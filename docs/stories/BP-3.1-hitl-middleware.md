# Story BP-3.1 — HITL approval-gate middleware for paybot-mcp money-moving tools

**Epic:** EPIC-BANK-3 (MCP Bank-Surface) — part of EPIC-SET-BANK-PITCH-EXECUTION
**Repo:** paybot-mcp (Apache 2.0)
**Sprint:** Bank-Pitch Sprint — Weeks 2 + 3
**Status:** Draft
**Priority:** P0 — bank-pitch keystone (gates EPIC-BANK-3 + 2026-06-16 pitch readiness)
**Estimated effort (operator-locked):** 22 h total · 16 h critical path · 14 h with 2-dev parallelization
**Depends on:** BP-1.6 (paybot-mcp clean baseline + vitest scaffold), BP-2.4 (paybot-sdk ≥80% coverage rc.1)
**Blocks:** BP-3.2 (paybot_pay_eur), BP-3.3 (paybot_audit_excerpt), BP-3.4 (paybot_policy_preview), BP-3.5 (paybot_identity), BP-3.6 (tool registration + smoke test), BP-5.1 (e2e), BP-5.2 (e2e HITL approval-path)

---

## Spec / plan / decision anchors

| Artifact | Path | Notes |
|---|---|---|
| Spec (v0.2, APPROVED 4.5/5) | `paybot-mcp/docs/specs/BP-3.1/spec.md` | 15 FR · 12 NFR · 9 CON · 6 sections of design · §11 test strategy |
| Implementation plan | `paybot-mcp/docs/specs/BP-3.1/implementation.yaml` | 11 phases · 22 h · ready_for_dev=true |
| ADR | `paybot/docs/architecture/adrs/ADR-BP-001-hitl-approval-gate.md` | Accepted 2026-05-20 |
| Architecture §2 | `paybot/docs/architecture/bank-pitch-sprint-architecture.md` | Middleware contract |
| Open-core boundary | `paybot/docs/architecture/OPEN-CORE-BOUNDARY-MAP.md` §5 | CON-2 / CON-5 discipline |
| Companion ADR | `paybot/docs/architecture/adrs/ADR-BP-002-veritas-reuse.md` | VERITAS Ed25519 reuse |
| Operator-decision provenance | `paybot/docs/decisions/BP-3.1-operator-decisions-2026-05-20.md` *(to be authored alongside dev start)* | hybrid posture · single approver v0.3 · all 3 channels |

---

## Story

**As** the operator preparing the Nordic bank pitch — and the Nordic bank reviewer who will inspect this code post-pitch,
**I want** every money-moving MCP tool (`paybot_pay`, upcoming `paybot_pay_eur`) wrapped in declarative HITL approval middleware that — with structural rather than policy enforcement — refuses settlement until a human-signed `ApprovalEnvelope` (or auditable `BypassEnvelope`) exists; surfaces the approval prompt across **stdio + webhook + http-poll** channels; carries a **JWS(EdDSA)** envelope with PSD2/PSD3 dynamic-linking inside the signature; writes a VERITAS-signed audit chain cross-anchored to paybot-core's chain; and ships with an offline **bank-verifier-kit** that bank IT can run with zero paybot dependencies,
**So that** the 2026-06-16 pitch satisfies "show me the human approval for tx X" with one falsifiable artifact per payment, the LLM-as-payer threat is closed at three layers (schema · middleware · core header verification), and Nordic banks can verify the evidence independently — without trusting paybot software — per PSD2 RTS Art. 5, DORA Art. 28, and AMLD6 5-year retention.

---

## Acceptance Criteria

> Numbered for traceability. Each AC maps to one or more FRs in spec.md §3 and to specific tasks in implementation.yaml. The `coverage_check:` block in `implementation.yaml` (lines 660–700) is the canonical FR/NFR/CON → task map; this AC list is the user-outcome view.

1. **Wrap-at-registration is the only path to settlement.** **Given** `src/server.ts` registers `paybot_pay` (and later `paybot_pay_eur`), **When** the tool surface is inspected, **Then** every money-moving tool is wrapped via `wrapWithHitl(handler, policy)` at registration time (FR-1); the tool schema exposes ZERO bypass field (`bypass_hitl`, `skip_approval`, `override_hitl` — any LLM attempt → `HITL_BYPASS_DENIED`, FR-14); and `tests/security/hitl/llm-cannot-bypass.test.ts` proves the schema invariant + middleware denial path.

2. **Six-state machine with hybrid durable path persists every transition.** **Given** spec §5.2 enumerates `pending → approved → executed | failed`, `pending → rejected`, `pending → timeout`, and the hybrid `pending → durable_pending → approved → executed` fork, **When** the state-machine runs, **Then** all 6 transitions succeed; invalid transitions throw `InvalidTransitionError`; idempotency holds (applying the same transition twice equals once); `T_a` (per-channel: stdio 30s · webhook 5min · http-poll 10min) and `T_b` (5min hard sync ceiling for stdio) and `T_c` (72h durable, configurable) clock semantics enforce the durable fork only when `amount ≥ PAYBOT_MCP_HITL_DURABLE_THRESHOLD` (default 100 EUR/USD) — covered by `tests/unit/hitl/state-machine.test.ts` and property-based exhaustive enumeration.

3. **Three channels ship live in v0.3, all behind one `ApprovalNotifier` interface.** **Given** operator decision 2026-05-20 locks stdio + webhook + http-poll, **When** each channel runs an end-to-end happy-path against a stubbed operator, **Then** `tests/integration/hitl/end-to-end-{stdio,webhook,http-poll}.test.ts` each pass: stdio uses MCP elicitation form-mode (Claude Desktop); webhook uses MCP elicitation URL-mode + HMAC-SHA256-signed callback (`X-Paybot-HMAC`, 32-byte `PAYBOT_MCP_WEBHOOK_SECRET`); http-poll serves `GET /approvals/pending` + `POST /approvals/callback` (same HMAC contract, air-gap-friendly). Channel selected by `PAYBOT_MCP_APPROVAL_CHANNEL` env (FR-3).

4. **JWS(EdDSA) envelope with PSD2/PSD3 dynamic linking inside the signature.** **Given** spec §5.3 mandates RFC 7515 compact JWS with `alg=EdDSA` (RFC 8037), `typ=paybot-approval+jws`, and a sanitized payload containing only `{recipient, amount, network, asset, resource}` plus envelope metadata, **When** an envelope is encoded/decoded, **Then** the wire shape is `<protected_header>.<payload>.<signature>`; tampering any of recipient/amount/asset/network invalidates the signature (`tests/security/hitl/dynamic-linking-tamper.test.ts`); canonical-JSON serialization is stable under 1000 fast-check permutations; timestamp normalization (round-trip per `feedback_veritas_timestamp_normalization`) succeeds across 1000 random timestamps; FR-11 allowlist sanitization drops `apiKey`/`walletPrivateKey`/headers/internal-state across ≥50 input shapes.

