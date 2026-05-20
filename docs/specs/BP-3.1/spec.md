# BP-3.1 Spec — HITL Approval Middleware for paybot-mcp Money-Moving Tools

**Story:** BP-3.1 (Epic EPIC-BANK-3, paybot-mcp v0.3) · Class: COMPLEX (score 17) · Author: @pm (Morgan) · Version: v0.2 · Date: 2026-05-20
**Anchors:** requirements.json · research.json · architecture/bank-pitch-sprint-architecture.md §2 · ADR-BP-001 (to amend) · ADR-BP-002 (VERITAS reuse)

## Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| v0.1 | 2026-05-20 | @pm | Initial spec draft (Phase 4) — submitted to @qa critique |
| v0.2 | 2026-05-20 | @pm | Revised per @qa critique: CON-3 carve-out for HTTP sidecar (§5.4 + §7), concrete test paths + ≥80% coverage on `src/middleware/hitl/**` + Vitest + fast-check (§11), bank-verifier-kit as FR-15 + R4 remedy (§3 + §12), FR-14 LLM-callability negative-AuthZ (§3 + §6.2 + §11), OQ-D1 conditional resolution (§5.3 + §9), N2/R5 reconciliation (§5.2 + §12), FR-10 amendment framing (§3), operator-decision pointer (§13), cross-chain ASCII diagram (§5.5) |

---

## 1. Problem Statement

`paybot-mcp` today registers money-moving tools (`paybot_pay`, upcoming `paybot_pay_eur`) that synchronously invoke `client.pay()` against paybot-core — no operator in the loop. An LLM hallucination, prompt injection, or compromised host moves money instantly. Nordic bank reviewers at the 2026-06-16 pitch will refuse this posture: PSD2 dynamic linking, EU four-eyes practice, and DORA Art. 28 all assume human authorization between agent intent and settlement. BP-3.1 builds that control: declarative middleware wrapping every money-moving tool, surfacing a signed approval envelope to a human across three channels, refusing settlement without a VERITAS-signed `ApprovalEnvelope` (or auditable bypass).

## 2. Goals & Non-Goals

**Goals**
- **G1** Structural impossibility for LLM to settle without a signed `ApprovalEnvelope` or `BypassEnvelope`. Enforced MCP-side (gate) + core-side (header verify).
- **G2** Three channels in v0.3: stdio (Claude Desktop demo), webhook (operator console / Slack HMAC), http-poll (air-gapped).
- **G3** Hybrid timeout: sync wait + `HITL_DURABLE_PENDING` for long-tail, pollable via `paybot_pay_status`.
- **G4** PSD2/PSD3 dynamic-linking inside signed payload; DORA evidence via hash-chains; JWS(EdDSA) wire format for IETF familiarity.
- **G5** Forward-compat `approvers[]` for v0.4 2-of-2 four-eyes (no wire break if OQ-D1 picks Option B).

**Non-Goals (v0.3)**
- **N1** No N-of-M quorum impl (field reserved, v0.4).
- **N2** No paybot-built operator-console UI (channels are contracts; Slack/web console = downstream BP-4.x).
- **N3** No key rotation policy, no KYC, no fraud-scoring.
- **N4** No approval revocation in T_b window (irrevocable once approved).
- **N5** No cross-MCP-server approval propagation.

## 3. Functional Requirements

All FRs derive from `requirements.json`; rationale and source trace per Article IV (No Invention).

