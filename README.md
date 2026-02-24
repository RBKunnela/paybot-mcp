# @paybot/mcp

MCP (Model Context Protocol) server for [PayBot](https://github.com/RBKunnela/paybot-sdk) — Connect AI agents to PayBot payment infrastructure.

## Installation

```bash
npm install -g @paybot/mcp
```

Or add to your MCP client config directly.

## Configuration

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "paybot": {
      "command": "npx",
      "args": ["@paybot/mcp"],
      "env": {
        "PAYBOT_BASE_URL": "https://api.paybot.dev",
        "PAYBOT_API_KEY": "your-api-key"
      }
    }
  }
}
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PAYBOT_BASE_URL` | PayBot API URL | `http://localhost:3000` |
| `PAYBOT_API_KEY` | Your API key | (required) |

## Available Tools

| Tool | Description |
|------|-------------|
| `pay` | Submit a USDC payment through PayBot |
| `get_payment` | Get the status of a payment by ID |
| `list_payments` | List recent payments with pagination |
| `health` | Check if the PayBot server is reachable |

### `pay`

```
to: string        — Recipient wallet address (0x...)
amount: string     — Amount in USDC (e.g. "10.00")
memo?: string      — Payment description
idempotencyKey?: string — Prevent duplicate payments
```

### `get_payment`

```
paymentId: string — The payment ID to look up
```

### `list_payments`

```
limit?: number  — Max results to return
offset?: number — Pagination offset
```

## Development

```bash
npm install
npm run dev      # Watch mode with hot reload
npm run build    # Compile TypeScript
npm start        # Run compiled server
```

## License

MIT
