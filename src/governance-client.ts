/**
 * @module governance-client
 *
 * Thin authenticated HTTP client for core's action-governance API (AK-2),
 * consumed by the AK-3 tool-call interceptor (`src/governed-tool.ts`).
 *
 * It speaks exactly three core endpoints and nothing else:
 *  - `POST /actions/govern`            — evaluate an {@link GovernIntentRequest}
 *  - `GET  /approvals/:id`             — poll a paused action's decision
 *  - (operator drives `POST /actions/approvals/:id/approve|deny` out of band)
 *
 * Design constraints (story AK-3, threat model):
 *  - FAIL CLOSED: a network error, timeout, 5xx, or malformed body is raised as
 *    a typed {@link GovernanceUnreachableError} — never silently treated as an
 *    allow. The interceptor maps that to a refusal for irreversible/unknown
 *    actions.
 *  - NO RETRIES on `govern`: a retry is a second governance evaluation. The
 *    caller generates one `intent_id` per tool call so core can dedupe.
 *  - MANDATORY TIMEOUT: every request is bounded (default 5 s) via AbortController.
 *  - SAME AUTH POSTURE AS THE SDK: base URL + API key come from operator env
 *    (`PAYBOT_FACILITATOR_URL` / `PAYBOT_API_KEY`), never from tool arguments
 *    (spoofed-governance-server defence).
 *  - NO PII / NO RAW ARGS: only the params_hash and opaque refs are sent; the
 *    interceptor is responsible for never placing raw arguments in the intent.
 *
 * Dependencies: global `fetch` (Node 18+). No SDK import — this is intentionally
 *   decoupled from the payment SDK's client.
 * Used by: src/governed-tool.ts (the interceptor), src/index.ts (export).
 */

/** Ternary verdict returned by `POST /actions/govern`. */
export type GovernDecision = 'allow' | 'deny' | 'pending';

/** A single machine-readable gate reason (mirrors core's `ActionDenyReason`). */
export interface GovernReason {
  /** Gate identifier (e.g. `VERB_ALLOWLIST`, `RISK_CLASS`, `GOVERNANCE_UNREACHABLE`). */
  gate: string;
  /** Human-readable explanation. */
  reason: string;
}

/**
 * The caller-declared ActionPolicy envelope sent with each govern request.
 *
 * Core stores no per-action policy yet (AK-2), so the interceptor declares the
 * policy centrally per request — mirroring `/authorize`'s `policy_level`. The
 * `riskClass` and policy are set by the REGISTRAR (operator code), never by the
 * acting model (risk-class self-report defence).
 */
export interface ActionPolicyEnvelope {
  /** Trust level the policy is resolved for (0-5). */
  trustLevel: number;
  /** Verbs the actor may perform. Deny-by-default (empty = nothing allowed). */
  allowedVerbs: string[];
  /** Targets that always deny (checked before the allowlist). */
  forbiddenTargets?: string[];
  /** Targets the actor may touch. Empty = unrestricted. */
  allowedTargets?: string[];
  /** Sliding-window velocity cap (evaluations per actor-hour). */
  maxActionsPerHour: number;
  /** When true AND the verb is explicitly listed, an irreversible action skips HITL. */
  autoAllowIrreversible?: boolean;
}

/** Request body for `POST /actions/govern`. */
export interface GovernIntentRequest {
  /** Unique, idempotency-friendly id generated once per tool call. */
  intent_id: string;
  /** Who is attempting the action. `subject_ref` is an opaque bot id. */
  actor: { type: 'agent' | 'human'; subject_ref: string };
  /** What they want to do: verb + opaque target + params hash. */
  action: { verb: string; target_ref: string; params_hash: string };
  /** Reversibility classification (set by the registrar). */
  risk_class: 'reversible' | 'irreversible';
  /** Intake channel. */
  channel: 'mcp' | 'api';
  /** Non-PII context bag (scanned fail-closed by core). */
  context?: Record<string, unknown>;
  /** Caller-declared policy envelope. Absent ⇒ core denies by default. */
  policy?: ActionPolicyEnvelope;
}

