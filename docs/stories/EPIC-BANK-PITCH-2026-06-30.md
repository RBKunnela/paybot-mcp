# EPIC — Bank-Pitch Readiness (External-Surface Gaps)

**Epic ID:** EPIC-BANK-PITCH-2026-06-30
**Owner:** Morgan (PM)
**Date opened:** 2026-05-20
**Target pitch-ready date:** **2026-06-30** *(unconfirmed — flag for Renata)*
**Sprint window:** 2026-05-20 → 2026-06-30 (~6 weeks)
**Authoritative siblings (do not duplicate):**
- `paybot/docs/stories/BANK-PITCH-MASTER-DOD.md` (the closed BANK-01..12 core sprint, 749 tests green 2026-05-20)
- `paybot/docs/strategy/MAY-2026-CAPABILITY-AUDIT.md` (the 6-week core plan — already executed)
- `paybot-mcp/docs/AGENT-ECONOMY-MCP-GAPS.md` (10-tool MCP roadmap)
- `paybot/docs/strategy/FOLLOWUPS-2026-05-20-SCOPE.md` (TF-1..5 cleanup follow-ups)
- `paybot-mcp/docs/stories/BP-1.x` (in-flight commit hygiene work)

---

## Business Value

The closed BANK-01..12 sprint shipped EURC settlement, the `SettlementProvider` abstraction, AML/PSD2 adapter interfaces, KYC binding, the bank-pilot demo runner, and six new HIGH-priority MCP tools. **The core is bank-pitch-ready on capability.**

This epic closes the **external-surface gaps** that Renata flagged on 2026-05-20 — the items a bank legal/risk reviewer will surface in the first 30 minutes of due diligence and that, if absent, get the deal vetoed before any technical conversation begins:

1. **Unattended LLM payments** — `paybot_pay` exposes a money-moving primitive with no human-in-the-loop confirmation. Bank legal will reject on first read.
2. **Audit excerpts have no verifiable surface for outside callers** — chain exists in core; SDK/MCP cannot return signed proof a regulator can verify offline.
3. **SDK hardening for bank-grade integration** — no idempotency keys, no IBAN/BIC validation, no audit-log hooks. Nordic banks require coverage reports.
4. **MCP operational gates** — no rate-limiting, no `paybot_identity` tool exposed (BANK-10 landed `paybot_identity` in core/SDK; rate-limit + dry-run polish still owed).
5. **Pilot-disclosure framing for AML/PSD2/EURC-mainnet** — these are partner-dependent; we ship documentation, not code, but it must be ready for review.
6. **Demo-determinism, env-wiring, schema hygiene** — TF-1/2/3 stories already exist; rolled in for sprint completeness.

**Why this is the right framing:** the BANK-01..12 sprint proved capability. This epic proves **bank-grade discipline around that capability**. Without it, the demo works but the legal package doesn't.

---

## Scope IN

- HITL gate on every money-moving MCP tool (`paybot_pay`, `paybot_pay_eur`, `paybot_subscription_create` if it lands)
- `audit_excerpt` verifiable surface in SDK + MCP (BANK-09 shipped the MCP tool; this epic hardens the verifier story for external callers)
- SDK hardening: idempotency keys, IBAN/BIC validation, audit-log hook interface, coverage report ≥ 85 % on changed files
- MCP rate-limiting middleware (per-bot, per-tool)
- MCP `policy_preview` / dry-run polish (BANK-08 shipped the core; this epic ensures parity surface)
- Pilot-disclosure documents (AML/PSD2/EURC-mainnet) added to pitch pack
- TF-1 / TF-2 / TF-3 follow-up stories already drafted in `paybot/docs/stories/active/` — folded into this epic as P3 to track in one place

## Scope OUT

- New MCP tools beyond what BANK-07..11 already shipped (subscriptions, anomaly, commission are MEDIUM priority in the GAPS doc — defer to a post-pitch epic)
- Multi-chain (Solana, mainnet ETH) — per capability audit, "Base is sufficient for institutional EU launch"
- Card-network bridge, EMI license, custodial issuance — banks bring these
- EURC mainnet activation (Circle IP question is documented; partner decision)
- Gift-card / mobile-top-up / ESIM / invoice-pay (LOW priority in GAPS doc, pulled by pilot customer)
- ANY change to BSL 1.1 / Apache 2.0 / MIT licensing split — boundary check enforces