| ID | Requirement | Source |
|---|---|---|
| **FR-1** | Middleware wraps every money-moving tool via declarative `wrapWithHitl(handler, policy)` — initial scope `paybot_pay`, `paybot_pay_eur`. Tool authors cannot opt out. | epic AC #1 + architect §2 |
| **FR-2** | 6-state machine: `pending → approved → executed` (terminal) ∥ `pending → rejected` (terminal) ∥ `pending → timeout` (terminal) ∥ `approved → failed` (terminal) ∥ `pending → durable_pending → approved → executed` (hybrid path, NEW). All transitions persisted before action. | architect §2 + NEW state `durable_pending` (operator hybrid decision 2026-05-20) |
| **FR-3** | Three notifier channels — `stdio`, `webhook`, `http-poll` — selected by `PAYBOT_MCP_APPROVAL_CHANNEL`. Pluggable `ApprovalNotifier` interface. All three ship in v0.3 (operator decision 2026-05-20). | architect §2 + operator decision |
| **FR-4** | VERITAS Ed25519 `ApprovalEnvelope` containing only sanitized params, wrapped as **JWS(EdDSA) per RFC 7515** for bank-readable wire (NEW, research-driven). Reuses existing VERITAS signer. | requirements.json FR-4 + research key-finding §JWS + memory `project_veritas_three_chains_live` |
| **FR-5** | On approval, MCP forwards JWS envelope via `X-Paybot-Approval-Envelope` HTTP header. Core verifies and refuses settlement if absent/invalid. | architect §2 |
| **FR-6** | Tiered timeout per persona (see §5.2 reconciliation): `T_a` per channel — stdio 30s (operator-at-terminal), webhook 5min (operator-at-desk), http-poll 10min (operator-at-desk, async-pull). `T_b` 5min absolute sync ceiling for stdio. `T_c` durable tier (default 72h, configurable per amount-threshold) for amounts ≥ `PAYBOT_MCP_HITL_DURABLE_THRESHOLD` (default 100 EUR/USD) — this is the only "human-on-email" path. | epic AC #2 + architect §2 + operator hybrid decision + @qa SHOULD-FIX persona reconciliation |
| **FR-7** | Persistent state at `paybot-mcp/.state/approvals.sqlite` (gitignored, restart-safe). WAL mode. Idempotent on restart by `request_id` (UUIDv7). Pluggable storage interface (NEW — could swap to Redis/Postgres for hosted MCP, per operator default). | requirements.json FR-7 + operator default §state persistence |
| **FR-8** | Typed MCP errors: `APPROVAL_REQUIRED`, `APPROVAL_REJECTED`, `APPROVAL_TIMEOUT`, `HITL_DURABLE_PENDING` (carries `request_id`), `HITL_REPLAY`, `HITL_INVALID_ENVELOPE`, `HITL_BYPASSED`, `VERITAS_SIGNER_UNAVAILABLE`. Each maps to a stable MCP error code. | requirements.json FR-8 + OQ-8 fail-closed resolution |
| **FR-9** | Bypass mode: `HITL_BYPASS=true` AND `HITL_BYPASS_OPERATOR_ID` AND build-flag `PAYBOT_MCP_ALLOW_BYPASS=true` (compile-time). Production bundle ships with `ALLOW_BYPASS=false`. Bypass writes a signed `BypassEnvelope` to the audit chain before execution. Server refuses to start if `HITL_BYPASS=true && NODE_ENV=production && ALLOW_BYPASS!=true`. | epic AC #3 + NFR-5 + memory `feedback_credentials_masking` |
| **FR-10** | **Amends requirements.json FR-10.** Every state transition writes a VERITAS-signed chain entry. Linkage: MCP maintains its own chain anchored to paybot-core's chain at `executed` (two chains, cross-anchor at settlement). Original FR-10 specified single chain via core HTTP API; that wording is incompatible with CON-2 (no shared DB) + CON-5 (no cross-import). Requirements.json to be updated next gather pass, or divergence acknowledged in Phase 6 plan. | Amends requirements.json FR-10 (CON-2/CON-5 trump original wording) |
| **FR-11** | Parameter sanitization by allowlist — envelope payload contains only `{recipient, amount, network, asset, resource}`. Any other field is stripped before signing. Future params default to excluded. | requirements.json FR-11 |
| **FR-12** | `ApprovalDriver` programmatic interface for tests/E2E, gated by `NODE_ENV=test \|\| PAYBOT_MCP_APPROVAL_DRIVER=test`. | requirements.json FR-12 + BP-5.2 |
| **FR-13** | **New tool** `paybot_pay_status(request_id)` returns the current state of any pending/durable approval — the LLM polls this when it receives `HITL_DURABLE_PENDING`. | NEW — operator hybrid decision (durable path needs a poll surface) |
| **FR-14** | **New tool** `paybot_hitl_approve(request_id, decision, reason?)`. **Hardened AuthZ (must-fix per @qa):** MUST verify caller against `PAYBOT_MCP_TOOL_APPROVAL_ALLOWED_CALLERS` (default empty → tool disabled). MCP host MUST pass verifiable caller identity (operator session token, not transport identity). Without it → `HITL_BYPASS_DENIED`. Also: LLM calls of `paybot_pay({..., bypass_hitl: true})` MUST be rejected with `HITL_BYPASS_DENIED`; tool schemas (§6.2) MUST NOT expose any bypass field. | NEW — stdio programmatic surface + @qa AuthZ hardening |
| **FR-15** | **(NEW, must-fix R4)** Ship **bank-verifier-kit** at `docs/pitch/bank-verifier-kit/`: (a) standalone Node script `verify-paybot-hitl.js` with zero paybot deps (only `crypto` + `jose`), (b) exported Ed25519 pubkeys for both chains, (c) two sample chains (1 approval, 1 rejection), (d) 1-page runbook. Turns two-chain claim into falsifiable artifact for bank IT. | NEW — must-fix R4 remedy |

## 4. Non-Functional Requirements

