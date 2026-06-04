# paybot-mcp

MCP server for [PayBot](https://paybotcore.com) — payment tools for AI agents via the [Model Context Protocol](https://modelcontextprotocol.io).

`paybot-mcp` is a thin [Hono](https://hono.dev)-friendly MCP server that wraps [`paybot-sdk`](https://www.npmjs.com/package/paybot-sdk) and exposes PayBot's agent-payment capabilities as MCP tools. Any MCP host — Claude Desktop, Claude Code, or any client that speaks MCP — can give an AI agent the ability to register, check its spending budget, pay for a resource, and review its own audit history.

It contains **no business logic of its own**: every tool forwards to `paybot-sdk`, which forwards to the PayBot facilitator. The MCP layer is a generic, open-source surface (Apache 2.0).

## Install

```bash
npm install paybot-mcp paybot-sdk
```

`paybot-sdk` is a required peer dependency.

## How it wraps paybot-sdk

```
MCP host (Claude Desktop / Claude Code / any MCP client)
        │   MCP tool call
        ▼
   paybot-mcp            ← this package: Zod-typed MCP tools, no business logic
        │   method call
        ▼
   paybot-sdk            ← typed client: PayBotClient.pay / balance / history / register
        │   signed HTTP (x402)
        ▼
   PayBot facilitator    ← settlement, trust, policy, audit
```

Each tool constructs a `PayBotClient` lazily from environment variables on first use, then calls the matching SDK method and formats the result as MCP text content.

`paybot-sdk` 0.4.0 broadens the underlying client surface (multi-network support across Base / Optimism / Arbitrum / Polygon, a token registry, client pooling and treasury, idempotency, and a structured error taxonomy). That SDK release is what unblocks the tool expansion described in the [Roadmap](#roadmap) — the four tools below are the stable surface today; the rest are planned.

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
| `PAYBOT_API_KEY` | PayBot API key (or `API_KEY`) | (required) |
| `PAYBOT_FACILITATOR_URL` | Facilitator server URL (or `X402_FACILITATOR_URL`) | `https://api.paybotcore.com` |
| `PAYBOT_BOT_ID` | Default bot identifier | `mcp-agent` |
| `PAYBOT_WALLET_KEY` | Wallet private key for real payments | (optional) |

The server requires an API key (`PAYBOT_API_KEY` or `API_KEY`) to be set before any PayBot tool runs; calls fail with a clear error if it is missing.

## Available Tools

Four tools are available today. They map one-to-one onto `PayBotClient` methods.

| Tool | Description | Status |
|------|-------------|:------:|
| `paybot_pay` | Make a USDC payment for an API, service, or resource | ✅ available |
| `paybot_balance` | Check trust level, spending limits, and remaining daily budget | ✅ available |
| `paybot_history` | View recent payment history and audit events | ✅ available |
| `paybot_register` | Register a new bot with the facilitator | ✅ available |

### `paybot_pay`

Make a payment and receive the transaction hash plus a commission breakdown.

| Param | Type | Required | Description |
|-------|------|:--------:|-------------|
| `amount` | string | yes | Amount in USD (e.g. `"0.05"` for 5 cents) |
| `recipient` | string | yes | Recipient wallet address (`0x...`) |
| `resource` | string | yes | URL or description of what you are paying for |
| `botId` | string | no | Bot identifier (defaults to `PAYBOT_BOT_ID`) |
| `network` | string | no | Network CAIP-2 ID (default: `eip155:84532`, Base Sepolia) |

### `paybot_balance`

Report trust level, daily spent/limit/remaining, and the hourly transaction count for a bot.

| Param | Type | Required | Description |
|-------|------|:--------:|-------------|
| `botId` | string | no | Bot identifier (defaults to `PAYBOT_BOT_ID`) |

### `paybot_history`

Return recent audit events for a bot.

| Param | Type | Required | Description |
|-------|------|:--------:|-------------|
| `botId` | string | no | Bot identifier (defaults to `PAYBOT_BOT_ID`) |
| `limit` | number | no | Max events to return (default: `10`) |

### `paybot_register`

Register a new bot with the facilitator and return its assigned trust level.

| Param | Type | Required | Description |
|-------|------|:--------:|-------------|
| `botId` | string | yes | Unique bot identifier |
| `trustLevel` | number | no | Initial trust level 0–5 (default: `1`) |

## Roadmap

`paybot-sdk` 0.4.0 unblocks an expansion from 4 tools toward roughly 11 — network/token discovery, client-pool management, spending-limit control, extended health, and commission inspection, plus token and idempotency parameters on `paybot_pay`. These are **planned, not yet shipped**.

See [`docs/ROADMAP.md`](docs/ROADMAP.md) for the full plan and the [capability diagram](docs/diagrams/paybot-mcp-roadmap.excalidraw).

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
