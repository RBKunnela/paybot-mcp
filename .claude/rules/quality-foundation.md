# Quality Foundation Protocol — Universal Rule

## Purpose

**This is a PERMANENT, NON-NEGOTIABLE protocol.** Every single piece of code produced in any epic, story, or task MUST have heavy unit tests, documentation, and continuous QA validation. This is not a one-time activity — it runs on EVERY implementation, EVERY time.

**Applies to ALL agents:** @dev, @qa, @pm, @po, @sm, @architect, @data-engineer, @devops, and any specialist or squad.

---

## The 4 Pillars

```
PILLAR 1: Test-First Development (before/during code)
PILLAR 2: Documentation-as-Code (inline, every function)
PILLAR 3: QA Continuous Validation (not one-time, every cycle)
PILLAR 4: Regression Shield (nothing breaks, ever)
```

---

## Pillar 1: Test-First Development

### Veto Conditions (BLOCKING — code cannot merge without these)

- **VETO** if any new function has 0 unit tests
- **VETO** if test coverage for changed files drops below 80%
- **VETO** if any test is skipped (`*.skip`, `xit`, `xdescribe`, `@Disabled`)
- **VETO** if tests don't cover: happy path + error path + edge case (minimum 3 per function)
- **VETO** if tests use hardcoded magic values without explanation

### What @dev MUST Do (Every Story, Every Task)

1. **Before writing implementation code**, write failing tests for the acceptance criteria
2. **During implementation**, add unit tests for every new function:
   - Happy path (expected input → expected output)
   - Error path (invalid input → graceful failure)
   - Edge case (boundary values, empty inputs, nulls)
3. **After implementation**, run full test suite — ALL must pass
4. **Re-test**: Run related test suites (not just new tests) to catch regressions
5. **Coverage check**: Verify changed files maintain >= 80% coverage

### Test Categories Required

| Category | When | Owner | Minimum |
|----------|------|-------|---------|
| Unit tests | Every function | @dev | 3 per function (happy/error/edge) |
| Integration tests | Every API/DB interaction | @dev | 1 per endpoint/query |
| Acceptance tests | Every story AC | @dev + @qa | 1 per acceptance criterion |
| Regression tests | Every QA cycle | @qa | Full suite re-run |

### Test Naming Convention

```
test("[CATEGORY] functionName — should [expected behavior] when [condition]")
```

Example: `test("[UNIT] calculateTotal — should return 0 when cart is empty")`

---

## Pillar 2: Documentation-as-Code

### Veto Conditions (BLOCKING)

- **VETO** if any exported function lacks a doc comment explaining what it does
- **VETO** if any module lacks a top-level comment describing its purpose
- **VETO** if any complex logic (> 10 lines, conditionals, algorithms) lacks inline comments
- **VETO** if API endpoints lack request/response documentation
- **VETO** if database queries lack comment explaining the business logic

### What @dev MUST Document

1. **Every exported function**: What it does, parameters, return value, throws
2. **Every module/file**: Top-level comment — purpose, dependencies, usage
3. **Every complex block**: Inline comment explaining WHY (not what)
4. **Every API endpoint**: Method, path, request body, response shape, error codes
5. **Every database migration**: What changes, why, rollback strategy

### Documentation Template (Functions)

```typescript
/**
 * [What this function does — one sentence]
 *
 * [Why this exists — business context if not obvious]
 *
 * @param {Type} paramName - [description]
 * @returns {Type} [description]
 * @throws {ErrorType} [when condition]
 *
 * @example
 * const result = functionName(input)
 * // result === expectedOutput
 */
```

### Documentation Template (Modules)

```typescript
/**
 * @module ModuleName
 *
 * [What this module does — 1-2 sentences]
 *
 * Dependencies: [list key imports]
 * Used by: [list key consumers]
 *
 * @example
 * import { feature } from '@/module-name'
 */
```

---

## Pillar 3: QA Continuous Validation

### Veto Conditions (BLOCKING)

- **VETO** if story moves to Done without QA gate PASS
- **VETO** if QA gate runs only once — minimum 2 passes required (initial + re-test)
- **VETO** if QA does not verify ALL acceptance criteria with evidence
- **VETO** if QA does not run full regression suite on affected areas
- **VETO** if QA finds Critical/High issue and @dev does not fix + re-test

### QA Validation Cycle (MANDATORY for every story)

```
@dev completes → @qa FIRST PASS → findings → @dev fixes →
@qa RE-TEST → confirm fixes + no regressions →
@qa FINAL PASS → verdict (PASS/FAIL)
```

**Minimum 2 QA passes. No exceptions. No WAIVED for test/doc coverage.**

### What @qa MUST Validate (Every Cycle)

| Check | First Pass | Re-Test | Final Pass |
|-------|-----------|---------|------------|
| All unit tests pass | ✓ | ✓ | ✓ |
| Test coverage >= 80% on changed files | ✓ | ✓ | ✓ |
| No skipped tests | ✓ | ✓ | ✓ |
| 3 tests per new function (happy/error/edge) | ✓ | — | ✓ |
| All acceptance criteria met | ✓ | ✓ | ✓ |
| No regressions in related features | ✓ | ✓ | ✓ |
| Doc comments on all exported functions | ✓ | — | ✓ |
| Module-level documentation present | ✓ | — | ✓ |
| Complex logic has inline comments | ✓ | — | ✓ |
| API documentation complete | ✓ (if applicable) | — | ✓ |
| Security basics (OWASP) | ✓ | — | ✓ |
| Performance within limits | ✓ | — | ✓ |

### QA Verdict Rules (Updated)

