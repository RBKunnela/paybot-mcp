import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createRequire } from 'node:module';
import { z } from 'zod';
import {
  PayBotClient,
  PayBotApiError,
  PayBotClientPool,
  getSupportedNetworks,
  getNetwork,
  getSupportedTokens,
  getToken,
  getTokenAddress,
} from 'paybot-sdk';
import type { TrustLevel, LimitsConfig, CommissionLedgerFilter } from 'paybot-sdk';
import { formatDenial } from './denial-guidance.js';

/**
 * Single source of truth for the served version.
 *
 * Read from package.json at runtime so the MCP handshake version can never
 * drift from the published package version. `createRequire` resolves
 * `../package.json` relative to the compiled `dist/server.js` (one level above
 * dist/) as well as `src/server.ts` (one level above src/) — package.json sits
 * at the repo root in both layouts. Reading at runtime (rather than a JSON
 * import) keeps package.json outside tsconfig's `rootDir: ./src`.
 */
const require = createRequire(import.meta.url);
const { version: PACKAGE_VERSION } = require('../package.json') as { version: string };

/**
 * Derive a network-correct block-explorer transaction URL from the public
 * networks registry.
 *
 * The earlier implementation hardcoded `sepolia.basescan.org` for every
 * network, which produced wrong links for any non-Base-Sepolia payment. This
 * resolves the explorer base from {@link getNetwork} so each network's tx link
 * points at the right explorer (e.g. Optimism → optimistic.etherscan.io).
 *
 * @param network - CAIP-2 network id (e.g. `'eip155:84532'`). When undefined or
 *   unknown, falls back to Base Sepolia for backward compatibility.
 * @param txHash - The transaction hash to link to.
 * @returns A fully-qualified explorer URL for the transaction.
 */
function explorerTxUrl(network: string | undefined, txHash: string): string {
  const cfg = network ? getNetwork(network) : undefined;
  const base = cfg?.explorerUrl ?? 'https://sepolia.basescan.org';
  return `${base.replace(/\/$/, '')}/tx/${txHash}`;
}

/**
 * Create a PayBot MCP server exposing payment tools to AI agents.
 *
 * Tools (v0.3.0):
 * - paybot_pay — make a payment (USDC default; optional token + idempotencyKey)
 * - paybot_balance — check spending limits and budget
 * - paybot_history — view recent payment history
 * - paybot_register — register a new bot (optional idempotencyKey)
 * - paybot_list_networks_and_tokens — discover supported networks/tokens (offline, public registry only)
 * - paybot_health_extended — facilitator health (status/version/uptime + extras)
 * - paybot_set_spending_limit — tighten an agent's own spending limits
 * - paybot_commission_inspect — commission summary + ledger
 * - paybot_pool_create / paybot_pool_allocate / paybot_pool_revoke / paybot_pool_status —
 *   in-process multi-bot pool with a shared daily treasury
 */
