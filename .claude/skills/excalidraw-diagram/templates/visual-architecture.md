# Visual Architecture Template

## Runbook: How to Visualize Architecture Problems

### When to Use
- Service boundary changes
- API contract modifications
- Dependency chain restructuring
- Microservice extraction/merge
- Integration point changes

### Excalidraw Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  TITLE: [Problem Description]                                       │
│  TYPE: Architecture Change    DATE: YYYY-MM-DD    AUTHOR: [name]    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─── CURRENT STATE ───┐     ┌── CHANGE ZONE ──┐    ┌─ TARGET ──┐ │
│  │                      │     │                  │    │            │ │
│  │  [Existing services  │     │  [What changes]  │    │  [End      │ │
│  │   and connections]   │ ──> │  [Red = removed] │ ──>│   state]   │ │
│  │  Color: BLUE         │     │  [Green = added]  │    │  Color:    │ │
│  │                      │     │  [Yellow = risk]  │    │  GREEN     │ │
│  └──────────────────────┘     └──────────────────┘    └────────────┘ │
│                                                                     │
│  ┌─── IMPACT RADIUS ────────────────────────────────────────────┐   │
│  │  Ring 1 (DIRECT):  [services that directly change]           │   │
│  │  Ring 2 (INDIRECT): [services that depend on Ring 1]         │   │
│  │  Ring 3 (POTENTIAL): [services that could be affected]       │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─── LEGEND ───────────────────┐                                   │
│  │  🔴 Problem/Breaking  🟢 Solution  🔵 Unchanged  🟡 Risk       │
│  │  ── Sync call  - - Async  ═══ Critical path                     │
│  └──────────────────────────────┘                                   │
└─────────────────────────────────────────────────────────────────────┘
```

### Template Fields

```markdown
# Architecture Visual: [Problem Title]

## Problem Statement
[1-2 sentences: what is the architecture problem?]

## Scope
- **In Scope:** [services, modules, APIs that change]
- **Out of Scope:** [what we're NOT changing]
- **Deferred:** [what we'll handle later]

## Current State
| Service/Module | Role | Connections |
|---|---|---|
| [name] | [what it does] | [what it connects to] |

## Proposed Change
| Element | Change Type | Description |
|---|---|---|
| [name] | ADD/MODIFY/REMOVE | [what changes] |

## Impact Assessment
| Ring | Elements | Count |
|---|---|---|
| Direct | [names] | X |
| Indirect | [names] | Y |
| Potential | [names] | Z |
| **Total** | | **X+Y+Z** |

## Risk Factors
- [ ] Breaking API contract? → List affected consumers
- [ ] Data migration required? → Link to database-migration template
- [ ] Deployment coordination? → Define deployment sequence
- [ ] Rollback complexity? → Define rollback strategy

## Visual Elements (for Excalidraw)
[Describe each box, arrow, and annotation needed in the diagram]

## Audience-Specific Notes
- **Architect:** [trade-offs and pattern compliance]
- **Dev:** [files to change and implementation order]
- **QA:** [test scenarios and regression risks]
- **DevOps:** [deployment sequence and monitoring]
- **PM:** [user impact and timeline]
```
