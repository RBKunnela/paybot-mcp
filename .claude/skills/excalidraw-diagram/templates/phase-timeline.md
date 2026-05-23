---
name: phase-timeline
description: Horizontal timeline with phases, milestones, and agent assignments for project planning
type: template
lifecycle_phase: planning
visual_pattern: timeline
---

# Phase Timeline Template

## Runbook: How to Visualize Phase Timelines

### When to Use
- MVP or release planning across multiple sprints
- Visualizing project phases with milestones and deadlines
- Communicating delivery roadmap to stakeholders
- Sprint boundary planning with agent assignments
- Tracking progress against a time-bound plan

### Excalidraw Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  TITLE: [Project / Release Name]                                    │
│  TYPE: Phase Timeline    DATE: YYYY-MM-DD    TARGET: [end date]     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  TIMELINE:                                                          │
│                                                                     │
│  [Start]                                                  [End]     │
│    o─────────────┬─────────────┬─────────────┬──────────────o       │
│    │             │             │             │              │        │
│    │  Phase 1    │  Phase 2    │  Phase 3    │  Phase 4     │        │
│    │  Discovery  │  Build      │  Validate   │  Launch      │        │
│    │  W1-W2      │  W3-W6      │  W7-W8      │  W9          │        │
│    │             │             │             │              │        │
│    │      ◆      │      ◆      │      ◆      │       ◆      │        │
│    │   M1: PRD   │  M2: Alpha  │ M3: QA Pass │  M4: Ship    │        │
│    │   approved  │  complete   │             │              │        │
│    │             │             │             │              │        │
│  AGENTS:         │             │             │              │        │
│    @pm @arch     │  @dev @qa   │  @qa        │  @devops     │        │
│    @analyst      │             │             │  @pm         │        │
│                                                                     │
│  ┌── STATUS BAR ───────────────────────────────────────────────┐    │
│  │  [===========>          ] 45% complete                      │    │
│  │  Phase 2 in progress — on track                             │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  ┌── LEGEND ───────────────────────────────────────────────────┐    │
│  │  o = boundary   ◆ = milestone   ── = timeline              │    │
│  │  Green phase = done   Blue = active   Gray = upcoming       │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

### Template Fields

```markdown
# Phase Timeline: [Project Name]

## Overview
- **Start Date:** YYYY-MM-DD
- **Target End Date:** YYYY-MM-DD
- **Total Duration:** [N weeks/sprints]
- **Current Phase:** [phase name]
- **Overall Progress:** [X]%

## Phases

### Phase 1: [Name] — [Start] to [End]
- **Status:** Done / Active / Upcoming
- **Duration:** [N weeks]
- **Agents:** @pm, @architect, @analyst
- **Deliverables:**
  - [Deliverable 1]
  - [Deliverable 2]
- **Milestone:** [M1 name] — [date]

### Phase 2: [Name] — [Start] to [End]
- **Status:** [status]
- **Duration:** [N weeks]
- **Agents:** @dev, @qa
- **Deliverables:**
  - [Deliverable 1]
- **Milestone:** [M2 name] — [date]

### Phase 3: [Name] — [Start] to [End]
- **Status:** [status]
- **Duration:** [N weeks]
- **Agents:** @qa
- **Deliverables:**
  - [Deliverable 1]
- **Milestone:** [M3 name] — [date]

### Phase 4: [Name] — [Start] to [End]
- **Status:** [status]
- **Duration:** [N weeks]
- **Agents:** @devops, @pm
- **Deliverables:**
  - [Deliverable 1]
- **Milestone:** [M4 name] — [date]

## Milestones

| # | Milestone | Date | Gate | Status |
|---|---|---|---|---|
| M1 | [Name] | YYYY-MM-DD | [What must be true] | Done / Pending |
| M2 | [Name] | YYYY-MM-DD | [What must be true] | Done / Pending |
| M3 | [Name] | YYYY-MM-DD | [What must be true] | Done / Pending |
| M4 | [Name] | YYYY-MM-DD | [What must be true] | Done / Pending |

## Risks to Timeline
- [ ] [Risk]: [impact on schedule] — [mitigation]
```

### Element Guidance

| Element | Shape | Fill | Stroke | Font | Notes |
|---|---|---|---|---|---|
| Timeline line | Line (horizontal) | none | `#1e3a5f` | none | strokeWidth:3, full canvas width |
| Phase boundary | Circle (20x20) | `#3b82f6` | `#1e3a5f` | none | Placed on the timeline line |
| Phase label (done) | Rectangle (200x80) | `#a7f3d0` | `#047857` | 16px bold `#047857` | Below timeline, contains name + dates |
| Phase label (active) | Rectangle (200x80) | `#3b82f6` | `#1e3a5f` | 16px bold `#ffffff` | Below timeline |
| Phase label (upcoming) | Rectangle (200x80) | `#f1f5f9` | `#94a3b8` | 16px `#94a3b8` | Below timeline |
| Milestone diamond | Diamond (30x30) | `#fef3c7` | `#b45309` | none | On the timeline at milestone date |
| Milestone label | Free text | none | none | 12px bold `#b45309` | Below the diamond |
| Agent assignment | Free text | none | none | 12px `#6d28d9` | Below phase box, purple for agent names |
| Start marker | Rounded rectangle (100x40) | `#fed7aa` | `#c2410c` | 12px `#c2410c` | Left end of timeline |
| End marker | Rounded rectangle (100x40) | `#a7f3d0` | `#047857` | 12px `#047857` | Right end of timeline |
| Progress bar | Rectangle | `#3b82f6` fill | `#1e3a5f` | 12px `#64748b` | Filled proportional to progress |

- **Layout:** horizontal, left to right, timeline centered vertically
- **roughness:0** for clean professional presentation
- **Spacing:** phase widths proportional to duration (longer phase = wider section)
- **Milestones** sit directly on the timeline as diamonds, labels below
- **Agent names** below each phase box in purple text, no boxes around them

### Example: 4-Phase MVP Build

**Project:** AIOS Dashboard MVP
**Duration:** 9 weeks (W1-W9)

- **Phase 1: Discovery** (W1-W2, Done, green) -- @pm, @architect, @analyst
  - M1: PRD approved (end of W2)
- **Phase 2: Build** (W3-W6, Active, blue) -- @dev, @qa
  - M2: Alpha complete (end of W5)
- **Phase 3: Validate** (W7-W8, Upcoming, gray) -- @qa
  - M3: QA pass with 2+ cycles (end of W8)
- **Phase 4: Launch** (W9, Upcoming, gray) -- @devops, @pm
  - M4: Production deploy (end of W9)

**Progress:** 35% complete, Phase 2 in progress, on track for M2.