/** Parsed response from `POST /actions/govern`. */
export interface GovernResult {
  decision: GovernDecision;
  reasons: GovernReason[];
  policy_level: number;
  audit_seq_id?: number;
  audit_hash?: string;
  /** Present only when `decision === 'pending'`. */
  approval_id?: string;
  poll_url?: string;
  expires_at?: string;
}

/** Status of a paused action's approval, as reported by `GET /approvals/:id`. */
export type ApprovalDecision = 'PENDING' | 'APPROVED' | 'DENIED' | 'EXPIRED';

/**
 * Post-approve settlement state machine, as surfaced by the SHARED A5a row.
 *
 * This field is the cross-route discriminator (AK-3-C1). The shared
 * `pending_approvals` row is keyed only by `decision`; both the PAYMENT route
 * (`POST /approvals/:id/approve`) and the ACTION route
 * (`POST /actions/approvals/:id/approve`) flip a paused row to `APPROVED`. They
 * differ in ONE observable way:
 *  - The PAYMENT route ALWAYS runs the settlement state machine after granting,
 *    so it ALWAYS writes a `state` (`SETTLED` for a real payment, or
 *    `SETTLE_FAILED` / `RESUME_CONTEXT_UNAVAILABLE` when it grants what is
 *    actually an ACTION — there is no payment resume context to settle).
 *  - The ACTION route NEVER settles, so it NEVER writes a `state` (it stays
 *    `null`/absent) — an action-shaped approval is `APPROVED` with NO `state`.
 *
 * The interceptor therefore treats a PRESENT `state` on an APPROVED row as proof
 * the PAYMENT lane claimed it, and refuses to execute (fail-closed). Only an
 * `APPROVED` row with NO `state` is an action-route approval that authorizes
 * execution.
 */
export type ApprovalSettleState = 'SETTLED' | 'SETTLE_FAILED';

/** Parsed response from `GET /approvals/:id`. */
export interface ApprovalStatus {
  approval_id: string;
  decision: ApprovalDecision;
  decided_by?: string;
  audit_hash?: string;
  expires_at?: string;
  /**
   * Payment-settlement state. PRESENT ⇒ the payment route claimed this row
   * (cross-route hazard, AK-3-C1). ABSENT ⇒ action-route-shaped. See
   * {@link ApprovalSettleState}.
   */
  state?: ApprovalSettleState;
  /** Settlement error string (e.g. `RESUME_CONTEXT_UNAVAILABLE`) when present. */
  settle_error?: string;
}

/**
 * Raised whenever governance cannot produce a trustworthy verdict — network
 * failure, timeout, 5xx, or an unparseable body. The interceptor treats this as
 * a hard block for irreversible/unknown actions (fail-closed; AC4).
 */
export class GovernanceUnreachableError extends Error {
  /** Stable machine code surfaced to the agent. */
  readonly code = 'GOVERNANCE_UNREACHABLE';
  /** The underlying cause, when one exists. */
  readonly cause?: unknown;
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'GovernanceUnreachableError';
    this.cause = cause;
  }
}

/** Raised when `GET /approvals/:id` returns 404 (approval id unknown). */
export class ApprovalNotFoundError extends Error {
  /** Stable machine code. */
  readonly code = 'APPROVAL_NOT_FOUND';
  constructor(approvalId: string) {
    super(`Approval '${approvalId}' not found`);
    this.name = 'ApprovalNotFoundError';
  }
}

/** Constructor options for {@link GovernanceClient}. */
export interface GovernanceClientOptions {
  /** Core base URL (e.g. `http://localhost:3000`). */
  baseUrl: string;
  /** Operator API key sent as `X-API-Key`. */
  apiKey: string;
  /** Per-request timeout in milliseconds (default 5000). */
  timeoutMs?: number;
  /** Injectable fetch (tests). Defaults to global `fetch`. */
  fetchImpl?: typeof fetch;
}

