/**
 * @module tests/demo-tools
 *
 * Tests for the env-gated MOCK demo tools (src/demo-tools.ts) and their
 * registration through the AK-3 interceptor. A fake McpServer captures the
 * registered handlers so each can be invoked with a faked GovernanceClient.
 *
 * Covers: demoToolsEnabled() gate (off by default), both tools register,
 * delete_database governs as irreversible (declared by registrar, not args),
 * annotate_record governs as reversible, and the demo policy is forwarded.
 *
 * Dependencies: vitest, src/demo-tools, src/governance-client (types).
 */
import { describe, it, expect, vi } from 'vitest';
import {
  registerDemoTools,
  demoToolsEnabled,
  DEMO_POLICY,
  DEMO_TOOLS_ENV_FLAG,
} from '../src/demo-tools.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { GovernanceClient, GovernIntentRequest } from '../src/governance-client.js';

type Handler = (args: unknown) => Promise<{ content: Array<{ type: 'text'; text: string }> }>;

/** A fake McpServer that records (name, description, schema, handler). */
function fakeServer() {
  const tools = new Map<
    string,
    { description: string; schema: unknown; handler: Handler }
  >();
  const server = {
    tool: (name: string, description: string, schema: unknown, handler: Handler) => {
      tools.set(name, { description, schema, handler });
    },
  } as unknown as McpServer;
  return { server, tools };
}

/** A fake client that captures the govern() intent and returns allow. */
function capturingClient() {
  const intents: GovernIntentRequest[] = [];
  const client = {
    govern: vi.fn(async (intent: GovernIntentRequest) => {
      intents.push(intent);
      return { decision: 'allow' as const, reasons: [], policy_level: 3 };
    }),
    getApproval: vi.fn(),
  } as unknown as GovernanceClient;
  return { client, intents };
}

describe('[UNIT] demoToolsEnabled', () => {
  it('should be false by default (no flag)', () => {
    expect(demoToolsEnabled({} as NodeJS.ProcessEnv)).toBe(false);
  });

  it('should be true only when flag is exactly "true"', () => {
    expect(
      demoToolsEnabled({ [DEMO_TOOLS_ENV_FLAG]: 'true' } as unknown as NodeJS.ProcessEnv)
    ).toBe(true);
  });

  it('[ADVERSARIAL] should reject truthy-but-not-"true" values (off by default)', () => {
    expect(
      demoToolsEnabled({ [DEMO_TOOLS_ENV_FLAG]: '1' } as unknown as NodeJS.ProcessEnv)
    ).toBe(false);
    expect(
      demoToolsEnabled({ [DEMO_TOOLS_ENV_FLAG]: 'TRUE' } as unknown as NodeJS.ProcessEnv)
    ).toBe(false);
  });
});

describe('[UNIT] registerDemoTools', () => {
  it('should register both demo tools', () => {
    const { server, tools } = fakeServer();
    registerDemoTools(server, capturingClient().client);
    expect([...tools.keys()].sort()).toEqual(['annotate_record', 'delete_database']);
  });

  it('should label delete_database as a MOCK in its description', () => {
    const { server, tools } = fakeServer();
    registerDemoTools(server, capturingClient().client);
    expect(tools.get('delete_database')!.description).toContain('MOCK');
  });

  it('should govern delete_database as IRREVERSIBLE regardless of call args', async () => {
    const { server, tools } = fakeServer();
    const { client, intents } = capturingClient();
    registerDemoTools(server, client);
    // The agent cannot self-declare risk: even passing risk_class in args is ignored.
    await tools.get('delete_database')!.handler({
      database: 'analytics',
      risk_class: 'reversible',
    });
    expect(intents[0].risk_class).toBe('irreversible');
    expect(intents[0].action.verb).toBe('delete_database');
    expect(intents[0].action.target_ref).toBe('db:analytics');
  });

  it('should govern annotate_record as REVERSIBLE', async () => {
    const { server, tools } = fakeServer();
    const { client, intents } = capturingClient();
    registerDemoTools(server, client);
    await tools.get('annotate_record')!.handler({ record: 'r1', note: 'hi' });
    expect(intents[0].risk_class).toBe('reversible');
    expect(intents[0].action.target_ref).toBe('record:r1');
  });

  it('should forward the DEMO_POLICY allowing exactly the two demo verbs', async () => {
    const { server, tools } = fakeServer();
    const { client, intents } = capturingClient();
    registerDemoTools(server, client);
    await tools.get('annotate_record')!.handler({ record: 'r1', note: 'hi' });
    expect(intents[0].policy?.allowedVerbs.sort()).toEqual([
      'annotate_record',
      'delete_database',
    ]);
    expect(intents[0].policy?.autoAllowIrreversible).toBe(false);
    expect(DEMO_POLICY.allowedVerbs).toContain('delete_database');
  });

  it('should never send raw arguments to core — only params_hash + target_ref', async () => {
    const { server, tools } = fakeServer();
    const { client, intents } = capturingClient();
    registerDemoTools(server, client);
    await tools.get('delete_database')!.handler({ database: 'secret-db', reason: 'cleanup' });
    const sent = JSON.stringify(intents[0]);
    expect(sent).not.toContain('cleanup'); // raw arg value never leaves the process
    expect(intents[0].action.params_hash).toMatch(/^[a-f0-9]{64}$/);
  });
});
