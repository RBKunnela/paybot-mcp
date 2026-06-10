#!/usr/bin/env node

/**
 * PayBot MCP Server — Stdio transport entry point.
 *
 * Usage:
 *   npx paybot-mcp
 *
 * Or add to your MCP client config:
 *   {
 *     "mcpServers": {
 *       "paybot": {
 *         "command": "npx",
 *         "args": ["paybot-mcp"],
 *         "env": {
 *           "PAYBOT_API_KEY": "pb_...",
 *           "PAYBOT_FACILITATOR_URL": "https://api.paybotcore.com",
 *           "PAYBOT_BOT_ID": "my-agent"
 *         }
 *       }
 *     }
 *   }
 */

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createMcpServer } from './server.js';
import { warnIfApiKeyMissing } from './config-warnings.js';

// Public API surface for embedders building their own governed MCP servers
// (AK-3). Re-exporting is side-effect-free; the stdio bootstrap below only runs
// when this module is the process entry point.
export { createMcpServer } from './server.js';
export {
  registerGovernedTool,
  governCall,
  hashActionParams,
  sortObjectKeys,
  type GovernedToolDefinition,
  type GovernedToolOptions,
  type RiskClass,
  type PendingMode,
} from './governed-tool.js';
export {
  GovernanceClient,
  GovernanceUnreachableError,
  ApprovalNotFoundError,
  governanceConfigFromEnv,
  type GovernIntentRequest,
  type GovernResult,
  type GovernDecision,
  type ApprovalStatus,
  type ActionPolicyEnvelope,
} from './governance-client.js';
export {
  registerDemoTools,
  demoToolsEnabled,
  DEMO_POLICY,
  DEMO_TOOLS_ENV_FLAG,
} from './demo-tools.js';

// Surface a missing API key at boot (stderr) instead of at the first tool
// call. Warn-only by design: the server must still boot so the MCP handshake
// succeeds and the client can read tool descriptions.
warnIfApiKeyMissing();

const server = createMcpServer();
const transport = new StdioServerTransport();
await server.connect(transport);
