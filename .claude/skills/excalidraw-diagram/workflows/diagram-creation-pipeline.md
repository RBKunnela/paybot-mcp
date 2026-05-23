---
name: diagram-creation-pipeline
description: End-to-end workflow for creating Excalidraw diagrams. From request to validated PNG.
type: workflow
phases: 6
owner: "any agent"
---

# Workflow: Excalidraw Diagram Creation Pipeline

Fluxo unidirecional do pedido ao diagrama validado. Cada fase produz um artefato concreto.

## Overview

```
REQUEST → ASSESS → RESEARCH → DESIGN → BUILD → VALIDATE
   │         │         │         │        │        │
   ▼         ▼         ▼         ▼        ▼        ▼
 Parse    Simple/   Lookup    Map to   JSON     Render
 intent   Compr.    specs    patterns  section  PNG loop
```

---

## Phase 1: REQUEST — Parse Intent

**Input:** User's natural language request
**Output:** Structured brief

### Extract

| Field | Question |
|-------|----------|
| Subject | What is being diagrammed? |
| Purpose | Why? (explain, teach, document, sell) |
| Audience | Who will see this? (dev, exec, student) |
| Scope | How many concepts/systems? |
| Output | Where should the `.excalidraw` file go? |

### Veto Conditions
- **VETO** if subject is unclear — ask before drawing
- **VETO** if no output path specified — default to `docs/diagrams/`

---

## Phase 2: ASSESS — Depth Decision

**Input:** Structured brief
**Output:** Depth classification

| If... | Then... |
|-------|---------|
| Mental model, philosophy, abstract concept | **SIMPLE** — abstract shapes, labels |
| Real system, architecture, protocol, tutorial | **COMPREHENSIVE** — evidence artifacts, code snippets, real data |
| Quick overview for someone who knows the domain | **SIMPLE** |
| Teaching material, YouTube explainer, documentation | **COMPREHENSIVE** |

### Veto Conditions
- **VETO** if marked SIMPLE but subject is a technical system — force COMPREHENSIVE
- **VETO** if marked COMPREHENSIVE but no research plan — requires Phase 3

---

## Phase 3: RESEARCH — Gather Real Data (COMPREHENSIVE only)

**Input:** Subject + scope
**Output:** Research notes with concrete artifacts

### Gather

1. Look up actual specs, API formats, event names
2. Find real JSON payloads, code snippets, method signatures
3. Understand actual data flow between components
4. Collect real terminology (not generic labels)

### Veto Conditions
- **VETO** if using placeholder names ("Event 1", "Component A") when real names exist
- **VETO** if no evidence artifacts collected for a COMPREHENSIVE diagram

---

## Phase 4: DESIGN — Map to Visual Patterns

**Input:** Research notes + concepts
**Output:** Visual plan (mental sketch)

### For each concept, choose pattern:

| Concept Behavior | Visual Pattern |
|-----------------|----------------|
| Spawns multiple outputs | Fan-out (radial arrows) |
| Combines inputs | Convergence (funnel) |
| Has hierarchy | Tree (lines + text) |
| Is a sequence | Timeline (dots + labels) |
| Loops/iterates | Spiral/Cycle |
| Abstract state | Cloud (overlapping ellipses) |
| Transforms I/O | Assembly line (before → after) |
| Compares options | Side-by-side |
| Phase boundary | Gap/Break |

### Rules

- Each major concept MUST use a DIFFERENT visual pattern
- NO uniform card grids or equal boxes
- < 30% of text elements should be inside containers
- Colors from `references/color-palette.md` ONLY

### Veto Conditions
- **VETO** if all concepts use the same pattern (rectangles everywhere)
- **VETO** if inventing new colors not in the palette

---

## Phase 5: BUILD — Generate JSON Section-by-Section

**Input:** Visual plan
**Output:** `.excalidraw` JSON file

### Process

1. **Create base file** with JSON wrapper + first section
2. **Add one section per edit** — take time with layout and spacing
3. **Use descriptive string IDs** (`"trigger_rect"`, `"arrow_fan_left"`)
4. **Namespace seeds by section** (100xxx, 200xxx, 300xxx...)
5. **Update cross-section bindings** as you go
6. After all sections: review complete JSON for binding errors

### Section Boundaries (typical)

- Section 1: Entry point / trigger
- Section 2: First decision or routing
- Section 3: Main content (hero — largest section)
- Section 4-N: Remaining phases, outputs

### Anti-Patterns (BLOCKED)

- **NEVER** generate entire diagram in one response (32K token output limit)
- **NEVER** use a coding agent to generate JSON (loses skill context)
- **NEVER** write a Python generator script (adds indirection, harder to debug)

### Veto Conditions
- **VETO** if attempting to generate entire large diagram in one pass
- **VETO** if JSON is invalid (run through validator mentally)
- **VETO** if IDs have collisions

---

## Phase 6: VALIDATE — Render & Fix Loop

**Input:** `.excalidraw` JSON file
**Output:** Validated PNG

### The Loop (MANDATORY — not optional)

```
Render → View PNG → Audit Vision → Check Defects → Fix → Re-render
                                                          ↑
                                                     Repeat 2-4x
```

### Render Command

```bash
cd .claude/skills/excalidraw-diagram/references && uv run python render_excalidraw.py <path.excalidraw>
```

Then use `Read` tool on the PNG to visually inspect.

### Audit Checklist

**Vision Check:**
- [ ] Visual structure matches conceptual plan from Phase 4
- [ ] Each section uses intended pattern
- [ ] Eye flows through diagram in designed order
- [ ] Visual hierarchy correct — hero dominant, supporting smaller
- [ ] Evidence artifacts readable (COMPREHENSIVE only)

**Defect Check:**
- [ ] No text clipped by container
- [ ] No overlapping elements
- [ ] Arrows route cleanly (not through elements)
- [ ] Arrows land on correct targets
- [ ] Labels clearly anchored to what they describe
- [ ] Even spacing between similar elements
- [ ] No lopsided composition
- [ ] Text readable at rendered size

### Common Fixes

| Defect | Fix |
|--------|-----|
| Text clipped | Widen container width/height |
| Overlapping | Adjust x/y coordinates |
| Arrow crosses element | Add intermediate waypoints to `points` array |
| Label floating | Move closer to described element |
| Unbalanced | Resize elements, redistribute whitespace |

### Veto Conditions
- **VETO** if diagram not rendered at all — JSON alone is not validation
- **VETO** if text is unreadable in PNG
- **VETO** if arrows don't connect to intended elements

### Done When

- Rendered diagram matches conceptual design
- No text clipped, overlapping, or unreadable
- Arrows route cleanly
- Spacing consistent, composition balanced
- You'd show it without caveats

---

## Integration Points

### With AIOS Agents

| Agent | When to Create Diagram |
|-------|----------------------|
| `@architect` | System architecture, integration patterns |
| `@ux-design-expert` | User flows, wireframe concepts |
| `@analyst` | Research findings, competitive analysis |
| `@pm` | Product roadmaps, feature relationships |
| `@dev` | Component architecture, data flow |

### With Stories

When a story requires visual documentation:
1. Create diagram during implementation (Phase 3 of SDC)
2. Save to `docs/diagrams/{story-id}-{name}.excalidraw`
3. Render PNG alongside for quick reference
4. Reference in story file: `[Diagram](docs/diagrams/...)`

### Trigger

Any of these trigger this workflow:
- User says "create a diagram", "visualize", "draw"
- `/excalidraw-diagram` skill invocation
- Story AC requires visual documentation
- Architecture decision needs visual representation