5. **Core refuses settlement without the signed header (cross-repo contract).** **Given** the MCP forwards the JWS via `X-Paybot-Approval-Envelope`, **When** paybot-core's `/v1/audit/verify` receives a settlement request, **Then** missing header → 401, bad signature → 401, replayed `request_id` → 409, expired envelope (>5 min) → 410 (`tests/integration/hitl/core-header-verification.test.ts` — cross-repo; depends on @dev (Dex) on paybot-core ADR-BP-001 amendment + ADR-BP-002 nonce-store amendment).

6. **Persistent state survives `kill -9`.** **Given** SQLite (WAL mode) at `paybot-mcp/.state/approvals.sqlite` (gitignored) and `request_id` UUIDv7 uniqueness, **When** the MCP server is force-killed mid-approval and restarted, **Then** in-flight pendings within `T_b` resume cleanly; aged pendings transition to `timeout` (no phantom-pendings); 100 concurrent inserts produce zero `SQLITE_BUSY` (NFR-4 + NFR-10 — `tests/chaos/hitl/{restart-resume,concurrent-pendings}.test.ts`).

7. **MCP audit chain cross-anchors to paybot-core's chain.** **Given** CON-2 (no shared DB) and CON-5 (no cross-import), **When** every state transition fires, **Then** one VERITAS-signed entry is appended to `.state/audit-chain.sqlite` (`h_N = H(h_{N-1} ∥ entry_N)`, NFR-6: 1000 invocations → 1000 entries); the `executed` entry's `core_audit_ref` field carries the paybot-core audit-event-ID returned by `client.pay()` (degrades gracefully to `"PENDING"` + warning log if core has not yet shipped that response field — tracked as cross-repo dependency SQ-3).

8. **HTTP sidecar honors CON-3 carve-out — stdio default binds zero ports.** **Given** the CON-3 amendment (spec §5.4), **When** `PAYBOT_MCP_APPROVAL_CHANNEL=stdio` (default), **Then** the MCP server binds ZERO TCP ports (`tests/integration/hitl/stdio-only-no-http.test.ts`); when channel ∈ {webhook, http-poll}, the separate `paybot-mcp-approval-sidecar` process binds `PAYBOT_MCP_HTTP_SIDECAR_PORT` (default 7843, localhost-only); `GET /health` returns `{status, channel}`; SIGTERM shutdown 5s grace; bind failure → `SIDECAR_BIND_FAILED` (boot-time fatal); logs to stderr only (stdout cleanliness for MCP transport).

9. **Bypass is build-flagged + prod-refused + audit-visible.** **Given** spec §5.6 + NFR-5, **When** `HITL_BYPASS=true && NODE_ENV=production && PAYBOT_MCP_ALLOW_BYPASS!=true`, **Then** the server refuses to boot (`tests/security/hitl/bypass-refused-in-prod.test.ts`); `HITL_BYPASS=true && HITL_BYPASS_OPERATOR_ID unset` → also refuses to boot; when bypass is active in dev, middleware writes a signed `BypassEnvelope` (same JWS shape, `decision: "bypassed"`) to the audit chain BEFORE SDK invocation — bank-verifier-kit surfaces `bypassed=true` prominently.

10. **Two new tools surface the durable path safely.** **Given** FR-13 + FR-14, **When** `paybot_pay_status(request_id)` is called, **Then** it returns `{state, decided_at?, envelope?, executed_tx_hash?}` (no AuthZ — LLM polls freely after `HITL_DURABLE_PENDING`); **When** `paybot_hitl_approve(request_id, decision, reason?)` is called, **Then** it requires ALL of: caller in `PAYBOT_MCP_TOOL_APPROVAL_ALLOWED_CALLERS` allowlist (default empty → disabled) + `PAYBOT_MCP_ALLOW_TOOL_APPROVAL=true` + verifiable host-passed caller identity (operator session token, NOT transport identity) — missing any → `HITL_BYPASS_DENIED`.

11. **Bank-verifier-kit (FR-15) ships with zero paybot dependencies.** **Given** the falsifiable-claim posture (R4 mitigation), **When** `docs/pitch/bank-verifier-kit/` is published, **Then** it contains: standalone Node script `verify-paybot-hitl.js` (<200 LOC, only `crypto` + `jose` deps); exported Ed25519 pubkeys for both chains (`paybot-mcp-chain.pub`, `paybot-core-chain.pub`); two sample chains (`approval-chain.json`, `rejection-chain.json`); 1-page `RUNBOOK.md`. CI smoke test `tests/audit/hitl/verifier-kit-smoke.test.ts` runs the kit against the samples on every build; tampering any sample field → kit reports failure with line number.

12. **Quality Foundation Pillar 1 gate: ≥80% line coverage on `src/middleware/hitl/**`.** **Given** AIDR-009 quality-foundation, **When** `npm run test:coverage` runs scoped to the middleware directory tree, **Then** every file under `src/middleware/hitl/**` shows ≥80% line coverage (enforced by `vitest.config.ts` `coverage.thresholds.lines = 80` scoped to that path); zero `.skip` / `xit` / `xdescribe`; @qa veto if any file drops below 80%.

13. **DORA evidence and 5-year retention documented in release notes.** **Given** NFR-11, **When** v0.3 release notes are drafted, **Then** they include: (a) retention policy ≥5 years per AMLD6 minimum; (b) exit strategy (operator-key revocation procedure); (c) reference to the bank-verifier-kit runbook; (d) reference to ADR-BP-001 + ADR-BP-002.

---

## Tasks / Subtasks

> Mirrors `implementation.yaml` 11 phases. Phase-level checkboxes are checked when ALL child tasks in that phase pass their acceptance test. Files-touched per task are in the plan; not repeated here.

### Phase P1 — Module scaffold + types + module-level docs (est. 1.0 h)

- [ ] **T1.1** Create `src/middleware/hitl/{index.ts, types.ts, errors.ts}` with module-level doc comments (AIDR-009 Pillar 2). `types.ts` exports: `ApprovalState` (6-state union), `PendingEnvelope`, `SignedEnvelope`, `ApprovalEnvelopePayload`, `BypassEnvelope`, `ApprovalDecision`, `ApprovalNotifier` interface, `AuditChainEntry`, `HitlPolicy`. Acceptance: `tsc --noEmit` + `npm run lint` clean.
- [ ] **T1.2** Add npm deps: `jose` (JWS), `better-sqlite3`, `uuid` (v7), `@noble/ed25519` fallback. Pin per ADR-BP-007. Acceptance: `npm ci` + `npm run build` clean; zero peer-dep warnings.

