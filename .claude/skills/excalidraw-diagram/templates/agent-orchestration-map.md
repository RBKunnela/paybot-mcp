---
name: agent-orchestration-map
description: AIOS agent orchestration showing phases, task ownership, and handoff arrows
type: template
lifecycle_phase: communication
visual_pattern: assembly-line-fan-out
---

# Agent Orchestration Map Template

## Runbook: How to Visualize Agent Orchestration

### When to Use
- Documenting which agents own which phases in a workflow
- Onboarding new team members to AIOS agent structure
- Planning multi-agent epic execution
- Visualizing handoff points and dependencies between agents
- Debugging workflow bottlenecks or missed handoffs

### Excalidraw Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  TITLE: [Workflow Name]                                             │
│  TYPE: Agent Orchestration    DATE: YYYY-MM-DD    EPIC: [ID]        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  AGENTS:                                                            │
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐      │
│  │  @pm   │  │  @sm   │  │  @dev  │  │  @qa   │  │@devops │      │
│  │ Morgan │  │ River  │  │  Dex   │  │ Quinn  │  │  Gage  │      │
│  └───┬────┘  └───┬────┘  └───┬────┘  └───┬────┘  └───┬────┘      │
│      │           │           │           │           │              │
│  PHASES:         │           │           │           │              │
│      v           │           │           │           │              │
│  ┌────────────┐  │           │           │           │              │
│  │ Phase 1:   │──┘           │           │           │              │
│  │ Plan       │  v           │           │           │              │
│  └────────────┘  ┌────────────┐          │           │              │
│                  │ Phase 2:   │──────────┘           │              │
│                  │ Create     │  v                    │              │
│                  └────────────┘  ┌────────────┐      │              │
│                                  │ Phase 3:   │──────┘              │
│                                  │ Implement  │  v                  │
│                                  └────────────┘  ┌────────────┐    │
│                                                  │ Phase 4:   │──┐ │
│                                                  │ Validate   │  │ │
│                                                  └────────────┘  v │
│                                                     ┌────────────┐ │
│                                                     │ Phase 5:   │ │
│                                                     │ Deploy     │ │
│                                                     └────────────┘ │
│                                                                     │
│  HANDOFFS:                                                          │
│  @pm ──"epic ready"──> @sm ──"story drafted"──> @dev               │
│  @dev ──"impl complete"──> @qa ──"QA pass"──> @devops              │
│                                                                     │
│  ┌── LEGEND ───────────────────────────────────────────────────┐    │
│  │  Agent = purple box   Phase = blue box   Handoff = arrow    │    │
│  │  Solid = happy path   Dashed = rejection/rework loop        │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

### Template Fields

```markdown
# Agent Orchestration: [Workflow Name]

## Workflow Overview
[1-2 sentences: what this workflow accomplishes end to end]

## Agents Involved

| Agent | Persona | Role in Workflow | Phase(s) |
|---|---|---|---|
| @pm | Morgan | Epic orchestration, requirements | Plan |
| @sm | River | Story creation from epic | Create |
| @dev | Dex | Code implementation | Implement |
| @qa | Quinn | Quality validation | Validate |
| @devops | Gage | Push, deploy, release | Deploy |

## Phases

| # | Phase | Owner | Input | Output | Gate |
|---|---|---|---|---|---|
| 1 | Plan | @pm | PRD / Epic brief | Epic execution plan | Epic validated |
| 2 | Create | @sm | Epic context | Story file (Draft) | 11-point checklist |
| 3 | Implement | @dev | Story (Ready) | Working code + tests | Self-check pass |
| 4 | Validate | @qa | Implementation | QA verdict | 2+ QA passes |
| 5 | Deploy | @devops | QA PASS | Pushed to remote | All gates green |

## Handoffs

| From | To | Trigger | Artifact Passed |
|---|---|---|---|
| @pm | @sm | "Epic ready for stories" | EPIC-{ID}-EXECUTION.yaml |
| @sm | @dev | "Story drafted and validated" | {epicNum}.{storyNum}.story.md |
| @dev | @qa | "Implementation complete" | Story file + code changes |
| @qa | @devops | "QA PASS (2+ passes)" | QA gate report |

## Rework Loops
| Trigger | From | Back To | Condition |
|---|---|---|---|
| QA FAIL | @qa | @dev | Fix issues, re-submit |
| Story NO-GO | @po | @sm | Revise story, re-validate |

## Dependencies
- [ ] [External dependency or blocker]
```

### Element Guidance

| Element | Shape | Fill | Stroke | Font | Notes |
|---|---|---|---|---|---|
| Agent box | Rounded rectangle (120x70) | `#ddd6fe` | `#6d28d9` | 14px bold `#6d28d9` | Agent name + persona name |
| Phase box | Rectangle (160x60) | `#3b82f6` | `#1e3a5f` | 14px bold `#ffffff` | Phase number + name |
| Start trigger | Rounded rectangle (140x50) | `#fed7aa` | `#c2410c` | 14px `#c2410c` | Entry point of workflow |
| End / success | Rounded rectangle (140x50) | `#a7f3d0` | `#047857` | 14px `#047857` | Final state |
| Handoff arrow | Arrow | none | `#6d28d9` | 12px italic `#64748b` | Label with handoff artifact |
| Rework arrow | Dashed arrow | none | `#dc2626` | 12px `#dc2626` | Points backward in flow |

- **Layout:** horizontal swim-lane style, agents across top, phases flowing left to right
- **roughness:0** for clean professional look
- **Spacing:** 200px between phases, 150px between agent swim lanes
- **Rework loops** shown as dashed red arrows curving back to earlier phases

### Example: Story Development Cycle (SDC)

**Agents:** @pm (Plan) --> @sm (Create) --> @po (Validate) --> @dev (Implement) --> @qa (QA Gate) --> @devops (Push)

**Handoffs:**
- @pm passes EPIC-EXECUTION.yaml to @sm
- @sm passes story.md (Draft) to @po for validation
- @po marks story Ready, @dev picks up
- @dev completes, @qa runs 2-pass validation
- @qa PASS triggers @devops push

**Rework:** @qa FAIL returns to @dev; @po NO-GO returns to @sm
