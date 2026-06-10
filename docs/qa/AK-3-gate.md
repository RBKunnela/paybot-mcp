# QA Gate — AK-3: Thin MCP Tool-Call Interceptor (Wrap → Govern → HITL → Proof)

- **Story:** AK-3 (EPIC-AP2-KERNEL-2026-06) · **PR:** #60 (paybot-mcp)
- **Branch:** `feat/ak-3-mcp-interceptor`
- **Reviewer:** @qa · **Mode:** 2-pass, re-executed; three re-reviews after fixes
- **First-pass verdict (commit `b3d3756`):** CONCERNS
- **Re-review #1 verdict (commit `ef62534`):** CONCERNS — CONCERN-1 + CONCERN-2 RESOLVED; new AK-3-C1 surfaced
- **Re-review #2 verdict (commit `478c6c9`):** PASS — AK-3-C1 RESOLVED via negative `state`-discriminator (SUPERSEDED, see below)
- **Re-review #3 verdict (commit `1bb1517`):** **PASS** — AK-3-C1 re-closed via POSITIVE action-scoped signal; **this PASS is now the active pin**, superseding the `478c6c9` pin

---

## RE-REVIEW #3 — 2026-06-10 (commit `1bb1517`) — **PASS** (active pin; supersedes `478c6c9`)

Spans two branches. The interceptor was rewritten to gate execution on a
**POSITIVE action-scoped signal** instead of the prior negative settlement-`state`
inference. The paired core endpoint landed on AK-2 PR #104 (commit `c2cafa5`,
`GET /actions/approvals/:id`). Both branches re-verified from their worktrees.

### What changed since `478c6c9` (the design hardening)
- **Removed** the negative state-discriminator (`if (status.state !== undefined) → REFUSE WRONG_APPROVAL_ROUTE`).
- **Added** `GovernanceClient.getActionApproval()` polling `GET /actions/approvals/:id`
  (`governance-client.ts:377`); `pollAndExecute` now polls that endpoint and
  executes ONLY on `decision === 'APPROVED'` (`governed-tool.ts:432,450`) after the
  TOCTOU re-hash. The old `getApprovalStatus()` (`/approvals/:id`) is retained ONLY
  as an operator/debug view — **not used in the execute path** (grep confirms zero
  references in `governed-tool.ts`).

### Check #3 — the property — RE-VERIFIED LIVE (now via positive signal)
Booted AK-2 core from its worktree (`paybot-ak2`, `c2cafa5`) in mock mode on a free
port with a throwaway DB. Ran the unmocked integration suite against it:
- **`[AK-3-C1]` payment-route approve ONLY** → shared row flips `APPROVED`/`SETTLE_FAILED`,
  but `GET /actions/approvals/:id` stays **PENDING** → interceptor polls, never sees
  APPROVED, **times out** → **handler call count = 0**, `APPROVAL_TIMEOUT`, `isError`,
  never `RAN:`, no `result_hash`. ✅
- **`[AK-3-C1]` action-route approve** (separate fresh approval) → action-scoped status
  APPROVED → **executes exactly once**, `params_hash` + `result_hash` bound. ✅
- Confirmed the interceptor polls the **action-scoped** endpoint, not `/approvals/:id`,
  for the execute decision (static + the integration assertion reads
  `GET /actions/approvals/:id` directly and asserts PENDING under payment-route approve).

### Soundness vs the old fix (positive signal, no residual gap)
- NEW approach is a **positive** signal: execution requires `ACTION_APPROVED`-backed
  `decision === 'APPROVED'` on the action-scoped endpoint — not an inference from the
  absence of a settlement state. Strictly stronger: nothing is read from the payment lane.
- Removing the state-discriminator left **no gap**: there is no path where a payment-route
  approve yields action-scoped APPROVED. The action registry's `recordDecision('APPROVED')`
  is called ONLY by `POST /actions/approvals/:id/approve` (the `ACTION_APPROVED` emitter);
  the payment approve route (`approvals.ts`) has **zero** references to the registry
  (grep confirmed). **Live-proven both directions** against the running core:
  payment-route approve → action status PENDING; action-route approve → APPROVED;
  action-route deny → DENIED; unknown id → 404 (fail-closed, never falsy-APPROVED);
  unauthenticated → 401.

