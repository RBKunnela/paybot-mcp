/**
 * @module governed-tool
 *
 * The thin MCP tool-call interceptor (AK-3) — `registerGovernedTool`, a
 * higher-order tool registrar that wraps an arbitrary MCP tool handler so every
 * call is governed by core BEFORE it can execute:
 *
 *   build ActionIntent → POST /actions/govern →
 *     allow   → execute handler, bind intent→result hashes in the output
 *     deny    → refuse with gate reasons (never executes)
 *     pending → 'block' mode: poll GET /actions/approvals/:id (the ACTION-SCOPED
 *               signal) until APPROVED/DENIED/EXPIRED; on APPROVED re-verify
 *               params_hash (TOCTOU) then execute once;
 *               'return' mode: hand back approval_id + instructions, no execution
 *
 * Every governance outcome leaves a tamper-evident trace in core's audit chain
 * (the interceptor performs no audit itself — core owns the chain). The
 * interceptor's job is to ENFORCE core's verdict and to bind the executed
 * arguments to the governed arguments.
 *
 * Security properties enforced here (story AK-3 threat model):
 *  - Fail closed: any {@link GovernanceUnreachableError} ⇒ refuse for
 *    irreversible/unknown actions; reversible MAY opt into `failOpen` (documented
 *    demo-only). An unreachable governor never silently allows. (AC4)
 *  - TOCTOU: `params_hash` is bound at govern time and RE-VERIFIED against a
 *    fresh hash of the exact arguments just before execution; a mismatch refuses
 *    (AC2b). The handler receives the SAME args object that was hashed.
 *  - Risk class is set by the REGISTRAR, never read from call arguments.
 *  - No bypass: a server that wants a tool governed registers it through here;
 *    the raw handler is never exposed by this module.
 *  - No raw args to core: only the params_hash + registrar-provided target_ref
 *    extractor output leave the process. Raw arguments stay local.
 *
 * Approval routing (QA finding AK-2-C1): a paused ACTION is approved via the
 * ACTION approvals route `POST /actions/approvals/:id/approve` (NOT the payment
 * `/approvals/:id/approve`, whose grant path always attempts settlement). The
 * interceptor instructs the operator toward the ACTION route in its pending
 * message.
 *
 * Cross-route hazard (QA finding AK-3-C1) — POSITIVE-SIGNAL fix: the SHARED A5a
 * row (`GET /approvals/:id`) is keyed only by `decision`, and BOTH the payment
 * approve route and the action approve route flip it to `APPROVED`. So an
 * operator who approves a paused action via the PAYMENT route flips that shared
 * row to APPROVED *before* settlement fails — and a bare `decision === 'APPROVED'`
 * poll of the shared row cannot tell the two apart. Rather than infer intent
 * negatively from a settlement `state`, the interceptor polls a POSITIVE,
 * action-scoped signal: `GET /actions/approvals/:id`. Core marks that endpoint
 * `APPROVED` ONLY when the ACTION approve route ran (the same path that emits
 * `ACTION_APPROVED`); a payment-route approve leaves it `PENDING`. The
 * interceptor executes ONLY on `decision === 'APPROVED'` from this action-scoped
 * endpoint — so a payment-route approval simply never authorizes execution
 * (the poll keeps reading PENDING until the operator approves via the ACTION
 * route, or the approval times out / expires). Fail-closed throughout: an
 * unreadable status or a 404 (unknown / non-action id) is NEVER treated as
 * approved.
 *
 * Dependencies: zod (schema), @modelcontextprotocol/sdk (McpServer typing),
 *   ./governance-client, node:crypto (params hashing).
 * Used by: src/server.ts (registers the env-gated demo tools), src/index.ts.
 */

import { createHash } from 'node:crypto';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ZodRawShape } from 'zod';
import {
  GovernanceClient,
  GovernanceUnreachableError,
  ApprovalNotFoundError,
  type ActionPolicyEnvelope,
  type GovernReason,
} from './governance-client.js';

/** Shape of a single MCP text-content tool result (matches the SDK return). */
export interface ToolResult {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
  /** MCP results carry an open index signature; mirror it for assignability. */
  [x: string]: unknown;
}

/** Risk classification declared by the registrar — never by the model. */
export type RiskClass = 'reversible' | 'irreversible';

