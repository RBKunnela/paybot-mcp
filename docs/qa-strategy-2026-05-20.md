# QA Strategy — Paybot Bank-Pitch Sprint

**Owner:** Quinn (QA Guardian)
**Date:** 2026-05-20
**Target pitch:** 2026-06-30 (Nordic banks — due-diligence coverage report required)
**Authority:** Quality Foundation Protocol (`.claude/rules/quality-foundation.md`)
**Standard:** ≥85% coverage on changed files (per paybot GAPS DoD; supersedes generic 80%)

---

## 0. Ground-Truth Correction (READ FIRST)

Three memory-vs-reality reconciliations done at scope-in:

| Claim | Reality | Source |
|---|---|---|
| paybot-sdk has zero tests | **7 test files, 135 `describe/it` blocks** (`auth`, `client`, `crypto`, `errors`, `middleware`, `networks`, `x402-handler`) | `D:\1.GITHUB\paybot-sdk\tests\` |
| paybot-mcp has minimal coverage config | Correct. `vitest.config.ts` has no `coverage:` block at all. | `D:\1.GITHUB\paybot-mcp\vitest.config.ts` |
| 7 ADRs are gitignored | Only **4 ADRs** exist on disk: ADR-100, 101, 102, 103. Three are missing — confirm with PM whether they were drafted-and-lost or never written. | `D:\1.GITHUB\paybot\docs\architecture\adrs\` |
| EURC support in MCP | **Absent.** `paybot-mcp/src/server.ts` registers 4 tools (`pay`, `balance`, `history`, `register`). No `paybot_pay_eur`. EURC lives only in paybot core (`facilitator/providers/eurc.ts`). | grep `eurc\|EURC` in paybot-mcp/src |
| HITL gate exists | **Absent in source.** No `approval`, `intent_hash`, `approve_intent`, `pending_intent` matches in `paybot/src`. This is greenfield, not a coverage gap. | grep in paybot/src |

**Implication:** P0-1 (HITL) and P0-2 (EURC in MCP) are *implementation* stories first — QA defines acceptance, dev builds, QA verifies. P0-4 (SDK) is not a from-zero build; it's a *coverage-to-85%* lift.

---

## 1. Coverage Gap Analysis

Coverage % marked **(est.)** is inferred from test-file-to-source ratio + cyclomatic surface. Actual numbers come from the first `npm test -- --coverage` run @dev does this week.

| Repo | Current % (est.) | Target % | Top 3 untested high-risk modules | Effort |
|---|---|---|---|---|
| **paybot** (private core) | 65–75% | 85% | `facilitator/settle.ts` (settlement orchestrator), `security/policy/engine.ts` (WASM policy engine), `audit/hash-chain.ts` (Merkle inclusion proofs — bank-critical) | **M** — mostly gap-filling on the audit + settlement paths |
| **paybot-sdk** (public, MIT) | 55–65% | 85% | `x402-v2.ts` (456 LOC, no dedicated test), `micropayment-engine.ts` (346 LOC, no dedicated test), `client.ts` (641 LOC — has client.test.ts but error-path coverage is thin) | **L** — two large files have **zero** dedicated test files |
| **paybot-mcp** (public, Apache) | 60–70% on `server.ts` only | 85% **with `index.ts` excluded**; coverage block must be added to vitest config | `index.ts` (CLI bootstrap — exclude via config, integration-tested separately), `paybot_pay_eur` (does not yet exist), error-mapping in `paybot_pay` tool handler | **S** for current scope, **M** once EURC + HITL tools land |

**Coverage-config gaps (block 1 of week 1):**
- `paybot-mcp/vitest.config.ts` — add `coverage: { provider: 'v8', include: ['src/**/*.ts'], exclude: ['src/index.ts'], reporter: ['text','json','html','text-summary'], thresholds: { lines: 85, functions: 85, branches: 80, statements: 85 } }`. Note: branches deliberately lower because MCP tool handlers have many narrow branches that are integration-tested.
- `paybot-sdk/vitest.config.ts` — already has `coverage:` block but **no thresholds**. Add the same threshold set.
- `paybot/vitest.config.ts` — same. Plus add `exclude: ['src/stubs/**', 'src/cli/**', 'src/db/migrations/**']` (stubs and migrations should not count toward the metric).

---

## 2. Per-Gap Test Specifications

### P0-1 — HITL gate (greenfield in paybot core)

Contract tests (Vitest, in `paybot/tests/security/hitl/`):

| Test | What it asserts |
|---|---|
| `hitl.intent.test.ts` — happy path | `POST /hitl/intent` returns `{intent_hash, expires_at, ttl_sec}`; `intent_hash` is sha256 over the canonicalized payload (use the canonicalizer from `audit/`). |
| `hitl.approve.test.ts` — approval | `POST /hitl/approve` with valid `intent_hash` + operator signature transitions state `pending → approved`. Returns 200. |
| `hitl.execute.test.ts` — gated execute | `POST /facilitator/settle` with an approved `intent_hash` executes; same call without it returns **403 INTENT_NOT_APPROVED**. |
| `hitl.expiry.test.ts` — token expiry | Intent created with TTL=60s; advance clock 61s; execute returns **403 INTENT_EXPIRED**. |
| `hitl.replay.test.ts` — replay protection | Approve and execute once → 200. Execute again with same `intent_hash` → **409 INTENT_ALREADY_CONSUMED**. |
| `hitl.deny.test.ts` — denial | `POST /hitl/deny` transitions `pending → denied`. Subsequent execute returns **403 INTENT_DENIED**. State terminal. |
| `hitl.unauth.test.ts` — wrong operator | Operator A creates intent, Operator B approves → **403 OPERATOR_MISMATCH**. |

DoD: 7 tests, all green, ≥85% line coverage on the new `hitl/` module.

### P0-2 — EURC

Three layers:
1. **paybot-sdk** (`tests/networks.test.ts` — extend): EURC token address per network is a pass-through constant. Test (a) `NETWORKS['eip155:84532'].eurc === '0x...'`, (b) unknown network returns `undefined`, (c) SDK does NOT validate that the token IS EURC (boundary respect — that's the operator's call). 3 tests.
2. **paybot-mcp** (`tests/server.test.ts` — extend): Register a new `paybot_pay_eur` tool. Tests: (a) happy — calls `client.pay({...currency:'EURC'})` and returns tx hash; (b) error — SDK throws `PayBotApiError('INSUFFICIENT_FUNDS')` → MCP returns content with code, not crash; (c) edge — amount `"0"` rejected client-side. 3 tests.
3. **paybot** (`tests/facilitator/providers/eurc.test.ts` — already exists, audit it): confirm e2e against Base Sepolia EURC. If `tests/integration/real-settlement.test.ts` doesn't exercise EURC path, add one branch.

DoD: 6 new tests across SDK + MCP + 1 e2e branch in core. All green.

### P0-3 — Audit excerpt

In `paybot/tests/audit/`:

| Test | Assertion |
|---|---|
| `audit.signature.test.ts` | Excerpt signed with Ed25519 key → `verify(excerpt, pubkey)` returns true. Wrong pubkey → false. |
| `audit.inclusion.test.ts` | Merkle inclusion proof: given leaf hash + sibling path + root, verifier accepts. Wrong sibling → reject. |
| `audit.tamper.test.ts` | Mutate **one byte** in any leaf → inclusion proof fails (root mismatch). Mutate one byte in signature → verify fails. |
| `audit.canonicalization.test.ts` | Postgres `timestamptz` round-trip (per [[feedback_veritas_timestamp_normalization]]): write timestamp with trailing zeros, read back, re-canonicalize → byte-identical hash. |

DoD: 4 tests. Reuse Ed25519 chain logic already proven in [[project_veritas_three_chains_live]] (paybot key already issued).

### P0-4 — SDK coverage to 85%

**Top 5 highest-risk SDK methods** (chosen by LOC × external-surface × bank-due-diligence weight):

1. `PayBotClient.pay()` (line 182, ~140 LOC) — settles money. Highest blast radius.
2. `PayBotClient` constructor (line 49) — input validation gate; one bypass = key leak.
3. `x402-v2.ts` (entire file, 456 LOC) — protocol implementation, **zero dedicated test file**.
4. `micropayment-engine.ts` (entire file, 346 LOC) — **zero dedicated test file**.
5. `PayBotClient.commissionLedger()` (line 434) — financial reporting; banks will audit this.

Per-method DoD (3 tests minimum, per Quality Foundation Pillar 1):

| Method | Happy | Error | Edge |
|---|---|---|---|
| `pay()` | valid request → returns `{success:true, txHash}` | API 5xx → retries once, then `PayBotApiError` | amount `"0.0001"` (sub-cent) — accepted; `"-1"` rejected client-side before HTTP |
| constructor | full config → instance | missing `apiKey` throws | `walletPrivateKey` without `0x` throws |
| `x402-v2` (per public export) | spec-compliant request → spec-compliant response | malformed `WWW-Authenticate` header → typed error | network not in `NETWORKS` → undefined behaviour documented |
| `micropayment-engine` (per public export) | aggregate happy path | settlement failure mid-batch → partial result + reason | empty batch → no-op return, not throw |
| `commissionLedger()` | filter + pagination | server 401 → typed error not network error | `limit=0` returns empty array, not error |

**Velocity plan:**
- End of **Week 1 (2026-05-27)**: paybot-sdk ≥ **70%** lines (low-hanging fruit on existing test files + add `x402-v2.test.ts` + `micropayment-engine.test.ts` skeletons)
- End of **Week 2 (2026-06-03)**: paybot-sdk ≥ **80%**
- End of **Week 3 (2026-06-10)**: paybot-sdk ≥ **85%** (DoD met)
- End of **Week 4 (2026-06-17)**: paybot-mcp ≥ **85%**, paybot core ≥ **85%** on changed files
- Week 5 (2026-06-24): freeze + bank-pitch coverage report generated

### P1-5 — ADR gitignore regression (TF-4)

CI step in **all three repos**:
```bash
# .github/workflows/adr-tracking.yml
for adr in 100 101 102 103; do
  git ls-tree -r HEAD --name-only | grep -q "docs/architecture/adrs/ADR-${adr}" \
    || { echo "ADR-${adr} is missing from git tracking"; exit 1; }
