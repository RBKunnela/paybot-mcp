# Bug Analysis Visual Template

## Runbook: How to Visualize Bug Analysis

### When to Use
- Production bugs needing team coordination
- Performance issues spanning multiple services
- Data integrity problems
- Regression analysis
- Error cascade investigation

### Excalidraw Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  TITLE: [Bug Description]                                           │
│  TYPE: Bug Analysis    SEVERITY: P0/P1/P2    DATE: YYYY-MM-DD      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌── ERROR FLOW ───────────────────────────────────────────────┐    │
│  │                                                              │    │
│  │  [Trigger] ──> [Component A] ──X──> [Failure Point]         │    │
│  │                     │                      │                 │    │
│  │                     v                      v                 │    │
│  │              [Side Effect 1]        [Error Response]         │    │
│  │                                            │                 │    │
│  │                                            v                 │    │
│  │                                     [User Impact]            │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  ┌── BLAST RADIUS ─────────────────────────────────────────────┐    │
│  │                                                              │    │
│  │            ┌───────────────────────┐                         │    │
│  │            │  Ring 3: POTENTIAL    │                          │    │
│  │            │  ┌─────────────────┐ │                          │    │
│  │            │  │ Ring 2: INDIRECT│ │                          │    │
│  │            │  │ ┌─────────────┐│ │                          │    │
│  │            │  │ │Ring 1: BUG  ││ │                          │    │
│  │            │  │ │ [epicenter] ││ │                          │    │
│  │            │  │ └─────────────┘│ │                          │    │
│  │            │  └─────────────────┘ │                          │    │
│  │            └───────────────────────┘                         │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  ┌── ROOT CAUSE → FIX ────────────────────────────────────────┐     │
│  │  CAUSE: [root cause description]                            │     │
│  │  FIX:   [proposed fix]                                      │     │
│  │  VERIFY: [how to verify the fix works]                      │     │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

### Template Fields

```markdown
# Bug Visual: [Bug Title]

## Bug Summary
- **Severity:** P0/P1/P2/P3
- **Impact:** [who is affected and how]
- **First Reported:** [date/time]
- **Frequency:** [always/intermittent/rare]

## Error Flow
| Step | Component | Action | Result | Expected Result |
|---|---|---|---|---|
| 1 | [trigger] | [action] | [actual] | [expected] |
| 2 | [component] | [action] | [failure] | [expected] |

## Blast Radius
| Ring | Components | Impact Type |
|---|---|---|
| Epicenter | [bug location] | Direct failure |
| Ring 1 | [direct deps] | Error propagation |
| Ring 2 | [indirect deps] | Degraded behavior |
| Ring 3 | [potential] | Risk under load |

## Root Cause Analysis
- **Proximate Cause:** [what directly caused the error]
- **Root Cause:** [underlying reason]
- **Contributing Factors:** [conditions that enabled the bug]

## Fix Specification
| Fix | File | Change | Risk |
|---|---|---|---|
| [fix 1] | [file] | [description] | HIGH/MED/LOW |

## Verification Plan
| Test | Type | Verifies |
|---|---|---|
| [test 1] | Unit/Integration/E2E | [what it proves] |

## Regression Prevention
- [ ] Test added for this specific scenario
- [ ] Related scenarios covered
- [ ] Monitoring/alerting for recurrence

## Audience-Specific Notes
- **Dev:** [code location, fix approach, related code]
- **QA:** [reproduction steps, test scenarios, regression scope]
- **DevOps:** [hotfix deployment plan, monitoring]
- **PM:** [user impact, communication plan, timeline]
```