### Phase P2 — JWS(EdDSA) envelope encode/decode + canonical-JSON + dynamic linking + timestamp normalization (est. 2.5 h, can parallelize with P3 + P4-types)

- [ ] **T2.1** `src/middleware/hitl/canonical-json.ts` — RFC 8785 JSON Canonicalization Scheme. **DO NOT invent a third canonicalization scheme**; reuse the Helena/ALMA chain's lib if shape-compatible (memory: `project_veritas_three_chains_live`). Property test: 1000 random objects → stable under permutation.
- [ ] **T2.2** `src/middleware/hitl/timestamp.ts` — round-trip parse-and-re-emit before signing (memory-anchored gotcha `feedback_veritas_timestamp_normalization`). Property test: 1000 random timestamps round-trip identically. **Skipping this WILL break the verifier kit.**
- [ ] **T2.3** `src/middleware/hitl/{envelope.ts, sanitize.ts}` — encode/decode via `jose` JWS compact form; dynamic linking (recipient + amount + asset + network INSIDE signed payload); FR-11 allowlist sanitization BEFORE signing; future fields default to EXCLUDED. Acceptance: `tests/unit/hitl/envelope.test.ts` + `tests/unit/hitl/sanitization.test.ts` (≥50 input shapes via fast-check; 1000-round canonical-JSON fuzz with 0 mismatches).
- [ ] **T2.4** `src/middleware/hitl/veritas-signer.ts` — VERITAS signer adapter; kid `paybot-mcp-chain` (memory `project_veritas_three_chains_live`); fail-closed → `VeritasSignerUnavailableError` (OQ-8). Confirm dev key path with @devops (`.env` or `KEY_REGISTRY_PATH`). **Do not invent a new signing scheme (Article IV, CON-1).**

### Phase P3 — Approval state machine + SQLite persistence (WAL) + restart resume (est. 2.5 h, parallel with P2 + P4-types)

- [ ] **T3.1** `src/middleware/hitl/state-machine.ts` — pure functional state machine; rejects invalid transitions; idempotent. Threshold from `PAYBOT_MCP_HITL_DURABLE_THRESHOLD` (default 100, currency-aware EUR vs USD). Acceptance: `tests/unit/hitl/state-machine.test.ts` (all 6 transitions, T_a/T_b/T_c clock semantics, idempotency).
- [ ] **T3.2** `src/middleware/hitl/store/{sqlite-store.ts, types.ts, schema.sql}` — WAL mode SQLite at `.state/approvals.sqlite`; idempotent on `request_id` (UUIDv7); schema versioning in meta table; pluggable `StoreAdapter` interface (operator-default: swap-able to Postgres/Redis for hosted MCP per FR-7). Modify `.gitignore` to exclude `.state/`. Acceptance: `tests/integration/hitl/store-restart.test.ts` (insert → kill → restart → readable; 100 concurrent → 0 SQLITE_BUSY).
- [ ] **T3.3** `src/middleware/hitl/approval-gate.ts` — orchestrator combining state-machine + store + hybrid wait (T_a sync → T_c durable fall-through). **`HITL_DURABLE_PENDING` return path MUST be ≤200ms (NFR-2)** — fire-and-forget the durable_pending state write; don't block on storage flush.
- [ ] **T3.4** `src/middleware/hitl/recovery.ts` + boot hook in `src/index.ts` — restart-recovery scan loads all `pending` + `durable_pending` rows; past T_b/T_c expiry → `timeout`. Acceptance: `tests/chaos/hitl/restart-resume.test.ts` (kill-9 → in-flight resumed, aged → timeout, zero phantom-pendings).

### Phase P4 — Three notifier implementations (stdio, webhook, http-poll) (est. 3.5 h, serial after P2 + P3)

- [ ] **T4.1** `src/middleware/hitl/channels/{notifier.ts, factory.ts}` — `ApprovalNotifier` interface + factory keyed by `PAYBOT_MCP_APPROVAL_CHANNEL`. Acceptance: factory returns correct class for each of {stdio, webhook, http-poll}.
- [ ] **T4.2** `src/middleware/hitl/channels/stdio.ts` — MCP elicitation FORM-mode (per research §mcp-specific). Acceptance: `tests/unit/hitl/notifier-stdio.test.ts` (elicitation contains all `human_readable_summary` fields, approve/reject mapped, `paybot_hitl_approve` alternate path, stdout cleanliness).
- [ ] **T4.3** `src/middleware/hitl/channels/{webhook.ts, hmac.ts}` — outbound POST with HMAC-SHA256-signed body; `X-Paybot-HMAC` header; URL-mode elicitation; **`PAYBOT_MCP_WEBHOOK_SECRET` MUST be 32-byte (refuse to start if shorter when channel=webhook); mask in logs per `feedback_credentials_masking`**. Retry exponential backoff max 5 (NFR-8). Acceptance: `tests/unit/hitl/notifier-webhook.test.ts`.
- [ ] **T4.4** `src/middleware/hitl/channels/http-poll.ts` — serves `GET /approvals/pending` + ingests `POST /approvals/callback` (same HMAC contract as webhook). Sidecar wires it (P5). Acceptance: `tests/unit/hitl/notifier-http-poll.test.ts`.

### Phase P5 — HTTP sidecar process for webhook + http-poll (CON-3 amendment) (est. 2.0 h)

- [ ] **T5.1** `src/sidecar/{index.ts, server.ts, routes.ts}` + `package.json` bin entry `paybot-mcp-approval-sidecar`. Binds `PAYBOT_MCP_HTTP_SIDECAR_PORT` (default 7843, **localhost-only — 127.0.0.1, not 0.0.0.0**). Starts ONLY when channel ∈ {webhook, http-poll}; stdio mode → sidecar refuses to start, exit 0. Bind failure → `SIDECAR_BIND_FAILED` (boot-time fatal). SIGTERM → 5s grace shutdown. **Logs ONLY to stderr (stdout cleanliness for MCP transport).** Acceptance: `tests/integration/hitl/sidecar-lifecycle.test.ts`.
- [ ] **T5.2** `src/sidecar/lifecycle.ts` + boot hook in `src/index.ts` — MCP spawns sidecar on boot if channel needs it; tears down on MCP exit. Sidecar crash → 3 respawn attempts → fail-closed refusal of approvals. Acceptance: killing MCP kills sidecar within 5s.

### Phase P6 — wrapWithHitl wraps paybot_pay (and preps for paybot_pay_eur from BP-3.2) (est. 2.0 h)

