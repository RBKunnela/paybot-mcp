---
name: retrospective-map
description: Three-column retro diagram comparing what worked, what didn't, and gaps with action items
type: template
lifecycle_phase: postmortem
visual_pattern: side-by-side-comparison
---

# Retrospective Map Template

## Runbook: How to Visualize Sprint and Project Retrospectives

### When to Use
- Sprint retrospectives (end of iteration)
- Post-mortem analysis after incidents
- Gap analysis between expected and actual outcomes
- Project milestone reviews
- Process improvement workshops
- Comparing planned scope vs delivered scope

### Excalidraw Layout

```
+------------------------------------------------------------------------+
|  TITLE: [Sprint/Project] Retrospective                                 |
|  TYPE: Retrospective Map    DATE: YYYY-MM-DD    SPRINT: [N]            |
+------------------------------------------------------------------------+
|                                                                        |
|  +-- WHAT WORKED ----+  +-- WHAT DIDN'T ----+  +-- GAPS/MISSING ----+ |
|  |                    |  |                    |  |                    | |
|  |  * Story-driven    |  |  * Flaky CI took  |  |  * No load testing | |
|  |    dev kept focus  |  |    30min per run   |  |    before deploy   | |
|  |                    |  |                    |  |                    | |
|  |  * Pair sessions   |  |  * Late QA start  |  |  * Missing error   | |
|  |    on complex code |  |    caused rush     |  |    monitoring      | |
|  |                    |  |                    |  |                    | |
|  |  * ERD diagrams    |  |  * Schema change   |  |  * No runbook for  | |
|  |    saved rework    |  |    broke staging   |  |    rollback        | |
|  |                    |  |                    |  |                    | |
|  +--------------------+  +--------------------+  +--------------------+ |
|                                                                        |
|  +== ACTION ITEMS ====================================================+|
|  |                                                                    ||
|  |  [Fix CI flakiness] ---------> @devops (Gage)                     ||
|  |  [Start QA in parallel] -----> @sm (River)                        ||
|  |  [Add load test step] -------> @qa (Quinn)                        ||
|  |  [Create rollback runbook] --> @dev (Dex)                         ||
|  |                                                                    ||
|  +====================================================================+|
+------------------------------------------------------------------------+
```

### Template Fields

| Field | Description | Example |
|-------|-------------|---------|
| Sprint/project name | What period or effort this covers | `Sprint 14`, `IDS Epic Post-Mortem` |
| Sprint number | Iteration identifier | `14` |
| What worked items | Practices and outcomes worth repeating | `Story-driven dev kept focus` |
| What didn't items | Pain points and failures to address | `Flaky CI took 30min per run` |
| Gaps/missing items | Things absent that should exist | `No load testing before deploy` |
| Action items | Concrete next steps with owners | `Fix CI flakiness -> @devops` |
| Owners | Agent or person responsible for each action | `@devops`, `@sm`, `@qa` |

### Color Assignments

| Element | Fill | Stroke | Usage |
|---------|------|--------|-------|
| "What Worked" column | `#a7f3d0` | `#047857` | End/Success green for positives |
| "What Didn't" column | `#fee2e2` | `#dc2626` | Warning red for problems |
| "Gaps/Missing" column | `#fef3c7` | `#b45309` | Decision amber for unknowns |
| Action items section | `#3b82f6` | `#1e3a5f` | Primary blue for commitments |
| Dot markers | `#64748b` | -- | Body text color, small filled circles |
| Action arrows | `#3b82f6` | `#1e3a5f` | Primary blue, solid arrows to owners |
| Title text | `#1e40af` | -- | Title color |
| Column headers | `#3b82f6` | -- | Subtitle color |
| Item text | `#64748b` | -- | Body text color |
| Owner labels | `#1e40af` | -- | Bold title color for agent names |

### Element Guidance

- **Overall feel**: Use `roughness: 1` for a casual, hand-drawn retrospective feel. This is a collaborative artifact, not a formal diagram.
- **Three columns**: Equal-width rectangles side by side. Each has a colored header bar and white/light body area. Keep columns the same height regardless of item count.
- **Column headers**: Bold text centered at top of each column. Use subtitle color `#3b82f6`.
- **List items**: Each item starts with a small filled circle (dot marker, `#64748b`). Text wraps within column width. Keep items concise -- one line per insight where possible.
- **Action items section**: Full-width rectangle below the three columns. Primary blue fill. Each action is a text label with a solid arrow pointing right to the owner agent name.
- **Arrows to owners**: Solid lines, Primary stroke. Owner names in bold (`#1e40af`). Align arrows vertically for clean visual flow.
- **Spacing**: Leave breathing room between items. The diagram should feel open and scannable, not dense.
- **Layout**: Title at top. Three columns in the middle third. Action items across the bottom third.

### Example: Sprint 14 Retrospective

**What Worked** (Success green column):
- Story-driven development kept the team focused on deliverables
- Pair programming sessions on complex IDS gate code prevented bugs
- ERD diagrams created before implementation saved two rounds of rework
- Unified activation pipeline reduced greeting bugs to zero

**What Didn't Work** (Warning red column):
- Flaky CI pipeline added 30 minutes to every push cycle
- QA started late in the sprint causing a last-day rush
- Schema migration broke staging because it ran before API deploy
- Context window filled up during long agent sessions

**Gaps/Missing** (Decision amber column):
- No load testing step before production deploys
- Missing structured error monitoring (only console logs)
- No documented rollback runbook for database migrations
- No automated regression gate between staging and prod

**Action Items** (Primary blue section):
- `Fix CI flakiness by caching node_modules` --> `@devops (Gage)` -- due Sprint 15
- `Restructure sprint to start QA on Day 3` --> `@sm (River)` -- immediate
- `Add k6 load test to deploy pipeline` --> `@qa (Quinn)` -- due Sprint 15
- `Write migration rollback runbook template` --> `@dev (Dex)` -- due Sprint 15
- `Evaluate Sentry for error monitoring` --> `@analyst (Alex)` -- spike next sprint