/**
 * Resolve a {@link GovernanceClient} configuration from the process env.
 *
 * Uses the SAME variables as the payment SDK client (`PAYBOT_FACILITATOR_URL`,
 * `PAYBOT_API_KEY` / `API_KEY`) so a server already configured for payments
 * needs no new secrets to govern actions. Throws when no API key is present —
 * governance must never run unauthenticated (fail closed).
 *
 * @param env - Environment snapshot (defaults to `process.env`).
 * @returns A partial options object with `baseUrl` + `apiKey` resolved.
 * @throws {Error} When no API key is configured.
 *
 * @example
 * const client = new GovernanceClient(governanceConfigFromEnv());
 */
export function governanceConfigFromEnv(
  env: NodeJS.ProcessEnv = process.env
): { baseUrl: string; apiKey: string } {
  const apiKey = env.PAYBOT_API_KEY ?? env.API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    throw new Error(
      'Governance client requires an API key. Set PAYBOT_API_KEY (or API_KEY) ' +
        'before registering governed tools.'
    );
  }
  const baseUrl =
    env.PAYBOT_FACILITATOR_URL ?? env.X402_FACILITATOR_URL ?? 'https://api.paybotcore.com';
  return { baseUrl: baseUrl.replace(/\/$/, ''), apiKey };
}

/**
 * Thin authenticated client for core's action-governance API.
 *
 * Every method fails closed: any transport or protocol problem becomes a typed
 * error rather than a silent pass. See the module doc for the security rules
 * this enforces.
 */