| ID | Category | Requirement | Target |
|---|---|---|---|
| **NFR-1** | Performance | Middleware overhead (excluding wait) | p95 < 50ms, p99 < 100ms (local SQLite) |
| **NFR-2** | Performance | Sync tool call bounded by `T_a` or returns `HITL_DURABLE_PENDING` in ≤200ms | 100% of calls bounded by `max(T_a, 200ms)`; durable returns ≤200ms |
| **NFR-3** | Security | Ed25519 signatures via VERITAS; timestamp normalized (round-trip) per `feedback_veritas_timestamp_normalization` | 0 mismatches in 1000-envelope fuzz |
| **NFR-4** | Reliability | Restart-safety: in-flight `pending` resume within `T_b`; aged → `timeout` | `kill -9` test passes; no phantom-pending |
| **NFR-5** | Security | Bypass build-flag gated; production bundle refuses bypass | Build-time assertion enforced |
| **NFR-6** | Compliance | 100% of tool invocations write at least one chain entry | Property test: 1000 invocations → 1000 entries |
| **NFR-7** | Usability | Human-readable envelope summary in webhook payload (`human_readable_summary` field) | Renata-validated pre-pilot |
| **NFR-8** | Reliability | Notifier failures do not block approval; retry exponential backoff, max 5; chaos test 50% failure | 100% reach terminal state |
| **NFR-9** | Security | Replay defense: `request_id` (UUIDv7) + 5min envelope `expiry` + core-side 30-day nonce store; **+ HMAC-SHA256 webhook callback auth (NEW, technical default)** with `PAYBOT_MCP_WEBHOOK_SECRET` (32-byte) | Replay → 409; expired → 410; bad HMAC → 401 |
| **NFR-10** | Performance | SQLite WAL handles ≥100 concurrent pending; cleanup purges terminals >30d | Zero SQLITE_BUSY in 100-conc stress |
| **NFR-11** | Compliance | **(NEW)** Audit chain retention ≥ 5 years (AMLD6 minimum) — documented in DORA exit plan | Retention policy doc included with v0.3 release notes |
| **NFR-12** | Reliability | **(NEW, must-fix per @qa)** HTTP sidecar (`paybot-mcp-approval-sidecar`): starts only when channel ∈ {webhook, http-poll}; binds `PAYBOT_MCP_HTTP_SIDECAR_PORT` (default 7843, localhost-only); `GET /health` returns `{status,channel}`; SIGTERM-propagated shutdown with 5s grace; logs to stderr only (preserves stdio cleanliness). Port bind failure → `SIDECAR_BIND_FAILED` and MCP refuses to start. | `tests/integration/hitl/sidecar-lifecycle.test.ts` |

## 5. Design

### 5.1 Architecture

```
                  ┌──────────────────────────────────────────────────┐
                  │ paybot-mcp (Node, npm pkg, Apache 2.0)           │
LLM caller ──MCP─►│  server.tool('paybot_pay', schema, wrapped)      │
                  │         │                                         │
                  │         ▼                                         │
                  │  wrapWithHitl(handler, policy)                    │
                  │   ├─► sanitizeParams (allowlist) [FR-11]          │
                  │   ├─► persist(pending) → approvals.sqlite [FR-7]  │
                  │   ├─► ApprovalGate.requestApproval(envelope)      │
                  │   │     │                                         │
                  │   │     ├─► ApprovalNotifier (pluggable) [FR-3]   │
                  │   │     │     ├─ stdio   (form-mode elicitation)  │
                  │   │     │     ├─ webhook (HMAC-SHA256 + URL-mode) │
                  │   │     │     └─ http-poll (GET /approvals/pending)│
                  │   │     ▼                                         │
                  │   │  hybrid wait: T_a → durable_pending|approved  │
                  │   ├─► VERITAS.sign(envelope) → JWS(EdDSA) [FR-4]  │
                  │   ├─► AuditChain.append(transition) [FR-10]       │
                  │   ▼                                               │
                  │  paybot-sdk: client.pay({...,                     │
                  │    headers: {'X-Paybot-Approval-Envelope': jws})  │
                  └──────────────────────────────────────────────────┘
                            │ (HTTPS, JWS in header)
                            ▼
                  ┌──────────────────────────────────────────────────┐
                  │ paybot (core, BSL 1.1)                            │
                  │  verifyEnvelope(jws, VERITAS_KEYS) [FR-5]         │
                  │  enforceNonceStore(request_id) [NFR-9]            │
                  │  hashChain.append(settlement linked to envelope)  │
                  └──────────────────────────────────────────────────┘
```

### 5.2 State Machine (hybrid + durable)

```
                ┌─ approve ──► approved ─── SDK call ──► executed (terminal)
                │                              │
   pending ────┤                               └─ failure ─► failed (terminal)
   (T_a clock) │
                ├─ reject  ──► rejected (terminal)
                │
                ├─ timeout(T_a) ─┬──[amount < T_c thresh]─► timeout (terminal)
                │                │
                │                └──[amount ≥ T_c thresh]─► durable_pending
                │                                                  │
                │                                                  ├─ approve ─► approved → executed
                │                                                  ├─ reject  ─► rejected
                │                                                  └─ timeout(T_c, default 72h) ─► timeout
                │
                └─ timeout(T_b 5min hard sync ceiling, only for non-durable) ─► timeout
```

**Timeouts per persona (reconciles N2 vs R5 per @qa SHOULD-FIX):**
- **T_a stdio = 30s** — operator-at-terminal (Claude Desktop, Renata at screen). N2's "60s default for demo magic" lives here.
- **T_a webhook = 5min · T_a http-poll = 10min** — operator-at-desk pickup (console / Slack / dashboard). Still sync from LLM perspective.
- **T_b = 5min** — hard sync ceiling for stdio only. For webhook/http-poll, T_a IS the ceiling (always durable-fall-through after T_a).
- **T_c = 72h default, configurable per amount** — operator-away-from-terminal ("human-on-email" path R5 raised). LLM receives `HITL_DURABLE_PENDING` and polls `paybot_pay_status`.
- **Durable threshold:** 100 EUR/USD default. R5 conflated channel-T_a with human-on-email; the latter is exclusively T_c.

### 5.3 Envelope Format (JWS-wrapped Ed25519)

Wire shape: **`<protected_header_b64url>.<payload_b64url>.<signature_b64url>`** per RFC 7515.

