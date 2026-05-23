---
name: validation-to-diagram
description: QA workflow — visualize test coverage, gaps, and quality scorecards as Excalidraw diagrams.
type: workflow
phases: 4
owner: "@qa, @dev"
triggers:
  - "QA gate reporting"
  - "Test coverage visualization"
  - "Gap analysis needed"
  - "Sprint quality review"
  - "User says 'show coverage', 'what's tested', 'gap analysis'"
---

# Workflow: Validation to Diagram

Visualize test coverage and quality gaps. Output: coverage map showing what's tested, what's not, and where the risk is.

## Overview

```
INTAKE → ANALYZE → DIAGRAM → VALIDATE
   │         │         │          │
   ▼         ▼         ▼          ▼
 Collect   Calculate  Generate   Render
 test      coverage   coverage   PNG loop
 results   per area   map JSON
```

---

## Phase 1: INTAKE — Collect Test Data

**Input:** Test results, story acceptance criteria, codebase analysis
**Output:** Feature-to-test mapping

### Gather

1. List all features/components in scope
2. For each feature, identify which test types exist:
   - Unit tests
   - Integration tests
   - E2E tests
   - Manual validation
3. Check test results: pass/fail/skip counts
4. Identify acceptance criteria without matching tests

### Data Format

```
Feature A: { unit: PASS, integration: PASS, e2e: NONE, manual: PASS }
Feature B: { unit: PASS, integration: NONE, e2e: NONE, manual: NONE }
Feature C: { unit: FAIL, integration: PASS, e2e: PASS, manual: PASS }
```

---

## Phase 2: ANALYZE — Calculate Coverage

**Input:** Feature-to-test mapping
**Output:** Coverage analysis with risk assessment

### For each feature:

| Coverage Status | Color | Criteria |
|----------------|-------|----------|
| **Covered** | Green (`#a7f3d0`) | All relevant test types pass |
| **Partial** | Amber (`#fef3c7`) | Some test types missing or skipped |
| **Gap** | Red (`#fecaca`) | No tests or failing tests |

### Risk Heuristics
- Feature with 0 tests = HIGH risk (red)
- Feature with only manual tests = MEDIUM risk (amber)
- Feature with unit + integration + e2e = LOW risk (green)
- Any failing test = mark as gap regardless of other coverage

---

## Phase 3: DIAGRAM — Generate Coverage Map

**Input:** Coverage analysis
**Output:** `.excalidraw` file

### Steps

1. Read template from `squads/visual-engineers/templates/coverage-map.md`
2. Create a grid: rows = features, columns = test types
3. Color each cell based on coverage status
4. Add summary row with percentages
5. Highlight gaps prominently (thick red border)
6. Add legend

### Output Path
```
docs/diagrams/{context}-coverage.excalidraw
```

---

## Phase 4: VALIDATE — Render & Verify

**Input:** `.excalidraw` file
**Output:** Validated PNG

### Steps

1. Render:
   ```bash
   cd .claude/skills/excalidraw-diagram/references && uv run python render_excalidraw.py <path.excalidraw>
   ```
2. View PNG with Read tool
3. Verify: every feature from Phase 1 appears in the grid
4. Verify: colors accurately reflect coverage status
5. Verify: gaps are visually prominent (someone can spot risk in 3 seconds)
6. Fix and re-render until clean

### Done When
- All features represented
- Colors match actual coverage
- Gaps are impossible to miss
- A QA lead could use this in a sprint review
