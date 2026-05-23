# Excalidraw Visual Tool — MANDATORY for ALL Agents

globs: ["**/*"]

## ENFORCEMENT

**This is NOT optional.** Every AIOS agent MUST use the excalidraw-diagram skill to create visual diagrams when the situation calls for it. Diagrams are essential for humans — for understanding, for presentations, for videos, for aligning teams on concepts.

**MANDATORY triggers — you MUST create a diagram when:**
- Explaining architecture with 3+ components
- Planning an epic, sprint, or multi-story feature
- Documenting database schema (ERD)
- Showing test coverage or gaps
- Presenting to non-technical stakeholders
- Comparing before/after states
- The user asks to visualize, diagram, draw, or map anything
- Completing a sprint (retrospective diagram)
- Designing agent orchestration or handoff flows

**Default theme: DARK.** Canvas background `#1e1e2e`. Read `color-palette.md` for all colors.

---

## How to Use (3 Steps)

### Step 1: Find the right template

Read `.claude/skills/excalidraw-diagram/references/diagram-type-router.md` — decision tree:

| Situation | Template (relative to `.claude/skills/excalidraw-diagram/templates/`) |
|-----------|----------|
| Brainstorm ideas | `mind-map.md` |
| Concept relationships | `concept-map.md` |
| Agent orchestration (who does what) | `agent-orchestration-map.md` |
| Epic/Story/Task hierarchy | `hierarchy-map.md` |
| Phase timeline / roadmap | `phase-timeline.md` |
| System for stakeholders | `system-context.md` |
| Data flow | `data-flow.md` |
| State machine | `state-machine.md` |
| Test coverage / gaps | `coverage-map.md` |
| Database ERD | `erd.md` |
| Deployment topology | `deployment-topology.md` |
| Retrospective | `retrospective-map.md` |
| Architecture | `visual-architecture.md` |
| Database migration | `database-migration.md` |
| Feature planning | `feature-planning.md` |
| Bug analysis | `bug-analysis.md` |

### Step 2: Create the diagram

1. Read the template at `.claude/skills/excalidraw-diagram/templates/{template-name}`
2. Read `.claude/skills/excalidraw-diagram/SKILL.md` for design methodology
3. Read `.claude/skills/excalidraw-diagram/references/color-palette.md` for dark theme colors
4. Generate `.excalidraw` JSON **section-by-section** (NEVER one shot for large diagrams)
5. Save to `docs/diagrams/{context}-{type}.excalidraw`

### Step 3: Render and show to user

```bash
cd .claude/skills/excalidraw-diagram/references && uv run python render_excalidraw.py <path.excalidraw>
```

Then use the **Read tool** on the generated PNG to view it. Fix and re-render until clean.

---

## All Paths (Self-Contained in Skill)

| File | Path |
|------|------|
| Skill methodology | `.claude/skills/excalidraw-diagram/SKILL.md` |
| Diagram type router | `.claude/skills/excalidraw-diagram/references/diagram-type-router.md` |
| Lifecycle triggers | `.claude/skills/excalidraw-diagram/references/lifecycle-phase-triggers.md` |
| Color palette (DARK) | `.claude/skills/excalidraw-diagram/references/color-palette.md` |
| Element JSON templates | `.claude/skills/excalidraw-diagram/references/element-templates.md` |
| Render script | `.claude/skills/excalidraw-diagram/references/render_excalidraw.py` |
| Diagram templates | `.claude/skills/excalidraw-diagram/templates/*.md` |

---

## Agent-Specific Guidance

| Agent | Most Relevant Diagrams |
|-------|----------------------|
| `@architect` | system-context, visual-architecture, data-flow, erd |
| `@dev` | data-flow, state-machine, erd |
| `@qa` | coverage-map, bug-analysis |
| `@pm` | hierarchy-map, phase-timeline, system-context |
| `@po` | hierarchy-map, mind-map |
| `@sm` | phase-timeline, agent-orchestration-map, retrospective-map |
| `@analyst` | mind-map, concept-map |
| `@data-engineer` | erd, data-flow |
| `@ux-design-expert` | system-context, mind-map |
| `@devops` | deployment-topology |
