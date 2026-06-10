/**
 * @module tests/governance-client
 *
 * Unit tests for {@link GovernanceClient} (src/governance-client.ts): the thin,
 * fail-closed HTTP client for core's action-governance API. Fetch is injected,
 * so these exercise the parsing + fail-closed posture with no live core.
 *
 * Covers: govern() happy/deny/pending parses, getApproval() parses, and the
 * adversarial set — network error, timeout/abort, 5xx, malformed JSON, malformed
 * decision, 404 → typed ApprovalNotFoundError, and env-config resolution.
 *
 * Dependencies: vitest, src/governance-client.
 */
import { describe, it, expect, vi } from 'vitest';
import {
  GovernanceClient,
  GovernanceUnreachableError,
  ApprovalNotFoundError,
  governanceConfigFromEnv,
  type GovernIntentRequest,
} from '../src/governance-client.js';

/** Build a fetch stub that returns a JSON body with a given status. */
function jsonFetch(status: number, body: unknown): typeof fetch {
  return vi.fn(async () =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })
  ) as unknown as typeof fetch;
}

const intent: GovernIntentRequest = {
  intent_id: 'act_test',
  actor: { type: 'agent', subject_ref: 'bot-1' },
  action: { verb: 'delete_database', target_ref: 'db:x', params_hash: 'a'.repeat(64) },
  risk_class: 'irreversible',
  channel: 'mcp',
};

function client(fetchImpl: typeof fetch, timeoutMs = 5000): GovernanceClient {
  return new GovernanceClient({ baseUrl: 'http://core', apiKey: 'k', timeoutMs, fetchImpl });
}

describe('[UNIT] GovernanceClient.govern', () => {
  it('should parse an allow decision when core returns allow', async () => {
    const c = client(jsonFetch(200, { decision: 'allow', reasons: [], policy_level: 3 }));
    const r = await c.govern(intent);
    expect(r.decision).toBe('allow');
    expect(r.policy_level).toBe(3);
  });

  it('should parse a deny decision with reasons', async () => {
    const c = client(
      jsonFetch(200, {
        decision: 'deny',
        reasons: [{ gate: 'VERB_ALLOWLIST', reason: 'nope' }],
        policy_level: 0,
      })
    );
    const r = await c.govern(intent);
    expect(r.decision).toBe('deny');
    expect(r.reasons[0].gate).toBe('VERB_ALLOWLIST');
  });

  it('should parse a pending decision carrying the approval id', async () => {
    const c = client(
      jsonFetch(200, {
        decision: 'pending',
        reasons: [{ gate: 'RISK_CLASS', reason: 'needs approval' }],
        policy_level: 3,
        approval_id: 'apr_9',
        poll_url: '/approvals/apr_9',
      })
    );
    const r = await c.govern(intent);
    expect(r.decision).toBe('pending');
    expect(r.approval_id).toBe('apr_9');
  });

  it('[ADVERSARIAL] should fail closed on a 500 response', async () => {
    const c = client(jsonFetch(500, { error: 'boom' }));
    await expect(c.govern(intent)).rejects.toBeInstanceOf(GovernanceUnreachableError);
  });

  it('[ADVERSARIAL] should fail closed on a network error', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error('ECONNREFUSED');
    }) as unknown as typeof fetch;
    await expect(client(fetchImpl).govern(intent)).rejects.toBeInstanceOf(
      GovernanceUnreachableError
    );
  });

  it('[ADVERSARIAL] should fail closed on a timeout (AbortError)', async () => {
    const fetchImpl = vi.fn(async () => {
      const e = new Error('aborted');
      e.name = 'AbortError';
      throw e;
    }) as unknown as typeof fetch;
    await expect(client(fetchImpl, 10).govern(intent)).rejects.toMatchObject({
      code: 'GOVERNANCE_UNREACHABLE',
    });
  });

  it('[ADVERSARIAL] should fail closed on malformed JSON', async () => {
    const fetchImpl = vi.fn(async () =>
      new Response('not json', { status: 200 })
    ) as unknown as typeof fetch;
    await expect(client(fetchImpl).govern(intent)).rejects.toBeInstanceOf(
      GovernanceUnreachableError
    );
  });

  it('[ADVERSARIAL] should fail closed on a malformed decision value (never allow)', async () => {
    const c = client(jsonFetch(200, { decision: 'maybe', reasons: [] }));
    await expect(c.govern(intent)).rejects.toBeInstanceOf(GovernanceUnreachableError);
  });

  it('should send the API key header and JSON body', async () => {
    const spy = vi.fn(async () =>
      new Response(JSON.stringify({ decision: 'allow', reasons: [], policy_level: 0 }), {
        status: 200,
      })
    );
    await client(spy as unknown as typeof fetch).govern(intent);
    const [, init] = spy.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>)['X-API-Key']).toBe('k');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string).intent_id).toBe('act_test');
  });
});

describe('[UNIT] GovernanceClient.getApproval', () => {
  it('should parse a PENDING status', async () => {
    const c = client(jsonFetch(200, { approval_id: 'apr_1', decision: 'PENDING' }));
    expect((await c.getApproval('apr_1')).decision).toBe('PENDING');
  });

  it('should parse an APPROVED status with decided_by', async () => {
    const c = client(
      jsonFetch(200, { approval_id: 'apr_1', decision: 'APPROVED', decided_by: 'op-1' })
    );
    const s = await c.getApproval('apr_1');
    expect(s.decision).toBe('APPROVED');
    expect(s.decided_by).toBe('op-1');
  });

  it('[ADVERSARIAL] should throw ApprovalNotFoundError on 404', async () => {
    const c = client(jsonFetch(404, { error: 'NOT_FOUND' }));
    await expect(c.getApproval('apr_x')).rejects.toBeInstanceOf(ApprovalNotFoundError);
  });

  it('[ADVERSARIAL] should fail closed on a malformed decision (never APPROVED)', async () => {
    const c = client(jsonFetch(200, { approval_id: 'apr_1', decision: 'green' }));
    await expect(c.getApproval('apr_1')).rejects.toBeInstanceOf(GovernanceUnreachableError);
  });

  it('[ADVERSARIAL] should fail closed on a 503 status', async () => {
    const c = client(jsonFetch(503, {}));
    await expect(c.getApproval('apr_1')).rejects.toBeInstanceOf(GovernanceUnreachableError);
  });
});

describe('[UNIT] governanceConfigFromEnv', () => {
  it('should resolve baseUrl + apiKey from PAYBOT_* vars', () => {
    const cfg = governanceConfigFromEnv({
      PAYBOT_API_KEY: 'pb_1',
      PAYBOT_FACILITATOR_URL: 'http://core:3000/',
    } as NodeJS.ProcessEnv);
    expect(cfg.apiKey).toBe('pb_1');
    expect(cfg.baseUrl).toBe('http://core:3000'); // trailing slash trimmed
  });

  it('should fall back to the public default base URL', () => {
    const cfg = governanceConfigFromEnv({ API_KEY: 'k' } as NodeJS.ProcessEnv);
    expect(cfg.baseUrl).toBe('https://api.paybotcore.com');
  });

  it('[ADVERSARIAL] should throw when no API key is configured (fail closed)', () => {
    expect(() => governanceConfigFromEnv({} as NodeJS.ProcessEnv)).toThrow(/API key/);
  });
});