export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: 'paybot',
    version: PACKAGE_VERSION,
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
      facilitatorUrl: process.env.PAYBOT_FACILITATOR_URL ?? process.env.X402_FACILITATOR_URL ?? 'https://api.paybotcore.com',
      botId: botId ?? process.env.PAYBOT_BOT_ID ?? 'mcp-agent',
      walletPrivateKey: process.env.PAYBOT_WALLET_KEY,
    });
  }

  /**
   * In-process pool registry for the lifetime of this MCP server (one stdio
   * session). MCP stdio servers are single-session and stateless across runs,
   * so a pool created here lives only for the session and its shared-treasury
   * accounting is in-memory; the facilitator remains the authoritative limit.
   * Keyed by a caller-chosen pool id so an orchestrator can run more than one.
   */
  const pools = new Map<string, PayBotClientPool>();

  // --- paybot_pay ---
  server.tool(
    'paybot_pay',
    'Make a payment (USDC by default) for an API, service, or resource. Returns transaction hash and commission breakdown. Supports alternate tokens and idempotency.',
    {
      amount: z.string().describe('Amount in USD (e.g., "0.05" for 5 cents)'),
      recipient: z.string().describe('Recipient wallet address (0x...)'),
      resource: z.string().describe('URL or description of what you are paying for'),
      botId: z.string().optional().describe('Bot identifier (defaults to env PAYBOT_BOT_ID)'),
      network: z.string().optional().describe('Network CAIP-2 ID (default: eip155:84532 Base Sepolia)'),
      token: z.string().optional().describe('Token ticker to pay with (default: USDC). e.g. USDC, EURC, DAI'),
      idempotencyKey: z.string().optional().describe('Optional idempotency key; a repeat call with the same key returns the cached result'),
    },
    async ({ amount, recipient, resource, botId, network, token, idempotencyKey }) => {
      const client = getClient(botId);
      const result = await client.pay({
        resource,
        amount,
        payTo: recipient,
        network,
        token,
        idempotencyKey,
      });

      if (!result.success) {
        // Surface the machine errorCode + human errorDetails the SDK already
        // returns, plus a plain-language guidance line for policy denials, so
        // the agent can act without opening core's logs (Story A1). Non-policy
        // failures keep their SDK text with no fabricated code/guidance.
        return {
          content: [{ type: 'text' as const, text: formatDenial(result) }],
          isError: true,
        };
      }

      return {
        content: [{
          type: 'text' as const,
          text: [
            `Payment successful!`,
            `Transaction: ${result.txHash}`,
            `Amount: $${amount} ${token ?? 'USDC'}`,
            `Recipient: ${recipient}`,
            `Commission: ${result.commissionRate * 100}% ($${(Number(result.commissionAmount) / 1e6).toFixed(6)})`,
            result.network ? `Network: ${result.network}` : '',
            result.txHash ? `Explorer: ${explorerTxUrl(result.network, result.txHash)}` : '',
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
    'Register a new bot with the PayBot facilitator. Returns the assigned trust level. Supports an optional idempotency key for safe re-issue.',
    {
      botId: z.string().describe('Unique bot identifier'),
      trustLevel: z.number().min(0).max(5).optional().describe('Initial trust level 0-5 (default: 1)'),
      idempotencyKey: z.string().optional().describe('Optional idempotency key; a repeat register with the same key returns the cached result'),
    },
    async ({ botId, trustLevel, idempotencyKey }) => {
      try {
        const client = getClient(botId);
        const result = await client.register((trustLevel ?? 1) as TrustLevel, idempotencyKey);

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

  // --- paybot_list_networks_and_tokens ---
  server.tool(
    'paybot_list_networks_and_tokens',
    'List the networks and tokens PayBot supports. Read-only, offline, requires no API key. Surfaces only the PUBLIC open-core registry — operator-private mainnet addresses are never shown.',
    {},
    async () => {
      // Public registry only. We deliberately do NOT touch any operator
      // tokenAddressOverrides — this discovery surface must never leak a
      // private mainnet address (e.g. EURC mainnet). EURC therefore advertises
      // only its public (Base Sepolia) deployment.
      const networks = getSupportedNetworks().map((caip2) => {
        const n = getNetwork(caip2);
        return {
          caip2,
          name: n?.name ?? caip2,
          isTestnet: n?.isTestnet ?? false,
          explorerUrl: n?.explorerUrl ?? '',
        };
      });

      const tokens = getSupportedTokens().map((symbol) => {
        const t = getToken(symbol);
        // Per-network deployment from the PUBLIC registry only.
        const deployedOn = getSupportedNetworks().filter(
          (caip2) => getTokenAddress(symbol, caip2) !== undefined
        );
        return {
          symbol,
          decimals: t?.decimals ?? 0,
          name: t?.name ?? symbol,
          networks: deployedOn,
        };
      });

      const networkLines = networks.map((n) =>
        `- ${n.name} (${n.caip2})${n.isTestnet ? ' [testnet]' : ''} — ${n.explorerUrl}`
      );
      const tokenLines = tokens.map((t) =>
        `- ${t.symbol} (${t.name}, ${t.decimals} decimals) — on: ${t.networks.length ? t.networks.join(', ') : '(no public deployment)'}`
      );

      return {
        content: [{
          type: 'text' as const,
          text: [
            `Supported networks (${networks.length}):`,
            ...networkLines,
            '',
            `Supported tokens (${tokens.length}):`,
            ...tokenLines,
          ].join('\n'),
        }],
      };
    }
  );

  // --- paybot_health_extended ---
  server.tool(
    'paybot_health_extended',
    'Check extended facilitator health: status, version, uptime, timestamp, plus any extra fields the facilitator reports (e.g. relayer/gas/AML status).',
    {
      botId: z.string().optional().describe('Bot identifier (defaults to env PAYBOT_BOT_ID)'),
    },
    async ({ botId }) => {
      try {
        const client = getClient(botId);
        const health = await client.health();

        const known = new Set(['status', 'version', 'uptime', 'timestamp']);
        const extras = Object.entries(health)
          .filter(([k]) => !known.has(k))
          .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : String(v)}`);

        return {
          content: [{
            type: 'text' as const,
            text: [
              `Status: ${health.status}`,
              `Version: ${health.version}`,
              `Uptime: ${health.uptime}s`,
              `Timestamp: ${health.timestamp}`,
              ...extras,
            ].join('\n'),
          }],
        };
      } catch (error: unknown) {
        const message = error instanceof PayBotApiError ? error.message : String(error);
        return {
          content: [{ type: 'text' as const, text: `Health check failed: ${message}` }],
          isError: true,
        };
      }
    }
  );

  // --- paybot_set_spending_limit ---
  server.tool(
    'paybot_set_spending_limit',
    'Set spending limits for a bot. Tightens the agent\'s own limits; the facilitator enforces the operator ceiling and may reject attempts to loosen beyond policy.',
    {
      botId: z.string().optional().describe('Bot identifier (defaults to env PAYBOT_BOT_ID)'),
      maxTransactionUsd: z.number().nonnegative().optional().describe('Max USD per transaction'),
      maxDailySpendUsd: z.number().nonnegative().optional().describe('Max USD spend per day'),
      maxTransactionsPerHour: z.number().int().nonnegative().optional().describe('Max transactions per hour'),
      allowedRecipients: z.array(z.string()).optional().describe('Allowlist of recipient addresses'),
    },
    async ({ botId, maxTransactionUsd, maxDailySpendUsd, maxTransactionsPerHour, allowedRecipients }) => {
      try {
        const client = getClient(botId);
        const limits: LimitsConfig = {};
        if (maxTransactionUsd !== undefined) limits.maxTransactionUsd = maxTransactionUsd;
        if (maxDailySpendUsd !== undefined) limits.maxDailySpendUsd = maxDailySpendUsd;
        if (maxTransactionsPerHour !== undefined) limits.maxTransactionsPerHour = maxTransactionsPerHour;
        if (allowedRecipients !== undefined) limits.allowedRecipients = allowedRecipients;

        if (Object.keys(limits).length === 0) {
          return {
            content: [{ type: 'text' as const, text: 'No limits provided. Specify at least one limit field.' }],
            isError: true,
          };
        }

        await client.setLimits(limits);

        const applied = Object.entries(limits).map(([k, v]) =>
          `${k}: ${Array.isArray(v) ? v.join(', ') : v}`
        );
        return {
          content: [{
            type: 'text' as const,
            text: ['Spending limits updated:', ...applied].join('\n'),
          }],
        };
      } catch (error: unknown) {
        const message = error instanceof PayBotApiError ? error.message : String(error);
        return {
          content: [{ type: 'text' as const, text: `Failed to set limits: ${message}` }],
          isError: true,
        };
      }
    }
  );

  // --- paybot_commission_inspect ---
  server.tool(
    'paybot_commission_inspect',
    'Inspect commission for transparency: aggregate summary (totals + rate) and a filterable, paginated ledger.',
    {
      botId: z.string().optional().describe('Bot identifier (defaults to env PAYBOT_BOT_ID)'),
      status: z.enum(['pending', 'forwarded', 'deferred']).optional().describe('Filter ledger entries by status'),
      startDate: z.string().optional().describe('Ledger start date (ISO 8601)'),
      endDate: z.string().optional().describe('Ledger end date (ISO 8601)'),
      limit: z.number().int().positive().optional().describe('Max ledger entries (default: 50)'),
      offset: z.number().int().nonnegative().optional().describe('Ledger pagination offset'),
    },
    async ({ botId, status, startDate, endDate, limit, offset }) => {
      try {
        const client = getClient(botId);
        const summary = await client.commissionSummary();

        const filter: CommissionLedgerFilter = {};
        if (status !== undefined) filter.status = status;
        if (startDate !== undefined) filter.startDate = startDate;
        if (endDate !== undefined) filter.endDate = endDate;
        if (limit !== undefined) filter.limit = limit;
        if (offset !== undefined) filter.offset = offset;

        const ledger = await client.commissionLedger(
          Object.keys(filter).length ? filter : undefined
        );

        const summaryLines = [
          'Commission summary:',
          `- Rate: ${(summary.commissionRate * 100).toFixed(2)}%`,
          `- Total earned: ${summary.totalEarned}`,
          `- Pending: ${summary.pending}`,
          `- Forwarded: ${summary.forwarded}`,
          `- Deferred: ${summary.deferred}`,
          `- Entries: ${summary.entryCount}`,
        ];

        const ledgerLines = ledger.length === 0
          ? ['Ledger: no entries.']
          : [
              `Ledger (${ledger.length} entries):`,
              ...ledger.map((e, i) =>
                `${i + 1}. [${e.status}] ${e.commissionAmount} from tx ${e.txHash} (${e.createdAt})`
              ),
            ];

        return {
          content: [{
            type: 'text' as const,
            text: [...summaryLines, '', ...ledgerLines].join('\n'),
          }],
        };
      } catch (error: unknown) {
        const message = error instanceof PayBotApiError ? error.message : String(error);
        return {
          content: [{ type: 'text' as const, text: `Failed to inspect commission: ${message}` }],
          isError: true,
        };
      }
    }
  );

  // --- paybot_pool_create ---
  server.tool(
    'paybot_pool_create',
    'Create an in-process bot pool with an optional shared daily treasury. The pool lives for this MCP session; treasury accounting is in-memory and the facilitator remains authoritative.',
    {
      poolId: z.string().describe('Identifier for this pool (used by allocate/revoke/status)'),
      sharedDailyLimitUsd: z.number().nonnegative().optional().describe('Optional shared daily spend cap across all bots'),
    },
    async ({ poolId, sharedDailyLimitUsd }) => {
      const apiKey = process.env.PAYBOT_API_KEY ?? process.env.API_KEY;
      if (!apiKey) {
        return {
          content: [{ type: 'text' as const, text: 'PayBot MCP server requires an API key (PAYBOT_API_KEY or API_KEY) to create a pool.' }],
          isError: true,
        };
      }
      if (pools.has(poolId)) {
        return {
          content: [{ type: 'text' as const, text: `Pool "${poolId}" already exists.` }],
          isError: true,
        };
      }
      try {
        const pool = new PayBotClientPool({
          apiKey,
          facilitatorUrl: process.env.PAYBOT_FACILITATOR_URL ?? process.env.X402_FACILITATOR_URL ?? 'https://api.paybotcore.com',
          sharedDailyLimitUsd,
        });
        pools.set(poolId, pool);
        return {
          content: [{
            type: 'text' as const,
            text: [
              `Pool "${poolId}" created.`,
              sharedDailyLimitUsd !== undefined
                ? `Shared daily treasury: $${sharedDailyLimitUsd.toFixed(2)}`
                : 'Shared daily treasury: unbounded',
            ].join('\n'),
          }],
        };
      } catch (error: unknown) {
        return {
          content: [{ type: 'text' as const, text: `Failed to create pool: ${String(error instanceof Error ? error.message : error)}` }],
          isError: true,
        };
      }
    }
  );

  // --- paybot_pool_allocate ---
  server.tool(
    'paybot_pool_allocate',
    'Add a bot to a pool, and optionally make a payment as that bot through the shared treasury.',
    {
      poolId: z.string().describe('Pool identifier'),
      botId: z.string().describe('Bot identifier to add to the pool'),
      trustLevel: z.number().min(0).max(5).optional().describe('Initial trust level 0-5'),
      pay: z.object({
        amount: z.string().describe('Amount in USD'),
        recipient: z.string().describe('Recipient wallet address (0x...)'),
        resource: z.string().describe('URL or description of what is being paid for'),
        network: z.string().optional().describe('Network CAIP-2 ID'),
        token: z.string().optional().describe('Token ticker (default USDC)'),
      }).optional().describe('Optional payment to execute as this bot after allocation'),
    },
    async ({ poolId, botId, trustLevel, pay }) => {
      const pool = pools.get(poolId);
      if (!pool) {
        return {
          content: [{ type: 'text' as const, text: `Pool "${poolId}" not found. Create it first with paybot_pool_create.` }],
          isError: true,
        };
      }
      try {
        if (!pool.hasBot(botId)) {
          pool.addBot({ botId, trustLevel: trustLevel as TrustLevel | undefined });
        }

        if (!pay) {
          return {
            content: [{ type: 'text' as const, text: `Bot "${botId}" allocated to pool "${poolId}".` }],
          };
        }

        const result = await pool.payAs(botId, {
          resource: pay.resource,
          amount: pay.amount,
          payTo: pay.recipient,
          network: pay.network,
          token: pay.token,
        });

        if (!result.success) {
          return {
            content: [{
              type: 'text' as const,
              text: `Bot "${botId}" allocated. Payment failed: ${result.errorCode ?? ''} ${result.error ?? ''}`.trim(),
            }],
            isError: true,
          };
        }

        return {
          content: [{
            type: 'text' as const,
            text: [
              `Bot "${botId}" allocated and paid.`,
              `Transaction: ${result.txHash}`,
              `Amount: $${pay.amount} ${pay.token ?? 'USDC'}`,
              result.txHash ? `Explorer: ${explorerTxUrl(result.network, result.txHash)}` : '',
            ].filter(Boolean).join('\n'),
          }],
        };
      } catch (error: unknown) {
        return {
          content: [{ type: 'text' as const, text: `Allocation failed: ${String(error instanceof Error ? error.message : error)}` }],
          isError: true,
        };
      }
    }
  );

  // --- paybot_pool_revoke ---
  server.tool(
    'paybot_pool_revoke',
    'Remove a bot from a pool.',
    {
      poolId: z.string().describe('Pool identifier'),
      botId: z.string().describe('Bot identifier to remove'),
    },
    async ({ poolId, botId }) => {
      const pool = pools.get(poolId);
      if (!pool) {
        return {
          content: [{ type: 'text' as const, text: `Pool "${poolId}" not found.` }],
          isError: true,
        };
      }
      const removed = pool.removeBot(botId);
      return {
        content: [{
          type: 'text' as const,
          text: removed
            ? `Bot "${botId}" revoked from pool "${poolId}".`
            : `Bot "${botId}" was not in pool "${poolId}".`,
        }],
        ...(removed ? {} : { isError: true }),
      };
    }
  );

  // --- paybot_pool_status ---
  server.tool(
    'paybot_pool_status',
    'Report a pool\'s remaining shared treasury and per-bot local spend/transaction counters (in-process projection; facilitator is authoritative).',
    {
      poolId: z.string().describe('Pool identifier'),
    },
    async ({ poolId }) => {
      const pool = pools.get(poolId);
      if (!pool) {
        return {
          content: [{ type: 'text' as const, text: `Pool "${poolId}" not found.` }],
          isError: true,
        };
      }
      const remaining = pool.remainingTreasuryUsd();
      const botLines = pool.botIds().map((id) => {
        const s = pool.botStats(id);
        return `- ${id}: spent $${s.dailySpentUsd.toFixed(2)} today, ${s.dailyTxCount} tx`;
      });

      return {
        content: [{
          type: 'text' as const,
          text: [
            `Pool "${poolId}" status:`,
            `Bots: ${pool.size}`,
            `Remaining treasury: ${remaining === null ? 'unbounded' : `$${remaining.toFixed(2)}`}`,
            ...(botLines.length ? ['Per-bot:', ...botLines] : ['No bots allocated.']),
          ].join('\n'),
        }],
      };
    }
  );

  return server;
}
