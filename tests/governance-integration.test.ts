/**
 * @module tests/governance-integration
 *
 * UNMOCKED integration test (AK-3, story T5) — exercises the real
 * {@link GovernanceClient} and {@link governCall} interceptor against a LIVE
 * core server running in mock settlement mode (the AK-2 `/actions/govern` +
 * `/actions/approvals/:id/*` + `/approvals/:id` endpoints).
 *
 * This test deliberately does NOT mock the facilitator (lesson of DP-0.1: the
 * mocked test hid the broken approve path). It is env-gated via `PAYBOT_CORE_URL`
 * — an env-gated `describe.skipIf` is an intentional conditional, not a skip
 * leak (see scripts/check-no-skip.sh). To run it:
 *
 *   1. boot core (mock mode): in the paybot-ak2 worktree, with
 *      SETTLEMENT_MODE=mock NODE_ENV=development PORT=3007 API_KEY=pb_test_default_key
 *      `npm run start:server`
 *   2. PAYBOT_CORE_URL=http://localhost:3007 PAYBOT_API_KEY=pb_test_default_key \
 *      npx vitest run tests/governance-integration.test.ts
 *
 * Covers against the real chain: allow (reversible executes), deny (handler
 * never runs), pending→approve via the ACTION route (executes once, hash bound),
 * pending→deny (never executes), and TOCTOU mutation refused after a real approve.
 *
 * Dependencies: vitest, src/governance-client, src/governed-tool. No SDK mock.
 */
import { describe, it, expect } from 'vitest';
import { GovernanceClient } from '../src/governance-client.js';
import {
  governCall,
  type GovernedToolDefinition,
  type ToolResult,
} from '../src/governed-tool.js';
import type { ActionPolicyEnvelope } from '../src/governance-client.js';

const CORE_URL = process.env.PAYBOT_CORE_URL;
const API_KEY = process.env.PAYBOT_API_KEY ?? process.env.API_KEY ?? 'pb_test_default_key';

const POLICY: ActionPolicyEnvelope = {
  trustLevel: 3,
  allowedVerbs: ['delete_database', 'annotate_record'],
  forbiddenTargets: [],
  allowedTargets: [],
  maxActionsPerHour: 1000,
  autoAllowIrreversible: false,
};

/** A handler that records each execution so we can spy-assert non-execution. */
function spyHandler() {
  let runs = 0;
  const handler = (args: Record<string, unknown>): ToolResult => {
    runs += 1;
    return { content: [{ type: 'text', text: `RAN:${JSON.stringify(args)}` }] };
  };
  return { handler, runs: () => runs };
}

function def(
  name: string,
  riskClass: 'reversible' | 'irreversible',
  handler: GovernedToolDefinition<Record<string, unknown>>['handler']
): GovernedToolDefinition<Record<string, unknown>> {
  return {
    name,
    description: 'integration mock',
    schema: {},
    riskClass,
    targetRef: (a) => `db:${String(a.database ?? a.record)}`,
    handler,
  };
}

/** Approve or deny a pending action via the ACTION approvals route (AK-2-C1). */
async function decide(
  approvalId: string,
  action: 'approve' | 'deny'
): Promise<void> {
  const res = await fetch(`${CORE_URL}/actions/approvals/${approvalId}/${action}`, {
    method: 'POST',
    headers: { 'X-API-Key': API_KEY },
  });
  if (!res.ok) throw new Error(`decide ${action} failed: ${res.status}`);
}

/**
 * Approve a pending action via the PAYMENT approvals route (the WRONG route for
 * an action — AK-3-C1). The payment grant path always attempts settlement; for
 * an action there is no resume context, so the shared row is flipped to APPROVED
 * with state=SETTLE_FAILED / RESUME_CONTEXT_UNAVAILABLE. Returns the HTTP body.
 */
async function approveViaPaymentRoute(approvalId: string): Promise<Record<string, unknown>> {
  const res = await fetch(`${CORE_URL}/approvals/${approvalId}/approve`, {
    method: 'POST',
    headers: { 'X-API-Key': API_KEY },
  });
  // The payment route returns 200 with state=SETTLE_FAILED even though it
  // "approved" — that is precisely the cross-route hazard we are probing.
  return (await res.json()) as Record<string, unknown>;
}

