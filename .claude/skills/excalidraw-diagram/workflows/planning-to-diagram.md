---
name: planning-to-diagram
description: Planning workflow — transform PRDs, epics, and sprint plans into hierarchy maps, timelines, and agent orchestration diagrams.
type: workflow
phases: 5
owner: "@pm, @sm, @architect"
triggers:
  - "Epic breakdown needed"
  - "Sprint planning session"
  - "Agent assignment visualization"
  - "PRD phase visualization"
  - "User says 'plan diagram', 'show the phases', 'who does what'"
---

# Workflow: Planning to Diagram

Transform planning artifacts (PRD, epic, sprint plan) into visual diagrams. Can produce 1-3 diagrams depending on need.

## Overview

```
INTAKE → CLASSIFY → DIAGRAM(S) → CROSS-LINK → VALIDATE
   │         │           │            │            │
   ▼         ▼           ▼            ▼            ▼
 Parse    Which      Generate      Connect       Render
 source   diagrams   each one     diagrams      PNG loop
           needed?   separately   if multiple
```

---

## Phase 1: INTAKE — Parse Source Material

**Input:** PRD, epic definition, sprint plan, or conversation
**Output:** Structured planning data

### Extract

| Field | Source |
|-------|--------|
| Phases/milestones | PRD phases, sprint boundaries |
| Stories/tasks | Epic breakdown, backlog |
| Agent assignments | Workflow definitions, SDC phases |
| Dependencies | Story dependencies, blocking relationships |
| Timeline | Sprint dates, deadlines |

---

## Phase 2: CLASSIFY — Which Diagrams Needed?

**Input:** Planning data
**Output:** Diagram list (1-3 diagrams)

| If you have... | Create... | Template |
|----------------|-----------|----------|
| Epic with stories and tasks | **Hierarchy Map** | `hierarchy-map.md` |
| Phases with dates/milestones | **Phase Timeline** | `phase-timeline.md` |
| Agent assignments and handoffs | **Agent Orchestration Map** | `agent-orchestration-map.md` |
| All three | Create all three — they complement each other |

### Decision Rules
- **Always** create a hierarchy map if there's an epic breakdown
- **Add** timeline if there are dates or phase boundaries
- **Add** orchestration if multiple agents are involved

---

## Phase 3: DIAGRAM — Generate Each Diagram

**Input:** Planning data + chosen templates
**Output:** `.excalidraw` files

### Steps

1. Read each chosen template from `squads/visual-engineers/templates/`
2. Generate each diagram following the template's runbook
3. Build section-by-section (mandatory)
4. Use consistent IDs across diagrams for cross-referencing

### Output Paths
```
docs/diagrams/{epic-id}-hierarchy.excalidraw
docs/diagrams/{epic-id}-timeline.excalidraw
docs/diagrams/{epic-id}-orchestration.excalidraw
```

---

## Phase 4: CROSS-LINK — Connect Diagrams

**Input:** Multiple diagrams
**Output:** Cross-referenced diagrams

If multiple diagrams were created:
1. Add a "See also" annotation in each diagram pointing to the others
2. Use consistent color-coding for the same stories/phases across diagrams
3. Ensure agent names match exactly between orchestration map and timeline

---

## Phase 5: VALIDATE — Render & Fix

**Input:** `.excalidraw` files
**Output:** Validated PNGs

### Steps

1. Render each diagram:
   ```bash
   cd .claude/skills/excalidraw-diagram/references && uv run python render_excalidraw.py <path.excalidraw>
   ```
2. View each PNG with Read tool
3. Hierarchy check: does the tree accurately reflect the epic breakdown?
4. Timeline check: are phases in correct order? Milestones placed right?
5. Orchestration check: do handoff arrows flow correctly between agents?
6. Fix and re-render until clean

### Done When
- All planning data from Phase 1 is represented
- Diagrams are consistent with each other
- A PM could use these to run a sprint planning meeting
