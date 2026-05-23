---
name: coverage-map
description: Grid matrix showing test coverage across features and test types with gap analysis
type: template
lifecycle_phase: validation
visual_pattern: side-by-side
---

# Coverage Map Diagram

## When to Use

- QA reporting at sprint review to visualize what is tested and what is not
- Gap analysis before release to identify missing test coverage
- Sprint quality dashboards comparing planned vs actual coverage
- Audit preparation showing compliance of testing efforts
- Prioritizing test debt by highlighting the riskiest uncovered areas

## ASCII Layout

```
+--------------------------------------------------------------------+
|                          [TITLE]                                    |
|                         [SUBTITLE]                                  |
|                                                                     |
|              | Unit  | Integ | E2E   | Perf  | % Coverage |        |
|  +-----------+-------+-------+-------+-------+------------+        |
|  | Feature A | GREEN | GREEN | AMBER | RED   |    62%     |        |
|  +-----------+-------+-------+-------+-------+------------+        |
|  | Feature B | GREEN | GREEN | GREEN | GREEN |   100%     |        |
|  +-----------+-------+-------+-------+-------+------------+        |
|  | Feature C | RED   | RED   | RED   | RED   |     0%     |        |
|  +-----------+-------+-------+-------+-------+------------+        |
|  | Feature D | GREEN | AMBER | GREEN | AMBER |    75%     |        |
|  +-----------+-------+-------+-------+-------+------------+        |
|  | % by Type | 75%   | 50%   | 50%   | 25%   |  [TOTAL]  |        |
|  +-----------+-------+-------+-------+-------+------------+        |
|                                                                     |
|  +-------------------------------+  +----------------------------+  |
|  | SUMMARY                       |  | LEGEND                     |  |
|  | Total: X/Y cells covered      |  | [green]  Covered (tests   |  |
|  | Critical gaps: Feature C      |  |          pass, >80% cov)  |  |
|  | Action: Add unit tests first  |  | [amber]  Partial (tests   |  |
|  +-------------------------------+  |          exist, <80% cov) |  |
|                                     | [red]    Gap (no tests)   |  |
|                                     +----------------------------+  |
+--------------------------------------------------------------------+
```

## Template Fields

| Field | Description | Example |
|-------|-------------|---------|
| `map_title` | What this coverage map represents | "Sprint 14 Test Coverage" |
| `features` | Row labels: features, modules, or stories | Auth, Payments, Notifications |
| `test_types` | Column labels: categories of testing | Unit, Integration, E2E, Performance |
| `cell_status` | Coverage status per cell | covered, partial, gap |
| `row_percentages` | Coverage percentage per feature (row) | 75%, 100%, 0% |
| `column_percentages` | Coverage percentage per test type (column) | 80%, 60% |
| `total_coverage` | Overall coverage across entire matrix | 52% |
| `critical_gaps` | Features with zero or near-zero coverage | Feature C: 0% |

## Element Guidance

### Matrix Grid
- Type: `rectangle` per cell, arranged in rows and columns
- Cell size: 100x50 recommended for readability
- roughness: 0

### Cell Colors by Status

| Status | Fill | Stroke | Meaning |
|--------|------|--------|---------|
| Covered | `#a7f3d0` | `#047857` | Tests exist and pass, coverage above 80% |
| Partial | `#fef3c7` | `#b45309` | Tests exist but coverage below 80% or some skipped |
| Gap | `#fecaca` | `#b91c1c` | No tests exist for this combination |

### Row and Column Headers
- Type: `rectangle`
- Fill: `#3b82f6` (primary), stroke: `#1e3a5f`
- Text color: `#ffffff`, fontSize: 14, fontFamily: 1
- Feature names in left column header, test types in top row header

### Percentage Cells (Summary Row/Column)
- Type: `rectangle`
- Fill: `#f8fafc` (light gray), stroke: `#1e3a5f`
- Text: bold, fontSize: 14
- Color the text by threshold: green (`#047857`) for >=80%, amber (`#b45309`) for 50-79%, red (`#b91c1c`) for <50%

### Total Coverage Badge
- Type: `rectangle`, borderRadius: 8
- Fill based on total: green/amber/red using same thresholds as percentage cells
- fontSize: 20, bold, centered

### Summary Box
- Type: `rectangle`, borderRadius: 8
- Fill: `#f8fafc`, stroke: `#1e3a5f`
- Content: total fraction, critical gaps list, recommended next action
- Text color: `#64748b` (body)

### Legend Box
- Type: `rectangle`, borderRadius: 8
- Fill: `#f8fafc`, stroke: `#1e3a5f`
- Three rows: green swatch + "Covered", amber swatch + "Partial", red swatch + "Gap"
- Place beside or below the summary box

### Title
- fontSize: 28, fontFamily: 3, color: `#1e40af`

### Subtitle
- fontSize: 16, fontFamily: 1, color: `#3b82f6`

## Example: Sprint 14 Quality Report

```
Title: "Sprint 14 — Test Coverage Map"
Subtitle: "4 features, 4 test types, 16 cells"

Matrix:
              | Unit       | Integration | E2E        | Performance | Coverage
  Auth        | COVERED    | COVERED     | COVERED    | PARTIAL     |   87%
  Payments    | COVERED    | COVERED     | PARTIAL    | GAP         |   62%
  Notifications| COVERED   | GAP         | GAP        | GAP         |   25%
  Dashboard   | COVERED    | COVERED     | COVERED    | COVERED     |  100%
  ------------|------------|-------------|------------|-------------|--------
  By Type     | 100%       | 75%         | 50%        | 25%         |

Total Coverage Badge: 68% (amber)

Summary:
  - 10 of 16 cells covered, 2 partial, 4 gaps
  - Critical gap: Notifications has no integration, E2E, or performance tests
  - Action: Prioritize Notifications integration tests, then Payments E2E

Legend:
  [#a7f3d0] Covered — tests pass, >80% line coverage
  [#fef3c7] Partial — tests exist but <80% coverage or some skipped
  [#fecaca] Gap — no tests for this feature+type combination
```
