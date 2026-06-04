# paybot-mcp — Roadmap

This is the public roadmap for `paybot-mcp`, the MCP server that exposes PayBot
payment capabilities to AI agents. It tracks what ships in this package — the
generic, open-source (Apache 2.0) tool surface. All business logic lives behind
`paybot-sdk` and the PayBot facilitator; this package only adds and wires MCP
tools.

The roadmap is organized in three tiers:

- **Shipped** — available on npm today.
- **Next** — designed and unblocked by `paybot-sdk` 0.4.0; not yet built.
- **Later** — depends on facilitator/core capabilities that are not yet exposed
  through the SDK.

A capability diagram for this roadmap lives at
[`docs/diagrams/paybot-mcp-roadmap.excalidraw`](diagrams/paybot-mcp-roadmap.excalidraw).

---

## Shipped

The current release exposes **4 MCP tools**, each a one-to-one wrapper over a
`PayBotClient` method:

| Tool | Purpose |
|------|---------|
| `paybot_pay` | Make a USDC payment for a resource; returns tx hash + commission breakdown |
| `paybot_balance` | Report trust level, daily spent/limit/remaining, hourly tx count |
| `paybot_history` | Return recent audit events for a bot |
| `paybot_register` | Register a new bot and return its assigned trust level |

Also shipped recently:

- **Boundary hardening** — framework-internal and runtime directories are
  gitignored so they can never enter the published package.
- **Version-drift fix** — the MCP handshake version is read from `package.json`
  at runtime, so the served version can never drift from the published package
  version.

---

## Next — unblocked by paybot-sdk 0.4.0

`paybot-sdk` 0.4.0 broadens the underlying client: multi-network support
(Base / Optimism / Arbitrum / Polygon), a token registry, a client pool with
treasury support, idempotency, and a structured error taxonomy. That release
unblocks an expansion from 4 tools toward roughly 11. These are **planned, not
yet built** — each is a thin MCP wrapper over an existing or near-term SDK
method.

| Tool | Purpose |
|------|---------|
| `paybot_list_networks_and_tokens` | List the networks and tokens the SDK can settle on, so an agent can discover its options before paying |
| `paybot_pool_create` | Create a client pool for managing multiple bot identities/budgets under one operator |
| `paybot_pool_allocate` | Allocate budget or a slot from a pool to a specific bot |
| `paybot_pool_revoke` | Revoke a bot's allocation from a pool |
| `paybot_pool_status` | Report the current state of a pool (members, allocations, remaining capacity) |
| `paybot_set_spending_limit` | Set or adjust a bot's spending limit within operator-permitted bounds |
| `paybot_health_extended` | Extended health/readiness probe (facilitator reachability, network status) |
| `paybot_commission_inspect` | Show the commission rate and recent commission ledger entries for the operator |

Plus enhancements to existing tools:

- **`paybot_pay`** — add `token` and `idempotencyKey` parameters, surfacing the
  0.4.0 token registry and idempotency support so an agent can choose a token
  and safely retry a payment.
- **`paybot_register`** — make registration idempotent, so re-registering a
  known bot is a safe no-op rather than an error.

---

## Later — blocked on core

These tools require capabilities that the facilitator/core must expose through
`paybot-sdk` first. They are tracked here so the surface is planned, but they
are **not scheduled** until the underlying SDK support exists.

| Tool | Purpose | Blocked on |
|------|---------|------------|
| `paybot_policy_preview` | Dry-run a payment against the policy engine and return the decision + reason without executing | Policy preview mode in core |
| `paybot_audit_excerpt` | Fetch a verifiable audit-chain excerpt for a transaction, so an agent can prove an action | Signed audit-excerpt endpoint in core |
| `paybot_refund` | Request a refund / reversal of a prior payment | Refund/reversal support in core + SDK |
| `paybot_subscribe` | Create a recurring payment authorization with a cap and frequency | Subscription support in core + SDK |

---

## Principles

- **No business logic in this package.** Every MCP tool forwards to
  `paybot-sdk`. The SDK takes generic parameters (token, network, amount); the
  facilitator/core decides what is allowed. This keeps the open-core boundary
  clean.
- **Truthful tiers.** A tool is listed under *Shipped* only when it is on npm.
  *Next* and *Later* are explicitly not-yet-built.
- **One tool, one SDK method.** New tools stay thin — schema validation and
  response formatting only.

---

*Roadmap reflects state as of 2026-06-04. Tool names and parameters under
*Next* and *Later* are planned and may change as they are implemented.*
