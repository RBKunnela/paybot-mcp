# paybot-mcp

MCP server for [PayBot](https://paybotcore.com) — payment tools for AI agents via the Model Context Protocol.

## Install

```bash
npm install paybot-mcp paybot-sdk
```

## Get your API key

`PAYBOT_API_KEY` is required — without it every tool call fails with a 401. The fastest way to get a key is one `PayBotClient.signup()` call (from `paybot-sdk`) against the hosted facilitator at `https://api.paybotcore.com`:

```bash
node -e "import('paybot-sdk').then(async ({ PayBotClient }) => {
  const a = await PayBotClient.signup('you@example.com', 'a-strong-password', { botId: 'my-agent' });
  console.log(a.apiKey); // pb_live_... — printed ONLY once, save it now
})"
```

This single call registers your operator account, creates the API key, **and registers the bot** (`botId`). Put the printed key into `PAYBOT_API_KEY` in the MCP config below, and reuse the same bot id as `PAYBOT_BOT_ID`.

Notes:

- The key is printed **only once** — store it securely; it cannot be retrieved later.
- Because `signup()` already registered your bot, calling the `paybot_register` tool with the same bot id returns `409 ALREADY_EXISTS`. Use `paybot_register` only for **additional** bots.
- Full auth flow (login, extra API keys, self-hosted facilitators): see the [paybot-sdk README → Get your API key](https://github.com/RBKunnela/paybot-sdk#get-your-api-key).

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
| `PAYBOT_API_KEY` | PayBot API key (see [Get your API key](#get-your-api-key)) | (required) |
| `PAYBOT_FACILITATOR_URL` | Facilitator server URL | `https://api.paybotcore.com` |
| `PAYBOT_BOT_ID` | Default bot identifier | `mcp-agent` |
| `PAYBOT_WALLET_KEY` | Wallet private key for real payments | (optional) |
| `PAYBOT_ENABLE_DEMO_TOOLS` | Register the governed mock demo tools (`delete_database`, `annotate_record`). Must be exactly `true`. | `false` (off) |

If `PAYBOT_API_KEY` is unset or empty, the server still boots (so the MCP handshake succeeds) but prints a warning to stderr at startup, and every tool call will fail with an authentication error until a key is configured. Omitting `PAYBOT_WALLET_KEY` keeps the underlying SDK in mock mode (no on-chain settlement).

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

## Governed tools (decide-before / prove-after)

PayBot MCP can wrap **any** tool — not just payments — so a dangerous call must
pass policy before it runs, an irreversible call pauses for a named human's
approval, and every outcome leaves a tamper-evident, replayable trace in core's
audit chain. This is the kill-switch + black-box-recorder for MCP tool calls.

### How it works

`registerGovernedTool(server, def, client, opts)` is a higher-order registrar.
Each wrapped call:

1. builds an **ActionIntent** — `verb` = tool name, `target_ref` = a
   registrar-provided extractor over the args (opaque, never raw PII),
   `params_hash` = SHA-256 of the canonical (key-sorted) JSON of the args,
   `actor.subject_ref` = the configured bot id, `channel: 'mcp'`;
2. calls core `POST /actions/govern`;
3. acts on the verdict:
   - **allow** → runs the tool, and appends `executed: params_hash=…,
     result_hash=…` to the output so the trace binds intent → execution;
   - **deny** → does **not** run; returns the gate reasons;
   - **pending** → (default `block` mode) polls `GET /approvals/:id` with backoff
     until approved/denied/expired or `approvalTimeoutMs` (default 120 s); on
     approval it **re-verifies `params_hash`** before executing (TOCTOU defence),
     then runs once. (`return` mode hands back the `approval_id` instead.)

> **Approve via the ACTION route.** A paused action is approved/denied through
> `POST /actions/approvals/:id/approve` (or `.../deny`) — **not** the payment
> `/approvals/:id/approve` route, whose grant path attempts settlement. The
> interceptor only polls `GET /approvals/:id` and instructs operators toward the
> action route.

### Cost & lifetime

Governance adds **one network round-trip per governed call** (`/actions/govern`).
A `pending` action in `block` mode holds open only as long as the **stdio session
lives** — MCP stdio servers are single-session, so a session that ends drops a
blocking wait. Operators drive approval from a second terminal (curl/dashboard),
exactly like the HITL payment demo.

### Security properties

- **Fail closed.** If governance is unreachable (network error, timeout, 5xx,
  malformed body) an irreversible or unknown action is **refused**
  (`GOVERNANCE_UNREACHABLE`) — an unreachable governor never silently allows.
  A `reversible` tool MAY set `failOpen: true` (demo-only convenience; ignored
  for irreversible verbs).
- **Risk class is set by the registrar (operator code), never by the model.** An
  agent cannot self-declare its destructive tool "reversible."
- **No raw args leave the process.** Only the `params_hash` and the extractor's
  `target_ref` are sent to core; raw arguments (connection strings, PII) stay
  local.
- **No bypass.** Governance is applied at registration. A server that registers
  a raw tool is ungoverned by definition — we govern what is wrapped, and make
  no claim to intercept everything.

### Demo tools (off by default)

Set `PAYBOT_ENABLE_DEMO_TOOLS=true` to register two **mock** governed tools:

| Tool | Risk class | Effect |
|------|-----------|--------|
| `delete_database` | irreversible | **MOCK** — touches nothing; pauses for human approval, then returns a labelled mock confirmation |
| `annotate_record` | reversible | **MOCK** — proves the allow path; flows straight through |

A published MCP server must not advertise a `delete_database` tool to every
agent, so these stay off unless the flag is explicitly `true`.

See [`docs/runbooks/governed-action-demo.md`](docs/runbooks/governed-action-demo.md)
for the exact recorded-demo script (govern → pending → approve → mock execute →
replayable audit proof).

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