/** How a `pending` decision is surfaced to the caller. */
export type PendingMode = 'block' | 'return';

/**
 * Registrar-supplied definition of a governed tool.
 *
 * @typeParam Args - The decoded argument object the handler receives.
 */
export interface GovernedToolDefinition<Args extends Record<string, unknown>> {
  /** Tool name — becomes the ActionIntent `verb`. */
  name: string;
  /** Human description shown to the agent. */
  description: string;
  /** Zod raw shape passed straight to `McpServer.tool`. */
  schema: ZodRawShape;
  /**
   * Reversibility of the action. Set by the operator, NOT the agent — an
   * irreversible action pauses for human approval (HITL). (risk self-report
   * defence)
   */
  riskClass: RiskClass;
  /**
   * Derive the opaque `target_ref` from the decoded args (e.g. the database
   * name). MUST NOT return raw PII; the result is sent to core and audited.
   */
  targetRef: (args: Args) => string;
  /** The real tool handler. Runs ONLY after an allow / approved-pending. */
  handler: (args: Args) => Promise<ToolResult> | ToolResult;
}

/** Per-tool / per-server governance options. */
export interface GovernedToolOptions {
  /** Opaque bot id used as `actor.subject_ref`. Defaults to env PAYBOT_BOT_ID. */
  subjectRef?: string;
  /** Policy envelope declared to core. Absent ⇒ core denies by default. */
  policy?: ActionPolicyEnvelope;
  /** Pending handling: 'block' (poll) [default] or 'return' (hand back id). */
  pendingMode?: PendingMode;
  /** Max time to block on a pending approval, ms (default 120000). */
  approvalTimeoutMs?: number;
  /** Initial poll interval, ms (default 1000). Backs off up to 5x. */
  pollIntervalMs?: number;
  /**
   * Reversible-only escape hatch: when governance is unreachable, allow the
   * call instead of blocking. Default false. DEMO-ONLY — never enable for an
   * irreversible verb (ignored if riskClass is irreversible; fail closed).
   */
  failOpen?: boolean;
  /** Injectable sleeper (tests) — defaults to a real timer. */
  sleep?: (ms: number) => Promise<void>;
}

/**
 * Compute the canonical params hash of a bag of action arguments.
 *
 * MUST match core's `hashActionParams`: recursively key-sorted JSON, then
 * lowercase-hex SHA-256. Two semantically-equal argument objects hash
 * identically regardless of key order, so the TOCTOU re-check is order-stable.
 *
 * @param params - The raw action arguments (hashed locally; never sent raw).
 * @returns Lowercase 64-char hex SHA-256 of the canonical JSON.
 *
 * @example
 * hashActionParams({ b: 1, a: 2 }) === hashActionParams({ a: 2, b: 1 }); // true
 */
export function hashActionParams(params: Record<string, unknown>): string {
  return createHash('sha256').update(JSON.stringify(sortObjectKeys(params))).digest('hex');
}

/**
 * Recursively sort object keys for canonical JSON serialization.
 *
 * Mirrors core's `sortObjectKeys` so the MCP-side and core-side hashes agree.
 * Arrays preserve order (order is semantic); plain objects are key-sorted.
 *
 * @param value - Any JSON-serializable value.
 * @returns The value with all nested plain-object keys sorted.
 */
export function sortObjectKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortObjectKeys);
  }
  if (value !== null && typeof value === 'object') {
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      sorted[key] = sortObjectKeys((value as Record<string, unknown>)[key]);
    }
    return sorted;
  }
  return value;
}

