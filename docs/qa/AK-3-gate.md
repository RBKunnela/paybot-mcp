# QA Gate — AK-3: Thin MCP Tool-Call Interceptor (Wrap → Govern → HITL → Proof)

- **Story:** AK-3 (EPIC-AP2-KERNEL-2026-06) · **PR:** #60 (paybot-mcp)
- **Branch:** `feat/ak-3-mcp-interceptor` @ `b3d3756`
- **Reviewer:** @qa · **Date:** 2026-06-10 · **Mode:** 2-pass, re-executed
- **Verdict:** **CONCERNS** (ship-blocking? no — one defence-in-depth hardening + one test-claim fix)

## Result summary

| Check | Result |
|---|---|
| Suite without core | **118 passed / 5 skipped (123)** — integration `skipIf` gated, intentional |
| Suite with live AK-2 core (mock mode) | **123 passed / 0 skipped** ✅ matches claim |
| Lint / type-check / build | green / green / green |
| Coverage (with core) | governance-client **100% lines**, governed-tool **95.71% lines**, demo-tools **100%** — all ≥80% |
| Zero-skip enforcement | passes (`skipIf` recognised as intentional conditional) |
| Payment tools untouched (AC4) | diff is **additive only** (2187 insertions, 0 deletions); `server.ts` = 1 import + env-gated block |
| Audit chain (AC5) | APPROVE + DENY triads present, joined by `approval_id` + `params_hash`; **chain verifies green** (84 events intact) |
| Runbook reproducible (AC5) | re-run end-to-end against live core in < 10 min |

## Adversarial matrix

| Property | Result |
|---|---|
| TOCTOU — approve then mutate args | ✅ REFUSED `PARAMS_HASH_MISMATCH`; handler never ran (real core APPROVE, local re-hash caught it) |
| Deny-by-default — unknown verb | ✅ denied (`VERB_ALLOWLIST`), never executed |
| risk_class injection via tool args | ✅ ignored; registrar's `irreversible` honoured → routed to HITL, no execution |
| No bypass / no raw args to core | ✅ only `params_hash` + `target_ref` sent; raw args never in intent; demo tools exist only wrapped |
| Approval route | ✅ paused actions driven through `POST /actions/approvals/:id/approve` (AK-2-C1); payment route never settles an action |
| Core-down fail-closed — via `registerGovernedTool` | ✅ irreversible/unknown REFUSED `GOVERNANCE_UNREACHABLE`; reversible+`failOpen` runs only when explicitly opted in |
| Core-down fail-closed — via exported `governCall` directly | ⚠️ **GAP** — see CONCERN-1 |

## CONCERNS

### CONCERN-1 (Medium — hardening): `failOpen` reversible-only guard lives only in the wrapper, not in the exported `governCall`

- `registerGovernedTool` correctly forces `failOpen = opts.failOpen === true && def.riskClass === 'reversible'` (`governed-tool.ts:239`). Through the registrar — the demo path and all tests — an irreversible tool can **never** fail open. The live demo (`delete_database`, irreversible) is safe.
- However, `governCall` is **re-exported as public API** (`index.ts:35`, "Public API surface for embedders building their own governed MCP servers") and trusts `p.failOpen` directly (`governed-tool.ts:305`) with **no riskClass re-check**. An embedder calling `governCall({ riskClass:'irreversible', failOpen:true })` with core down **executes the irreversible action** — the blanket-bypass the threat model forbids and the README (line 247–248) promises is "ignored for irreversible verbs."
- Verified reproducibly: irreversible + `failOpen:true` + dead core ⇒ handler ran, output `(fail-open: governance unreachable)`, `isError` unset.
- **Fix:** move the reversible-only clamp into `governCall` itself (e.g. `const failOpen = p.failOpen === true && p.def.riskClass === 'reversible'`), so the invariant holds for every caller of the exported primitive, not just the wrapper.

### CONCERN-2 (Low — test integrity): the "failOpen ONLY for reversible" test does not test the negative

- `governed-tool.test.ts:318` "`[ADVERSARIAL] failOpen is honored ONLY for reversible actions`" only asserts the reversible-true case runs. It never asserts the irreversible-true case is refused — which is why CONCERN-1 went uncaught. Add a case: irreversible + `failOpen:true` + unreachable ⇒ refused, handler not called. (Pairs with the CONCERN-1 fix.)

## Honest gaps — judged acceptable for scope

- **Runbook location:** story places it in core `docs/runbooks/`; it ships in paybot-mcp with an explicit "port when AK-2 merges" note. Transparent, reproduced successfully. Acceptable.
- **Inherited in-memory velocity / action context:** action approvals reuse A5a's in-memory store; a core restart drops pending action context → reconciled to EXPIRED (fail-closed). Acceptable & documented.
- **Blocking-wait session scope:** stdio session holds a blocking approval only as long as the session lives — documented in README. Acceptable.
- **External verifier binary deferred to AK-5:** chain integrity validated here via core's `verifyChain` (green). Acceptable for AK-3 scope.

## Recommendation

Both CONCERNs are small, well-scoped, and do not affect the demo path (which only reaches `governCall` through the safe wrapper). **Recommend: address CONCERN-1 + CONCERN-2 in this PR before merge** (a few lines + one test) to make the documented "ignored for irreversible verbs" guarantee true at the public-API boundary. Everything else — all 5 ACs, the full adversarial set, payments-untouched, replayable proof — holds.