---

## Success Criteria (tied to bank-pitch readiness)

1. A bank legal reviewer reading `paybot-mcp/README.md` can identify HITL gate behaviour for every money-moving tool within 60 s of scanning the tool table.
2. A bank risk reviewer can request an `audit_excerpt` via MCP, verify the signature offline against the published Ed25519 public key, and reproduce the hash-chain link without contacting Paybot.
3. `paybot-sdk` v0.4.x ships with idempotency keys + IBAN/BIC validators + audit-hook interface and `npm run test:coverage` reports ≥ 85 % on changed files.
4. `paybot-mcp` enforces per-bot per-tool rate limits documented in README; an integration test demonstrates lockout at the documented threshold.
5. Pilot-disclosure pack (`docs/pitch/PILOT-DISCLOSURES.md`) explicitly frames AML / PSD2 / EURC-mainnet as **pilot integrations, vendor partnership phase post-launch** — same language the bank legal team can quote into their internal memo.
6. TF-1/2/3 follow-ups closed; full regression green across all three repos.
7. The chief architect convokes specialist agents for every story (per the `aiox_master_first` memory); zero solo-Claude entries in Dev Agent Record.

---

## Sprint Allocation (6 weeks)

| Week | Focus | Stories |
|------|-------|---------|
| 1 (May 20–26) | P0 unblockers — HITL design + audit excerpt verifier surface | BP-2.1, BP-2.3, BP-5.1, BP-5.2 |
| 2 (May 27–Jun 2) | P0 implementation — HITL wiring in MCP, SDK idempotency + IBAN | BP-2.1 (impl), BP-2.4 (idempotency), BP-3.1 (IBAN/BIC) |
| 3 (Jun 3–9) | P1 — SDK audit-hook interface, MCP rate-limit, policy_preview polish | BP-3.2, BP-3.3, BP-3.4 |
| 4 (Jun 10–16) | P2 — pilot-disclosure docs, audit excerpt verifier docs | BP-4.1, BP-4.2, BP-4.3, BP-5.3 |
| 5 (Jun 17–23) | Coverage push to 85 %, full regression sweep, demo recording refresh | BP-3.5 (coverage), BP-5.4 (regression) |
| 6 (Jun 24–30) | Buffer + pitch dry-runs + outreach activation | All — final QA gate, sprint close |

TF-1, TF-2, TF-3 absorb into Week 1 (per FOLLOWUPS doc — ranked highest external visibility, mechanical effort).

---

## Dependency Graph (between gaps)

```
                ┌─────────────────────────────────────┐
                │ BP-2.1  HITL gate (MCP)             │  P0
                └───────────────┬─────────────────────┘
                                │ unblocks all money-moving tool extensions
                                ▼
        ┌───────────────────────┴────────────────────────┐
        │                                                │
        ▼                                                ▼
┌──────────────────────┐                ┌────────────────────────────┐
│ BP-2.4 idempotency   │ P0             │ BP-3.4 MCP rate-limit      │ P1
│  (SDK)               │                │  (depends on HITL audit log│
└──────────┬───────────┘                │   format from BP-2.1)      │
           │                            └────────────────────────────┘
           ▼
┌──────────────────────┐
│ BP-3.1 IBAN/BIC      │ P1
│  validators (SDK)    │
└──────────────────────┘

┌──────────────────────┐    ┌─────────────────────────────┐
│ BP-2.3 audit excerpt │ P0 │ BP-3.2 SDK audit-hook iface │ P1
│  verifier surface    │───▶│  (consumes BP-2.3 format)   │
└──────────────────────┘    └─────────────────────────────┘
           │
           ▼
┌──────────────────────┐
│ BP-5.3 verifier docs │ P2
└──────────────────────┘

┌──────────────────────┐
│ BP-4.1 / 4.2 / 4.3   │ P2  — independent, docs only, no code dep
│  pilot disclosures   │
└──────────────────────┘

TF-1 / TF-2 / TF-3 — independent of everything above (paybot-core hygiene)
```

**Critical path:** BP-2.1 (HITL) → BP-2.4 (idempotency) → BP-3.4 (rate-limit). Three serialised P0/P1 stories, ~8 days dev with the team executing in parallel.