/**
 * Poll the operator pending-list until an approval owned by `subject` appears.
 * The interceptor's govern POST races with the test's list call, so we retry.
 */
async function waitForPending(subject: string, tries = 40): Promise<string> {
  for (let i = 0; i < tries; i += 1) {
    const list = (await fetch(`${CORE_URL}/approvals?status=PENDING`, {
      headers: { 'X-API-Key': API_KEY },
    }).then((r) => r.json())) as { approvals: Array<{ approval_id: string; bot_id: string }> };
    const mine = list.approvals.find((a) => a.bot_id === subject);
    if (mine) return mine.approval_id;
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(`no pending approval for ${subject} after ${tries} tries`);
}

/** Read the live approval id created by an immediately-prior pending govern. */
async function latestPendingId(client: GovernanceClient, verb: string, hash: string, subject: string): Promise<string> {
  const r = await client.govern({
    intent_id: `it_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    actor: { type: 'agent', subject_ref: subject },
    action: { verb, target_ref: `db:probe`, params_hash: hash },
    risk_class: 'irreversible',
    channel: 'mcp',
    policy: POLICY,
  });
  return r.approval_id!;
}

// Env-gated: runs only when a live core URL is provided. NOT a mock.
describe.skipIf(!CORE_URL)('[INTEGRATION] interceptor against live core (mock mode)', () => {
  const client = () =>
    new GovernanceClient({ baseUrl: CORE_URL as string, apiKey: API_KEY, timeoutMs: 5000 });

  it('[AC] reversible allowed verb executes against the real gate', async () => {
    const { handler, runs } = spyHandler();
    const res = await governCall({
      args: { record: 'rec-1', note: 'ok' },
      def: def('annotate_record', 'reversible', handler),
      client: client(),
      subjectRef: `it-allow-${Date.now()}`,
      policy: POLICY,
      pendingMode: 'block',
      approvalTimeoutMs: 10000,
      pollIntervalMs: 200,
      failOpen: false,
      sleep: (ms) => new Promise((r) => setTimeout(r, ms)),
    });
    expect(runs()).toBe(1);
    expect(res.content.map((c) => c.text).join('\n')).toMatch(/result_hash=[a-f0-9]{64}/);
  });

  it('[AC1] an unknown verb is denied by the real gate and never executes', async () => {
    const { handler, runs } = spyHandler();
    const res = await governCall({
      args: { database: 'x' },
      def: def('drop_everything', 'irreversible', handler),
      client: client(),
      subjectRef: `it-deny-${Date.now()}`,
      policy: POLICY, // drop_everything not in allowedVerbs ⇒ deny-by-default
      pendingMode: 'block',
      approvalTimeoutMs: 10000,
      pollIntervalMs: 200,
      failOpen: false,
      sleep: (ms) => new Promise((r) => setTimeout(r, ms)),
    });
    expect(runs()).toBe(0);
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toContain('VERB_ALLOWLIST');
  });

  it('[AC2] pending → operator approves via ACTION route → executes once, hash bound', async () => {
    const { handler, runs } = spyHandler();
    const subject = `it-approve-${Date.now()}`;
    // Drive approval from a second "terminal" once the pending row exists.
    const exec = governCall({
      args: { database: 'analytics-staging' },
      def: def('delete_database', 'irreversible', handler),
      client: client(),
      subjectRef: subject,
      policy: POLICY,
      pendingMode: 'block',
      approvalTimeoutMs: 15000,
      pollIntervalMs: 250,
      failOpen: false,
      sleep: (ms) => new Promise((r) => setTimeout(r, ms)),
    });
    // Find the pending approval for this subject (retry past the govern race).
    const approvalId = await waitForPending(subject);
    await decide(approvalId, 'approve');

    const res = await exec;
    expect(runs()).toBe(1);
    const text = res.content.map((c) => c.text).join('\n');
    expect(text).toContain('RAN:');
    expect(text).toMatch(/executed: params_hash=[a-f0-9]{64}, result_hash=[a-f0-9]{64}/);
  });

  it('[AK-3-C1] pending → approve via PAYMENT route ONLY → interceptor MUST NOT execute', async () => {
    // The adversarial regression for AK-3-C1: an operator approves a paused
    // irreversible ACTION via the PAYMENT route. The shared row flips to
    // APPROVED (before settlement fails), but the interceptor must NOT treat
    // that as authorization — a human approving what they believe is a payment
    // must never execute an agent's irreversible action.
    const { handler, runs } = spyHandler();
    const subject = `it-wrongroute-${Date.now()}`;
    const exec = governCall({
      args: { database: 'prod-payment-poison' },
      def: def('delete_database', 'irreversible', handler),
      client: client(),
      subjectRef: subject,
      policy: POLICY,
      pendingMode: 'block',
      approvalTimeoutMs: 15000,
      pollIntervalMs: 250,
      failOpen: false,
      sleep: (ms) => new Promise((r) => setTimeout(r, ms)),
    });
    const approvalId = await waitForPending(subject);

    // Approve through the WRONG (payment) route. Confirm the shared row really
    // did flip to APPROVED with a settlement-failure state (the hazard surface).
    const body = await approveViaPaymentRoute(approvalId);
    expect(body.decision).toBe('APPROVED');
    expect(body.state).toBe('SETTLE_FAILED');

    const res = await exec;
    // The core property: handler call count is ZERO on a payment-route approval.
    expect(runs()).toBe(0);
    expect(res.isError).toBe(true);
    const text = res.content.map((c) => c.text).join('\n');
    expect(text).toContain('WRONG_APPROVAL_ROUTE');
    // And it never reached the handler / never bound an execution hash.
    expect(text).not.toContain('RAN:');
    expect(text).not.toMatch(/result_hash=/);
  });

  it('[AK-3-C1] a SEPARATE pending action approved via the ACTION route DOES execute', async () => {
    // The positive half of the cross-route property: the action route IS the
    // authorizing path. (A fresh approval — the payment-poisoned row above is
    // already terminal and cannot be re-approved.)
    const { handler, runs } = spyHandler();
    const subject = `it-rightroute-${Date.now()}`;
    const exec = governCall({
      args: { database: 'analytics-staging' },
      def: def('delete_database', 'irreversible', handler),
      client: client(),
      subjectRef: subject,
      policy: POLICY,
      pendingMode: 'block',
      approvalTimeoutMs: 15000,
      pollIntervalMs: 250,
      failOpen: false,
      sleep: (ms) => new Promise((r) => setTimeout(r, ms)),
    });
    const approvalId = await waitForPending(subject);
    await decide(approvalId, 'approve');

    const res = await exec;
    expect(runs()).toBe(1);
    const text = res.content.map((c) => c.text).join('\n');
    expect(text).toContain('RAN:');
    expect(text).toMatch(/executed: params_hash=[a-f0-9]{64}, result_hash=[a-f0-9]{64}/);
  });

  it('[AC3] pending → operator denies via ACTION route → never executes', async () => {
    const { handler, runs } = spyHandler();
    const subject = `it-denyflow-${Date.now()}`;
    const exec = governCall({
      args: { database: 'prod' },
      def: def('delete_database', 'irreversible', handler),
      client: client(),
      subjectRef: subject,
      policy: POLICY,
      pendingMode: 'block',
      approvalTimeoutMs: 15000,
      pollIntervalMs: 250,
      failOpen: false,
      sleep: (ms) => new Promise((r) => setTimeout(r, ms)),
    });
    const approvalId = await waitForPending(subject);
    await decide(approvalId, 'deny');

    const res = await exec;
    expect(runs()).toBe(0);
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toContain('denied');
  });

  it('[AC4-sanity] core reachable confirms fail-closed is the only block source', async () => {
    // A live, reachable core returns a real decision (not GOVERNANCE_UNREACHABLE).
    const id = await latestPendingId(
      client(),
      'delete_database',
      'a'.repeat(64),
      `it-reach-${Date.now()}`
    );
    expect(id).toMatch(/^ap_/);
  });
});
