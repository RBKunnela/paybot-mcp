# Feature Planning Visual Template

## Runbook: How to Visualize Feature Planning

### When to Use
- New feature development planning
- Feature redesign or enhancement
- Cross-service feature implementation
- User flow changes

### Excalidraw Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  TITLE: [Feature Name]                                              │
│  TYPE: Feature Planning    DATE: YYYY-MM-DD    AUTHOR: [name]       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌── USER FLOW ────────────────────────────────────────────────┐    │
│  │                                                              │    │
│  │  (Start) ──> [Step 1] ──> [Step 2] ──> [Decision] ──> (End)│    │
│  │                                           │                  │    │
│  │                                           └──> [Alt Path]    │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  ┌── COMPONENT MAP ────────────────────────────────────────────┐    │
│  │                                                              │    │
│  │  ┌─────────┐    ┌─────────┐    ┌─────────┐                 │    │
│  │  │ Frontend │───>│   API   │───>│ Backend │                 │    │
│  │  │ [new]    │    │ [modify]│    │ [new]   │                 │    │
│  │  └─────────┘    └─────────┘    └─────────┘                 │    │
│  │       │              │              │                        │    │
│  │       v              v              v                        │    │
│  │  ┌─────────┐    ┌─────────┐    ┌─────────┐                 │    │
│  │  │  State  │    │ Schema  │    │  Queue  │                  │    │
│  │  │ [new]   │    │ [modify]│    │ [new]   │                  │    │
│  │  └─────────┘    └─────────┘    └─────────┘                 │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  ┌── DEPENDENCIES ─────────────────────────────────────────────┐    │
│  │  Must complete BEFORE: [list]                                │    │
│  │  Can run IN PARALLEL: [list]                                 │    │
│  │  Depends ON: [list]                                          │    │
│  └──────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

### Template Fields

```markdown
# Feature Visual: [Feature Name]

## Feature Summary
[1-2 sentences: what does this feature do for the user?]

## User Flow
| Step | User Action | System Response | UI Element |
|---|---|---|---|
| 1 | [action] | [response] | [component] |
| 2 | [action] | [response] | [component] |

## Component Map
| Component | Type | Change | Priority |
|---|---|---|---|
| [name] | Frontend/API/Backend/DB | NEW/MODIFY | P0/P1/P2 |

## Data Model
| Entity | Fields | Relationships |
|---|---|---|
| [name] | [field list] | [FK/references] |

## API Changes
| Endpoint | Method | Change | Breaking? |
|---|---|---|---|
| [path] | GET/POST/etc | NEW/MODIFY | YES/NO |

## Dependencies
| Dependency | Type | Status | Blocker? |
|---|---|---|---|
| [name] | Must-before/Parallel/External | READY/PENDING | YES/NO |

## Acceptance Criteria
- [ ] [Criterion 1: GIVEN/WHEN/THEN]
- [ ] [Criterion 2: GIVEN/WHEN/THEN]

## Audience-Specific Notes
- **PM/PO:** [user story, business value, success metrics]
- **Dev:** [implementation approach, tech decisions, patterns]
- **QA:** [test scenarios, edge cases, performance criteria]
- **DevOps:** [new infrastructure, monitoring, feature flags]
- **SM:** [task breakdown, sprint fit, dependencies]
```
