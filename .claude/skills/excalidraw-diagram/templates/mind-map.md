---
name: mind-map
description: Radial mind map for brainstorming sessions with central idea and 3-level branching
type: template
lifecycle_phase: brainstorm
visual_pattern: fan-out
---

# Mind Map Template

## Runbook: How to Visualize Brainstorming with Mind Maps

### When to Use
- Brainstorming sessions for new features or epics
- Exploring solution space before committing to architecture
- Mapping out related concepts during discovery
- Team ideation and divergent thinking
- Breaking down a large problem into sub-problems

### Excalidraw Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  TITLE: [Brainstorm Topic]                                          │
│  TYPE: Mind Map    DATE: YYYY-MM-DD    AUTHOR: [name]               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│                        [Branch 1.1]                                  │
│                       /                                              │
│            [Branch 1] ── [Branch 1.2]                                │
│           /           \                                              │
│          /             [Branch 1.3]                                   │
│         /                                                            │
│   ┌──────────┐                                                       │
│   │ CENTRAL  │ ── [Branch 2] ── [Branch 2.1]                        │
│   │  IDEA    │            \                                          │
│   └──────────┘             [Branch 2.2]                              │
│         \                                                            │
│          \             [Branch 3.1]                                   │
│           \           /                                              │
│            [Branch 3] ── [Branch 3.2]                                │
│                       \                                              │
│                        [Branch 3.3] ── [Leaf 3.3.1]                  │
│                                    \                                 │
│                                     [Leaf 3.3.2]                     │
│                                                                     │
│  ┌── LEGEND ───────────────────────────────────────────────────┐    │
│  │  Central = rounded rect   Branches = ellipse   Leaves = text│    │
│  │  Lines use roughness:1 for hand-drawn feel                  │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

### Template Fields

```markdown
# Mind Map: [Topic Title]

## Central Idea
[The core question or topic being explored — keep to one sentence]

## Branch 1: [Category Name]
- [Sub-topic 1.1]
  - [Leaf detail]
- [Sub-topic 1.2]
- [Sub-topic 1.3]

## Branch 2: [Category Name]
- [Sub-topic 2.1]
- [Sub-topic 2.2]

## Branch 3: [Category Name]
- [Sub-topic 3.1]
- [Sub-topic 3.2]
- [Sub-topic 3.3]
  - [Leaf detail]
  - [Leaf detail]

## Observations
[Patterns or clusters that emerged from the brainstorm]

## Next Steps
- [ ] [Action item derived from the map]
```

### Element Guidance

| Element | Shape | Fill | Stroke | Font | Notes |
|---|---|---|---|---|---|
| Central idea | Rounded rectangle (200x100) | `#fed7aa` | `#c2410c` | 24px bold `#1e40af` | roughness:1, center of canvas |
| Level 1 branch | Ellipse (160x60) | `#3b82f6` | `#1e3a5f` | 18px bold `#ffffff` | Fan out at 60-degree intervals |
| Level 2 sub-branch | Ellipse (140x50) | `#60a5fa` | `#1e3a5f` | 14px `#ffffff` | Offset 200px from parent |
| Level 3 leaf | Free text (no shape) | none | none | 12px `#64748b` | Short labels only |
| Connectors | Line | none | `#1e3a5f` | none | roughness:1, strokeWidth:2 |

- **Max 3 levels deep** to avoid visual clutter
- **Max 5 branches** from central idea for readability
- **Spacing:** 200px between levels, 60-degree angular spread
- **roughness:1** on all elements for hand-drawn brainstorm feel

### Example: Brainstorming a CLI Tool

**Central Idea:** "New CLI for project scaffolding"

- **Branch 1: Commands** -- init, add-module, config, validate
- **Branch 2: UX** -- interactive prompts, flags, --dry-run, color output
- **Branch 3: Architecture** -- plugin system, config files, template engine
- **Branch 4: Distribution** -- npm, homebrew, binary, docker