---

## Story Backlog (PM scope output — SM drafts the stories next)

> BP-1.x reserved for in-flight / done commit-hygiene work. BP-2.x = P0. BP-3.x = P1. BP-4.x = P2 disclosures. BP-5.x = P3 (hygiene + verifier docs).

| ID | Summary | Repo | Size | Wk | Tag |
|----|---------|------|:--:|:--:|:--:|
| **BP-2.1** | HITL gate middleware on `paybot_pay` / `paybot_pay_eur` (MCP); confirmation flow + audit-logged decision | paybot-mcp | M | 1–2 | P0 |
| **BP-2.2** | HITL gate behaviour also enforced for `paybot_subscription_create` if/when it lands (forward-compat hook) | paybot-mcp | S | 2 | P0 |
| **BP-2.3** | Public `audit_excerpt` verifier surface — Ed25519 detached-sig format, published public key, offline-verify example | paybot-sdk + paybot-mcp | M | 1–2 | P0 |
| **BP-2.4** | SDK idempotency-key support — `Idempotency-Key` header + dedupe semantics + replay-safe response cache | paybot-sdk | M | 2 | P0 |
| **BP-3.1** | SDK IBAN/BIC validation utilities (mod-97, ISO 13616) + tests | paybot-sdk | S | 2–3 | P1 |
| **BP-3.2** | SDK audit-log hook interface (consumer-supplied callback, structured payload, no PII leak) | paybot-sdk | M | 3 | P1 |
| **BP-3.3** | MCP `policy_preview` dry-run UX polish — README + Zod schema documentation parity with `paybot_pay` | paybot-mcp | S | 3 | P1 |
| **BP-3.4** | MCP per-bot per-tool rate-limit middleware (token-bucket, configurable, integration test demonstrates lockout) | paybot-mcp | M | 3 | P1 |
| **BP-3.5** | Coverage push — ≥ 85 % on changed files across paybot-sdk + paybot-mcp; report committed to `test-results/` | paybot-sdk + paybot-mcp | M | 5 | P1 |
| **BP-4.1** | `PILOT-DISCLOSURES.md` — AML (Chainalysis) framed as pilot vendor partnership | paybot (docs) | S | 4 | P2 |
| **BP-4.2** | `PILOT-DISCLOSURES.md` — PSD2 (Tink) framed as pilot vendor partnership | paybot (docs) | S | 4 | P2 |
| **BP-4.3** | `PILOT-DISCLOSURES.md` — EURC mainnet framed as partner decision (Circle IP question already documented) | paybot (docs) | S | 4 | P2 |
| **BP-5.1** | TF-4 already in flight as `BP-1.1` (ADR gitignore + ADR-101 scrub) — track close-out only | paybot | S | 1 | P3* |
| **BP-5.2** | TF-1 fold-in — flaky BANK-3.2 determinism test seam fix (story `paybot/docs/stories/active/TF-1-*` exists) | paybot | S | 1 | P3 |
| **BP-5.3** | Audit-excerpt verifier external docs + `verify-paybot-audit-excerpt` CLI example | paybot-mcp (docs) | S | 4 | P3 |
| **BP-5.4** | TF-2 fold-in — `AML_TIMEOUT_MS` env wiring (story `paybot/docs/stories/active/TF-2-*` exists) | paybot | S | 1 | P3 |
| **BP-5.5** | TF-3 fold-in — Drizzle schema patch for KYC tables (story `paybot/docs/stories/active/TF-3-*` exists) | paybot | S | 1 | P3 |
| **BP-5.6** | Full regression sweep + sprint-close evidence pack (commit coverage reports + per-repo green-test screenshots) | all three | S | 5–6 | P3 |

*BP-5.1 — note ID collision risk: the `BP-1.1` story in `paybot/docs/stories/` already implements TF-4. BP-5.1 is a **tracking placeholder** for sprint accountability, not a new story. SM should NOT redraft.

---

## Critical Decisions — REQUIRES ROUNDTABLE BEFORE SM DRAFTS

Per `.claude/rules/roundtable-decisions.md`, the following must run through specialist disagreement (Architect + Data Engineer + Analyst + QA + DevOps) before stories go to SM:

### D-1 — HITL UX Pattern (P0 — blocks BP-2.1)