export class GovernanceClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly timeoutMs: number;
  private readonly fetchImpl: typeof fetch;

  /**
   * @param options - Base URL, API key, and optional timeout / fetch override.
   */
  constructor(options: GovernanceClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, '');
    this.apiKey = options.apiKey;
    this.timeoutMs = options.timeoutMs ?? 5000;
    // Bind so a passed global fetch keeps its receiver.
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  /**
   * Evaluate an ActionIntent against core's gates.
   *
   * NO retry on failure — a retry would be a second governance evaluation. The
   * caller supplies one `intent_id` per tool call so a transport-level resend
   * is deduped by core.
   *
   * @param intent - The fully-built govern request (verb, target_ref,
   *   params_hash, risk_class, policy). Raw arguments MUST NOT appear here.
   * @returns The parsed {@link GovernResult}.
   * @throws {GovernanceUnreachableError} On network error, timeout, non-2xx
   *   response, or an unparseable / malformed body (fail closed).
   *
   * @example
   * const verdict = await client.govern(intent);
   * if (verdict.decision === 'allow') { ...run the tool... }
   */
  async govern(intent: GovernIntentRequest): Promise<GovernResult> {
    const body = await this.request('POST', '/actions/govern', intent);
    const decision = (body as { decision?: unknown }).decision;
    if (decision !== 'allow' && decision !== 'deny' && decision !== 'pending') {
      // A body we cannot trust is a fail-closed condition, not an allow.
      throw new GovernanceUnreachableError(
        `Malformed governance response: missing/invalid decision (${String(decision)})`
      );
    }
    const reasonsRaw = (body as { reasons?: unknown }).reasons;
    const reasons: GovernReason[] = Array.isArray(reasonsRaw)
      ? (reasonsRaw as GovernReason[])
      : [];
    return {
      decision,
      reasons,
      policy_level: Number((body as { policy_level?: unknown }).policy_level ?? 0),
      audit_seq_id: (body as { audit_seq_id?: number }).audit_seq_id,
      audit_hash: (body as { audit_hash?: string }).audit_hash,
      approval_id: (body as { approval_id?: string }).approval_id,
      poll_url: (body as { poll_url?: string }).poll_url,
      expires_at: (body as { expires_at?: string }).expires_at,
    };
  }

  /**
   * Poll a paused action's approval status.
   *
   * @param approvalId - The `approval_id` returned by a `pending` govern call.
   * @returns The parsed {@link ApprovalStatus}.
   * @throws {ApprovalNotFoundError} When core returns 404 for the id.
   * @throws {GovernanceUnreachableError} On any other transport/protocol error
   *   (fail closed — an unreadable status is never treated as approved).
   *
   * @example
   * const status = await client.getApproval('apr_123');
   * if (status.decision === 'APPROVED') { ...proceed... }
   */
  async getApproval(approvalId: string): Promise<ApprovalStatus> {
    const path = `/approvals/${encodeURIComponent(approvalId)}`;
    const body = await this.request('GET', path, undefined, {
      // 404 is a meaningful, typed outcome rather than a generic failure.
      notFoundError: () => new ApprovalNotFoundError(approvalId),
    });
    const decision = (body as { decision?: unknown }).decision;
    if (
      decision !== 'PENDING' &&
      decision !== 'APPROVED' &&
      decision !== 'DENIED' &&
      decision !== 'EXPIRED'
    ) {
      throw new GovernanceUnreachableError(
        `Malformed approval status: invalid decision (${String(decision)})`
      );
    }
    // Cross-route discriminator (AK-3-C1): the shared A5a row only carries
    // `state` when the PAYMENT settlement lane has touched it. The payment
    // approve route ALWAYS writes a `state`; the action approve route NEVER
    // does. We surface it verbatim so the interceptor can refuse a payment-route
    // claim of an action. Any non-empty `state` string is treated as present
    // (fail-closed: an unexpected value still means "payment lane ran").
    const rawState = (body as { state?: unknown }).state;
    const state =
      rawState === 'SETTLED' || rawState === 'SETTLE_FAILED'
        ? rawState
        : typeof rawState === 'string' && rawState.length > 0
          ? 'SETTLE_FAILED'
          : undefined;
    // The route maps the row's settle_error onto the `error` field.
    const settleError = (body as { error?: unknown; settle_error?: unknown }).error;
    const settleErrorAlt = (body as { settle_error?: unknown }).settle_error;
    return {
      approval_id: String((body as { approval_id?: unknown }).approval_id ?? approvalId),
      decision,
      decided_by: (body as { decided_by?: string }).decided_by,
      audit_hash: (body as { audit_hash?: string }).audit_hash,
      expires_at: (body as { expires_at?: string }).expires_at,
      ...(state ? { state } : {}),
      ...(typeof settleError === 'string'
        ? { settle_error: settleError }
        : typeof settleErrorAlt === 'string'
          ? { settle_error: settleErrorAlt }
          : {}),
    };
  }

  /**
   * Perform a bounded, authenticated request and parse the JSON body.
   *
   * Centralises the fail-closed posture: timeout via AbortController, non-2xx →
   * thrown error, unparseable body → thrown error. A `notFoundError` hook lets a
   * caller map 404 to a domain-specific typed error.
   *
   * @param method - HTTP method.
   * @param path - Path beginning with `/`.
   * @param payload - JSON body for POST, or undefined.
   * @param opts - Optional 404 mapper.
   * @returns The parsed JSON body.
   * @throws {GovernanceUnreachableError} On timeout, network error, non-2xx, or
   *   a body that is not valid JSON.
   */
  private async request(
    method: 'GET' | 'POST',
    path: string,
    payload?: unknown,
    opts?: { notFoundError?: () => Error }
  ): Promise<unknown> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    let response: Response;
    try {
      response = await this.fetchImpl(`${this.baseUrl}${path}`, {
        method,
        headers: {
          'X-API-Key': this.apiKey,
          ...(payload !== undefined ? { 'Content-Type': 'application/json' } : {}),
        },
        ...(payload !== undefined ? { body: JSON.stringify(payload) } : {}),
        signal: controller.signal,
      });
    } catch (err: unknown) {
      // Network error or abort (timeout) — both are fail-closed conditions.
      const isAbort = err instanceof Error && err.name === 'AbortError';
      throw new GovernanceUnreachableError(
        isAbort
          ? `Governance request timed out after ${this.timeoutMs}ms (${method} ${path})`
          : `Governance request failed (${method} ${path}): ${err instanceof Error ? err.message : String(err)}`,
        err
      );
    } finally {
      clearTimeout(timer);
    }

    if (response.status === 404 && opts?.notFoundError) {
      throw opts.notFoundError();
    }

    if (!response.ok) {
      throw new GovernanceUnreachableError(
        `Governance endpoint returned ${response.status} (${method} ${path})`
      );
    }

    try {
      return await response.json();
    } catch (err: unknown) {
      throw new GovernanceUnreachableError(
        `Governance response was not valid JSON (${method} ${path})`,
        err
      );
    }
  }
}
