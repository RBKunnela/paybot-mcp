/**
 * @module tests/governed-tool
 *
 * Unit + adversarial tests for the AK-3 interceptor (src/governed-tool.ts):
 * the govern→allow/deny/pending state machine, TOCTOU re-check, fail-closed
 * paths, and the params-hash helpers. The GovernanceClient is faked so each
 * decision branch is driven deterministically with no live core.
 *
 * Acceptance criteria covered:
 *  - AC1 deny blocks execution (handler never runs)
 *  - AC2 pending → approve executes exactly once with hash binding
 *  - AC2b TOCTOU: args mutated after approval ⇒ refuse
 *  - AC3 deny / expiry / timeout ⇒ no execution
 *  - AC4 fail closed: governance unreachable ⇒ refuse (irreversible)
 *  - deny-by-default for an unknown verb (core denies; handler never runs)
 *
 * Dependencies: vitest, src/governed-tool, src/governance-client (types only).
 */
import { describe, it, expect, vi } from 'vitest';
import {
  governCall,
  hashActionParams,
  sortObjectKeys,
  type GovernedToolDefinition,
  type ToolResult,
} from '../src/governed-tool.js';
import {
  GovernanceUnreachableError,
  type GovernanceClient,
  type GovernResult,
  type ApprovalStatus,
} from '../src/governance-client.js';

/** A spy-able handler that records whether it executed. */
function makeHandler() {
  const calls: Array<Record<string, unknown>> = [];
  const handler = vi.fn((args: Record<string, unknown>): ToolResult => {
    calls.push(args);
    return { content: [{ type: 'text', text: 'HANDLER RAN' }] };
  });
  return { handler, calls };
}

function makeDef(
  riskClass: 'reversible' | 'irreversible',
  handler: GovernedToolDefinition<Record<string, unknown>>['handler']
): GovernedToolDefinition<Record<string, unknown>> {
  return {
    name: 'delete_database',
    description: 'mock',
    schema: {},
    riskClass,
    targetRef: (a) => `db:${String(a.database)}`,
    handler,
  };
}

/** A fake GovernanceClient with scripted govern + getApproval. */
function fakeClient(
  govern: () => Promise<GovernResult>,
  getApproval?: () => Promise<ApprovalStatus>
): GovernanceClient {
  return {
    govern: vi.fn(govern),
    getApproval: vi.fn(getApproval ?? (async () => ({ approval_id: 'apr', decision: 'PENDING' }))),
  } as unknown as GovernanceClient;
}

const noSleep = async () => {};

describe('[UNIT] hashActionParams / sortObjectKeys', () => {
  it('should be order-independent for object keys', () => {
    expect(hashActionParams({ b: 1, a: 2 })).toBe(hashActionParams({ a: 2, b: 1 }));
  });

  it('should change when a value changes', () => {
    expect(hashActionParams({ a: 1 })).not.toBe(hashActionParams({ a: 2 }));
  });

  it('should produce a lowercase 64-hex digest', () => {
    expect(hashActionParams({ x: 'y' })).toMatch(/^[a-f0-9]{64}$/);
  });

  it('should preserve array order while sorting nested object keys', () => {
    const sorted = sortObjectKeys({ z: [{ b: 1, a: 2 }], a: 1 }) as Record<string, unknown>;
    expect(Object.keys(sorted)).toEqual(['a', 'z']);
    expect(Object.keys((sorted.z as Record<string, unknown>[])[0])).toEqual(['a', 'b']);
  });
});

describe('[UNIT] governCall — allow path', () => {
  it('should execute the handler and append the hash binding on allow', async () => {
    const { handler, calls } = makeHandler();
    const client = fakeClient(async () => ({ decision: 'allow', reasons: [], policy_level: 3 }));
    const res = await governCall({
      args: { database: 'staging' },
      def: makeDef('reversible', handler),
      client,
      subjectRef: 'bot-1',
      pendingMode: 'block',
      approvalTimeoutMs: 1000,
      pollIntervalMs: 1,
      failOpen: false,
      sleep: noSleep,
    });
    expect(calls).toHaveLength(1);
    const text = res.content.map((c) => c.text).join('\n');
    expect(text).toContain('HANDLER RAN');
    expect(text).toMatch(/executed: params_hash=[a-f0-9]{64}, result_hash=[a-f0-9]{64}/);
    expect(res.isError).toBeFalsy();
  });
});

