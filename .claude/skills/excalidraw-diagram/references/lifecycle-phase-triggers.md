---
name: lifecycle-phase-triggers
description: Maps each AIOS development lifecycle phase to the diagram types that should be created at that moment.
type: reference
---

# Lifecycle Phase Triggers

When should you create a diagram? This reference maps AIOS lifecycle moments to the right diagram type.

**Rule:** Diagrams are not mandatory at every phase. Create them when they add clarity that words alone cannot provide.

---

## AIOS Story Development Cycle (SDC)

| SDC Phase | Agent | When to Diagram | Diagram Type | Template |
|-----------|-------|-----------------|--------------|----------|
| Pre-Phase: AIDR | @architect | AI architecture decision | `system-context` | `system-context.md` |
| Phase 1: Create | @sm | Complex story with many tasks | `hierarchy-map` | `hierarchy-map.md` |
| Phase 2: Validate | @po | Story scope unclear to team | `system-context` | `system-context.md` |
| Phase 3: Implement | @dev | Multi-component feature | `data-flow` or `state-machine` | `data-flow.md` / `state-machine.md` |
| Phase 3.5: Self-Check | @dev | Verify test coverage | `coverage-map` | `coverage-map.md` |
| Phase 4: QA Gate | @qa | Document test coverage + gaps | `coverage-map` | `coverage-map.md` |
| Phase 5: Push | @devops | Deployment topology change | `deployment-topology` | `deployment-topology.md` |

## Spec Pipeline

| Spec Phase | Agent | When to Diagram | Diagram Type | Template |
|------------|-------|-----------------|--------------|----------|
| 1. Gather | @pm | Complex requirements | `mind-map` or `concept-map` | `mind-map.md` / `concept-map.md` |
| 2. Assess | @architect | Architecture impact | `system-context` | `system-context.md` |
| 3. Research | @analyst | Mapping research findings | `concept-map` | `concept-map.md` |
| 4. Write Spec | @pm | Feature architecture | `visual-architecture` | `visual-architecture.md` |
| 5. Critique | @qa | Gap analysis | `coverage-map` | `coverage-map.md` |
| 6. Plan | @architect | Implementation plan | `hierarchy-map` + `phase-timeline` | Both templates |

## Epic / Sprint Planning

| Moment | Agent | Diagram Type | Template |
|--------|-------|--------------|----------|
| Epic breakdown | @pm | `hierarchy-map` | `hierarchy-map.md` |
| Sprint planning | @sm | `phase-timeline` | `phase-timeline.md` |
| Agent assignment | @pm/@sm | `agent-orchestration-map` | `agent-orchestration-map.md` |
| Stakeholder alignment | @pm | `system-context` | `system-context.md` |

## Greenfield / Brownfield

| Moment | Agent | Diagram Type | Template |
|--------|-------|--------------|----------|
| New project ideation | Any | `mind-map` | `mind-map.md` |
| Brownfield discovery | @architect | `visual-architecture` (current state) | `visual-architecture.md` |
| Database audit | @data-engineer | `erd` | `erd.md` |
| Tech debt mapping | @architect | `retrospective-map` | `retrospective-map.md` |

## Post-Implementation

| Moment | Agent | Diagram Type | Template |
|--------|-------|--------------|----------|
| Feature complete | @dev | `data-flow` (as-built) | `data-flow.md` |
| Sprint retro | @sm | `retrospective-map` | `retrospective-map.md` |
| Database final state | @data-engineer | `erd` | `erd.md` |
| Deployment documentation | @devops | `deployment-topology` | `deployment-topology.md` |
| QA summary | @qa | `coverage-map` | `coverage-map.md` |

---

## Trigger Heuristics

**Always create a diagram when:**
- 3+ people need to align on the same thing
- The system has 4+ interacting components
- You're explaining something to a non-technical audience
- A before/after comparison would clarify the change
- Test coverage has gaps that need to be visible

**Skip the diagram when:**
- Single-file change with obvious scope
- The team already has shared understanding
- A bullet list communicates just as well

---

## Render & View

After creating any `.excalidraw` file:

```bash
cd .claude/skills/excalidraw-diagram/references && uv run python render_excalidraw.py <path.excalidraw>
```

Then use the Read tool on the generated PNG to view and validate.