- [ ] **T6.1** `src/middleware/hitl/wrap.ts` — composes `sanitize → persist(pending) → ApprovalGate.requestApproval → sign envelope → AuditChain.append → call original handler with X-Paybot-Approval-Envelope header → persist(executed|failed) → return`. Handler signature stays backwards-compatible — only header injection changes for downstream. Acceptance: `tests/unit/hitl/wrap.test.ts` (handler called only after `approved`; JWS in header; reject/timeout/durable paths verified).
- [ ] **T6.2** Apply wrap in `src/server.ts` to `paybot_pay` registration; export `GATED_TOOLS = ['paybot_pay', 'paybot_pay_eur']` from `src/middleware/hitl/index.ts` (forward-prep for BP-3.2). **Tool-schema invariant assertion (FR-14 must-fix):** scan `paybot_pay`'s `z.object` schema and assert no key matches `/bypass|skip[_-]?approval|override.*hitl/i`. Acceptance: `tests/integration/hitl/end-to-end-stdio.test.ts`.

### Phase P7 — MCP-side VERITAS audit chain + cross-anchor at executed (est. 2.0 h, parallel with P4 once P2 done)

- [ ] **T7.1** `src/middleware/hitl/audit-chain/{chain.ts, types.ts, schema.sql}` — append-only ledger at `.state/audit-chain.sqlite`; each entry VERITAS-signed (kid `paybot-mcp-chain`); `h_N = H(h_{N-1} ∥ entry_N)`. Acceptance: property test 1000 appends → 1000 hash-linked entries; tampering → chain verification fails; each transition writes exactly one entry (NFR-6).
- [ ] **T7.2** Cross-anchor at `executed`: read core-side `audit_event_id` from `client.pay()` response, write into `core_audit_ref` field. **Cross-repo dependency on @dev (Dex) on paybot-core to populate `audit_event_id` in pay() response (SQ-3 to @pm).** Graceful degrade: log warning + store `"PENDING"` if absent. Acceptance: `tests/integration/hitl/audit-chain.test.ts` (3 entries pending/approved/executed; `core_audit_ref` matches SDK response).
- [ ] **T7.3** `src/middleware/hitl/audit-chain/retention.ts` + `docs/RETENTION-POLICY.md` — cleanup job purges audit-chain entries >5 years (AMLD6 minimum, NFR-11). Documented in v0.3 release notes.

### Phase P8 — New tools: paybot_pay_status + paybot_hitl_approve (est. 1.5 h, parallel with P9)

- [ ] **T8.1** `src/tools/paybot-pay-status.ts` + register in `src/server.ts`. Returns `{state, decided_at?, envelope?, executed_tx_hash?}`. `request_id` not found → typed error, no crash. No HITL gate (FR-13).
- [ ] **T8.2** `src/tools/paybot-hitl-approve.ts` + `src/middleware/hitl/caller-identity.ts` + register in `src/server.ts`. **HARDENED per @qa FR-14:** gated by ALL of: `PAYBOT_MCP_TOOL_APPROVAL_ALLOWED_CALLERS` allowlist (default empty → disabled), `PAYBOT_MCP_ALLOW_TOOL_APPROVAL=true`, verifiable host-passed caller identity (operator session token, NOT transport identity). Missing any → `HITL_BYPASS_DENIED`. **Stub adapter for demo (env-var-defined token); production deployments require real host integration (SQ-2 to @pm).** Acceptance: `tests/security/hitl/llm-cannot-bypass.test.ts` (4 sub-cases).

### Phase P9 — HITL_BYPASS env with prod-refusal + BypassEnvelope (est. 1.0 h, parallel with P8)

- [ ] **T9.1** `src/middleware/hitl/bypass.ts` + `src/index.ts` + `build/build-flags.ts` (build-time constant injection — esbuild/tsc `define`, **NOT** runtime env, so it cannot be flipped post-build; SQ-1 to @pm). Three env vars: `HITL_BYPASS=true` (runtime) + `HITL_BYPASS_OPERATOR_ID=<id>` (required when bypass) + `PAYBOT_MCP_ALLOW_BYPASS=true` (build-time). Production bundle MUST ship `ALLOW_BYPASS=false`. Acceptance: `tests/security/hitl/bypass-refused-in-prod.test.ts`.
- [ ] **T9.2** Modify `src/middleware/hitl/wrap.ts` + `audit-chain/chain.ts` — when bypass active, write signed `BypassEnvelope` (same JWS shape, `decision:"bypassed"`, `bypass_operator_id` present) to audit chain BEFORE SDK call. SDK call still uses `X-Paybot-Approval-Envelope` header (BypassEnvelope, same JWS shape).

### Phase P10 — FR-15 offline bank-verifier-kit (est. 1.5 h, parallel with P11)

- [ ] **T10.1** Author `docs/pitch/bank-verifier-kit/`:
  - `verify-paybot-hitl.js` — standalone Node, zero paybot deps (only `crypto` + `jose`), <200 LOC
  - `package.json` — only `jose` dep
  - `pubkeys/{paybot-mcp-chain,paybot-core-chain}.pub` — Ed25519 from VERITAS registry (**cross-repo: @devops to publish at `paybot/docs/architecture/keys/paybot-mcp-chain.pub`**)
  - `samples/{approval,rejection}-chain.json` — fixture chains generated by an end-to-end fixture script
  - `RUNBOOK.md` — 1-page bank-IT guide
  - Acceptance: `tests/audit/hitl/verifier-kit-smoke.test.ts` (CI runs kit against samples; tampering any sample field → kit reports failure with line number).
- [ ] **T10.2** `RUNBOOK.md` finalization — manual review by Renata that a non-paybot engineer can run it in <10 minutes.

### Phase P11 — Test file completion + coverage gate (est. 2.5 h)

- [ ] **T11.1** Ensure all 25 test files from spec §11 exist with the listed assertions. Most are scaffolded by P2/P3/P4/P5/P7/P8/P9/P10; this phase fills gaps and adds the regression + chaos + DORA-audit tiers:
  - Unit (6): `envelope`, `state-machine`, `sanitization`, `notifier-stdio`, `notifier-webhook`, `notifier-http-poll`
  - Integration (7): `end-to-end-{stdio,webhook,http-poll}`, `sidecar-lifecycle`, `stdio-only-no-http`, `core-header-verification` (cross-repo: needs paybot-core stub), `audit-chain`
  - Security (5): `replay-defense`, `bypass-refused-in-prod`, `webhook-hmac`, `dynamic-linking-tamper`, `llm-cannot-bypass`
  - Regression (2): `bp16-baseline` (BP-1.6 still green), `ungated-tools-unchanged` (paybot_balance/paybot_history/paybot_register intact)
  - Chaos (3): `notifier-failure` (50% failure → 100% terminal, NFR-8), `concurrent-pendings` (100 concurrent → 0 SQLITE_BUSY, NFR-10), `restart-resume` (T3.4)
  - DORA-audit (2): `chain-integrity` (100 random tx, verifier-kit confirms with published pubkeys only), `verifier-kit-smoke`