describe('[UNIT] governCall — AC1 deny blocks execution', () => {
  it('should NOT execute the handler on deny and should surface gate reasons', async () => {
    const { handler, calls } = makeHandler();
    const client = fakeClient(async () => ({
      decision: 'deny',
      reasons: [{ gate: 'VERB_ALLOWLIST', reason: "Verb 'delete_database' not allowed" }],
      policy_level: 0,
    }));
    const res = await governCall({
      args: { database: 'prod' },
      def: makeDef('irreversible', handler),
      client,
      subjectRef: 'bot-1',
      pendingMode: 'block',
      approvalTimeoutMs: 1000,
      pollIntervalMs: 1,
      failOpen: false,
      sleep: noSleep,
    });
    expect(calls).toHaveLength(0); // spy-asserted: never executed
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toContain('VERB_ALLOWLIST');
  });

  it('[ADVERSARIAL] unknown verb → core denies → handler never runs (deny-by-default)', async () => {
    const { handler, calls } = makeHandler();
    // Simulate core's deny-by-default for a verb absent from the policy.
    const client = fakeClient(async () => ({
      decision: 'deny',
      reasons: [{ gate: 'VERB_ALLOWLIST', reason: 'unknown verb' }],
      policy_level: 0,
    }));
    const res = await governCall({
      args: { database: 'x' },
      def: makeDef('irreversible', handler),
      client,
      subjectRef: 'bot-1',
      pendingMode: 'block',
      approvalTimeoutMs: 1000,
      pollIntervalMs: 1,
      failOpen: false,
      sleep: noSleep,
    });
    expect(calls).toHaveLength(0);
    expect(res.isError).toBe(true);
  });
});

describe('[UNIT] governCall — AC2 pending → approve', () => {
  it('should execute exactly once after APPROVED with the hash binding', async () => {
    const { handler, calls } = makeHandler();
    const statuses: ApprovalStatus[] = [
      { approval_id: 'apr_1', decision: 'PENDING' },
      { approval_id: 'apr_1', decision: 'APPROVED', decided_by: 'op-1' },
    ];
    let i = 0;
    const client = fakeClient(
      async () => ({
        decision: 'pending',
        reasons: [{ gate: 'RISK_CLASS', reason: 'needs approval' }],
        policy_level: 3,
        approval_id: 'apr_1',
      }),
      async () => statuses[Math.min(i++, statuses.length - 1)]
    );
    const res = await governCall({
      args: { database: 'staging' },
      def: makeDef('irreversible', handler),
      client,
      subjectRef: 'bot-1',
      pendingMode: 'block',
      approvalTimeoutMs: 1000,
      pollIntervalMs: 1,
      failOpen: false,
      sleep: noSleep,
    });
    expect(calls).toHaveLength(1);
    const text = res.content.map((c) => c.text).join('\n');
    expect(text).toContain('HANDLER RAN');
    expect(text).toContain('approved by op-1');
    expect(text).toMatch(/result_hash=[a-f0-9]{64}/);
  });

  it('[ADVERSARIAL] AC2b TOCTOU: args mutated after approval ⇒ refuse, never execute', async () => {
    const { handler, calls } = makeHandler();
    const mutable: Record<string, unknown> = { database: 'staging' };
    const client = fakeClient(
      async () => ({
        decision: 'pending',
        reasons: [],
        policy_level: 3,
        approval_id: 'apr_1',
      }),
      // On the first poll, mutate the args object, THEN report APPROVED.
      async () => {
        mutable.database = 'production'; // swap target after governance
        return { approval_id: 'apr_1', decision: 'APPROVED', decided_by: 'op-1' };
      }
    );
    const res = await governCall({
      args: mutable,
      def: makeDef('irreversible', handler),
      client,
      subjectRef: 'bot-1',
      pendingMode: 'block',
      approvalTimeoutMs: 1000,
      pollIntervalMs: 1,
      failOpen: false,
      sleep: noSleep,
    });
    expect(calls).toHaveLength(0); // refused — never executed
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toContain('PARAMS_HASH_MISMATCH');
  });
});

