---
name: concept-map
description: Concept map with labeled relationships between nodes for knowledge modeling
type: template
lifecycle_phase: planning
visual_pattern: cloud-arrows
---

# Concept Map Template

## Runbook: How to Visualize Concept Relationships

### When to Use
- Modeling domain knowledge for a new bounded context
- Explaining relationships between system components
- Onboarding documentation for complex subsystems
- Mapping dependencies before refactoring
- Visualizing how business rules connect to implementation

### Excalidraw Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  TITLE: [Domain/System Name]                                        │
│  TYPE: Concept Map    DATE: YYYY-MM-DD    AUTHOR: [name]            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌──────────┐   "produces"    ┌──────────┐                        │
│   │ Concept  │ ──────────────> │ Concept  │                        │
│   │    A     │                 │    B     │                        │
│   └──────────┘                 └──────────┘                        │
│        │                            │                               │
│        │ "requires"                 │ "validates"                    │
│        v                            v                               │
│   ┌──────────┐   "feeds into" ┌──────────┐                        │
│   │ Concept  │ ──────────────> │ Concept  │                        │
│   │    C     │                 │    D     │                        │
│   └──────────┘                 └──────────┘                        │
│        │                            │                               │
│        └─────── "depends on" ───────┘                               │
│                                                                     │
│   ┌──────────┐                                                      │
│   │ Concept  │  (isolated — no current relationships)               │
│   │    E     │                                                      │
│   └──────────┘                                                      │
│                                                                     │
│  ┌── LEGEND ───────────────────────────────────────────────────┐    │
│  │  Core concept = rectangle   Support = rounded rect           │    │
│  │  AI/LLM = purple   Decision = amber   External = gray       │    │
│  │  Solid arrow = direct   Dashed = indirect   Bold = critical  │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

### Template Fields

```markdown
# Concept Map: [Domain Title]

## Concepts

| ID | Concept | Category | Description |
|---|---|---|---|
| C1 | [Name] | core / support / external / ai | [One-line definition] |
| C2 | [Name] | core / support / external / ai | [One-line definition] |
| C3 | [Name] | core / support / external / ai | [One-line definition] |

## Relationships

| From | Relationship Label | To | Type |
|---|---|---|---|
| C1 | "produces" | C2 | direct |
| C1 | "requires" | C3 | direct |
| C2 | "validates" | C4 | direct |
| C3 | "feeds into" | C4 | indirect |

## Clusters
[Group related concepts — useful for identifying bounded contexts]
- **Cluster A:** C1, C2 — [why they group together]
- **Cluster B:** C3, C4 — [why they group together]

## Gaps and Questions
- [ ] [Missing relationship or unclear connection]
- [ ] [Concept that needs further definition]
```

### Element Guidance

| Element | Shape | Fill | Stroke | Font | Notes |
|---|---|---|---|---|---|
| Core concept | Rectangle (180x80) | `#3b82f6` | `#1e3a5f` | 16px bold `#ffffff` | roughness:0 for clean look |
| Support concept | Rounded rectangle (160x70) | `#60a5fa` | `#1e3a5f` | 14px `#ffffff` | roughness:0 |
| AI/LLM concept | Rectangle (180x80) | `#ddd6fe` | `#6d28d9` | 16px bold `#6d28d9` | roughness:0 |
| Decision concept | Diamond (140x100) | `#fef3c7` | `#b45309` | 14px `#b45309` | roughness:0 |
| External concept | Rectangle (160x70) | `#fee2e2` | `#dc2626` | 14px `#dc2626` | Dashed border |
| Relationship arrow | Arrow | none | `#64748b` | 12px italic `#64748b` | Label centered on arrow |
| Critical relationship | Arrow (bold) | none | `#1e3a5f` | 12px bold `#1e3a5f` | strokeWidth:3 |

- **roughness:0** on all elements for a clean, precise appearance
- **Spacing:** minimum 250px between nodes to leave room for labels
- **Arrow labels** placed at midpoint, slightly offset to avoid overlap
- **Layout:** top-to-bottom or left-to-right flow preferred; avoid crossing arrows

### Example: AIOS Agent Communication

- **Story** (core) --"assigned to"--> **Dev Agent** (ai)
- **Dev Agent** (ai) --"produces"--> **Implementation** (core)
- **Implementation** (core) --"reviewed by"--> **QA Agent** (ai)
- **QA Agent** (ai) --"validates against"--> **Acceptance Criteria** (support)
- **Acceptance Criteria** (support) --"defined in"--> **Story** (core)
