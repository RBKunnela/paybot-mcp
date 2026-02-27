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
 *           "PAYBOT_FACILITATOR_URL": "http://localhost:3000",
 *           "PAYBOT_BOT_ID": "my-agent"
 *         }
 *       }
 *     }
 *   }
 */

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createMcpServer } from './server.js';

const server = createMcpServer();
const transport = new StdioServerTransport();
await server.connect(transport);