| Verdict | Conditions | Allowed? |
|---------|-----------|----------|
| **PASS** | All checks green, 2+ passes complete | YES |
| **CONCERNS** | Minor issues, tests/docs complete | YES (with documented observations) |
| **FAIL** | Missing tests, missing docs, coverage < 80%, regressions | RETURN to @dev |
| **WAIVED** | Test/doc requirements waived | **NEVER for Pillars 1-2. Only for Pillar performance/security edge cases with @architect approval.** |

---

## Pillar 4: Regression Shield

### Veto Conditions (BLOCKING)

- **VETO** if any existing test breaks and is deleted instead of fixed
- **VETO** if test suite is not run before every commit
- **VETO** if regression test for a fixed bug is not added (every bug fix = new test)
- **VETO** if @devops pushes without full test suite passing

### Regression Rules

1. **Every bug fix MUST add a regression test** that reproduces the bug and verifies the fix
2. **Every refactor MUST maintain or improve test coverage** — never decrease
3. **Test suite runs before every commit** (`npm test` or equivalent in pre-commit)
4. **Full regression suite runs before every push** (enforced by @devops)
5. **Broken tests are FIXED, never deleted** — deleting a test requires @architect approval with documented reason

### @devops Push Gate (Updated)

Before `git push`, @devops MUST verify:
```
[ ] npm run lint — PASS
[ ] npm run typecheck — PASS
[ ] npm test — ALL PASS (zero failures, zero skipped)
[ ] Coverage report — >= 80% on changed files
[ ] No deleted tests without @architect approval
```

**If ANY check fails → BLOCK push. No exceptions.**

---

## Agent Responsibilities Matrix

| Agent | Pillar 1 (Tests) | Pillar 2 (Docs) | Pillar 3 (QA) | Pillar 4 (Regression) |
|-------|-----------------|-----------------|---------------|----------------------|
| **@dev** | Write all tests | Write all doc comments | Fix QA findings | Add regression tests for bugs |
| **@qa** | Validate test quality + coverage | Validate doc completeness | Run validation cycles | Run full regression suite |
| **@architect** | Define test strategy for complex features | Define doc standards | Review QA escalations | Approve test deletions (rare) |
| **@pm** | Ensure stories include test requirements | Ensure stories specify doc needs | Track QA velocity | Monitor regression trends |
| **@po** | Validate stories have testable AC | Validate stories have doc criteria | Accept/reject QA verdicts | Prioritize regression fixes |
| **@sm** | Include test tasks in story estimates | Include doc tasks in estimates | Schedule QA cycles | Flag regression backlogs |
| **@data-engineer** | Write DB query tests + migration tests | Document schemas, queries, RLS | Validate data integrity | Migration rollback tests |
| **@devops** | Enforce test gates on push | Enforce doc gates on PR | Enforce QA pass on merge | Run full suite before deploy |

---

## Integration with Story Development Cycle

### Updated SDC Flow

```
Phase 1: Create (@sm)
  → Story MUST include: test requirements, doc requirements
  → VETO if story has no testable acceptance criteria

Phase 2: Validate (@po)
  → Checklist item added: "Test strategy clear?"
  → Checklist item added: "Documentation requirements defined?"
  → VETO if AC is not testable (no Given/When/Then)

Phase 3: Implement (@dev)
  → Write tests FIRST (test-first development)
  → Write implementation
  → Write documentation (doc comments, module docs)
  → Run tests (all pass, coverage >= 80%)
  → Self-review against Pillar 1-2 checklists

Phase 3.5: Quality Foundation Check (NEW — MANDATORY)
  → @dev self-check: tests exist? docs exist? coverage met?
  → If NO → fix before requesting QA
  → If YES → proceed to Phase 4

Phase 4: QA Gate (@qa) — ENHANCED
  → First Pass: full 12-check validation
  → Findings → @dev fixes + adds missing tests/docs
  → Re-Test: verify fixes + no regressions
  → Final Pass: confirm all 12 checks green
  → Verdict: PASS (2+ passes) / FAIL (return to @dev)

Phase 4.5: Regression Verification (NEW — MANDATORY)
  → @qa runs FULL regression suite on affected areas
  → If regressions found → FAIL, return to @dev
  → If clean → proceed to Phase 5

Phase 5: Push (@devops)
  → Verify: lint + typecheck + ALL tests pass + coverage
  → BLOCK if any test fails or coverage drops
```

---

## Enforcement Mechanism

This protocol is enforced at 3 levels:

### Level 1: Agent Self-Check (Before requesting review)
@dev runs self-check before marking story as ready for QA:
```
[ ] Every new function has >= 3 tests (happy/error/edge)
[ ] Test coverage >= 80% on all changed files
[ ] Zero skipped tests
[ ] Every exported function has doc comment
[ ] Every module has top-level description
[ ] Complex logic has inline comments
[ ] All tests pass locally
```

### Level 2: QA Gate (During review)
@qa validates all 12 checks across minimum 2 passes.
FAIL on any test/doc deficiency.

### Level 3: DevOps Push Gate (Before merge/push)
@devops blocks push if tests fail or coverage drops.
No override without @architect documented approval.

---

## When This Applies

**ALWAYS.** This is not optional. Not one-time. Not "when we have time."

- Every epic → stories must include test/doc requirements
- Every story → implementation must include tests and docs
- Every task → code changes must include tests and docs
- Every bug fix → must add regression test
- Every refactor → must maintain or improve coverage
- Every PR → must pass all 4 pillars before merge

**There are no exceptions for:**
- "Quick fixes"
- "Prototype code"
- "Will add tests later"
- "Docs not needed for this"
- "Just a small change"

If code changes, tests and docs change. Period.

---

*Quality Foundation Protocol v1.0*
*"Code without tests doesn't exist. Code without docs is a liability. Code without QA is a risk."*
