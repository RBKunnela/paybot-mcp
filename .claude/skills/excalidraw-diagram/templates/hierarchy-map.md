---
name: hierarchy-map
description: Epic-Story-Task tree visualization with status color coding
type: template
lifecycle_phase: planning
visual_pattern: tree
---

# Hierarchy Map Template

## Runbook: How to Visualize Epic/Story/Task Trees

### When to Use
- Visualizing epic breakdown into stories and tasks
- Sprint planning to see full scope at a glance
- Tracking progress across a multi-story epic
- Identifying blocked or at-risk work items
- Stakeholder updates on delivery progress

### Excalidraw Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  TITLE: [Epic Name]                                                 │
│  TYPE: Hierarchy Map    DATE: YYYY-MM-DD    EPIC: [ID]              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│                    EPIC: [Title]                                     │
│                    (large text, primary color)                       │
│                         │                                           │
│          ┌──────────────┼──────────────┐                            │
│          │              │              │                             │
│     STORY 1.1      STORY 1.2      STORY 1.3                        │
│     (medium text)  (medium text)  (medium text)                     │
│     [DONE]         [IN PROGRESS]  [NOT STARTED]                     │
│          │              │              │                             │
│     ┌────┼────┐    ┌────┼────┐    ┌────┤                            │
│     │    │    │    │    │    │    │    │                             │
│    T1   T2   T3  T4   T5   T6  T7   T8                             │
│    (small text, status-colored)                                     │
│                                                                     │
│  STATUS KEY:                                                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │  DONE    │  │IN PROGRESS│  │ BLOCKED  │  │NOT STARTED│           │
│  │  green   │  │  amber    │  │   red    │  │   gray    │           │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘           │
│                                                                     │
│  PROGRESS: [X/Y stories done] [A/B tasks done]                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Template Fields

```markdown
# Hierarchy Map: [Epic Title]

## Epic
- **ID:** EPIC-{N}
- **Title:** [Epic title]
- **Status:** [overall status]
- **Progress:** [X/Y stories done]

## Stories

### Story 1.1: [Title]
- **Status:** Done / InProgress / Blocked / NotStarted
- **Points:** [estimate]
- **Tasks:**
  - [x] Task 1: [description] — Done
  - [ ] Task 2: [description] — InProgress
  - [ ] Task 3: [description] — NotStarted

### Story 1.2: [Title]
- **Status:** [status]
- **Points:** [estimate]
- **Tasks:**
  - [ ] Task 4: [description] — [status]
  - [ ] Task 5: [description] — [status]

### Story 1.3: [Title]
- **Status:** [status]
- **Points:** [estimate]
- **Tasks:**
  - [ ] Task 6: [description] — [status]

## Dependencies
| Story/Task | Depends On | Type |
|---|---|---|
| Story 1.3 | Story 1.1 | Must complete first |
| Task 5 | Task 4 | Sequential |

## Risks
- [Blocked item]: [reason and mitigation]
```

### Element Guidance

| Element | Shape | Fill | Stroke | Font | Notes |
|---|---|---|---|---|---|
| Epic title | Free text (no box) | none | none | 28px bold `#1e40af` | Top center of canvas |
| Story (Done) | Rounded rectangle (180x50) | `#a7f3d0` | `#047857` | 18px bold `#047857` | Green = completed |
| Story (InProgress) | Rounded rectangle (180x50) | `#fef3c7` | `#b45309` | 18px bold `#b45309` | Amber = active |
| Story (Blocked) | Rounded rectangle (180x50) | `#fee2e2` | `#dc2626` | 18px bold `#dc2626` | Red = blocked |
| Story (NotStarted) | Rounded rectangle (180x50) | `#f1f5f9` | `#94a3b8` | 18px `#94a3b8` | Gray = not started |
| Task (Done) | Free text | none | none | 12px strikethrough `#047857` | Below parent story |
| Task (InProgress) | Free text | none | none | 12px `#b45309` | Below parent story |
| Task (Blocked) | Free text | none | none | 12px `#dc2626` | Below parent story |
| Task (NotStarted) | Free text | none | none | 12px `#94a3b8` | Below parent story |
| Tree connectors | Line | none | `#64748b` | none | strokeWidth:1, roughness:0 |
| Dependency arrow | Dashed arrow | none | `#dc2626` | 10px italic `#dc2626` | Between dependent items |

- **Layout:** top-down tree, epic at root, stories as mid-level, tasks as leaves
- **roughness:0** for clean readability
- **Spacing:** 250px vertical between levels, 200px horizontal between siblings
- **Tasks use free text** (not boxes) to reduce visual weight at the leaf level
- **Progress bar** at bottom: simple rectangle with filled portion proportional to completion

### Example: Epic IDS - Incremental Development System

**EPIC: IDS - Incremental Development System** (28px, blue)

- **Story IDS-1: Entity Registry** -- DONE (green)
  - T1: Schema design -- Done
  - T2: CRUD operations -- Done
  - T3: Search queries -- Done
- **Story IDS-2: Decision Engine** -- IN PROGRESS (amber)
  - T4: Scoring algorithm -- Done
  - T5: REUSE/ADAPT/CREATE logic -- InProgress
  - T6: Registry integration -- NotStarted
- **Story IDS-3: Verification Gates** -- NOT STARTED (gray)
  - T7: G1-G4 gate stubs -- NotStarted
  - T8: Circuit breaker -- NotStarted
