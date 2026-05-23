---
paths:
  - "docs/stories/**"
  - ".aios-core/development/**"
---

# Story Lifecycle — Detailed Rules

## Status Progression

```
Draft → Ready → InProgress → InReview → Done
```

| Status | Trigger | Agent | Action |
|--------|---------|-------|--------|
| Draft | @sm creates story | @sm | Story file created |
| Ready | @po validates (GO) | @po | **MUST update status field in story file from Draft → Ready** |
| InProgress | @dev starts implementation | @dev | Update status field |
| InReview | @dev completes, @qa reviews | @qa | Update status field |
| Done | @qa PASS, @devops pushes | @devops | Update status field |

**CRITICAL:** The `Draft → Ready` transition is the responsibility of @po during `*validate-story-draft`. When verdict is GO (including conditional GO after fixes are applied), @po MUST update the story's Status field to `Ready` and log the transition in the Change Log. A story left in `Draft` after a GO verdict is a process violation.

## Phase 1: Create (@sm)

**Task:** `create-next-story.md`
**Inputs:** PRD sharded, epic context
**Output:** `{epicNum}.{storyNum}.story.md`

## Phase 2: Validate (@po)

**Task:** `validate-next-story.md`

### 11-Point Validation Checklist

1. Clear and objective title
2. Complete description (problem/need explained)
3. Testable acceptance criteria (Given/When/Then preferred)
4. Well-defined scope (IN and OUT clearly listed)
5. Dependencies mapped (prerequisite stories/resources)
6. Complexity estimate (points or T-shirt sizing)
7. Business value (benefit to user/business clear)
8. Risks documented (potential problems identified)
9. Criteria of Done (clear definition of complete)
10. Alignment with PRD/Epic (consistency with source docs)
11. (Conditional) AIDR referenced if story touches AI design — agent boundaries, model routing, token budgets, persona changes, handoff parameters (advisory, not a veto condition; see `aidr-awareness.md`)

**Decision:** GO (≥7/11) or NO-GO (<7/11 with required fixes)

## Phase 3: Implement (@dev)

**Task:** `dev-develop-story.md`

### Execution Modes

**YOLO (autonomous):**
- 0-1 prompts
- Decisions logged in `decision-log-{story-id}.md`
- Best for: simple, deterministic tasks

**Interactive (default):**
- 5-10 prompts with educational checkpoints
- Confirmations at key decision points
- Best for: learning, complex decisions

**Pre-Flight (plan-first):**
- All questions upfront (10-15 prompts)
- Generates execution plan
- Then zero-ambiguity execution
- Best for: ambiguous requirements, critical work

### CodeRabbit Self-Healing in Dev Phase

```
iteration = 0
while CRITICAL issues found AND iteration < 2:
  auto-fix CRITICAL/HIGH
  iteration++
if CRITICAL persist after 2 iterations:
  HALT — manual intervention required
```

## Phase 4: QA Gate (@qa)

**Task:** `qa-gate.md`

### 12 Quality Checks (Quality Foundation Protocol)

**Tests (BLOCKING — cannot pass without these):**
1. **All unit tests pass** — zero failures
2. **Test coverage >= 80%** on changed files
3. **No skipped tests** — no `.skip`, `xit`, `xdescribe`
4. **3 tests per new function** — happy path, error path, edge case
5. **All acceptance criteria met** — with test evidence

**Documentation (BLOCKING — cannot pass without these):**
6. **Doc comments on all exported functions** — JSDoc/TSDoc
7. **Module-level documentation** — purpose, dependencies, usage
8. **Complex logic commented** — inline WHY comments

**Validation:**
9. **No regressions** — full regression suite on affected areas
10. **API documentation** — if endpoints added/changed
11. **Security** — OWASP basics verified
12. **Performance** — within acceptable limits

**Minimum 2 QA passes required.** See `quality-foundation.md` for full protocol.

### Gate Decisions

| Decision | Conditions | Action |
|----------|-----------|--------|
| PASS | All 12 checks green, 2+ QA passes | Approve, proceed to regression check → @devops push |
| CONCERNS | Minor issues, tests/docs complete | Approve with observations documented |
| FAIL | Missing tests/docs, coverage < 80%, regressions | Return to @dev — MUST fix before re-test |
| WAIVED | Only for perf/security edge cases | Requires @architect documented approval. **NEVER for tests or docs.** |

### Gate File Structure

```yaml
storyId: STORY-42
verdict: PASS | CONCERNS | FAIL | WAIVED
issues:
  - severity: low | medium | high
    category: code | tests | requirements | performance | security | docs
    description: "..."
    recommendation: "..."
```

## QA Loop (Iterative Review-Fix)

```
@qa review → verdict → @dev fixes → re-review (max 5 iterations)
```

**Commands:**
- `*qa-loop {storyId}` — Start full loop
- `*stop-qa-loop` — Pause and save state
- `*resume-qa-loop` — Resume from saved state
- `*escalate-qa-loop` — Force manual escalation

**Escalation triggers:**
- max_iterations_reached (default: 5)
- verdict_blocked
- fix_failure (after retries)
- manual_escalate (user command)

**Status:** Tracked in `qa/loop-status.json`

## Story File Update Rules

| Section | Who Can Edit |
|---------|-------------|
| Title, Description, AC, Scope | @po only |
| File List, Dev Notes, checkboxes | @dev |
| QA Results | @qa only |
| Change Log | Any agent (append only) |