**Protected header** (JOSE):
```json
{ "alg": "EdDSA", "typ": "paybot-approval+jws", "kid": "veritas-paybot-mcp-2026-05",
  "iat": 1716200000, "exp": 1716200300 }
```

**Payload** (canonical JSON, then base64url):
```json
{
  "schema_version": "1.0",
  "request_id": "01913ba2-7e0e-7c3e-b8a4-2a6c1c2c3a4b",
  "tool_name": "paybot_pay_eur",
  "sanitized_params": {
    "recipient": "0xabc...def",
    "amount": "47.50",
    "asset": "eip155:8453/erc20:0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42",
    "network": "eip155:8453",
    "resource": "https://api.example.com/inference"
  },
  "channel": "webhook",
  "requested_at": "2026-05-20T14:00:00.000Z",
  "decided_at":   "2026-05-20T14:00:42.123Z",
  "decision": "approved",
  "operator_id": "renata@friendlyai.fi",
  "expiry":     "2026-05-20T14:05:00.000Z",
  "human_readable_summary": "Approve payment of 47.50 EUR to 0xabc...def via Base mainnet for https://api.example.com/inference?",
  "approvers": [
    { "operator_id": "renata@friendlyai.fi", "signed_at": "2026-05-20T14:00:42.123Z",
      "key_id": "veritas-paybot-mcp-2026-05", "signature": "<b64url ed25519>" }
  ]
}
```

`approvers: ApprovalSignature[]` is single-entry in v0.3; array shape is v0.4's 2-of-2 forward-compat scaffold.

**Forward-compat is CONDITIONAL on OQ-D1 (truth-in-spec per @qa SHOULD-FIX).** v0.4 picks:
- **Option A — JWS-JSON-Serialization** with `signatures[]`: wire shape changes (compact → JSON), schema_version bump 1.0 → 2.0 signals it cleanly, v0.3 verifiers CANNOT parse v0.4. IS a wire break.
- **Option B — compact JWS + detached `approvers[1..N]`** (each a detached Ed25519 sig over canonical payload bytes): wire unchanged, v0.3 verifiers continue parsing. NO wire break.

**ADR-BP-001-v2 commits to one option by 2026-07-01.** "No wire break" claim is honest-conditional on Option B, not guaranteed.

**Dynamic linking (PSD2/PSD3 RTS Art. 5 — research §regulatory):** recipient + amount + asset + network are inside the signed payload. Any tamper invalidates the signature. NON-NEGOTIABLE.

### 5.4 Channels

**CON-3 carve-out (must-fix per @qa).** Original CON-3 forbids an HTTP listener on the MCP side; webhook + http-poll need one. Amendment:

> **CON-3 (amended).** MCP server core remains stdio-only and binds zero ports when `PAYBOT_MCP_APPROVAL_CHANNEL=stdio` (default). The `paybot-mcp-approval-sidecar` (separate process) is permitted ONLY when channel ∈ {webhook, http-poll}, binds `PAYBOT_MCP_HTTP_SIDECAR_PORT` (default 7843, localhost-only), logs to stderr only. Lifecycle in NFR-12.

Falsifiable: §11 boot test verifies stdio-only mode binds zero ports.

Interface contract:
```typescript
interface ApprovalNotifier {
  channel: 'stdio' | 'webhook' | 'http-poll';
  notify(envelope: PendingEnvelope): Promise<void>;       // best-effort, retried per NFR-8
  poll?(requestId: string): Promise<ApprovalState | null>; // http-poll only
  receive?(payload: SignedCallback): Promise<void>;        // webhook callback ingress
}
```

- **stdio** — MCP elicitation **form-mode** (per research §mcp-specific). Renders pending envelope as a structured prompt in Claude Desktop; operator types approve/reject. Optional alternate path via `paybot_hitl_approve` tool call (FR-14).
- **webhook** — MCP elicitation **URL-mode** (mandatory for payment flows per spec) opens operator console URL; console POSTs signed decision back to `POST /approvals/callback` on the MCP server's HTTP sidecar. Callback auth: **HMAC-SHA256 of canonical body, header `X-Paybot-HMAC`, secret `PAYBOT_MCP_WEBHOOK_SECRET`** (32-byte, rotated by @devops; OQ-7 resolution). Replay-protected via `request_id` + envelope `expiry` (5min).
- **http-poll** — operator console (or air-gapped operator with a script) polls `GET /approvals/pending`, signs decision locally with VERITAS key, returns via `POST /approvals/callback` (same HMAC contract).

### 5.5 Audit Chain Integration

**Decision (NEW, this spec):** paybot-mcp maintains its **own VERITAS hash-chain** (`paybot-mcp/.state/audit-chain.sqlite`) for every state transition: `pending → approved → executed`, etc. At the `executed` transition, the MCP chain entry references the core's settlement audit-event-ID returned by `client.pay()` — establishing a cross-chain anchor. This honors CON-2 (no shared DB) and CON-5 (no cross-import of paybot-core) while keeping the linkage queryable by BP-3.3's `paybot_audit_excerpt`. Both chains' entries for a given `request_id` form one complete provenance record.

**Cross-chain diagram (NIT per @qa):**