- [ ] **T11.2** Configure `vitest.config.ts` `coverage.thresholds.lines = 80` scoped to `src/middleware/hitl/**` (SQ-4 to @pm — confirm scoped threshold acceptable, or require global lift). Acceptance: `npm test` → ALL pass zero skipped; `npm run test:coverage` → `src/middleware/hitl/**` lines ≥80%; PR blocked if drops.

---

## Dev Notes

### Spec / plan / ADR cross-references

- **Spec §3** (FR-1..FR-15), **§4** (NFR-1..NFR-12), **§5** (design), **§7** (constraints), **§11** (test strategy with concrete paths) — all paths in the AC list above trace back here.
- **Plan §coverage_check** (`implementation.yaml` lines 660-700) is the canonical FR/NFR/CON → task map; ACs above are the user-outcome view.
- **ADR-BP-001 §2** locks: six-state machine + hybrid durable, three notifier channels + one envelope shape, JWS(EdDSA) + VERITAS reuse, sidecar carve-out, two chains + cross-anchor, build-flagged bypass with prod refusal.

### Operator decisions (2026-05-20) locked into the design

1. **Hybrid posture** (sync `T_a` + durable `T_c` fall-through for amounts ≥ threshold) — not "synchronous-only blocking" (ADR-BP-001 §4 alternative (b) rejected).
2. **Single approver v0.3 / two-key contract v0.4** — `approvers: ApprovalSignature[]` array shape ships in v0.3 as forward-compat scaffold; v0.4 picks Option A (JWS-JSON-Serialization, wire break) OR Option B (compact JWS + detached `approvers[1..N]`, no wire break) by 2026-07-01 in ADR-BP-001-v2. **"No wire break" is honest-conditional on Option B.**
3. **All three channels in v0.3** — descope of webhook+http-poll to v0.3.1 requires operator re-approval (per plan R0 risk).

Provenance recorded at `paybot/docs/decisions/BP-3.1-operator-decisions-2026-05-20.md` (to be authored alongside @dev pickup) and memory `project_bp31_operator_decisions` (to create at session boundary).

### Memory anchors (apply proactively)

- `project_veritas_three_chains_live` — three production VERITAS Ed25519 chains exist (Helena Python, ALMA Python, paybot TS). Reuse pattern + lib; **do not invent a new canonicalization scheme**.
- `feedback_veritas_timestamp_normalization` — Postgres strips trailing zeros on `timestamptz`; verifiers MUST round-trip parse-and-re-emit before signing. T2.2 is non-skippable.
- `feedback_credentials_masking` — never log full `PAYBOT_MCP_WEBHOOK_SECRET` or VERITAS keys; mask `prefix…suffix` or reference `.env` path.
- `feedback_testing_agent_sop` — HITL approval-loop is the default; this story IS the canonical example.
- `feedback_idempotent_resource_creation` — sidecar `/health` and SQLite store schema setup must be idempotent on restart.
- `feedback_aiox_master_first` — @dev pickup of this story is convoked via @aiox-master; do not solo-Claude.

### Cross-repo dependencies (`implementation.yaml` §cross_repo_dependencies)

| Item | Owner | Blocks | Status |
|---|---|---|---|
| `paybot/docs/architecture/keys/paybot-mcp-chain.pub` publication | @devops (Gage) | P10-verifier-kit (T10.1) | pending |
| Core `/v1/audit/verify` accepts `X-Paybot-Approval-Envelope` + refuses settlement if absent/invalid | @dev on paybot-core; ADR-BP-001 amendment | P6 (T6.2), P11 integration core-header-verification | pending |
| Core `client.pay()` response carries `audit_event_id` (cross-anchor seed) | @dev on paybot-core | P7 (T7.2) | graceful-degrade `PENDING` if not shipped |
| Core 30-day `request_id` nonce store (NFR-9 replay defense) | @dev on paybot-core; ADR-BP-002 amendment | P11 security/replay-defense + integration/core-header-verification | pending |
| paybot-sdk `client.pay()` `opts.headers` passes `X-Paybot-Approval-Envelope` verbatim | @dev on paybot-sdk | P6 (T6.1) | pending — verify or add |

### Risk register (`implementation.yaml` §risk_assessment)

| # | Risk | Sev × Likely | Mitigation in plan |
|---|---|---|---|
| R0 | Epic AC said 5h; honest re-estimate is 22h | H × H | **Operator already accepted full scope 2026-05-20 (epic YAML line 186).** Re-surface only if descope becomes necessary. |
| R1 | Hybrid state machine doubles test surface | M × H | P3 property-based exhaustive transitions; P11 chaos tier covers durable-resume |
| R2 | Webhook channel needs HTTP sidecar; air-gapped pilot may refuse | M × M | http-poll is the explicit air-gap fallback; sidecar starts ONLY when needed (T5.1) |
| R3 | MCP elicitation spec is draft, not ratified | M × M | Stdio form-mode is lowest-common-denominator; Claude Desktop confirmed support; OQ-D7 tracked |
| R4 | Bank may demand single Merkle tree, not two chains | M × M | P10 verifier-kit turns claim into falsifiable artifact; Merkle unification deferred to BP-3.x post-pitch fallback |
| R5 | No operator console UI — webhook demo needs Slack stub | H × M | Slack-stub is 3rd-party config, not paybot deliverable; must be booked with @ux-design-expert by 2026-05-27 |
| R6 | FR-14 caller-identity model depends on MCP host extension that does not exist uniformly | M × H | T8.2 ships documented stub adapter (env-var token) for demo; production-grade requires real host integration (SQ-2) |
| R7 | Build-time ALLOW_BYPASS injection may interact with tsc/esbuild in unexpected ways | L × H | T9.1 uses `define` constant; `bypass-refused-in-prod.test.ts` verifies prod-bundle invariant |

### Open spec-level questions (non-blocking; @pm triage before mid-implementation)

- **SQ-1** Build-time `ALLOW_BYPASS` injection mechanism — confirm `define` constant is acceptable, or document an alternative (separate prod build script).
- **SQ-2** MCP host caller-identity contract (FR-14) — wire shape opaque; published paybot contract or Claude-Desktop-specific adapter?
- **SQ-3** Core-side `audit_event_id` in `client.pay()` response — paybot-core sprint deliverable or BP-3.3 separately? Plan assumes graceful degrade.
- **SQ-4** Vitest coverage threshold scoped to `src/middleware/hitl/**` only — confirm acceptable or require global threshold lift.