**Question:** How does the human-in-the-loop confirmation reach the operator when an LLM calls `paybot_pay`?
- **Option A — In-MCP-response prompt:** Tool returns `requires_confirmation` token; agent must call `paybot_confirm` with the token. Simple, MCP-native, but the LLM can still auto-call confirm.
- **Option B — Out-of-band webhook / push:** MCP holds the payment, fires a signed webhook to the operator's URL (or push notification); operator approves via signed callback. Stronger separation; needs operator infra.
- **Option C — Threshold-based auto-approve:** Trust-tier + amount thresholds auto-approve below limit, escalate to B above. Combines both.

**Specialists to convoke:** Architect (separation-of-trust), Analyst (bank reviewer perspective), QA (testability of webhook path), DevOps (infra cost for operator).

### D-2 — EURC MCP Tool Shape (P0 — affects BP-2.1 + downstream subscription work)

**Question:** Does EURC ship as a new tool `paybot_pay_eur` or extend `paybot_pay` with a `currency` param?
- BANK-07 already shipped `paybot_pay_eur` as a separate tool. Decision is **whether to deprecate-and-merge** or **keep both**.
- **Option A — Keep both:** Clearer LLM affordance ("if you want EUR, use this tool"), simpler Zod schema per tool. Tool inflation.
- **Option B — Merge into `paybot_pay` with `currency` param, deprecate `paybot_pay_eur`:** Smaller surface, but LLMs will pass invalid currencies more often.

**Specialists to convoke:** Architect (tool surface design), Analyst (LLM behaviour data), QA (Zod regression risk).

### D-3 — Audit Excerpt Format (P0 — blocks BP-2.3 + BP-3.2 + BP-5.3)

**Question:** What is the wire format for `audit_excerpt`?
- **Option A — JSON + detached Ed25519 signature:** Lightweight, easy to verify with the published key, machine-friendly. No standards body endorsement.
- **Option B — W3C Verifiable Credential (VC):** Bank legal teams understand VCs; aligns with EU eIDAS 2.0; heavier dependency, more code.
- **Option C — PDF report with embedded signature:** Human-readable for legal reviewers; cannot be machine-verified in the agent loop.

**Recommendation pre-roundtable:** A as the wire format, with an optional B wrapper for legal review and an optional C renderer for boardroom artifacts. Specialists may push back.

**Specialists to convoke:** Architect (signature scheme), Data Engineer (canonicalisation of JSON for signing), Analyst (bank-legal reviewer behaviour), QA (verifier testability).

### D-4 — Rate-Limit Policy (P1 — blocks BP-3.4)

**Question:** Are rate limits per-bot, per-operator, or per-bot-per-tool?
- Different mental models with different blast-radius outcomes.
- **Option A — Per-bot:** Simple, but a misbehaving tool on a well-behaved bot still gets blocked.
- **Option B — Per-bot-per-tool:** Granular, matches OPA policy patterns already in core, larger config surface.
- **Option C — Per-operator (aggregated):** Matches bank trust-tier model already in place; risks one bot exhausting an operator's budget.

**Specialists to convoke:** Architect (alignment with OPA policy), DevOps (config surface), Analyst (which model matches bank expectations).

### D-5 — Pilot-Disclosure Tone (P2 — blocks BP-4.x)

**Question:** Single combined `PILOT-DISCLOSURES.md` or three separate docs (AML / PSD2 / EURC)?
- Combined is easier for reviewers to find; separate is easier to update per vendor relationship.
- **Specialists to convoke:** Analyst (bank legal reviewer reading pattern), PM (sales-pack maintainability).

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------:|-------:|-----------|
| Pitch date 2026-06-30 unconfirmed by Renata | HIGH | HIGH | **FLAG TO RENATA** as the first question on return |
| HITL UX decision (D-1) stalls all P0 work | MEDIUM | HIGH | Run D-1 roundtable Day 1 of Week 1; do not let it slip |
| Audit-excerpt format (D-3) couples three stories — change costs grow weekly | MEDIUM | HIGH | Lock D-3 in Week 1; freeze format before BP-2.3 impl |
| BANK-07..11 MCP tools shipped without HITL — retrofitting risks regression | MEDIUM | MEDIUM | BP-2.1 tests must include regression suite over BANK-07..11 tools |
| Pre-existing hardcoded USDC address in `paybot-sdk/src/networks.ts` (called out in FOLLOWUPS as Sprint 4 cleanup) collides with idempotency / IBAN work | LOW | MEDIUM | BP-3.1 / BP-2.4 dev must verify the deferred address change doesn't shift |
| Solo Claude work — operator-only-mode story drafting violates `aiox_master_first` | MEDIUM | HIGH | This epic explicitly requires the chief architect convocation for every story; PM enforces |