done
```

DoD: workflow runs on every PR; missing-from-tracking → red. Also: PM to confirm the "3 missing ADRs" count — strategy doc currently states **4 ADRs exist**, not 7.

### P1-6 — SDK idempotency / IBAN / BIC / audit hooks

In `paybot-sdk/tests/`:

| Test | Assertion |
|---|---|
| `idempotency.test.ts` | Same idempotency key + same request body → returns cached response, no second HTTP call (assert `fetch` called once). Same key + **different body** → 409. |
| `iban.test.ts` | ISO 13616 check-digit: valid FI21 IBAN passes; one digit mutated fails; lowercase normalized before validation. |
| `bic.test.ts` | ISO 9362: 8-char and 11-char both valid; 9-char rejected; non-alpha bank code rejected. |
| `audit-hooks.test.ts` | Event order: `request_sent` → `response_received` → `settled` fires in that order; if `settled` errors, `failed` fires (not `settled`). |

DoD: 4 tests, ≥3 assertions each.

### P1-7 — MCP rate-limiting / policy-preview / identity

In `paybot-mcp/tests/server.test.ts` (extend) + new `tests/rate-limit.test.ts`:

| Test | Assertion |
|---|---|
| `rate-limit.test.ts` | N+1 calls in 60s window → tool returns content with `{code:'RATE_LIMITED', retryAfterSec:N}`. Underlying SDK called exactly N times. |
| `policy-preview` tool | Returns `{decision, reasons[]}` **without** invoking `client.pay()`. Assert `mockPay` not called. |
| `identity` tool | Returns `{intentHash, operatorId}` matching server config; `intentHash` is deterministic for same input. |

DoD: 3 tests; rate-limit test uses Vitest fake timers (not real waits).

---

## 3. CI Gate Spec

**Identical workflow across all three repos.** GitHub Actions `quality.yml`:

```yaml
jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npm run lint                                  # PASS
      - run: npm run typecheck                             # PASS
      - run: npm test -- --coverage --reporter=verbose     # ALL pass, zero skipped
      - name: Coverage threshold check
        run: |
          node scripts/check-coverage.mjs --lines 85 --functions 85 --statements 85 --branches 80 --changed-files-only
      - name: Open-core boundary check                     # paybot only
        run: bash scripts/verify-open-core-boundary.sh
      - name: ADR tracking guard
        run: bash scripts/verify-adr-tracking.sh
      - name: Upload coverage artifact
        uses: actions/upload-artifact@v4
        with:
          name: coverage-${{ github.sha }}
          path: coverage/
          retention-days: 90
      - name: PR coverage comment
        if: github.event_name == 'pull_request'
        uses: davelosert/vitest-coverage-report-action@v2
