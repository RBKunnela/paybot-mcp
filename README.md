# paybot-mcp

MCP server for [PayBot](https://paybotcore.com) — payment tools for AI agents via the Model Context Protocol.

## Install

```bash
npm install paybot-mcp paybot-sdk
```

## Usage with Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "paybot": {
      "command": "npx",
      "args": ["paybot-mcp"],
      "env": {
        "PAYBOT_API_KEY": "pb_...",
        "PAYBOT_FACILITATOR_URL": "https://api.paybotcore.com",
        "PAYBOT_BOT_ID": "my-agent"
      }
    }
  }
}
```

## Usage with Claude Code

```json
{
  "mcpServers": {
    "paybot": {
      "command": "npx",
      "args": ["paybot-mcp"],
      "env": {
        "PAYBOT_API_KEY": "pb_...",
        "PAYBOT_BOT_ID": "my-agent"
      }
    }
  }
}
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PAYBOT_API_KEY` | PayBot API key | (required) |
| `PAYBOT_FACILITATOR_URL` | Facilitator server URL | `https://api.paybotcore.com` |
| `PAYBOT_BOT_ID` | Default bot identifier | `mcp-agent` |
| `PAYBOT_WALLET_KEY` | Wallet private key for real payments | (optional) |

## Available Tools

| Tool | Description |
|------|-------------|
| `paybot_pay` | Make a payment (USDC by default; supports alternate tokens + idempotency) |
| `paybot_balance` | Check trust level, spending limits, and remaining budget |
| `paybot_history` | View recent payment history and audit events |
| `paybot_register` | Register a new bot with the facilitator (optional idempotency key) |
| `paybot_list_networks_and_tokens` | Discover supported networks and tokens (offline, no API key) |
| `paybot_health_extended` | Extended facilitator health (status/version/uptime + extras) |
| `paybot_set_spending_limit` | Set per-transaction / daily / hourly limits and a recipient allowlist |
| `paybot_commission_inspect` | Inspect commission summary and a filterable ledger |
| `paybot_pool_create` | Create an in-process bot pool with an optional shared treasury |
| `paybot_pool_allocate` | Add a bot to a pool, optionally paying as it through the treasury |
| `paybot_pool_revoke` | Remove a bot from a pool |
| `paybot_pool_status` | Report pool treasury and per-bot spend counters |

### paybot_pay

| Param | Type | Notes |
|-------|------|-------|
| `amount` | string | Amount in USD (e.g., `"0.05"`) |
| `recipient` | string | Recipient wallet address (`0x...`) |
| `resource` | string | URL or description of what you're paying for |
| `botId?` | string | Bot identifier (defaults to env) |
| `network?` | string | Network CAIP-2 ID (default: Base Sepolia) |
| `token?` | string | Token ticker (default `USDC`); e.g. `USDC`, `EURC`, `DAI` |
| `idempotencyKey?` | string | Repeat call with the same key returns the cached result |

### paybot_balance

| Param | Type | Notes |
|-------|------|-------|
| `botId?` | string | Bot identifier (defaults to env) |

### paybot_history

| Param | Type | Notes |
|-------|------|-------|
| `botId?` | string | Bot identifier (defaults to env) |
| `limit?` | number | Max events to return (default: 10) |

### paybot_register

| Param | Type | Notes |
|-------|------|-------|
| `botId` | string | Unique bot identifier |
| `trustLevel?` | number | Initial trust level 0-5 (default: 1) |
| `idempotencyKey?` | string | Repeat register with the same key returns the cached result |

### paybot_list_networks_and_tokens

Read-only discovery. Requires no API key and makes zero network calls. Surfaces
only the **public** open-core registry — operator-private mainnet addresses are
never shown (e.g. EURC advertises its Base Sepolia testnet deployment only).

_No parameters._

### paybot_health_extended

| Param | Type | Notes |
|-------|------|-------|
| `botId?` | string | Bot identifier (defaults to env) |

Returns `status`, `version`, `uptime`, `timestamp`, plus any extra fields the
facilitator reports.

### paybot_set_spending_limit

Tightens an agent's own limits. The facilitator enforces the operator ceiling
and may reject attempts to loosen beyond policy.

| Param | Type | Notes |
|-------|------|-------|
| `botId?` | string | Bot identifier (defaults to env) |
| `maxTransactionUsd?` | number | Max USD per transaction |
| `maxDailySpendUsd?` | number | Max USD spend per day |
| `maxTransactionsPerHour?` | number | Max transactions per hour |
| `allowedRecipients?` | string[] | Allowlist of recipient addresses |

### paybot_commission_inspect

| Param | Type | Notes |
|-------|------|-------|
| `botId?` | string | Bot identifier (defaults to env) |
| `status?` | enum | Filter ledger by `pending` \| `forwarded` \| `deferred` |
| `startDate?` | string | Ledger start date (ISO 8601) |
| `endDate?` | string | Ledger end date (ISO 8601) |
| `limit?` | number | Max ledger entries (default: 50) |
| `offset?` | number | Ledger pagination offset |

### paybot_pool_create

Creates an in-process bot pool for this MCP session. Treasury accounting is
in-memory; the facilitator remains the authoritative limit.

| Param | Type | Notes |
|-------|------|-------|
| `poolId` | string | Identifier for this pool (used by allocate/revoke/status) |
| `sharedDailyLimitUsd?` | number | Optional shared daily spend cap across all bots |

### paybot_pool_allocate

| Param | Type | Notes |
|-------|------|-------|
| `poolId` | string | Pool identifier |
| `botId` | string | Bot identifier to add to the pool |
| `trustLevel?` | number | Initial trust level 0-5 |
| `pay?` | object | Optional `{ amount, recipient, resource, network?, token? }` to pay as this bot |

### paybot_pool_revoke

| Param | Type | Notes |
|-------|------|-------|
| `poolId` | string | Pool identifier |
| `botId` | string | Bot identifier to remove |

### paybot_pool_status

| Param | Type | Notes |
|-------|------|-------|
| `poolId` | string | Pool identifier |

## Programmatic Usage

```typescript
import { createMcpServer } from 'paybot-mcp/server';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = createMcpServer();
const transport = new StdioServerTransport();
await server.connect(transport);
```

## License

[Apache 2.0](LICENSE)
