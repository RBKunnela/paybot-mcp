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
        "PAYBOT_FACILITATOR_URL": "https://facilitator.paybot.dev",
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
| `PAYBOT_FACILITATOR_URL` | Facilitator server URL | `http://localhost:3000` |
| `PAYBOT_BOT_ID` | Default bot identifier | `mcp-agent` |
| `PAYBOT_WALLET_KEY` | Wallet private key for real payments | (optional) |

## Available Tools

| Tool | Description |
|------|-------------|
| `paybot_pay` | Make a USDC payment for an API, service, or resource |
| `paybot_balance` | Check trust level, spending limits, and remaining budget |
| `paybot_history` | View recent payment history and audit events |
| `paybot_register` | Register a new bot with the facilitator |

### paybot_pay

```
amount: string     - Amount in USD (e.g., "0.05")
recipient: string  - Recipient wallet address (0x...)
resource: string   - URL or description of what you're paying for
botId?: string     - Bot identifier (defaults to env)
network?: string   - Network CAIP-2 ID (default: Base Sepolia)
```

### paybot_balance

```
botId?: string - Bot identifier (defaults to env)
```

### paybot_history

```
botId?: string  - Bot identifier (defaults to env)
limit?: number  - Max events to return (default: 10)
```

### paybot_register

```
botId: string        - Unique bot identifier
trustLevel?: number  - Initial trust level 0-5 (default: 1)
```

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
