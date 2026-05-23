# Database Migration Visual Template

## Runbook: How to Visualize Database Problems

### When to Use
- Schema changes (add/remove/modify tables/columns)
- Data migration between schemas
- Index optimization changes
- Foreign key restructuring
- Database splitting or consolidation

### Excalidraw Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  TITLE: [Migration Description]                                     │
│  TYPE: Database Migration    DATE: YYYY-MM-DD    AUTHOR: [name]     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌── CURRENT SCHEMA ──┐      ┌── MIGRATION ──┐     ┌── TARGET ──┐ │
│  │                     │      │               │     │             │ │
│  │  ┌─────────┐       │      │  Step 1: ...  │     │  ┌────────┐│ │
│  │  │ table_a │──FK──>│──────│  Step 2: ...  │────>│  │ new_a  ││ │
│  │  └─────────┘       │      │  Step 3: ...  │     │  └────────┘│ │
│  │  ┌─────────┐       │      │               │     │  ┌────────┐│ │
│  │  │ table_b │       │      │  [Data flow]  │     │  │ new_b  ││ │
│  │  └─────────┘       │      │               │     │  └────────┘│ │
│  └─────────────────────┘      └───────────────┘     └────────────┘ │
│                                                                     │
│  ┌── DATA FLOW ────────────────────────────────────────────────┐    │
│  │  table_a (1M rows) ──transform──> new_a (1M rows)          │    │
│  │  table_b (500K rows) ──split──> new_b + new_c              │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  ┌── RISK ZONES ──────────────────────────────────────────────┐     │
│  │  🔴 FK constraint: table_a.user_id -> users.id (CASCADE)  │     │
│  │  🟡 Index rebuild: estimated 15 min downtime               │     │
│  │  🟢 Backward compatible: old queries still work            │     │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

### Template Fields

```markdown
# Database Visual: [Migration Title]

## Problem Statement
[What database change is needed and why?]

## Current Schema
| Table | Rows (est.) | Key Columns | Foreign Keys |
|---|---|---|---|
| [name] | [count] | [columns] | [FK references] |

## Target Schema
| Table | Change | New Columns | Removed Columns | Modified Columns |
|---|---|---|---|---|
| [name] | ADD/MODIFY/DROP | [list] | [list] | [list] |

## Migration Steps (Ordered)
| Step | Action | Estimated Time | Reversible? |
|---|---|---|---|
| 1 | [action] | [time] | YES/NO |
| 2 | [action] | [time] | YES/NO |

## Data Flow
| Source | Rows | Transform | Destination | Validation |
|---|---|---|---|---|
| [table] | [count] | [operation] | [table] | [check] |

## Risk Assessment
| Risk | Severity | Mitigation |
|---|---|---|
| Data loss | HIGH/MED/LOW | [mitigation strategy] |
| Downtime | HIGH/MED/LOW | [mitigation strategy] |
| FK violations | HIGH/MED/LOW | [mitigation strategy] |
| Performance degradation | HIGH/MED/LOW | [mitigation strategy] |

## Rollback Plan
| Step | Rollback Action | Data Recovery |
|---|---|---|
| 1 | [reverse action] | [how to recover data] |

## Audience-Specific Notes
- **DBA:** [index strategy, query impact, maintenance window]
- **Dev:** [ORM changes, migration code, feature flags]
- **QA:** [data integrity tests, performance benchmarks]
- **DevOps:** [backup schedule, monitoring, maintenance window]
- **PM:** [downtime impact, user communication needed]
```