/** Generate a unique, idempotency-friendly intent id (one per tool call). */
function newIntentId(): string {
  return `act_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

/** Format gate reasons into a denial body (action analog of `formatDenial`). */
function formatActionDenial(verb: string, reasons: GovernReason[]): string {
  const lines = [`Action '${verb}' was blocked by governance.`];
  if (reasons.length > 0) {
    lines.push('Reasons:');
    for (const r of reasons) {
      lines.push(`- [${r.gate}] ${r.reason}`);
    }
  }
  return lines.join('\n');
}

/** Build a fail-closed refusal result for an unreachable governor. */
function governanceUnreachableResult(verb: string, message: string): ToolResult {
  return {
    content: [
      {
        type: 'text',
        text: [
          `Action '${verb}' was blocked: governance is unreachable.`,
          `Code: GOVERNANCE_UNREACHABLE`,
          `Detail: ${message}`,
          'Fail-closed: an action cannot execute while the governor cannot be reached.',
        ].join('\n'),
      },
    ],
    isError: true,
  };
}

/** Default async sleep used by the blocking pending poll. */
function realSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Register an MCP tool whose every invocation is governed by core before it can
 * execute. This is the AK-3 interceptor.
 *
 * The returned tool is registered on `server` under `def.name`. Its wrapper:
 *  1. hashes the decoded args, builds an ActionIntent, and calls
 *     `client.govern(...)`;
 *  2. on `allow` executes the handler and appends `executed: params_hash=…,
 *     result_hash=…` to the output (binds intent→execution);
 *  3. on `deny` returns the gate reasons and NEVER executes;
 *  4. on `pending` either blocks-and-polls (re-checking the hash before
 *     executing on approval) or returns the approval id per `opts.pendingMode`;
 *  5. on a governor failure fails closed (or `failOpen` for reversible only).
 *
 * @typeParam Args - The decoded argument object shape.
 * @param server - The MCP server to register the tool on.
 * @param def - The governed-tool definition (name, schema, riskClass, handler).
 * @param client - The {@link GovernanceClient} used to reach core.
 * @param opts - Subject ref, policy, pending mode, timeouts, fail-open.
 * @returns void (the tool is registered as a side effect).
 *
 * @example
 * registerGovernedTool(server, {
 *   name: 'delete_database',
 *   description: 'MOCK: delete a database (touches nothing real)',
 *   schema: { database: z.string() },
 *   riskClass: 'irreversible',
 *   targetRef: (a) => `db:${a.database}`,
 *   handler: async (a) => ({ content: [{ type: 'text', text: `deleted ${a.database}` }] }),
 * }, client, { policy });
 */
export function registerGovernedTool<Args extends Record<string, unknown>>(
  server: McpServer,
  def: GovernedToolDefinition<Args>,
  client: GovernanceClient,
  opts: GovernedToolOptions = {}
): void {
  const pendingMode: PendingMode = opts.pendingMode ?? 'block';
  const approvalTimeoutMs = opts.approvalTimeoutMs ?? 120_000;
  const pollIntervalMs = opts.pollIntervalMs ?? 1000;
  const sleep = opts.sleep ?? realSleep;

  server.tool(def.name, def.description, def.schema, async (rawArgs: unknown) => {
    const args = (rawArgs ?? {}) as Args;
    return governCall<Args>({
      args,
      def,
      client,
      subjectRef: opts.subjectRef ?? process.env.PAYBOT_BOT_ID ?? 'mcp-agent',
      policy: opts.policy,
      pendingMode,
      approvalTimeoutMs,
      pollIntervalMs,
      // The reversible-only clamp lives in governCall itself (the public API
      // boundary), so pass the caller's intent through unmodified.
      failOpen: opts.failOpen,
      sleep,
    });
  });
}

/** Internal parameters for {@link governCall}. */
interface GovernCallParams<Args extends Record<string, unknown>> {
  args: Args;
  def: GovernedToolDefinition<Args>;
  client: GovernanceClient;
  subjectRef: string;
  policy?: ActionPolicyEnvelope;
  pendingMode: PendingMode;
  approvalTimeoutMs: number;
  pollIntervalMs: number;
  /**
   * Caller's fail-open request. Clamped to reversible-only INSIDE
   * {@link governCall}: an irreversible (or any non-`'reversible'`) action can
   * never fail open, regardless of what the caller passes. (AC4)
   */
  failOpen?: boolean;
  sleep: (ms: number) => Promise<void>;
}

/**
 * The governed-call state machine. Exported for direct unit testing without a
 * full MCP server round-trip.
 *
 * @typeParam Args - The decoded argument object shape.
 * @param p - The call parameters (args, definition, client, options).
 * @returns The MCP {@link ToolResult} to return to the agent.
 */
export async function governCall<Args extends Record<string, unknown>>(
  p: GovernCallParams<Args>
): Promise<ToolResult> {
  const { args, def, client } = p;
  // Reversible-only fail-open clamp — enforced HERE, at the public-API entry,
  // not just in the registrar wrapper. Any caller (including direct embedders
  // of this exported primitive) that requests failOpen for a non-reversible
  // verb is fail-CLOSED: an irreversible (or unknown/malformed risk_class)
  // action can never execute while governance is unreachable. This makes the
  // README's "ignored for irreversible verbs" guarantee hold at the boundary.
  const failOpen = p.failOpen === true && def.riskClass === 'reversible';
  // Hash the exact arguments the handler would run with. This is the value
  // bound into the approval; it is re-derived and compared before execution.
  const paramsHash = hashActionParams(args);
  const intentId = newIntentId();

  let verdict;
  try {
    verdict = await client.govern({
      intent_id: intentId,
      actor: { type: 'agent', subject_ref: p.subjectRef },
      action: {
        verb: def.name,
        target_ref: def.targetRef(args),
        params_hash: paramsHash,
      },
      risk_class: def.riskClass,
      channel: 'mcp',
      ...(p.policy ? { policy: p.policy } : {}),
    });
  } catch (err: unknown) {
    if (err instanceof GovernanceUnreachableError) {
      if (failOpen) {
        // Reversible-only, opt-in, demo-only: documented in README. `failOpen`
        // is the clamped value — true only when the action is reversible.
        return runHandler(def, args, paramsHash, '(fail-open: governance unreachable)');
      }
      return governanceUnreachableResult(def.name, err.message);
    }
    // Any other unexpected error is also fail-closed.
    return governanceUnreachableResult(
      def.name,
      err instanceof Error ? err.message : String(err)
    );
  }

  if (verdict.decision === 'allow') {
    return runHandler(def, args, paramsHash);
  }

  if (verdict.decision === 'deny') {
    return {
      content: [{ type: 'text', text: formatActionDenial(def.name, verdict.reasons) }],
      isError: true,
    };
  }

  // decision === 'pending'
  const approvalId = verdict.approval_id;
  if (!approvalId) {
    // Pending with no approval id is unusable — fail closed.
    return governanceUnreachableResult(
      def.name,
      'governance returned pending without an approval id'
    );
  }

  if (p.pendingMode === 'return') {
    return {
      content: [
        {
          type: 'text',
          text: [
            `Action '${def.name}' requires operator approval before it can run.`,
            `approval_id: ${approvalId}`,
            `params_hash: ${paramsHash}`,
            verdict.expires_at ? `expires_at: ${verdict.expires_at}` : '',
            'Operator: approve via POST /actions/approvals/' +
              approvalId +
              '/approve (or deny via .../deny).',
            'Poll GET /approvals/' + approvalId + ' for the decision.',
          ]
            .filter(Boolean)
            .join('\n'),
        },
      ],
    };
  }

  // 'block' mode: poll until a terminal decision or timeout.
  return pollAndExecute(p, approvalId, paramsHash);
}

/**
 * Poll `GET /actions/approvals/:id` (the ACTION-SCOPED signal) with backoff
 * until the action is approved, denied, expired, or the local timeout elapses.
 * On the action-scoped APPROVED, re-verify the params hash (TOCTOU) and execute
 * the handler exactly once.
 *
 * AK-3-C1 (positive signal): execution is gated on `decision === 'APPROVED'`
 * from the ACTION-scoped endpoint — which core sets ONLY when the ACTION approve
 * route ran. A payment-route approve on the same shared row leaves this endpoint
 * `PENDING`, so it never authorizes execution; the poll simply keeps waiting
 * (until a real ACTION-route approval, a DENIED/EXPIRED, or the timeout). This
 * supersedes the prior negative `state`-discriminator: there is no payment-route
 * APPROVED to refuse here because the action-scoped signal never reports it.
 *
 * @typeParam Args - The decoded argument object shape.
 * @param p - The call parameters.
 * @param approvalId - The pending approval id to poll.
 * @param paramsHash - The hash bound at govern time (TOCTOU anchor).
 * @returns The MCP {@link ToolResult}.
 */
async function pollAndExecute<Args extends Record<string, unknown>>(
  p: GovernCallParams<Args>,
  approvalId: string,
  paramsHash: string
): Promise<ToolResult> {
  const { client, def, args } = p;
  const deadline = Date.now() + p.approvalTimeoutMs;
  let interval = p.pollIntervalMs;

  for (;;) {
    let status;
    try {
      // POSITIVE SIGNAL (AK-3-C1): poll the ACTION-scoped decision, not the
      // shared payment row. Core reports APPROVED here ONLY for an action-route
      // approval, so a payment-route approve can never authorize execution.
      status = await client.getActionApproval(approvalId);
    } catch (err: unknown) {
      // A 404 here means no action-scoped approval exists for this id (unknown,
      // or a payment-only row). Fail-closed: never treat as approved — surface a
      // clear refusal rather than executing.
      if (err instanceof ApprovalNotFoundError) {
        return governanceUnreachableResult(
          def.name,
          `no action-scoped approval found for ${approvalId} (fail-closed)`
        );
      }
      // Unreadable status is fail-closed: never treat as approved.
      return governanceUnreachableResult(
        def.name,
        `could not read action approval status: ${err instanceof Error ? err.message : String(err)}`
      );
    }

    if (status.decision === 'APPROVED') {
      // Reaching APPROVED on the ACTION-scoped endpoint is itself the proof the
      // ACTION approve route ran (it is the only writer of this signal). No
      // negative cross-route discriminator is needed — a payment-route approve
      // would have left this PENDING and we would not be here.
      //
      // TOCTOU re-check: re-derive the hash from the LIVE args at the instant
      // before execution. If the in-memory args were mutated between govern and
      // now (test harness / a compromised caller), this no longer matches the
      // approved hash and execution is refused (AC2b).
      const currentHash = hashActionParams(args);
      if (currentHash !== paramsHash) {
        return {
          content: [
            {
              type: 'text',
              text: [
                `Action '${def.name}' was approved but REFUSED before execution:`,
                'arguments changed after approval (params_hash mismatch).',
                `approved: ${paramsHash}`,
                `current:  ${currentHash}`,
                'Code: PARAMS_HASH_MISMATCH',
              ].join('\n'),
            },
          ],
          isError: true,
        };
      }
      const approvedBy = status.decided_by ? ` (approved by ${status.decided_by})` : '';
      return runHandler(def, args, paramsHash, approvedBy.trim());
    }

    if (status.decision === 'DENIED' || status.decision === 'EXPIRED') {
      const who = status.decided_by ? ` by ${status.decided_by}` : '';
      return {
        content: [
          {
            type: 'text',
            text: [
              `Action '${def.name}' was ${status.decision.toLowerCase()}${who}.`,
              `approval_id: ${approvalId}`,
              'The action did not execute.',
            ].join('\n'),
          },
        ],
        isError: true,
      };
    }

    // Still PENDING — wait, with backoff, but never past the deadline.
    if (Date.now() + interval >= deadline) {
      return {
        content: [
          {
            type: 'text',
            text: [
              `Action '${def.name}' timed out waiting for operator approval.`,
              `approval_id: ${approvalId}`,
              'Fail-closed: the action did not execute. Re-issue once approved.',
              'Code: APPROVAL_TIMEOUT',
            ].join('\n'),
          },
        ],
        isError: true,
      };
    }
    await p.sleep(interval);
    interval = Math.min(interval * 1.5, p.pollIntervalMs * 5);
  }
}

/**
 * Execute the real handler and append the intent→execution hash binding to its
 * output, so the audit trace can join what was governed to what ran.
 *
 * @typeParam Args - The decoded argument object shape.
 * @param def - The governed-tool definition.
 * @param args - The decoded (and hash-verified) arguments.
 * @param paramsHash - The params hash bound at govern time.
 * @param note - Optional provenance note (e.g. "approved by op").
 * @returns The handler's result with an `executed:` line appended.
 */
async function runHandler<Args extends Record<string, unknown>>(
  def: GovernedToolDefinition<Args>,
  args: Args,
  paramsHash: string,
  note?: string
): Promise<ToolResult> {
  const result = await def.handler(args);
  const resultHash = createHash('sha256')
    .update(JSON.stringify(result.content))
    .digest('hex');
  const binding = `executed: params_hash=${paramsHash}, result_hash=${resultHash}${
    note ? ` ${note}` : ''
  }`;
  return {
    ...result,
    content: [...result.content, { type: 'text', text: binding }],
  };
}
