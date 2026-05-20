# Paybot-MCP — Agent-Economy Tool Gaps (May 2026)

**Date:** 2026-05-19
**Current version:** 0.2.0 (published npm)
**Sister docs (paybot-core repo, private):** `docs/research/2026-05-AGENT-ECONOMY-LAUNCH-WAVE.md`, `docs/strategy/MAY-2026-CAPABILITY-AUDIT.md`

---

## Current State (Audited)

`paybot-mcp/src/server.ts` exposes **4 tools** today:

| Tool | What it does | Status |
|------|--------------|:------:|
| `paybot_pay` | Make a USDC payment (amount, recipient, resource, optional network) | ✅ Live |
| `paybot_balance` | Check trust level, daily limit, remaining budget, hourly tx count | ✅ Live |
| `paybot_history` | View last N audit events | ✅ Live |
| `paybot_register` | Register a new bot with initial trust level | ✅ Live |

**Strengths:** Clean MCP surface. Uses `paybot-sdk` directly. Env-var-driven. Lazy client init. Published on npm. Compatible with Claude Code, ChatGPT MCP clients, any MCP host.

**Weaknesses:** Limited to "primitive payment ops." The May 1–12 launch wave demonstrated that AI agents need a much broader commerce surface — gift cards, mobile top-ups, ESIMs, subscription management, multi-currency, micropayment streams, identity-binding queries.

---

## What the May 1–12 Wave Showed AI Agents Will Do

From the launches (Cryptorefills x402 commerce, Bedrock AgentCore, MoonAgents, pay.sh, XO Cash, Circle agentic):

1. **Pay-per-API-call micropayments** — already covered by `paybot_pay`.
2. **Recurring subscription payments** — not covered.
3. **Gift-card purchase** — not covered (Cryptorefills shipped this).
4. **Mobile top-up / ESIM purchase** — not covered (Cryptorefills shipped this).
5. **Multi-currency settlement (USDC + EURC + future CBDC)** — partially covered; SDK does not yet expose EURC.
6. **Identity-bound spend authorization** — partially covered; `settlement-binding` is in core but not surfaced as an MCP tool.
7. **Behavioral-anomaly self-check** — not covered (agents should be able to ask "am I in good standing?").
8. **Trust-tier promotion request** — not covered (agents should be able to request KYC upgrade).
9. **Policy preview** — not covered (agents should be able to dry-run a payment against policy before executing).
10. **Audit-chain verification** — not covered (agents should be able to fetch a signed audit excerpt to prove an action).

---

## Gap → New MCP Tools to Ship

Priority is **HIGH** for tools that close pitch-relevant gaps (1, 5, 6, 9 below).

### HIGH priority — ship in next 6 weeks