```
   paybot-mcp chain (key: paybot-mcp-chain)    paybot-core chain (key: paybot-core-chain)
   ─────────────────────────────────────       ─────────────────────────────────────────
   [N-3] pending   {req_id: R1}
   [N-2] approved  {req_id: R1}
   [N-1] executed  {req_id: R1,         ───►   [M-1] settle_started {req_id: R1, ...}
                    core_audit_ref:M-1}        [M  ] settle_ok      {req_id: R1, tx_hash}

   Both chains: h_N = H(h_{N-1} ∥ entry_N). Cross-link: MCP[N-1].core_audit_ref → core[M-1].id.
   FR-15 verifier-kit checks: (a) MCP chain integrity, (b) core chain integrity,
                              (c) cross-link match, (d) shared req_id in both.
```

BP-3.3 cross-chain query: given tx X, returns (core slice) ∥ (MCP slice by `request_id`); bank verifies independently with each chain's published pubkey.

### 5.6 Bypass Mode

`HITL_BYPASS=true` requires ALL of: (1) `HITL_BYPASS_OPERATOR_ID` set (else server won't start); (2) build-time `PAYBOT_MCP_ALLOW_BYPASS=true` (prod bundles ship `false`); (3) middleware writes signed `BypassEnvelope` (same JWS shape, `decision:"bypassed"`, reason if provided) to audit chain before execution — bank excerpts surface `bypassed=true` prominently. **Prod hard refusal:** `NODE_ENV==='production' && HITL_BYPASS==='true' && ALLOW_BYPASS!=='true'` → boot throws (NFR-5).

### 5.7 Error Model

| Code | When | MCP error type | Payload |
|---|---|---|---|
| `APPROVAL_REQUIRED` | Reserved namespace, non-blocking mode v2 | tool error | `{request_id}` |
| `APPROVAL_REJECTED` | Operator rejected | tool error | `{request_id, envelope, reason?}` |
| `APPROVAL_TIMEOUT` | `T_a` or `T_b` exceeded (non-durable) | tool error | `{request_id, elapsed_ms}` |
| `HITL_DURABLE_PENDING` | Sync window ended, amount ≥ `T_c` threshold | tool error (informational) | `{request_id, retry_after_ms, poll_tool: "paybot_pay_status"}` |
| `HITL_REPLAY` | `request_id` reused or `expiry` passed (core-side rejection mirrored) | tool error | `{request_id}` |
| `HITL_INVALID_ENVELOPE` | Signature failure, schema mismatch | tool error | `{request_id, reason}` |
| `HITL_BYPASSED` | Bypass used — informational only, NOT an error (audit-visible) | success result with flag | `{bypassed: true, bypass_operator_id, request_id}` |
| `HITL_BYPASS_DENIED` | **(NEW per @qa FR-14)** LLM attempted bypass via tool args, OR `paybot_hitl_approve` called without verifiable caller identity in allowlist | tool error | `{request_id?, reason}` |
| `VERITAS_SIGNER_UNAVAILABLE` | Key missing / rotation mid-flight — **fail-closed** (OQ-8) | tool error | `{request_id}` |
| `SIDECAR_BIND_FAILED` | **(NEW per @qa NFR-12)** HTTP sidecar could not bind `PAYBOT_MCP_HTTP_SIDECAR_PORT` at boot | boot-time fatal | `{port, channel}` |

## 6. Tool Surface Changes

### 6.1 Wrapped (HITL-gated)
- `paybot_pay` — existing, wrapped via `wrapWithHitl`.
- `paybot_pay_eur` — new in BP-3.2, wrapped at registration time.

### 6.2 New tools
- `paybot_pay_status(request_id)` — read-only `{state, decided_at?, envelope?, executed_tx_hash?}`. LLM polls after `HITL_DURABLE_PENDING`. No HITL gate.
- `paybot_hitl_approve(request_id, decision, reason?)` — stdio programmatic surface. Gated by ALL of: `PAYBOT_MCP_TOOL_APPROVAL_ALLOWED_CALLERS` allowlist (default empty → disabled), `PAYBOT_MCP_ALLOW_TOOL_APPROVAL=true`, verifiable host-passed caller identity (operator session token). Missing any → `HITL_BYPASS_DENIED`.

**Tool schema invariants (must-fix per @qa FR-14):** `paybot_pay`, `paybot_pay_eur`, and future money-moving tools MUST NOT expose ANY bypass argument (`bypass_hitl`, `skip_approval`, `override_hitl`, etc.). Bypass is selectable ONLY via the build-flagged env + `BypassEnvelope` flow (§5.6). LLM calls including such keys → `HITL_BYPASS_DENIED`. Test: `tests/security/hitl/llm-cannot-bypass.test.ts`.

### 6.3 Unchanged
- `paybot_balance`, `paybot_history`, `paybot_register` (tier ≤ 1) — read-only or low-risk; remain ungated.

## 7. Constraints

All seven from `requirements.json` (CON-1 VERITAS reuse · CON-2 no new DB beyond SQLite · **CON-3 amended — see §5.4** · CON-4 open-core licensing discipline · CON-5 no cross-import of paybot-core · CON-6 schema alignment with BP-3.3 · CON-7 lands before BP-3.2). Adds:

- **CON-3 (amended, must-fix per @qa)** — MCP server core remains stdio-only (original invariant holds when `PAYBOT_MCP_APPROVAL_CHANNEL=stdio`). HTTP sidecar permitted ONLY for webhook + http-poll channels, runs as a separate process gated by `PAYBOT_MCP_APPROVAL_CHANNEL` env. Full amendment text in §5.4; lifecycle in NFR-12. The amendment is **opt-in** — air-gapped pilots can keep the pure-stdio posture.
- **CON-8 (NEW)** — capability-tokens (ADR-BP-006) do NOT yet exist. ADR-BP-001 explicitly carves out: *"When ADR-BP-006 lands, capability tokens scope WHICH tools an LLM can call; HITL gates WHETHER any call executes. Both checks run; either denial stops execution."* HITL is sole auth gate for v0.3 money-moving tools (OQ-3 resolution).
- **CON-9 (NEW)** — wire format is JWS(EdDSA) per RFC 7515. Bank IT reads this as ACME/OIDC/FIDO-familiar (research key-finding 1).

## 8. Open Questions Closed in This Spec

| OQ | Resolution | Rationale |
|---|---|---|
| **OQ-1** Tiered timeout | T_a per-channel (30s/5min/10min), T_b 5min stdio ceiling, T_c 72h durable ≥100 EUR/USD | Hybrid posture (operator). Research §timeout_design confirms. |
| **OQ-2** Channel choice for pilot | All three ship in v0.3 (operator decision) | Demo (stdio), pilot (webhook), air-gap (http-poll). |
| **OQ-3** ADR-BP-006 cap-token interaction | HITL is sole auth gate for v0.3; ADR-BP-001 carves the v0.4 dual-check contract | Cap-tokens don't exist yet. |
| **OQ-4** Replay defense | request_id + 5min expiry + core-side 30-day nonce store (ADR-BP-002 amendment) | Two-layer defense (research-recommended). |
| **OQ-5** Quorum v0.3? | Out of scope. `approvers[]` reserved; v0.4 ships 2-of-2 | Renata sole approver in pilot; bank sees reserved shape. |
| **OQ-6** Audit chain coupling to BP-3.3 | Decoupled — MCP own chain, BP-3.3 cross-chain query | Honors CON-2/CON-5. |
| **OQ-7** Webhook auth model | HMAC-SHA256 with `PAYBOT_MCP_WEBHOOK_SECRET` (32-byte, @devops-rotated) | Standard pattern; replay-protected. |
| **OQ-8** VERITAS signer failure | Fail-closed. Typed error `VERITAS_SIGNER_UNAVAILABLE` | Bank-pilot principle. Mirrors ADR-BP-008. |

**Operator decisions (2026-05-20) locked in:** hybrid posture · single approver v0.3 / two-key contract v0.4 · all three channels in v0.3.

## 9. Open Questions Deferred (safe for v0.3)

| ID | Question | Why safe to defer |
|---|---|---|
| **OQ-D1** | Multi-sig serialization for v0.4 two-key (compact JWS Option B vs JWS-JSON-Serialization Option A) | **Conditional resolution (per @qa SHOULD-FIX):** v0.3 ships compact JWS single-sig. v0.4 selects Option A (JWS-JSON-Serialization, wire break + schema_version bump) OR Option B (compact JWS + detached approvers[1..N] over payload bytes, no wire break). **Decision recorded in ADR-BP-001-v2 by 2026-07-01.** Spec §5.3 documents both paths transparently — "no wire break" is contingent on Option B. |
| **OQ-D2** | Per-tool rate limits (R2 from risk register) | Token-bucket lives in ADR-BP-006 / BP-006 work — HITL gate already bounds tool throughput by human-decision rate. |
| **OQ-D3** | Approval revocation (between approved and settled within `T_b`) | Window is ≤5min; product complexity not justified for v0.3. Capture as BP-3.1c. |
| **OQ-D4** | TLS-exporter binding (RFC 9266) for envelope-to-channel binding | Defense-in-depth, not primary (research §replay_attack_defenses). air-gapped channel cannot use it. Defer to ADR-BP-002-v2. |
| **OQ-D5** | Approver key rotation policy + max-age | DORA implies a policy exists; ADR-BP-002 covers key registry; rotation operational SOP is @devops work post-v0.3. |
| **OQ-D6** | Operator console UI implementation | Channels are contracts; UI is BP-4.x. Slack interactive buttons are a workable fallback for pilot. |
| **OQ-D7** | MCP elicitation spec changes (draft → ratified) | Spec is draft-status; we conform now and track ratification. Wire-shape is stable enough. |

## 10. Success Criteria

1. **Bank-reviewer demand satisfied:** "Show me the human approval for tx X" → one JWS(EdDSA) `ApprovalEnvelope` verifiable offline with the published VERITAS Ed25519 public key, with dynamic-linked recipient + amount inside the signed payload, hash-chained on both MCP and core sides — across **100%** of bank-pilot payments.
2. **LLM cannot bypass:** Settlement refuses without a valid `X-Paybot-Approval-Envelope` header OR a recorded `BypassEnvelope` (`HITL_BYPASS=true` + build-flag + operator-id). Enforced **both** MCP-side (gate) and core-side (header verification).
3. **All three channels work end-to-end in v0.3 demo:** stdio (Claude Desktop form-mode), webhook (HMAC callback to operator console), http-poll (air-gapped). Each documented with one passing E2E test.
4. **Hybrid timeout behaves correctly:** sync path returns within `T_a`; large-amount returns `HITL_DURABLE_PENDING` ≤200ms with valid `request_id`; `paybot_pay_status` returns terminal state when polled post-decision; sync hard ceiling `T_b` is non-bypassable.
5. **Full audit-chain integrity:** kill-9 mid-approval → restart → in-flight pendings resume; aged ones time-out cleanly; **zero** phantom-pendings; **zero** orphan settlements (every settlement has a chain-linked envelope).
6. **DORA evidence ready:** 5-year retention policy documented; exit strategy (revoke operator key) documented; both shipped with v0.3 release notes (NFR-11).
7. **Bank-verifier-kit ready (FR-15):** `docs/pitch/bank-verifier-kit/` ships with v0.3 containing standalone verify script (zero paybot deps), exported Ed25519 public keys, 2 sample chains, 1-page runbook. CI smoke test (`tests/audit/hitl/verifier-kit-smoke.test.ts`) confirms the kit verifies both samples successfully on every build.

## 11. Test Strategy

**Framework:** **Vitest** (matches paybot-mcp baseline from BP-1.6). Property-based testing via **fast-check**. Mocking via Vitest built-ins (`vi.fn`, `vi.mock`).
**Coverage target:** **≥80% line coverage on `src/middleware/hitl/**`** per AIDR-009 quality-foundation.md. Enforced by `vitest --coverage` with `coverage.thresholds.lines = 80` scoped to that directory. @qa veto if any file in that tree drops below 80%.
**Test root:** `paybot-mcp/tests/` (mirrors `paybot-mcp/src/`).

### 11.1 Test paths (concrete contract for @dev)

**Unit** (BP-3.1.U)
- `tests/unit/hitl/envelope.test.ts` — JWS(EdDSA) round-trip; canonical-JSON ordering; dynamic-linking; replay fields; timestamp normalization. Property-based 1000 fast-check round-trips → 0 mismatches (NFR-3).
- `tests/unit/hitl/state-machine.test.ts` — all 6 transitions; reject invalid; T_a/T_b/T_c clock semantics; transition idempotency.
- `tests/unit/hitl/sanitization.test.ts` — allowlist drops `apiKey`/`walletPrivateKey`/headers/internal state, ≥50 input shapes (fast-check).
- `tests/unit/hitl/notifier-stdio.test.ts` — form-mode rendering; `paybot_hitl_approve` surface; stdout-cleanliness.
- `tests/unit/hitl/notifier-webhook.test.ts` — outbound POST shape; HMAC-SHA256 sign; URL-mode payload.
- `tests/unit/hitl/notifier-http-poll.test.ts` — `GET /approvals/pending` shape; callback ingress verification.

**Integration** (BP-3.1.I)
- `tests/integration/hitl/end-to-end-{stdio,webhook,http-poll}.test.ts` — one E2E per channel: LLM call → pending → approve → executed → core verifies header.
- `tests/integration/hitl/sidecar-lifecycle.test.ts` — sidecar starts only when channel ∈ {webhook, http-poll}; SIGTERM shutdown; `/health` 200; bind-fail → `SIDECAR_BIND_FAILED`.
- `tests/integration/hitl/stdio-only-no-http.test.ts` — **(must-fix per @qa CON-3)** boot `PAYBOT_MCP_APPROVAL_CHANNEL=stdio` → zero TCP ports bound; webhook-channel registration fails loud.
- `tests/integration/hitl/core-header-verification.test.ts` — missing header 401; bad sig 401; replay 409; expired 410.
- `tests/integration/hitl/audit-chain.test.ts` — every transition writes one entry; `executed` references core audit-event-ID.

**Security** (BP-3.1.S)
- `tests/security/hitl/replay-defense.test.ts` — used envelope/expired → `HITL_REPLAY`; clock-skew ±30s.
- `tests/security/hitl/bypass-refused-in-prod.test.ts` — `HITL_BYPASS=true` + `NODE_ENV=production` + `ALLOW_BYPASS!=true` → boot refused.
- `tests/security/hitl/webhook-hmac.test.ts` — bad sig 401; callback replay 409.
- `tests/security/hitl/dynamic-linking-tamper.test.ts` — mutate recipient/amount → JWS verify fails.
- `tests/security/hitl/llm-cannot-bypass.test.ts` — **(must-fix per @qa FR-14)** (a) `paybot_pay({..., bypass_hitl: true})` → `HITL_BYPASS_DENIED`; (b) tool-schema introspection confirms zero bypass fields exposed; (c) `paybot_hitl_approve` without verifiable caller in allowlist → `HITL_BYPASS_DENIED`.

**Regression** (BP-3.1.R)
- `tests/regression/hitl/bp16-baseline.test.ts` — BP-1.6 baseline still green.
- `tests/regression/hitl/ungated-tools-unchanged.test.ts` — `paybot_balance`/`paybot_history`/`paybot_register` remain ungated.

**Reliability / chaos** (BP-3.1.C)
- `tests/chaos/hitl/notifier-failure.test.ts` — 50% failure → 100% reach terminal (NFR-8).
- `tests/chaos/hitl/concurrent-pendings.test.ts` — 100 concurrent → 0 SQLITE_BUSY (NFR-10).
- `tests/chaos/hitl/restart-resume.test.ts` — kill-9 + restart → in-flight resumed (NFR-4).

**DORA-audit** (BP-3.1.D)
- `tests/audit/hitl/chain-integrity.test.ts` — 100 random tx, `paybot_audit_excerpt` returns linked envelope; bank-verifier-kit (FR-15) confirms chain integrity using only published Ed25519 pubkeys.
- `tests/audit/hitl/verifier-kit-smoke.test.ts` — CI runs the kit against `samples/{approval,rejection}-chain.json`; both verify successfully.

### 11.2 Bank-verifier-kit (FR-15 must-fix per @qa R4)

`docs/pitch/bank-verifier-kit/` ships with v0.3:
- `verify-paybot-hitl.js` — zero paybot deps (only `crypto`+`jose`), <200 LOC
- `pubkeys/{paybot-mcp-chain,paybot-core-chain}.pub` — Ed25519 from VERITAS registry
- `samples/{approval,rejection}-chain.json` — fixture txs
- `RUNBOOK.md` — 1-page bank-IT guide
- CI smoke: `tests/audit/hitl/verifier-kit-smoke.test.ts`

## 12. Risks & Mitigations

| # | Risk | Sev/Likely | Mitigation |
|---|---|---|---|
| **R1** | Hybrid state machine doubles testing surface (research §timeout_design) — bugs hide in the `durable_pending` fork | High / Med | State-machine spec is exhaustive; property-based test enumerates all transitions; pre-pitch chaos drill covers durable path explicitly |
| **R2** | Webhook channel needs an HTTP sidecar on the MCP server — air-gapped pilot may not allow it | High / Med | http-poll channel is the explicit air-gap fallback; webhook is optional per install; documented in deployment guide |
| **R3** | MCP elicitation spec is draft, not ratified — host support varies | Med / Med | Stdio form-mode is the lowest-common-denominator; Claude Desktop is the primary pitch host (confirmed supports elicitation); webhook channel bypasses elicitation entirely via URL-mode + direct callback |
| **R4** | Bank may demand single Merkle tree instead of two chains | Med / Med | **(must-fix rewrite per @qa.)** Ship **bank-verifier-kit** (FR-15) — standalone Node script + pubkeys + samples + runbook. Bank IT can verify both chains offline, no paybot software needed. Out-of-band validation by Nordic bank IT before 2026-06-16 RECOMMENDED, not blocking — the kit is the falsifiable claim. Merkle unification deferred to BP-3.x as post-pitch fallback. |
| **R5** | No operator console UI — webhook demo needs a stub | High / Med | **(reconciled with N2 per @qa.)** N2 excludes a paybot-built UI; Slack interactive buttons are a third-party integration consumed by the webhook channel (Slack-app config is operator-side, not paybot code). Demo: Slack-stub for webhook + http-poll for air-gap. Slack-app config under `@ux-design-expert` post-spec; must be booked by 2026-05-27 (3-week pitch buffer). |

## 13. References

- `D:\1.GITHUB\paybot-mcp\docs\specs\BP-3.1\requirements.json` — Phase 1 output
- `D:\1.GITHUB\paybot-mcp\docs\specs\BP-3.1\research.json` — Phase 3 output (analyst)
- `D:\1.GITHUB\paybot\docs\architecture\bank-pitch-sprint-architecture.md` §2 — middleware design
- `D:\1.GITHUB\paybot\docs\architecture\OPEN-CORE-BOUNDARY-MAP.md` §5 — boundary discipline
- `D:\1.GITHUB\paybot\docs\architecture\adrs\` — ADR-BP-001 (to amend), ADR-BP-002 (VERITAS reuse), ADR-BP-008 (fail-closed pattern)
- `D:\1.GITHUB\paybot-mcp\src\server.ts` — interpose point for `wrapWithHitl`
- MCP Elicitation spec — https://modelcontextprotocol.io/specification/draft/client/elicitation
- RFC 7515 (JWS), RFC 8037 (JOSE EdDSA), RFC 9266 (TLS exporter — deferred)
- PSD2 RTS on SCA Art. 4-5 (Commission Delegated Regulation (EU) 2018/389)
- DORA (Regulation (EU) 2022/2554) Art. 5–14, 28
- AMLD6 (Directive (EU) 2018/1673) — 5-year retention
- Memory anchors: `project_veritas_three_chains_live`, `feedback_veritas_timestamp_normalization`, `feedback_credentials_masking`, `feedback_testing_agent_sop`, `feedback_idempotent_resource_creation`

**Operator decision provenance (NIT per @qa).** All "operator decision 2026-05-20" references trace to **Renata, 2026-05-20, session-end roundtable**, captured at `docs/decisions/BP-3.1-operator-decisions-2026-05-20.md` (authored alongside Phase 6 plan) and memory entry `project_bp31_operator_decisions` (created on plan handoff). Article IV satisfied — concrete artifact, not just a date string.

**Article IV (No Invention) compliance:** every FR, NFR, CON, and design decision above traces to one of: `requirements.json`, `research.json`, architect §2 (`bank-pitch-sprint-architecture.md`), operator decision 2026-05-20 (provenance above), or is explicitly marked **NEW** with rationale anchored to a memory, research finding, or @qa critique remedy. Zero invented features.