### Quality Foundation pillars (AIDR-009 mandatory)

- **Pillar 1 (tests):** ≥80% line coverage on `src/middleware/hitl/**`, every new function gets ≥3 tests (happy/error/edge), zero skipped tests, property-based testing via `fast-check` for canonical-JSON + state-machine + sanitization + audit-chain integrity.
- **Pillar 2 (docs):** every exported function has TSDoc (what/param/returns/throws/example); every module has top-level doc comment; complex logic has inline WHY comments.
- **Pillar 3 (QA):** 2-pass minimum @qa gate per AIDR-009; 12-check matrix; **WAIVED not available for tests/docs** (only for perf/security edge cases with @architect approval).
- **Pillar 4 (regression):** `bp16-baseline.test.ts` + `ungated-tools-unchanged.test.ts` are the regression-shield contracts.

### SVG-1 (Intent Anchoring) requirement

@dev MUST author `paybot-mcp/docs/stories/BP-3.1/semantic-intent.md` BEFORE writing any implementation code (after reading T1.1), and `semantic-mapping.md` AFTER all tasks pass + BEFORE @qa pickup. Template: `.aios-core/development/templates/semantic-intent-tmpl.md`. Cross-checked by @qa Phase 6.4 (Adversarial Semantic Review) against the `task_packet.objective` below (per `.claude/rules/svg-intent-anchoring-addendum.md`).

---

## Semantic Intent (SVG-1 placeholder)

> **To be filled by @dev at start of implementation, before any code edit.**
>
> File: `paybot-mcp/docs/stories/BP-3.1/semantic-intent.md`
> Format: 3-5 sentences describing the user-outcome of this change.
> Reference template: `.aios-core/development/templates/semantic-intent-tmpl.md`
>
> Suggested anchor: "A Nordic bank reviewer at the 2026-06-16 pitch asks 'show me the human approval for tx X', and the operator returns one JWS-wrapped, Ed25519-signed envelope containing recipient + amount + asset + network inside the signature, verifiable offline with the published public key, with a hash-chain on both the MCP and core sides — and the reviewer can verify it themselves with a 200-line Node script that has zero paybot dependencies. An LLM trying to settle without that envelope is stopped at three layers (schema, middleware, core header verification), regardless of prompt injection or compromised host."

---

## Testing

Spec §11 + plan P11 define the full test inventory. Summary for the reader:

**Frameworks:** Vitest (matches BP-1.6 baseline) + fast-check for property-based testing.
**Test root:** `paybot-mcp/tests/` (mirrors `paybot-mcp/src/`).
**Coverage gate:** `coverage.thresholds.lines = 80` scoped to `src/middleware/hitl/**` (enforced; @qa veto).
**Test count:** 25 files across 6 categories (unit, integration, security, regression, chaos, DORA-audit).

**Critical-path tests for bank-pitch readiness:**
- `tests/security/hitl/llm-cannot-bypass.test.ts` — closes the LLM-as-payer threat across schema + middleware + AuthZ
- `tests/integration/hitl/end-to-end-{stdio,webhook,http-poll}.test.ts` — three channels live in v0.3
- `tests/audit/hitl/verifier-kit-smoke.test.ts` — bank-verifier-kit is the falsifiable claim (R4 mitigation)
- `tests/integration/hitl/core-header-verification.test.ts` — cross-repo proof that core refuses settlement without the header

**Regression must remain green:** BP-1.6 baseline tests + paybot_balance / paybot_history / paybot_register (ungated tools — must NOT be wrapped).

---

## task_packet (AIDR-020)

