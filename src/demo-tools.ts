/**
 * @module demo-tools
 *
 * Env-gated MOCK demo tools that exercise the AK-3 governance interceptor end
 * to end without any real side effects. They are the flagship cross-verb demo:
 * an agent calls `delete_database` → core gate → PENDING → operator approves →
 * the (mock) tool executes → tamper-evident proof in core's audit chain.
 *
 * Honesty guardrails (epic EPIC-AP2-KERNEL):
 *  - `delete_database` is a MOCK: its handler touches NOTHING real and says so
 *    in its description and output. It is irreversible by CLASSIFICATION (so it
 *    pauses for approval) but harmless in EFFECT.
 *  - `annotate_record` is a reversible companion that proves the allow path.
 *  - Both are registered ONLY when `PAYBOT_ENABLE_DEMO_TOOLS=true`. A published
 *    MCP server must not advertise a `delete_database` tool to every agent.
 *
 * The demo policy granted to these tools allows exactly the two demo verbs and
 * leaves `autoAllowIrreversible: false`, so `delete_database` always pauses for
 * a human (the HITL trigger) while `annotate_record` flows straight through.
 *
 * Dependencies: zod, @modelcontextprotocol/sdk, ./governed-tool,
 *   ./governance-client.
 * Used by: src/server.ts (additive registration behind the env flag).
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerGovernedTool, type GovernedToolOptions } from './governed-tool.js';
import {
  GovernanceClient,
  governanceConfigFromEnv,
  type ActionPolicyEnvelope,
} from './governance-client.js';

/** Env flag that gates demo-tool registration. */
export const DEMO_TOOLS_ENV_FLAG = 'PAYBOT_ENABLE_DEMO_TOOLS';

/**
 * The demo policy declared to core for the two demo verbs.
 *
 * Allows exactly `delete_database` and `annotate_record`; everything else is
 * deny-by-default. `autoAllowIrreversible` is false, so `delete_database`
 * (irreversible) pauses for human approval and `annotate_record` (reversible)
 * is allowed outright. Trust level 3 is a reasonable demo default.
 */
export const DEMO_POLICY: ActionPolicyEnvelope = {
  trustLevel: 3,
  allowedVerbs: ['delete_database', 'annotate_record'],
  forbiddenTargets: [],
  allowedTargets: [],
  maxActionsPerHour: 60,
  autoAllowIrreversible: false,
};

/**
 * Whether demo tools should be registered, per the env flag.
 *
 * @param env - Environment snapshot (defaults to `process.env`).
 * @returns `true` only when `PAYBOT_ENABLE_DEMO_TOOLS` is exactly `'true'`.
 *
 * @example
 * if (demoToolsEnabled()) registerDemoTools(server);
 */
export function demoToolsEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env[DEMO_TOOLS_ENV_FLAG] === 'true';
}

/**
 * Register the two governed MOCK demo tools on an MCP server.
 *
 * Caller is responsible for the env gate (use {@link demoToolsEnabled}); this
 * function registers unconditionally so tests can drive it directly. A
 * {@link GovernanceClient} may be injected (tests); otherwise one is built from
 * env via {@link governanceConfigFromEnv}.
 *
 * @param server - The MCP server to register the demo tools on.
 * @param client - Optional governance client (defaults to env-configured).
 * @param opts - Optional governed-tool options (subjectRef, pendingMode, etc.);
 *   the demo policy is supplied automatically when `opts.policy` is absent.
 * @returns void.
 *
 * @example
 * registerDemoTools(server); // uses env config + DEMO_POLICY
 */
export function registerDemoTools(
  server: McpServer,
  client?: GovernanceClient,
  opts: GovernedToolOptions = {}
): void {
  const governanceClient = client ?? new GovernanceClient(governanceConfigFromEnv());
  const baseOpts: GovernedToolOptions = {
    ...opts,
    policy: opts.policy ?? DEMO_POLICY,
  };

  // --- delete_database (MOCK, irreversible → pauses for approval) ---
  registerGovernedTool<{ database: string; reason?: string }>(
    server,
    {
      name: 'delete_database',
      description:
        'MOCK demo tool: simulate deleting a database. Touches NOTHING real — ' +
        'it only returns a labelled mock confirmation. Governed as irreversible, ' +
        'so it pauses for human approval before the mock "deletion" runs.',
      schema: {
        database: z.string().describe('Name of the (mock) database to delete'),
        reason: z.string().optional().describe('Optional reason for the deletion'),
      },
      riskClass: 'irreversible',
      // Opaque target: the db name is not PII; safe to audit as a ref.
      targetRef: (args) => `db:${args.database}`,
      handler: (args) => ({
        content: [
          {
            type: 'text' as const,
            text: [
              `[MOCK] Database '${args.database}' deleted.`,
              'No real resource was touched — this is a demo tool.',
              args.reason ? `Reason: ${args.reason}` : '',
            ]
              .filter(Boolean)
              .join('\n'),
          },
        ],
      }),
    },
    governanceClient,
    baseOpts
  );

  // --- annotate_record (reversible → allowed straight through) ---
  registerGovernedTool<{ record: string; note: string }>(
    server,
    {
      name: 'annotate_record',
      description:
        'MOCK demo tool: attach a reversible annotation to a record. Touches ' +
        'nothing real; governed as reversible, so it proves the allow path.',
      schema: {
        record: z.string().describe('Opaque record id to annotate'),
        note: z.string().describe('Annotation text'),
      },
      riskClass: 'reversible',
      targetRef: (args) => `record:${args.record}`,
      handler: (args) => ({
        content: [
          {
            type: 'text' as const,
            text: `[MOCK] Annotated record '${args.record}': "${args.note}" (reversible).`,
          },
        ],
      }),
    },
    governanceClient,
    baseOpts
  );
}
