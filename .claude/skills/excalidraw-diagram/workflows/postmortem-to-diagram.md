---
name: postmortem-to-diagram
description: Post-mortem workflow — document the system as-built with ERDs, deployment topology, and retrospective maps.
type: workflow
phases: 5
owner: "@architect, @data-engineer, @devops, @sm"
triggers:
  - "Sprint/project complete"
  - "System documentation needed"
  - "Database schema documentation"
  - "Deployment architecture review"
  - "Retrospective session"
  - "User says 'document what we built', 'show the schema', 'retro diagram'"
---

# Workflow: Post-Mortem to Diagram

Document the system as-built. Produces up to 3 diagrams: ERD, deployment topology, and retrospective map.

## Overview

```
INVENTORY → CLASSIFY → DIAGRAM(S) → COMPARE → VALIDATE
     │           │           │           │          │
     ▼           ▼           ▼           ▼          ▼
  Catalog     Which       Generate    Compare     Render
  what was    diagrams    each one    to original  PNG loop
  built       needed?                 plan
```

---

## Phase 1: INVENTORY — Catalog What Was Built

**Input:** Codebase, database, deployment config, git history
**Output:** System inventory

### Gather

1. **Database**: Read schema/migrations → list tables, columns, relationships
2. **Deployment**: Read config files → list services, environments, connections
3. **Features**: Read stories/git log → list what was implemented vs planned
4. **Issues**: Read QA reports → list what worked, what didn't, what's missing

---

## Phase 2: CLASSIFY — Which Diagrams Needed?

**Input:** System inventory
**Output:** Diagram list (1-3)

| If you have... | Create... | Template |
|----------------|-----------|----------|
| Database with 3+ tables | **ERD** | `erd.md` |
| Multi-service deployment | **Deployment Topology** | `deployment-topology.md` |
| Sprint/project ending | **Retrospective Map** | `retrospective-map.md` |
| All three | Create all three |

### Decision Rules
- **Always** create retrospective map at end of sprint/project
- **Add** ERD if database was created or significantly changed
- **Add** deployment topology if infrastructure was set up or changed

---

## Phase 3: DIAGRAM — Generate Each Diagram

**Input:** Inventory + chosen templates
**Output:** `.excalidraw` files

### Steps

1. Read each template from `squads/visual-engineers/templates/`
2. For ERD: extract actual table/column/FK data from migrations or schema
3. For Deployment: extract actual service names, ports, URLs from config
4. For Retrospective: collect team feedback or analyze git history for patterns
5. Build each diagram section-by-section

### Output Paths
```
docs/diagrams/{project}-erd.excalidraw
docs/diagrams/{project}-deployment.excalidraw
docs/diagrams/{project}-retrospective.excalidraw
```

---

## Phase 4: COMPARE — Compare to Original Plan

**Input:** As-built diagrams + original PRD/plan diagrams
**Output:** Gap annotations

### Steps

1. If original planning diagrams exist (hierarchy map, timeline), compare:
   - What was planned but not built? (annotate in retrospective)
   - What was built but not planned? (annotate as scope change)
   - What changed from the plan? (annotate as adaptation)
2. Add "Planned vs Actual" annotations to retrospective map
3. This phase is optional if no original plan diagrams exist

---

## Phase 5: VALIDATE — Render & Verify

**Input:** `.excalidraw` files
**Output:** Validated PNGs

### Steps

1. Render each:
   ```bash
   cd .claude/skills/excalidraw-diagram/references && uv run python render_excalidraw.py <path.excalidraw>
   ```
2. View each PNG with Read tool
3. ERD check: do tables match actual schema? Are all FKs shown?
4. Deployment check: does topology match actual infrastructure?
5. Retrospective check: are "worked/didn't/gaps" columns balanced and honest?
6. Fix and re-render until clean

### Done When
- Diagrams accurately reflect the actual system (not the plan)
- Someone joining the project tomorrow could understand the system from these diagrams
- Gaps between plan and reality are visible in the retrospective
