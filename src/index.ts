#!/usr/bin/env node

/**
 * PayBot MCP Server
 *
 * Exposes PayBot payment capabilities to AI agents
 * via the Model Context Protocol (MCP).
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const PAYBOT_BASE_URL = process.env.PAYBOT_BASE_URL ?? 'http://localhost:3000';
const PAYBOT_API_KEY = process.env.PAYBOT_API_KEY ?? '';

async function paybotRequest<T>(method: string, path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${PAYBOT_BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${PAYBOT_API_KEY}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => 'Unknown error');
    throw new Error(`PayBot API error (${response.status}): ${errorBody}`);
  }

  return (await response.json()) as T;
}

const server = new McpServer({
  name: 'paybot',
  version: '0.1.0',
});

// Tool: pay
server.tool(
  'pay',
  'Submit a USDC payment through PayBot',
  {
    to: z.string().describe('Recipient wallet address (0x...)'),
    amount: z.string().describe('Amount in USDC (e.g. "10.00")'),
    memo: z.string().optional().describe('Payment description'),
    idempotencyKey: z.string().optional().describe('Idempotency key to prevent duplicates'),
  },
  async ({ to, amount, memo, idempotencyKey }) => {
    const result = await paybotRequest('POST', '/v1/payments', {
      to,
      amount,
      memo,
      idempotencyKey,
    });
    return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
  },
);

// Tool: get_payment
server.tool(
  'get_payment',
  'Get the status of a PayBot payment',
  {
    paymentId: z.string().describe('The payment ID to look up'),
  },
  async ({ paymentId }) => {
    const result = await paybotRequest('GET', `/v1/payments/${paymentId}`);
    return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
  },
);

// Tool: list_payments
server.tool(
  'list_payments',
  'List recent payments',
  {
    limit: z.number().optional().describe('Max number of payments to return'),
    offset: z.number().optional().describe('Offset for pagination'),
  },
  async ({ limit, offset }) => {
    const params = new URLSearchParams();
    if (limit) params.set('limit', String(limit));
    if (offset) params.set('offset', String(offset));
    const query = params.toString();
    const result = await paybotRequest('GET', `/v1/payments${query ? `?${query}` : ''}`);
    return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
  },
);

// Tool: health
server.tool('health', 'Check if the PayBot server is reachable', {}, async () => {
  const result = await paybotRequest('GET', '/health');
  return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error: unknown) => {
  console.error('Failed to start PayBot MCP server:', error);
  process.exit(1);
});