### No regression (unit, dead-core + live)
TOCTOU `PARAMS_HASH_MISMATCH` (0 exec after mutation), deny-by-default `VERB_ALLOWLIST`
(0 exec), irreversible + core-unreachable (0 exec), reversible-only `failOpen` clamp
(irreversible + failOpen + dead core ⇒ 0 exec, `GOVERNANCE_UNREACHABLE`, no `fail-open`),
malformed-risk_class clamp (fail-closed) — all hold.

### Test/quality results (commit `1bb1517`)
| Check | Result |
|---|---|
| Suite without core | **132 passed / 7 skipped (139)** ✅ (integration `skipIf`-gated) |
| Suite with live AK-2 core (`c2cafa5`, mock mode, free port, throwaway DB) | **139 passed / 0 skipped** ✅ |
| Lint / type-check / build | green / green / green |
| Coverage (changed files, with core) | governance-client **100% lines / 90.66% branch**, governed-tool **95.83% lines / 83.87% branch**, demo-tools **100%** — all ≥80% |
| Check #3 handler count | payment-route approve = **0**; action-route approve = **1** |

### Cross-repo note (AK-2 PR #104, `c2cafa5`)
The paired core endpoint is now **committed** on AK-2 (no longer the dead/uncommitted
edits flagged in re-review #2). `src/server/routes/approvals.ts` is **untouched**
(empty diff vs `origin/main`); the AK-2 diff is additive. AK-2 #104 re-gated and
still PASSES with `c2cafa5` (see `paybot-ak2` AK-2 gate re-gate note). The
re-review #2 "uncommitted/dead" process note is therefore resolved.

### Re-review #3 verdict: **PASS** (active pin = `1bb1517`; supersedes `478c6c9`). Not merged.

---

## RE-REVIEW #2 — 2026-06-10 (commit `478c6c9`) — **PASS**

@dev closed AK-3-C1 interceptor-side (no `approvals.ts` edits). The blocking poll
now refuses to execute unless the APPROVED row has **no** settlement `state`:
the payment approve route always runs settlement and records a `state`
(`SETTLE_FAILED`/`RESUME_CONTEXT_UNAVAILABLE` for an action row); the action
approve route never settles, so `state` stays absent. Present `state` ⇒ payment
lane claimed it ⇒ refuse `WRONG_APPROVAL_ROUTE` (fail-closed; any non-empty
state, including `SETTLED`, coerced to refuse).

### Check #3 — the property that withheld PASS — NOW HOLDS
Re-ran the original attack live against AK-2 core (mock mode, port 3122, throwaway DB):
pause irreversible `delete_database` → approve via the **PAYMENT** route only →
**handler call count = 0**, refusal carries `WRONG_APPROVAL_ROUTE`, `isError`.
Then a fresh action approved via the **ACTION** route executes exactly once with
hashes bound. ✅

### State-discriminator — sound (spot-checked both directions, live)
- Pending action row: **no** `state` (decision PENDING).
- Action-route approved: APPROVED with **no** `state` → executes once.
- Payment-route approved: APPROVED with `state=SETTLE_FAILED` → refused.
- Client coercion fail-closed: known states pass through; any other non-empty
  string → treated as `SETTLE_FAILED` (refuse); only absent/empty → execute
  (`governance-client.ts:309-315`). Verified against the live `GET /approvals/:id`
  serialization (`paybot-ak2/src/server/routes/approvals.ts:448`,
  `...(approval.state ? { state } : {})` — present only when settlement touched the row).

### No regression (live + dead-core probes)
TOCTOU (`PARAMS_HASH_MISMATCH`, 0 exec after mutation), deny-by-default
(`VERB_ALLOWLIST`, 0 exec), reversible-only `failOpen` clamp (irreversible +
failOpen + dead core ⇒ 0 exec, `GOVERNANCE_UNREACHABLE`, no `fail-open` note) all hold.

### Test/quality results (commit `478c6c9`)
| Check | Result |
|---|---|
| Suite without core | **126 passed / 7 skipped (133)** ✅ (+2 integration regressions, skipIf-gated) |
| Suite with live AK-2 core | **133 passed / 0 skipped** ✅ |
| Lint / type-check / build | green / green / green |
| Coverage | governed-tool **95.83% lines / 85.93% branch**, governance-client **100% lines**, demo-tools **100%** — all ≥80% |
| New AK-3-C1 tests | unit: payment `SETTLE_FAILED`→refused, action no-state→executes, `SETTLED`→refused; +3 client-parse; +unmocked integration (payment→0 exec, action→executes) — non-tautological |

### Dev's flagged consequence — acceptable
Payment-route approve poisons the shared id (→ action route returns 409
ALREADY_DECIDED → operator must re-issue). This is **fail-closed-correct**: the
action never executes (count 0), the refusal names `WRONG_APPROVAL_ROUTE` and
tells the operator to re-approve via the ACTION route, and a re-issue is a fresh
intent/approval that approves cleanly (verified). No silent failure, no execution. Acceptable.

### Process note (NOT a blocker for AK-3; for the AK-2 owner)
The AK-2 worktree (`D:\1.GITHUB\paybot-ak2`) carries **uncommitted** edits to
`src/server/routes/actions.ts` (+ its test) adding a *parallel* AK-3-C1 fix — an
action-scoped `GET /actions/approvals/:id` positive-signal endpoint. The shipped
mcp interceptor (`478c6c9`) does **not** poll that endpoint; it polls the shared
`GET /approvals/:id` and keys on `state` (served by the untouched `approvals.ts`).
Confirmed by static analysis: `approvals.ts` is not in the AK-2 diff, and the
diff is purely additive of a new route — so the check #3 PASS is attributable
solely to the committed mcp fix, not the uncommitted endpoint. Left the AK-2
worktree untouched (did not stash, per the do-not-modify boundary). Recommend the
AK-2 owner either land or discard those uncommitted edits; they are dead relative
to the shipped interceptor.

### Scope of this PASS (commit pinned)
This PASS is pinned to **committed `478c6c9`** (the shared-`/approvals/:id` +
`state`-discriminator fix). Verification ran 16:58–17:01; the `dist/` under test
(built 16:59) and the vitest source transform both reflected `478c6c9`. After
verification (working-tree edits at 17:11, AFTER all runs), the dev continued
iterating in the mcp working tree — **uncommitted** edits to
`src/governance-client.ts` + `src/governed-tool.ts` switch the interceptor to
poll the action-scoped `GET /actions/approvals/:id` positive signal (pairing with
the uncommitted AK-2 endpoint). Those edits are NOT part of the reviewed commit,
are NOT staged or pushed (the pushed branch HEAD is `478c6c9` + this docs commit
only), and were left in place (in-progress work). If the dev commits the
action-scoped approach, it warrants a quick re-review — but it is a strictly
stronger design (a positive ACTION_APPROVED signal vs inferring from a settlement
failure state), so the security property would only harden.

### Re-review #2 verdict: **PASS** (pinned to `478c6c9`). Not merged.

---

## RE-REVIEW — 2026-06-10 (commit `ef62534`)

@dev moved the reversible-only `failOpen` clamp INTO the public `governCall`
entry. Re-review findings:

### CONCERN-1 (failOpen at the public-API boundary) — ✅ RESOLVED
- `governed-tool.ts:295`: `const failOpen = p.failOpen === true && def.riskClass === 'reversible';`
  and the unreachable-catch (line 317) gates on the **clamped** value, not `p.failOpen`.
  The wrapper now passes `opts.failOpen` through unmodified (single source of truth).
- Clamp keys on `=== 'reversible'` (allowlist), so irreversible **and** any
  unknown/malformed risk_class fail closed — not the weaker `!== 'irreversible'`.
- Own probe vs a dead core: `governCall({riskClass:'irreversible', failOpen:true})`
  ⇒ handler never ran, `GOVERNANCE_UNREACHABLE`, **no** `fail-open` note, `isError`.
  Reversible+failOpen escape hatch still executes. Both confirmed.

### CONCERN-2 (test integrity) — ✅ RESOLVED
Three non-tautological clamp tests now exist (`governed-tool.test.ts`):
- L318 reversible+failOpen+unreachable ⇒ executes (`calls=1`, `fail-open` note).
- L338 irreversible+failOpen+unreachable ⇒ REFUSED (`calls=0`, `isError`,
  `GOVERNANCE_UNREACHABLE`, `not.toContain('fail-open')`).
- L365 forces an out-of-enum `risk_class='unknown'` past the compiler ⇒ REFUSED
  (proves the clamp is reversible-only, not "not-irreversible").

### Re-review test/quality results
| Check | Result |
|---|---|
| Suite without core | **120 passed / 5 skipped (125)** ✅ (+2 clamp tests) |
| Suite with live AK-2 core (mock mode, port 3119, throwaway DB) | **125 passed / 0 skipped** ✅ |
| Lint / type-check / build | green / green / green |
| Coverage governed-tool.ts | **95.71% lines**, branch 85% (≥80) ✅ |
| Regression: TOCTOU | HOLDS (`PARAMS_HASH_MISMATCH`, no exec after mutation) |
| Regression: deny-by-default | HOLDS (`VERB_ALLOWLIST`, no exec) |
| Regression: fail-closed (irreversible, core down) | HOLDS |

### NEW — AK-3-C1 (Medium): payment-route approval EXECUTES the governed action
Surfaced by deeper end-to-end probing during re-review (not a regression from the fix):
- The interceptor's blocking poll keys on `GET /approvals/:id` → `decision === 'APPROVED'`
  (`governed-tool.ts:410`). The approvals row is the **shared A5a store**.
- An operator who (mistakenly) approves a paused action via the **payment** route
  `POST /approvals/:id/approve` flips the shared row's `decision` to `APPROVED`
  *before* settlement fails (`SETTLE_FAILED / RESUME_CONTEXT_UNAVAILABLE`).
- Probed end-to-end against the live core: with the agent blocked on a pending
  `delete_database`, a payment-route approve caused the interceptor to **execute the
  mock deletion** (handler ran once, hashes bound). The gate's required property
  "approving via the PAYMENT route does NOT execute the action" therefore **does not hold**.
- This is the AK-2 deferred "wrong-route hazard" (AK-2 gate probe `b` /
  `AK-2-C1` / `gap1`). AK-2 marked it `PASS_WITH_NOTE` reasoning "no `ACTION_APPROVED`
  event ⇒ no execution authorized" — true at the **core** boundary, but the AK-3
  interceptor reads the shared `decision`, not the audit chain, so the conclusion
  does not survive the AK-3 layering. AK-2 deferred the *mitigation* to "the AK-3
  operator runbook." The runbook (line 65–66) does document the correct ACTION
  route, but the hazard remains an executable code path, not just a doc item.
- **Mitigation (in scope for AK-3, does NOT touch the forbidden `approvals.ts`):**
  before executing on APPROVED, the interceptor should confirm the approval is
  **action-shaped** — e.g. poll an action-specific decision (the action route
  already owns `ActionApprovalRegistry`), or have it require an `ACTION_APPROVED`
  signal rather than the generic payment-shared `decision`. A bare poll of the
  shared row cannot distinguish a payment-route claim from an action-route claim.

### Re-review recommendation
The fix under review is correct and complete — CONCERN-1 and CONCERN-2 are closed,
counts and quality match the brief (120/125, green, coverage ≥80%). Verdict remains
**CONCERNS** solely because the gate's check-#3 property (payment route must not
execute) does not hold end-to-end (AK-3-C1). Not merged. AK-3-C1 should be addressed
in this PR (interceptor-side, no forbidden-file edits) or explicitly accepted by the
operator with the wrong-route hazard reclassified from "doc-only" to "live path."

---

## FIRST-PASS RECORD (commit `b3d3756`)

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