| # | New tool | What it does | Why pitch-critical |
|---|----------|--------------|--------------------|
| 1 | `paybot_pay_eur` | Pay in EURC (Circle's MiCA-compliant euro stablecoin) on Base | Direct answer to "do you support EUR?" — closes #1 European bank objection |
| 2 | `paybot_settlement_provider_list` | List available settlement providers (USDC, EURC, future CBDC) and their status | Demonstrates multi-stablecoin architecture |
| 3 | `paybot_policy_preview` | Dry-run a payment against the policy engine, return `decision` + `reason` without executing | Shows OPA policy engine externally; banks love this for compliance reviews |
| 4 | `paybot_audit_excerpt` | Fetch a cryptographically signed audit-chain excerpt for a tx | Surfaces hash-chained audit ledger; FIN-FSA-ready evidence |
| 5 | `paybot_identity` | Show the (operatorId, botId) binding for the active session + cryptographic intent hash | Surfaces Wire #3 (identity binding) explicitly — only thing nobody else has |
| 6 | `paybot_trust_promote_request` | Request a trust-tier promotion (triggers KYC artifact upload through the operator's verified identity) | Demonstrates KYC hook — bank's existing KYC stack plugs in here |

### MEDIUM priority — ship in next 12 weeks

| # | New tool | What it does | Why useful |
|---|----------|--------------|------------|
| 7 | `paybot_subscription_create` | Create a recurring x402 payment authorization with cap + frequency | Agent SaaS subscriptions |
| 8 | `paybot_subscription_cancel` | Cancel an active subscription | Symmetry |
| 9 | `paybot_anomaly_self_check` | Ask the behavioral monitor for the agent's current anomaly score | Self-aware agents; pre-empts compliance issues |
| 10 | `paybot_commission_inspect` | Show commission rate + recent commission ledger entries for the agent's operator | Transparency for the bank's revenue model |

### LOW priority — ship when there's a customer pulling for them

| # | New tool | What it does |
|---|----------|--------------|
| 11 | `paybot_buy_giftcard` | Purchase a gift card (Amazon, App Store, etc.) — wraps a Cryptorefills-style integration |
| 12 | `paybot_mobile_topup` | Top up a mobile number worldwide |
| 13 | `paybot_buy_esim` | Buy an ESIM data plan |
| 14 | `paybot_invoice_pay` | Pay an x402-compatible invoice URL |

(11–14 require external API partnerships — defer until pilot customer specifies which provider.)

---

## Implementation Plan

All tool implementations **call into `paybot-sdk` (public)** which calls into `paybot-core` (private). Open-core boundary: the SDK exposes generic parameters (e.g., token address, currency code, policy name); the core enforces the actual rules.

### Sprint allocation

| Week | Tools shipped | Files touched |
|------|---------------|---------------|
| 1 | `paybot_pay_eur` (1), `paybot_settlement_provider_list` (2) | `paybot-mcp/src/server.ts`, `paybot-sdk/src/client.ts` (add `payEUR`, `listProviders`), `paybot-core/src/facilitator/providers/` (private — adds EURCProvider) |
| 2 | `paybot_policy_preview` (3), `paybot_audit_excerpt` (4) | `paybot-mcp/src/server.ts`, `paybot-sdk/src/client.ts`, `paybot-core/src/security/policy/engine.ts` (add `previewOnly` mode), `paybot-core/src/audit/index.ts` (add `getSignedExcerpt`) |
| 3 | `paybot_identity` (5), `paybot_trust_promote_request` (6) | `paybot-mcp/src/server.ts`, `paybot-sdk/src/client.ts`, `paybot-core/src/facilitator/settlement-binding.ts` (expose intent-hash inspection), `paybot-core/src/security/trust/state-machine.ts` (promotion request endpoint) |
| 4 | `paybot_subscription_create` (7), `paybot_subscription_cancel` (8) | `paybot-mcp/src/server.ts`, `paybot-sdk/src/client.ts`, `paybot-core/src/facilitator/subscriptions.ts` (new module, private) |
| 5 | `paybot_anomaly_self_check` (9), `paybot_commission_inspect` (10) | `paybot-mcp/src/server.ts`, `paybot-sdk/src/client.ts`, `paybot-core/src/security/behavioral/index.ts` (add `getSelfScore`), `paybot-core/src/facilitator/commission-ledger.ts` (add `getOperatorLedger`) |
| 6 | Hardening, MCP tool documentation in README, demo recording | Cross-repo polish |

### Per-tool checklist (applies to every new tool)

- [ ] `paybot-core` (private) implements the underlying capability — all rules, all enforcement, all moat-value code
- [ ] `paybot-sdk` (public) adds a thin client method that takes generic parameters and forwards to core via HTTP/x402
- [ ] `paybot-mcp` (public) wraps the SDK method in an MCP `server.tool(...)` with Zod schema + structured text response
- [ ] Tests: unit (sdk + core), integration (mcp ↔ sdk ↔ core mock), e2e (real Base Sepolia)
- [ ] README updated with usage example
- [ ] `verify-open-core-boundary.sh` passes (no MiCA/AML/EUR-specific logic in sdk or mcp)

---

## Open-Core Discipline (Critical)

The MCP package is **public** (Apache 2.0). The SDK is **public** (MIT). The core is **private** (BSL 1.1).

Every new MCP tool must respect this:

```
                ┌────────────────────────────────────────────┐
                │ paybot-mcp (public, Apache 2.0)            │
                │  - Generic MCP tool definitions            │
                │  - Calls into paybot-sdk                   │
                │  - No business logic                       │
                └────────────────────┬───────────────────────┘
                                     │
                                     ▼
                ┌────────────────────────────────────────────┐
                │ paybot-sdk (public, MIT)                   │
                │  - Generic HTTP client                     │
                │  - x402 primitives                         │
                │  - Token-address pass-through              │
                │  - No EUR/MiCA/AML logic                   │
                └────────────────────┬───────────────────────┘
                                     │ HTTP (signed, x402)
                                     ▼
                ┌────────────────────────────────────────────┐
                │ paybot-core (private, BSL 1.1)             │
                │  - SettlementProvider impls (USDC, EURC)   │
                │  - Trust state machine                     │
                │  - OPA policy engine                       │
                │  - Behavioral monitor                      │
                │  - Audit chain                             │
                │  - Commission ledger                       │
                │  - All MiCA/AML/EUR-specific rules         │
                │  - ALL ECONOMIC VALUE                      │
                └────────────────────────────────────────────┘
```

If a future contributor accidentally adds, say, "EURC token address validation" to `paybot-sdk`, the boundary check fails and the PR blocks. The rule: **the SDK takes a token address as input; the core decides if that token is allowed.**

---

## Definition of Done — Agent-Economy MCP Ready

- [ ] 10 new tools implemented (HIGH + MEDIUM priority)
- [ ] Test coverage ≥ 85% on new SDK + MCP code
- [ ] README updated with full tool catalog and usage examples
- [ ] Demo: end-to-end "agent does its own KYC, requests trust promotion, pays in EURC, fetches signed audit excerpt" via MCP tools only
- [ ] Open-core boundary script passes in CI
- [ ] Published v0.3.0 of paybot-mcp to npm

**Target: 2026-06-30 (6 weeks from now), aligned with bank pitch-ready milestone.**

---

*This document is the source of truth for the paybot-mcp roadmap during the bank-pitch sprint. Update as tools ship.*