```

**From-QA-perspective, `verify-open-core-boundary.sh` (owned by DevOps) MUST guarantee:**
1. No file under `src/stubs/**` is imported by any test outside `tests/stubs/**` (stubs must not bleed into real-mode tests).
2. No `src/**` file imports from `D:/1.GITHUB/paybot-sdk` or `D:/1.GITHUB/paybot-mcp` (paybot is the core; public repos depend on it, not the reverse).
3. No test file under `tests/security/**` is skipped — that whole tree is bank-critical.
4. License header check: paybot files have `BSL 1.1`, paybot-sdk files have `MIT`, paybot-mcp files have `Apache-2.0`. Mismatch → fail.

**Block conditions (any → CI red, no merge):**
- Lint fail, typecheck fail, any test fail
- Coverage on **any changed file** < 85% lines/functions/statements or < 80% branches
- Any `.skip` / `xit` / `xdescribe` in changed test files (existing skips grandfathered for 1 sprint, then enforced)
- Boundary check fail
- ADR tracking guard fail

**No WAIVED for Pillar-1/2 (test/doc) gaps.** Only for measured perf/security trade-offs with @architect signed-off rationale in the PR description.

---

## 4. Regression Shield Plan

**Smoke set — sub-60 seconds, runs on every commit (pre-push hook + every PR push):**

| Repo | Smoke command | What it runs |
|---|---|---|
| paybot | `npm run test:smoke` (new — add to package.json) | `tests/security/audit.test.ts` + `tests/security/policy.test.ts` + `tests/facilitator/settle-dispatch.test.ts` + `tests/audit/audit-logger.test.ts` |
| paybot-sdk | `npm run test:smoke` (new) | `tests/client.test.ts` (happy paths only — filter by `it.skipIf(slow)`) + `tests/errors.test.ts` + `tests/crypto.test.ts` |
| paybot-mcp | `npm test` (already <60s) | full suite |

**Full set — sub-10 minutes, runs on every PR + every push to main:**

| Repo | Command | Scope |
|---|---|---|
| paybot | `npm test -- --coverage` + `npm run test:integration` (e2e Base Sepolia) | full unit + integration + e2e |
| paybot-sdk | `npm test -- --coverage` | full unit |
| paybot-mcp | `npm test -- --coverage` + MCP-client integration smoke against a running paybot stub | full unit + integration |

**Bug-fix regression rule (Pillar 4):** Every bug fix MUST add a regression test that reproduces the bug *first* (red), then the fix turns it green. The test goes in `tests/regression/` (create the dir on first use) and is permanent. Deletions require @architect signoff per Quality Foundation.

**Cross-repo regression:** When paybot-sdk gets a breaking change, the paybot-mcp CI must run against the new SDK *before* the SDK ships. Add a `workflow_call` step in paybot-sdk's release workflow that triggers paybot-mcp's `quality.yml` against the candidate SDK build.

---

## 5. Quality Foundation 12-Check Matrix (per-story validation framework)

Applied to every story landing for this sprint. **2-pass minimum.**

| # | Check | First Pass | Re-Test | Final |
|---|---|---|---|---|
| 1 | All unit tests pass | ✓ | ✓ | ✓ |
| 2 | Coverage ≥ 85% on changed files | ✓ | ✓ | ✓ |
| 3 | No skipped tests (changed files) | ✓ | ✓ | ✓ |
| 4 | ≥3 tests per new function (happy/error/edge) | ✓ | — | ✓ |
| 5 | All AC met with code evidence | ✓ | ✓ | ✓ |
| 6 | No regressions in related modules (smoke set green) | ✓ | ✓ | ✓ |
| 7 | Doc comments on every exported function | ✓ | — | ✓ |
| 8 | Module-level top-of-file comment | ✓ | — | ✓ |
| 9 | Complex logic (>10 LOC, branches) has inline WHY comments | ✓ | — | ✓ |
| 10 | API/MCP-tool docs complete (request/response/errors) | ✓ | — | ✓ |
| 11 | Security basics (OWASP API top-10, secret-leak grep) | ✓ | — | ✓ |
| 12 | Performance: SDK `pay()` < 500ms p50 mocked, < 3s p99 e2e Base Sepolia | ✓ | — | ✓ |

**Verdict rules:** PASS only after 2+ passes documented. FAIL on any check 1-6 dropped. WAIVED forbidden for checks 1-10. Check 12 may be WAIVED with @architect note for documented measurement-environment variance.

---

## 6. Open Items for the Other AIOX Agents

- **@pm** — Confirm the "7 ADRs" claim. Only 4 exist on disk. Are 3 missing or never written? Affects P1-5 acceptance.
- **@architect** — HITL state machine: confirm intended states are `{pending, approved, denied, consumed, expired}`. QA contract tests above assume this.
- **@data-engineer** — Postgres `timestamptz` canonicalization for audit excerpts: reuse helper from [[project_veritas_three_chains_live]] chain, or do you need a new one for paybot?
- **@devops** — Take ownership of `verify-open-core-boundary.sh`, `verify-adr-tracking.sh`, `scripts/check-coverage.mjs --changed-files-only`. Coverage script is the only one that doesn't exist yet anywhere.
- **@analyst** — Bank-due-diligence checklist: do Nordic banks require the coverage report in a specific format (SARIF? Cobertura XML? plain HTML)? Drives reporter choice.

---

## 7. Definition of Done — Sprint-Level

- [ ] All three repos: ≥85% line/function/statement coverage on changed files in main
- [ ] All three repos: CI workflow `quality.yml` green on main
- [ ] paybot: HITL gate implemented + 7 contract tests green
- [ ] paybot-mcp: `paybot_pay_eur` + `policy_preview` + `identity` tools shipped with 3-tests-each minimum
- [ ] paybot-sdk: idempotency + IBAN + BIC + audit-hooks tests green
- [ ] ADR tracking guard green on all three repos
- [ ] Coverage HTML report exportable as PR artifact + uploadable as bank-pitch deliverable
- [ ] Smoke set < 60s, full set < 10min, both measured

*— Quinn, 2026-05-20*