```yaml
task_packet:
  story_id: BP-3.1
  spec_version: 0.2
  plan: paybot-mcp/docs/specs/BP-3.1/implementation.yaml
  adr: paybot/docs/architecture/adrs/ADR-BP-001-hitl-approval-gate.md
  size_hours_total: 22
  size_hours_critical_path: 16
  size_hours_2dev_parallel: 14

  objective: |
    Interpose a declarative HITL approval-gate middleware between every
    money-moving MCP tool registration (paybot_pay, upcoming paybot_pay_eur)
    and the underlying SDK call, such that:

      (a) The middleware is the only path from server.tool(...) to client.pay().
          Tool authors cannot opt out; LLMs cannot bypass via tool args
          (schema invariant + HITL_BYPASS_DENIED at three layers).
      (b) A six-state machine with a hybrid durable path (T_a sync window per
          channel + T_c durable for amounts ≥ threshold) persists every
          transition to SQLite WAL and resumes cleanly on kill-9 restart.
      (c) Three notifier channels (stdio + webhook + http-poll) ship in v0.3
          behind a single ApprovalNotifier interface; HTTP channels run in a
          separate sidecar process so CON-3 stdio-only invariant holds when
          channel=stdio (default).
      (d) The signed ApprovalEnvelope is JWS(EdDSA) compact per RFC 7515,
          payload contains only sanitized settlement params (PSD2 dynamic
          linking inside the signature), VERITAS Ed25519 reused (CON-1, kid
          paybot-mcp-chain). MCP forwards via X-Paybot-Approval-Envelope
          header; paybot-core verifies and refuses settlement if
          absent/invalid/replayed/expired.
      (e) An MCP-side VERITAS hash chain at .state/audit-chain.sqlite cross-
          anchors to paybot-core's chain at the executed transition via
          core_audit_ref (honors CON-2 + CON-5 — no shared DB, no cross-import).
      (f) Bypass mode is build-flag-gated (ALLOW_BYPASS baked at build time,
          NODE_ENV=production refuses to boot if HITL_BYPASS=true && ALLOW_BYPASS!=true)
          and writes a signed BypassEnvelope to the audit chain before SDK call.
      (g) Two new tools surface the durable path: paybot_pay_status (read-only,
          no AuthZ) and paybot_hitl_approve (allowlist + verifiable host caller
          identity, default disabled).
      (h) A standalone bank-verifier-kit ships with v0.3 at
          docs/pitch/bank-verifier-kit/ — <200-LOC Node script + Ed25519 pubkeys
          + sample chains + 1-page runbook — verifiable by bank IT with zero
          paybot dependencies.
      (i) ≥80% line coverage on src/middleware/hitl/** enforced via vitest
          scoped threshold; 25 test files across 6 tiers (unit, integration,
          security, regression, chaos, DORA-audit).

  scope:
    files_may_touch:
      # Source — middleware module tree
      - src/middleware/hitl/index.ts
      - src/middleware/hitl/types.ts
      - src/middleware/hitl/errors.ts
      - src/middleware/hitl/canonical-json.ts
      - src/middleware/hitl/timestamp.ts
      - src/middleware/hitl/envelope.ts
      - src/middleware/hitl/sanitize.ts
      - src/middleware/hitl/veritas-signer.ts
      - src/middleware/hitl/state-machine.ts
      - src/middleware/hitl/approval-gate.ts
      - src/middleware/hitl/recovery.ts
      - src/middleware/hitl/wrap.ts
      - src/middleware/hitl/bypass.ts
      - src/middleware/hitl/caller-identity.ts
      - src/middleware/hitl/store/sqlite-store.ts
      - src/middleware/hitl/store/types.ts
      - src/middleware/hitl/store/schema.sql
      - src/middleware/hitl/channels/notifier.ts
      - src/middleware/hitl/channels/factory.ts
      - src/middleware/hitl/channels/stdio.ts
      - src/middleware/hitl/channels/webhook.ts
      - src/middleware/hitl/channels/hmac.ts
      - src/middleware/hitl/channels/http-poll.ts
      - src/middleware/hitl/audit-chain/chain.ts
      - src/middleware/hitl/audit-chain/types.ts
      - src/middleware/hitl/audit-chain/schema.sql
      - src/middleware/hitl/audit-chain/retention.ts
      # New tools
      - src/tools/paybot-pay-status.ts
      - src/tools/paybot-hitl-approve.ts
      # Sidecar (separate process)
      - src/sidecar/index.ts
      - src/sidecar/server.ts
      - src/sidecar/routes.ts
      - src/sidecar/lifecycle.ts
      # Build-flag injection
      - build/build-flags.ts
      # Wiring (minimal edits; do not refactor)
      - src/server.ts            # wrap paybot_pay registration + register paybot_pay_status + paybot_hitl_approve
      - src/index.ts             # boot hook for recovery scan + sidecar lifecycle
      - package.json             # add deps (jose, better-sqlite3, uuid, @noble/ed25519); add sidecar bin entry
      - package-lock.json        # generated
      - vitest.config.ts         # scoped coverage threshold
      - .gitignore               # exclude .state/
      # Test files (25 across 6 tiers — spec §11)
      - tests/unit/hitl/envelope.test.ts
      - tests/unit/hitl/state-machine.test.ts
      - tests/unit/hitl/sanitization.test.ts
      - tests/unit/hitl/notifier-stdio.test.ts
      - tests/unit/hitl/notifier-webhook.test.ts
      - tests/unit/hitl/notifier-http-poll.test.ts
      - tests/unit/hitl/wrap.test.ts
      - tests/integration/hitl/end-to-end-stdio.test.ts
      - tests/integration/hitl/end-to-end-webhook.test.ts
      - tests/integration/hitl/end-to-end-http-poll.test.ts
      - tests/integration/hitl/sidecar-lifecycle.test.ts
      - tests/integration/hitl/stdio-only-no-http.test.ts
      - tests/integration/hitl/core-header-verification.test.ts
      - tests/integration/hitl/audit-chain.test.ts
      - tests/integration/hitl/store-restart.test.ts
      - tests/security/hitl/replay-defense.test.ts
      - tests/security/hitl/bypass-refused-in-prod.test.ts
      - tests/security/hitl/webhook-hmac.test.ts
      - tests/security/hitl/dynamic-linking-tamper.test.ts
      - tests/security/hitl/llm-cannot-bypass.test.ts
      - tests/regression/hitl/bp16-baseline.test.ts
      - tests/regression/hitl/ungated-tools-unchanged.test.ts
      - tests/chaos/hitl/notifier-failure.test.ts
      - tests/chaos/hitl/concurrent-pendings.test.ts
      - tests/chaos/hitl/restart-resume.test.ts
      - tests/audit/hitl/chain-integrity.test.ts
      - tests/audit/hitl/verifier-kit-smoke.test.ts
      # Bank-verifier-kit (FR-15)
      - docs/pitch/bank-verifier-kit/verify-paybot-hitl.js
      - docs/pitch/bank-verifier-kit/package.json
      - docs/pitch/bank-verifier-kit/pubkeys/paybot-mcp-chain.pub
      - docs/pitch/bank-verifier-kit/pubkeys/paybot-core-chain.pub
      - docs/pitch/bank-verifier-kit/samples/approval-chain.json
      - docs/pitch/bank-verifier-kit/samples/rejection-chain.json
      - docs/pitch/bank-verifier-kit/RUNBOOK.md
      # Retention policy
      - docs/RETENTION-POLICY.md
      # SVG-1 anchors
      - docs/stories/BP-3.1/semantic-intent.md     # created at @dev start
      - docs/stories/BP-3.1/semantic-mapping.md    # created at @dev finish

    files_must_not_touch:
      # Open-core boundary — paybot-mcp must NEVER import paybot-core (CON-5)
      - ../paybot/src/**
      - ../paybot/migrations/**
      - ../paybot/tests/**
      # Existing untouched tool registrations (ungated tools — must remain ungated)
      # Note: src/tools/paybot-balance.ts, paybot-history.ts, paybot-register.ts
      # exist (if at all) and remain unwrapped. wrap.ts applies ONLY at registration
      # for GATED_TOOLS = ['paybot_pay', 'paybot_pay_eur']. No edits to ungated handlers.
      # Other repos — do not touch
      - ../paybot-sdk/**     # cross-repo dependency: SDK opts.headers pass-through is owned by @dev on paybot-sdk
      # Operator-private content
      - .env
      - .env.*
      - .claude/agent-memory/**     # session memory is operator-private
      # CON-3 invariant — no global HTTP listener on the MCP server core
      # (sidecar is OK because it is a separate process gated by env channel)
      # The wrap.ts file MUST NOT bind any HTTP port; only src/sidecar/** may.

    cross_repo_export_only:
      # The ONLY cross-repo export from paybot-mcp is the VERITAS public key
      # for the paybot-mcp-chain, published by @devops to paybot core's
      # key registry at: paybot/docs/architecture/keys/paybot-mcp-chain.pub
      # This is a key-registry export, not a code import. CON-1 satisfied.
      - paybot/docs/architecture/keys/paybot-mcp-chain.pub    # @devops handles

  acceptance_tests:
    # Maps 1:1 to story AC numbered 1-13. Each AC has at least one corresponding
    # test file (see Tasks section + spec §11). Verification = test file passes
    # the assertions listed in implementation.yaml acceptance_test fields.
    - id: AC1
      fr: [FR-1, FR-14]
      description: "wrap-at-registration + zero bypass field in tool schema"
      verification: "tests/security/hitl/llm-cannot-bypass.test.ts + tests/integration/hitl/end-to-end-stdio.test.ts (schema introspection)"
    - id: AC2
      fr: [FR-2, FR-6]
      description: "six-state machine + hybrid durable + T_a/T_b/T_c clock semantics"
      verification: "tests/unit/hitl/state-machine.test.ts (property-based exhaustive transitions)"
    - id: AC3
      fr: [FR-3]
      description: "three channels live in v0.3 with single ApprovalNotifier interface"
      verification: "tests/integration/hitl/end-to-end-{stdio,webhook,http-poll}.test.ts × 3"
    - id: AC4
      fr: [FR-4, FR-11, CON-9, NFR-3]
      description: "JWS(EdDSA) envelope + canonical-JSON + dynamic linking + timestamp normalization + allowlist sanitization"
      verification: "tests/unit/hitl/envelope.test.ts + sanitization.test.ts + tests/security/hitl/dynamic-linking-tamper.test.ts"
    - id: AC5
      fr: [FR-5, NFR-9]
      description: "core refuses settlement without/invalid/replayed/expired header"
      verification: "tests/integration/hitl/core-header-verification.test.ts (cross-repo dep on paybot-core ADR-BP-001 amendment)"
    - id: AC6
      fr: [FR-7, NFR-4, NFR-10, CON-2]
      description: "kill-9 restart-safety + concurrent pendings zero SQLITE_BUSY"
      verification: "tests/chaos/hitl/restart-resume.test.ts + concurrent-pendings.test.ts"
    - id: AC7
      fr: [FR-10, NFR-6, CON-2, CON-5]
      description: "MCP audit chain + cross-anchor at executed (graceful degrade)"
      verification: "tests/integration/hitl/audit-chain.test.ts + tests/audit/hitl/chain-integrity.test.ts"
    - id: AC8
      fr: [NFR-12, CON-3-amended]
      description: "HTTP sidecar — stdio default binds zero ports; webhook/http-poll spawn sidecar"
      verification: "tests/integration/hitl/sidecar-lifecycle.test.ts + stdio-only-no-http.test.ts"
    - id: AC9
      fr: [FR-9, NFR-5]
      description: "bypass build-flagged + prod-refused + audit-visible BypassEnvelope"
      verification: "tests/security/hitl/bypass-refused-in-prod.test.ts"
    - id: AC10
      fr: [FR-13, FR-14]
      description: "paybot_pay_status (no AuthZ) + paybot_hitl_approve (allowlist + verifiable caller)"
      verification: "tests/security/hitl/llm-cannot-bypass.test.ts (4 sub-cases) + unit tests on tool handlers"
    - id: AC11
      fr: [FR-15]
      description: "bank-verifier-kit ships with zero paybot deps; CI smoke verifies samples"
      verification: "tests/audit/hitl/verifier-kit-smoke.test.ts"
    - id: AC12
      fr: [AIDR-009]
      description: "≥80% line coverage on src/middleware/hitl/** enforced via scoped vitest threshold"
      verification: "npm run test:coverage; vitest.config.ts coverage.thresholds.lines = 80 scoped"
    - id: AC13
      fr: [NFR-11]
      description: "retention policy ≥5 years + DORA exit strategy in v0.3 release notes"
      verification: "docs/RETENTION-POLICY.md present + cross-linked from release notes"

  cross_repo_dependencies:
    # Mirrors implementation.yaml lines 583-608. None of these block @dev start
    # of P1-P5, but P6/P7/P11 cannot fully validate without them. Plan ships
    # with graceful-degrade for SQ-3 (audit_event_id).
    - "paybot-core: /v1/audit/verify accepts X-Paybot-Approval-Envelope (owner: @dev on paybot-core)"
    - "paybot-core: client.pay() response carries audit_event_id (owner: @dev on paybot-core; graceful-degrade PENDING)"
    - "paybot-core: 30-day request_id nonce store, NFR-9 replay defense (owner: @dev on paybot-core; ADR-BP-002 amendment)"
    - "paybot-sdk: client.pay() opts.headers passes X-Paybot-Approval-Envelope verbatim (owner: @dev on paybot-sdk)"
    - "paybot key registry: paybot/docs/architecture/keys/paybot-mcp-chain.pub published (owner: @devops)"

  open_spec_questions:
    # Mirrors implementation.yaml lines 704-729. Non-blocking for @dev start;
    # @pm to triage before mid-implementation.
    - SQ-1: "Build-time ALLOW_BYPASS injection mechanism — esbuild/tsc define vs separate prod build script"
    - SQ-2: "MCP host caller-identity contract (FR-14) — published paybot contract or Claude-Desktop-specific adapter?"
    - SQ-3: "Core-side audit_event_id in client.pay() response — paybot-core sprint deliverable or BP-3.3 separately?"
    - SQ-4: "Vitest coverage threshold scoped to src/middleware/hitl/** only — acceptable or require global lift?"

  ready_to_implement: true
  ready_to_implement_rationale: |
    Spec v0.2 APPROVED at avg ~4.5/5. Plan v1 has every FR/NFR/CON → at least
    one task. Risks identified with mitigations. Cross-repo dependencies
    enumerated with owners + graceful-degrade strategy. Test paths concrete
    (matches spec §11 1:1). Coverage gate explicit. Open spec questions are
    non-blocking for P1-P5; SQ-2 + SQ-3 must resolve before P7.2 + P8.2 complete.
    Operator already accepted the 22h scope (epic YAML line 186 confirms).

  permission_mode_for_implementation: STAGING
  push_authority: "@devops only (per .claude/rules/agent-authority.md)"
  aiox_master_first: required
```

