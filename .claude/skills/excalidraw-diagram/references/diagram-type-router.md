---
name: diagram-type-router
description: Decision tree for any agent to find the right Excalidraw diagram type and template for their situation.
type: reference
---

# Diagram Type Router

**Any AIOS agent can use this.** Match your situation to a diagram type, find the template, create the diagram.

## How to Use

1. Find your situation in the decision tree below
2. Note the **template** path
3. Read the template from `.claude/skills/excalidraw-diagram/templates/{template}.md`
4. Follow the template's runbook to create the `.excalidraw` file
5. Render with: `cd .claude/skills/excalidraw-diagram/references && uv run python render_excalidraw.py <path.excalidraw>`
6. View the PNG with the Read tool to validate

## Decision Tree

```
What are you trying to do?
│
├─ EXPLORE IDEAS (greenfield, brainstorm, ideation)
│  ├─ Free-form ideas, no structure yet ──────────── mind-map.md
│  └─ Ideas WITH relationships between them ─────── concept-map.md
│
├─ PLAN WORK (who does what, when, dependencies)
│  ├─ Show which agents handle which tasks ──────── agent-orchestration-map.md
│  ├─ Show Epic → Story → Task hierarchy ────────── hierarchy-map.md
│  └─ Show phases/sprints over time ─────────────── phase-timeline.md
│
├─ EXPLAIN TO OTHERS (stakeholders, AI, team)
│  ├─ High-level system for non-technical people ── system-context.md
│  ├─ Architecture for developers ───────────────── visual-architecture.md (existing)
│  └─ What changed (before/after) ───────────────── visual-architecture.md (existing, before/after mode)
│
├─ GUIDE IMPLEMENTATION (during build)
│  ├─ How data moves through the system ─────────── data-flow.md
│  ├─ States and transitions ────────────────────── state-machine.md
│  ├─ Component breakdown ───────────────────────── visual-architecture.md (existing)
│  └─ Database changes ──────────────────────────── database-migration.md (existing)
│
├─ VALIDATE QUALITY (testing, QA, gaps)
│  ├─ What's tested vs what's not ───────────────── coverage-map.md
│  └─ Bug analysis ──────────────────────────────── bug-analysis.md (existing)
│
└─ DOCUMENT RESULTS (post-mortem, as-built)
   ├─ Database schema (ERD) ─────────────────────── erd.md
   ├─ Infrastructure / deployment ───────────────── deployment-topology.md
   └─ What worked / what didn't / gaps ──────────── retrospective-map.md
```

## Quick Reference Table

| Situation | Template | Pattern | Colors |
|-----------|----------|---------|--------|
| Brainstorm ideas | `mind-map.md` | Fan-out (radial) | Start/Trigger (orange) |
| Map concept relationships | `concept-map.md` | Nodes + labeled arrows | Primary (blue) |
| Agent orchestration | `agent-orchestration-map.md` | Assembly-line + fan-out | AI (purple) + Primary (blue) |
| Epic/Story/Task tree | `hierarchy-map.md` | Tree (lines + text) | Primary hierarchy |
| Phase timeline | `phase-timeline.md` | Timeline (dots + labels) | Primary + Decision (amber) |
| System for stakeholders | `system-context.md` | Boundary boxes | Primary + Secondary |
| Data flow | `data-flow.md` | Assembly line | Primary + Start/End |
| State machine | `state-machine.md` | Cycle (states + transitions) | Decision (amber) |
| Test coverage | `coverage-map.md` | Grid (color-coded) | Success/Warning/Error |
| Database ERD | `erd.md` | Tables + FK arrows | Primary + Secondary |
| Deployment topology | `deployment-topology.md` | Boundary + cloud | Primary + AI (purple) |
| Retrospective | `retrospective-map.md` | Side-by-side | Success + Warning |

## Template Location

All templates: `.claude/skills/excalidraw-diagram/templates/{name}.md`

This is inside the skill — syncs to all projects via `.claude/` auto-sync.

## Output Convention

Save diagrams to: `docs/diagrams/{context}-{type}.excalidraw`

Examples:
- `docs/diagrams/sprint-5-brainstorm.excalidraw`
- `docs/diagrams/epic-3-hierarchy.excalidraw`
- `docs/diagrams/auth-service-erd.excalidraw`
- `docs/diagrams/qa-coverage-sprint-5.excalidraw`
