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

// Surface a missing API key at boot (stderr) instead of at the first tool
// call. Warn-only by design: the server must still boot so the MCP handshake
// succeeds and the client can read tool descriptions.
warnIfApiKeyMissing();

const server = createMcpServer();
const transport = new StdioServerTransport();
await server.connect(transport);