---

## Dev Agent Record

*To be filled by @dev (Dex) at story pickup and close.*

**Agent:** Dex (Builder)
**Started:** _TBD_
**Completed:** _TBD_

### File List
*To be populated by @dev during implementation.*

### Dev Notes / Deviations
*To be populated by @dev. Any deviation from `implementation.yaml` must be documented here.*

### Quality Gates
*To be populated by @dev self-check + @qa 12-check matrix.*

- Lint: _TBD_
- TypeCheck: _TBD_
- Tests: _TBD_ / 25 files
- Coverage on `src/middleware/hitl/**`: _TBD_ % (≥80% required)
- @qa Pass 1: _TBD_
- @qa Pass 2: _TBD_

### Status
Draft

---

## Change Log

| Date       | Version | Description                                                                                                                                                                                       | Author              |
|------------|---------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------|
| 2026-05-21 | 0.1.0   | Initial draft from EPIC-BANK-3 BP-3.1 (HITL middleware). Authored from spec v0.2 (APPROVED 4.5/5) + implementation.yaml v1 (ready_for_dev=true) + ADR-BP-001 (Accepted 2026-05-20). 13 ACs, 11 phases ≈ 30 atomic tasks, task_packet fully populated, SVG-1 placeholder + AIDR-020 packet wired. Story file co-located with spec under paybot-mcp/docs/stories/ via .gitignore carve-out. | River (Scrum Master) |
