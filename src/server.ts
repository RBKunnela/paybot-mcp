import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { PayBotClient, PayBotApiError } from 'paybot-sdk';
import type { TrustLevel } from 'paybot-sdk';

/**
 * Create a PayBot MCP server exposing payment tools to AI agents.
 *
 * Tools:
 * - paybot_pay — make a USDC payment
 * - paybot_balance — check spending limits and budget
 * - paybot_history — view recent payment history
 * - paybot_register — register a new bot
 */
export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: 'paybot',
    version: '0.1.0',
  });

  // Shared client — lazily created per-request from env
  function getClient(botId?: string): PayBotClient {
    const apiKey = process.env.PAYBOT_API_KEY ?? process.env.API_KEY;
    if (!apiKey) {
      throw new Error(
        'PayBot MCP server requires an API key. ' +
        'Set the PAYBOT_API_KEY (or API_KEY) environment variable before using PayBot tools.'
      );
    }
    return new PayBotClient({
      apiKey,
      facilitatorUrl: process.env.PAYBOT_FACILITATOR_URL ?? process.env.X402_FACILITATOR_URL ?? 'http://localhost:3000',
      botId: botId ?? process.env.PAYBOT_BOT_ID ?? 'mcp-agent',
      walletPrivateKey: process.env.PAYBOT_WALLET_KEY,
    });
  }

  // --- paybot_pay ---
  server.tool(
    'paybot_pay',
    'Make a USDC payment for an API, service, or resource. Returns transaction hash and commission breakdown.',
    {
      amount: z.string().describe('Amount in USD (e.g., "0.05" for 5 cents)'),
      recipient: z.string().describe('Recipient wallet address (0x...)'),
      resource: z.string().describe('URL or description of what you are paying for'),
      botId: z.string().optional().describe('Bot identifier (defaults to env PAYBOT_BOT_ID)'),
      network: z.string().optional().describe('Network CAIP-2 ID (default: eip155:84532 Base Sepolia)'),
    },
    async ({ amount, recipient, resource, botId, network }) => {
      const client = getClient(botId);
      const result = await client.pay({
        resource,
        amount,
        payTo: recipient,
        network,
      });

      if (!result.success) {
        return {
          content: [{ type: 'text' as const, text: `Payment failed: ${result.error}` }],
          isError: true,
        };
      }

      return {
        content: [{
          type: 'text' as const,
          text: [
            `Payment successful!`,
            `Transaction: ${result.txHash}`,
            `Amount: $${amount} USDC`,
            `Recipient: ${recipient}`,
            `Commission: ${result.commissionRate * 100}% ($${(Number(result.commissionAmount) / 1e6).toFixed(6)})`,
            result.network ? `Network: ${result.network}` : '',
            result.txHash ? `Explorer: https://sepolia.basescan.org/tx/${result.txHash}` : '',
          ].filter(Boolean).join('\n'),
        }],
      };
    }
  );

  // --- paybot_balance ---
  server.tool(
    'paybot_balance',
    'Check spending limits, trust level, and remaining daily budget for a bot.',
    {
      botId: z.string().optional().describe('Bot identifier (defaults to env PAYBOT_BOT_ID)'),
    },
    async ({ botId }) => {
      const client = getClient(botId);
      const balance = await client.balance();

      return {
        content: [{
          type: 'text' as const,
          text: [
            `Bot: ${balance.botId}`,
            `Trust Level: ${balance.trustLevel} (${balance.trustLevelName})`,
            `Daily Spent: $${balance.dailySpentUsd.toFixed(2)}`,
            `Daily Limit: $${balance.dailyLimitUsd.toFixed(2)}`,
            `Remaining: $${balance.dailyRemainingUsd.toFixed(2)}`,
            `Hourly Transactions: ${balance.hourlyTransactions}/${balance.hourlyLimit}`,
          ].join('\n'),
        }],
      };
    }
  );

  // --- paybot_history ---
  server.tool(
    'paybot_history',
    'View recent payment history and audit events for a bot.',
    {
      botId: z.string().optional().describe('Bot identifier (defaults to env PAYBOT_BOT_ID)'),
      limit: z.number().optional().describe('Max events to return (default: 10)'),
    },
    async ({ botId, limit }) => {
      const client = getClient(botId);
      const events = await client.history(limit ?? 10);

      if (events.length === 0) {
        return {
          content: [{ type: 'text' as const, text: 'No payment history found.' }],
        };
      }

      const formatted = events.map((e, i) =>
        `${i + 1}. [${e.eventType}] ${e.action} (${new Date(e.timestamp).toISOString()})`
      ).join('\n');

      return {
        content: [{ type: 'text' as const, text: `Recent events:\n${formatted}` }],
      };
    }
  );

  // --- paybot_register ---
  server.tool(
    'paybot_register',
    'Register a new bot with the PayBot facilitator. Returns the assigned trust level.',
    {
      botId: z.string().describe('Unique bot identifier'),
      trustLevel: z.number().min(0).max(5).optional().describe('Initial trust level 0-5 (default: 1)'),
    },
    async ({ botId, trustLevel }) => {
      try {
        const client = getClient(botId);
        const result = await client.register((trustLevel ?? 1) as TrustLevel);

        return {
          content: [{
            type: 'text' as const,
            text: `Bot "${botId}" registered at trust level ${result.trustLevel}. Ready to make payments.`,
          }],
        };
      } catch (error: unknown) {
        const message = error instanceof PayBotApiError ? error.message : String(error);
        return {
          content: [{ type: 'text' as const, text: `Registration failed: ${message}` }],
          isError: true,
        };
      }
    }
  );

  return server;
}
