---
name: brainstorm-to-diagram
description: Greenfield workflow — capture ideas as mind maps or concept maps via Excalidraw.
type: workflow
phases: 4
owner: "any agent"
triggers:
  - "New project ideation"
  - "Feature brainstorming session"
  - "Research findings to visualize"
  - "User says 'brainstorm', 'mind map', 'explore ideas'"
---

# Workflow: Brainstorm to Diagram

Capture unstructured ideas into a visual structure. Output: `.excalidraw` mind map or concept map + rendered PNG.

## Overview

```
COLLECT → CLASSIFY → DIAGRAM → VALIDATE
   │          │          │          │
   ▼          ▼          ▼          ▼
 Gather    Mind map   Generate   Render
 ideas     or concept  JSON      PNG loop
            map?       section
                       by-sec
```

---

## Phase 1: COLLECT — Gather Ideas

**Input:** Conversation, user brain dump, research findings
**Output:** Raw idea list with rough groupings

### Steps

1. Extract all distinct ideas/concepts from the conversation
2. Note any relationships the user mentioned between ideas
3. Group into 3-7 clusters (more = too complex for one diagram)
4. Identify the central theme or question

### Veto Conditions
- **VETO** if fewer than 3 ideas — a list is better than a diagram
- **VETO** if more than 30 ideas — split into multiple diagrams

---

## Phase 2: CLASSIFY — Choose Diagram Type

**Input:** Idea list with groupings
**Output:** Diagram type decision

| If... | Then... | Template |
|-------|---------|----------|
| Ideas radiate from a central theme, hierarchical | **Mind Map** | `mind-map.md` |
| Ideas have labeled relationships between them, network-like | **Concept Map** | `concept-map.md` |
| Both hierarchy AND cross-relationships | **Concept Map** (more flexible) | `concept-map.md` |

---

## Phase 3: DIAGRAM — Generate Excalidraw JSON

**Input:** Classified ideas + chosen template
**Output:** `.excalidraw` file

### Steps

1. Read the chosen template from `squads/visual-engineers/templates/`
2. Follow the template's layout guidance
3. Build JSON section-by-section (NEVER one shot)
4. For mind maps: center node first, then branches clockwise
5. For concept maps: place most-connected nodes centrally
6. Use `roughness: 1` for brainstorm diagrams (hand-drawn feel)

### Output Path
```
docs/diagrams/{context}-brainstorm.excalidraw
```

---

## Phase 4: VALIDATE — Render & Fix

**Input:** `.excalidraw` file
**Output:** Validated PNG

### Steps

1. Render:
   ```bash
   cd .claude/skills/excalidraw-diagram/references && uv run python render_excalidraw.py <path.excalidraw>
   ```
2. View PNG with Read tool
3. Check: no overlapping nodes, labels readable, arrows don't cross through nodes
4. Fix and re-render until clean
5. Show PNG to user for feedback

### Done When
- All ideas from Phase 1 are represented
- Structure is visually clear without reading text
- User confirms it captures their thinking