describe('[UNIT] governCall — AC3 deny / expiry / timeout', () => {
  it('should not execute when the operator DENIES', async () => {
    const { handler, calls } = makeHandler();
    const client = fakeClient(
      async () => ({ decision: 'pending', reasons: [], policy_level: 3, approval_id: 'apr_1' }),
      async () => ({ approval_id: 'apr_1', decision: 'DENIED', decided_by: 'op-1' })
    );
    const res = await governCall({
      args: { database: 'x' },
      def: makeDef('irreversible', handler),
      client,
      subjectRef: 'bot-1',
      pendingMode: 'block',
      approvalTimeoutMs: 1000,
      pollIntervalMs: 1,
      failOpen: false,
      sleep: noSleep,
    });
    expect(calls).toHaveLength(0);
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toContain('denied');
  });

  it('should not execute when the approval EXPIRES', async () => {
    const { handler, calls } = makeHandler();
    const client = fakeClient(
      async () => ({ decision: 'pending', reasons: [], policy_level: 3, approval_id: 'apr_1' }),
      async () => ({ approval_id: 'apr_1', decision: 'EXPIRED' })
    );
    const res = await governCall({
      args: { database: 'x' },
      def: makeDef('irreversible', handler),
      client,
      subjectRef: 'bot-1',
      pendingMode: 'block',
      approvalTimeoutMs: 1000,
      pollIntervalMs: 1,
      failOpen: false,
      sleep: noSleep,
    });
    expect(calls).toHaveLength(0);
    expect(res.content[0].text).toContain('expired');
  });

  it('should time out and refuse when approval never resolves', async () => {
    const { handler, calls } = makeHandler();
    const client = fakeClient(
      async () => ({ decision: 'pending', reasons: [], policy_level: 3, approval_id: 'apr_1' }),
      async () => ({ approval_id: 'apr_1', decision: 'PENDING' })
    );
    const res = await governCall({
      args: { database: 'x' },
      def: makeDef('irreversible', handler),
      client,
      subjectRef: 'bot-1',
      pendingMode: 'block',
      approvalTimeoutMs: 5, // tiny deadline forces timeout immediately
      pollIntervalMs: 10,
      failOpen: false,
      sleep: noSleep,
    });
    expect(calls).toHaveLength(0);
    expect(res.content[0].text).toContain('APPROVAL_TIMEOUT');
  });
});

describe('[UNIT] governCall — AC4 fail closed', () => {
  it('[ADVERSARIAL] should refuse an irreversible action when governance is unreachable', async () => {
    const { handler, calls } = makeHandler();
    const client = fakeClient(async () => {
      throw new GovernanceUnreachableError('core down');
    });
    const res = await governCall({
      args: { database: 'x' },
      def: makeDef('irreversible', handler),
      client,
      subjectRef: 'bot-1',
      pendingMode: 'block',
      approvalTimeoutMs: 1000,
      pollIntervalMs: 1,
      failOpen: false,
      sleep: noSleep,
    });
    expect(calls).toHaveLength(0);
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toContain('GOVERNANCE_UNREACHABLE');
  });

  it('[ADVERSARIAL] failOpen is honored ONLY for reversible actions', async () => {
    const { handler, calls } = makeHandler();
    const client = fakeClient(async () => {
      throw new GovernanceUnreachableError('core down');
    });
    const res = await governCall({
      args: { database: 'x' },
      def: makeDef('reversible', handler),
      client,
      subjectRef: 'bot-1',
      pendingMode: 'block',
      approvalTimeoutMs: 1000,
      pollIntervalMs: 1,
      failOpen: true, // reversible + opt-in ⇒ runs
      sleep: noSleep,
    });
    expect(calls).toHaveLength(1);
    expect(res.content.map((c) => c.text).join('\n')).toContain('fail-open');
  });

  it('should fail closed when a pending decision lacks an approval id', async () => {
    const { handler, calls } = makeHandler();
    const client = fakeClient(async () => ({
      decision: 'pending',
      reasons: [],
      policy_level: 3,
      // approval_id intentionally absent
    }));
    const res = await governCall({
      args: { database: 'x' },
      def: makeDef('irreversible', handler),
      client,
      subjectRef: 'bot-1',
      pendingMode: 'block',
      approvalTimeoutMs: 1000,
      pollIntervalMs: 1,
      failOpen: false,
      sleep: noSleep,
    });
    expect(calls).toHaveLength(0);
    expect(res.isError).toBe(true);
  });
});

describe('[UNIT] governCall — return mode', () => {
  it('should return the approval id and ACTION approval route without executing', async () => {
    const { handler, calls } = makeHandler();
    const client = fakeClient(async () => ({
      decision: 'pending',
      reasons: [],
      policy_level: 3,
      approval_id: 'apr_77',
      expires_at: '2026-06-10T12:00:00Z',
    }));
    const res = await governCall({
      args: { database: 'x' },
      def: makeDef('irreversible', handler),
      client,
      subjectRef: 'bot-1',
      pendingMode: 'return',
      approvalTimeoutMs: 1000,
      pollIntervalMs: 1,
      failOpen: false,
      sleep: noSleep,
    });
    expect(calls).toHaveLength(0);
    const text = res.content[0].text;
    expect(text).toContain('apr_77');
    // QA finding AK-2-C1: must instruct the ACTION approvals route.
    expect(text).toContain('/actions/approvals/apr_77/approve');
  });
});