---

## Mapping — How the GAPS-doc roadmap relates to this epic

**Verdict: Overlapping, not the same effort.**

The `AGENT-ECONOMY-MCP-GAPS.md` 10-tool roadmap is a **capability list** — new MCP tools (6 HIGH, 4 MEDIUM). The BANK-01..12 sprint **already shipped the 6 HIGH-priority tools** (`paybot_pay_eur`, `_settlement_provider_list`, `_policy_preview`, `_audit_excerpt`, `_identity`, `_trust_promote_request` — BANK-07..11 + part of BANK-12). The MEDIUM-priority 4 (subscriptions, anomaly, commission inspect) are **out of scope** for this epic and deferred to a post-pitch follow-on.

Mapping P0–P3 items in the brief to GAPS-doc tools:

| Brief item | GAPS-doc tool | Status |
|------------|---------------|--------|
| P0-1 HITL on `paybot_pay` | Wraps the existing `paybot_pay` + new `paybot_pay_eur` (BANK-07, shipped) | **NEW work in this epic** — middleware, not a new tool |
| P0-2 EURC in SDK + MCP | `paybot_pay_eur` (HIGH #1) + `paybot_settlement_provider_list` (HIGH #2) | **DONE** by BANK-07 — this epic ensures HITL covers it |
| P0-3 audit-chain proof to outside callers | `paybot_audit_excerpt` (HIGH #4) | **MCP tool DONE** by BANK-09 — this epic adds external verifier surface (BP-2.3, BP-5.3) |
| P0-4 SDK zero tests | n/a | **STALE PREMISE** — SDK has 7 test files. Real gap is coverage % (BP-3.5) |
| P1-5 TF-4 ADR gitignore | n/a | In flight as `BP-1.1` in paybot — track-only via BP-5.1 |
| P1-6 SDK idempotency / IBAN / audit-hook | n/a | **NEW work** — BP-2.4 / BP-3.1 / BP-3.2 |
| P1-7 MCP rate-limit / policy-preview / `paybot_identity` | `paybot_policy_preview` (HIGH #3), `paybot_identity` (HIGH #5) | **Tools DONE** by BANK-08 + BANK-10; this epic adds rate-limit middleware (BP-3.4) + UX polish (BP-3.3) |
| P2-8 AML/PSD2 pilot framing | n/a | **NEW work** — BP-4.1 / BP-4.2 |
| P2-9 EURC mainnet disclosure | n/a | **NEW work** — BP-4.3 |
| P3-10/11/12 TF-1/2/3 | n/a | Existing stories — BP-5.2 / BP-5.4 / BP-5.5 fold-ins |

**The 10-tool GAPS-doc roadmap and this epic share the EURC + audit + identity + policy-preview surface (all already shipped). This epic is the wrapping layer — HITL, idempotency, validators, rate-limit, disclosures — that turns shipped capability into pitch-grade product.**

---

## Open Questions for Renata

1. **Pitch date** — is 2026-06-30 still the target? GAPS doc says yes; first bank meeting in capability audit says 2026-07-15.
2. **HITL UX** — D-1 specialists need an operator-side constraint: do prospect banks have webhook infra ready, or should we default to in-MCP confirmation?
3. **Audit excerpt format (D-3)** — do bank legal teams in the warm-intro path already work with Verifiable Credentials, or is detached-signature JSON sufficient?
4. **Subscription tool deferral** — confirm OK to defer `paybot_subscription_create` (MEDIUM #7) past 2026-06-30.
5. **EURC mainnet activation** — any signal from Circle on the IP question that would let BP-4.3 be reframed from disclosure to capability?

---

*Epic opened by Morgan (PM) 2026-05-20. SM creates stories next. The chief architect convokes specialist roundtable on D-1..D-5 before story drafts land.*
