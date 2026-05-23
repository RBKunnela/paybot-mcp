---
name: prd-to-visual-architecture
description: End-to-end workflow from Feature/PRD to stakeholder-ready visual architecture diagrams. Integrates CodeRabbit review + Excalidraw rendering.
type: workflow
phases: 7
owner: "@architect + @pm"
triggers:
  - "New feature with architecture impact"
  - "PRD review needing visual communication"
  - "Architecture decision requiring stakeholder alignment"
  - "Documentation that needs visual explanation of system impact"
---

# Workflow: PRD-to-Visual Architecture Pipeline

Transform PRDs, features, and architecture decisions into visual diagrams that
**any stakeholder can understand** — what is being built and how it impacts the system.

"Se o stakeholder não entende olhando o diagrama, a comunicação falhou. A culpa é sempre do comunicador."

## Overview

```
INTAKE → EXTRACT → REVIEW → DIAGRAM-PLAN → BUILD → VALIDATE → DELIVER
  │         │         │          │            │        │          │
  ▼         ▼         ▼          ▼            ▼        ▼          ▼
 Parse    Pull out  CodeRabbit  Map visual   JSON     Render    Multi-
 PRD/     arch      impact     patterns    section   PNG loop  audience
 feature  decisions  analysis               by-sec            packages
```

---

## Phase 1: INTAKE — Parse the Source Material

**Owner:** Executor (any agent)
**Input:** PRD, feature spec, architecture decision, or story
**Output:** Structured brief for visualization

### Steps

1. Identify the source document type:

| Source Type | Where to Find | Key Sections |
|-------------|---------------|--------------|
| PRD | `.aios-core/product/prd/` or `docs/` | Goals, Requirements, Architecture |
| Feature Spec | `docs/stories/{id}/spec/spec.md` | FR-*, NFR-*, Technical Approach |
| Architecture Decision | `docs/architecture/` or architect output | Decision, Rationale, Impact |
| Story | `docs/stories/*.story.md` | Objective, AC, File List |

2. Extract these fields:

| Field | Question | Required? |
|-------|----------|-----------|
| **What** | What is being built? (1-2 sentences) | YES |
| **Why** | Business driver / user problem | YES |
| **Components** | Which systems/services are affected? | YES |
| **Data Flow** | How does data move through the system? | IF APPLICABLE |
| **Dependencies** | External APIs, services, databases | YES |
| **Impact Radius** | What existing features are affected? | YES |
| **Audiences** | Who needs to understand this? (dev, exec, client) | YES |

### Veto Conditions
- **VETO** if "What" is unclear — ask before proceeding
- **VETO** if no audiences identified — diagram without audience is decoration
- **VETO** if no impact radius defined — you don't know what you're changing

---

## Phase 2: EXTRACT — Pull Architecture Decisions

**Owner:** @architect or executor
**Input:** Structured brief from Phase 1
**Output:** Architecture decision map

### Steps

1. Read the source document completely
2. Extract every architecture decision into this format:

```markdown
### Decision: {title}
- **Change:** {what changes}
- **From:** {current state}
- **To:** {future state}
- **Affects:** {list of components/files/services}
- **Risk:** {LOW|MEDIUM|HIGH}
- **Reversible:** {YES|NO}
```

3. Map component relationships:
   - Which components talk to each other?
   - What are the data flows (direction + format)?
   - Where are the boundaries (API, DB, UI)?

4. Identify the "blast radius" — everything that changes:
   - Direct changes (files modified)
   - Indirect impact (features that depend on changed components)
   - External dependencies affected

### Veto Conditions
- **VETO** if decisions have no "Affects" list — invisible impact is the most dangerous
- **VETO** if blast radius is "unknown" — research before drawing

---

## Phase 3: REVIEW — CodeRabbit Impact Analysis

**Owner:** @qa or executor
**Input:** Architecture decisions + affected files
**Output:** Code-level impact report

### Steps

1. If code already exists (brownfield/refactor), run CodeRabbit:
   ```bash
   wsl bash -c 'cd /mnt/d/1.GITHUB/{project} && ~/.local/bin/coderabbit --prompt-only -t uncommitted'
   ```
   Or for PR-level review:
   ```bash
   wsl bash -c 'cd /mnt/d/1.GITHUB/{project} && ~/.local/bin/coderabbit --prompt-only --base main'
   ```

2. If greenfield (no code yet), skip CodeRabbit CLI and instead:
   - Review architecture templates: `.aios-core/product/templates/architecture-*.yaml`
   - Check for existing patterns in codebase that new feature must integrate with
   - Identify integration points with existing code

3. From CodeRabbit output (or manual review), extract:

| Finding Type | What to Capture | Visual Impact |
|-------------|----------------|---------------|
| **CRITICAL** | Breaking changes, security issues | RED zone in diagram |
| **HIGH** | Performance impact, API changes | ORANGE zone in diagram |
| **MEDIUM** | Code quality, refactoring needed | YELLOW annotation |
| **Integration Points** | Where new code connects to existing | ARROWS in diagram |
| **Dependencies** | External services affected | EXTERNAL nodes |

### Decision Gate

| Condition | Action |
|-----------|--------|
| CRITICAL findings | MUST be shown in diagram as risk zones |
| No code yet (greenfield) | Skip CodeRabbit, use architecture review only |
| Simple feature (no architecture impact) | Skip to Phase 4 with SIMPLE depth |

### Veto Conditions
- **VETO** if CRITICAL findings exist but are not flagged for visualization
- **VETO** if integration points are not mapped

---

## Phase 4: DIAGRAM-PLAN — Design the Visual Architecture

**Owner:** Executor
**Input:** Architecture decisions + CodeRabbit findings + audiences
**Output:** Visual plan (what patterns, what sections, what depth)

### Step 1: Choose Diagram Type

Based on source material, select ONE primary diagram type:

| Source | Primary Diagram | Secondary (optional) |
|--------|----------------|---------------------|
| PRD (new feature) | **System Context** — what's new + how it connects | Component Detail |
| Architecture Decision | **Before/After** — current vs. proposed state | Impact Radius |
| Refactor/Migration | **Impact Radius** — what changes + blast radius | Data Flow |
| API/Integration | **Data Flow** — how data moves between systems | Sequence |
| Database Change | **Schema Impact** — entities + relationships changed | Migration Flow |
| Feature with UI | **User Flow** — user journey + system interaction | Component Detail |

### Step 2: Map to Excalidraw Visual Patterns

Use the pattern library from `/excalidraw-diagram` SKILL.md:

| Architecture Concept | Excalidraw Pattern | Color (from palette) |
|---------------------|-------------------|---------------------|
| New component | Rectangle + Start/Trigger fill (`#fed7aa`) | Orange border |
| Existing component (unchanged) | Rectangle + Primary fill (`#3b82f6`) | Blue border |
| Existing component (modified) | Rectangle + Decision fill (`#fef3c7`) | Amber border |
| Removed component | Rectangle + dashed stroke + Warning fill (`#fee2e2`) | Red border |
| External dependency | Ellipse + Secondary fill (`#60a5fa`) | Blue border |
| AI/LLM component | Rectangle + AI fill (`#ddd6fe`) | Purple border |
| Data flow | Arrow with label | Source's stroke color |
| Risk zone (CRITICAL) | Rectangle + Error fill (`#fecaca`) | Red border |
| Boundary (API, DB, UI) | Dashed line + free-floating label | Slate (`#64748b`) |

### Step 3: Plan Sections

Every architecture diagram MUST have these sections:

| Section | Purpose | Pattern |
|---------|---------|---------|
| **Title + Context** | What this diagram shows | Free-floating text (title color) |
| **Current State** (if before/after) | What exists today | Left side or top |
| **Proposed State** | What will exist after | Right side or bottom |
| **Impact Zones** | What changes + risk level | Color-coded rectangles |
| **Data Flow** | How data moves | Arrows with labels |
| **Legend** | Color meaning for non-technical audiences | Bottom-right corner |

### Step 4: Audience Adaptation Plan

| Audience | What to Show | What to Hide |
|----------|-------------|-------------|
| **Executives** | Business impact, timeline, risk zones | Code details, file paths |
| **Developers** | Components, APIs, data flow, integration points | Business justification |
| **Clients/Users** | User-facing changes, before/after experience | Internal architecture |
| **QA/Testing** | Test boundaries, integration points, risk zones | Business strategy |

For multiple audiences, create ONE master diagram with all detail, then note which sections each audience needs.

### Veto Conditions
- **VETO** if no legend planned — non-technical viewers can't decode colors
- **VETO** if no impact zones identified — diagram doesn't show "what changes"
- **VETO** if using uniform card grid — each concept needs a DIFFERENT visual pattern

---

## Phase 5: BUILD — Generate Excalidraw JSON

**Owner:** Executor
**Input:** Visual plan from Phase 4
**Output:** `.excalidraw` JSON file

Follow the **Diagram Creation Pipeline** workflow (`diagram-creation-pipeline.md`), Phase 5 rules:

### Architecture-Specific Build Rules

1. **Section order for architecture diagrams:**
   - Section 1: Title + context box (what this diagram shows)
   - Section 2: Current state / system context
   - Section 3: Proposed changes (highlighted with Start/Trigger colors)
   - Section 4: Impact zones + risk annotations
   - Section 5: Data flow arrows + labels
   - Section 6: Legend (color key)

2. **Evidence artifacts for technical audiences:**
   - API endpoint examples (dark background + code text)
   - Data format samples (JSON in evidence blocks)
   - Key config changes

3. **Naming convention:**
   ```
   docs/diagrams/{source-id}-{type}.excalidraw
   ```
   Examples:
   - `docs/diagrams/prd-auth-v2-system-context.excalidraw`
   - `docs/diagrams/story-3.2-data-flow.excalidraw`
   - `docs/diagrams/adr-005-before-after.excalidraw`

4. **Build section-by-section** (mandatory for architecture diagrams — they're always COMPREHENSIVE)

### Veto Conditions
- **VETO** if attempting to generate entire diagram in one pass
- **VETO** if no legend section included
- **VETO** if risk zones from Phase 3 not represented in diagram

---

## Phase 6: VALIDATE — Render & Verify

**Owner:** Executor
**Input:** `.excalidraw` JSON file
**Output:** Validated PNG

Follow the **Diagram Creation Pipeline** workflow (`diagram-creation-pipeline.md`), Phase 6 rules.

### Architecture-Specific Validation

In addition to standard render-view-fix loop, check:

- [ ] **Impact is visible** — Can you immediately see what changes? (color distinction)
- [ ] **Risk zones stand out** — CRITICAL/HIGH findings are visually prominent
- [ ] **Data flow is traceable** — Can you follow an arrow from start to end?
- [ ] **Legend is readable** — Color meanings are clear without explanation
- [ ] **Boundaries are clear** — API/DB/UI boundaries are visually distinct
- [ ] **Before/After is obvious** — If showing change, the contrast is clear
- [ ] **Scale is correct** — Important components are larger, supporting ones smaller

### The "Stakeholder Test" (Pedro Valério's "Teste da Filha" adapted)

> "Se uma pessoa que NÃO é dev olhar esse diagrama, ela consegue responder:
> 1. O que está sendo construído?
> 2. O que muda no sistema atual?
> 3. Onde está o risco?
>
> Se não consegue → o diagrama está errado. Redesenhe."

### Veto Conditions
- **VETO** if diagram not rendered to PNG
- **VETO** if stakeholder test fails on any of the 3 questions
- **VETO** if legend is missing or unreadable

---

## Phase 7: DELIVER — Package for Audiences

**Owner:** Executor
**Input:** Validated diagram + audience list from Phase 4
**Output:** Stakeholder-ready artifacts

### Deliverables

1. **Master diagram** (full detail):
   ```
   docs/diagrams/{source-id}-{type}.excalidraw  → source file
   docs/diagrams/{source-id}-{type}.png          → rendered PNG
   ```

2. **Reference in source document** — Add diagram link to PRD/story/spec:
   ```markdown
   ## Architecture Diagram
   ![{title}](docs/diagrams/{source-id}-{type}.png)
   See [full diagram](docs/diagrams/{source-id}-{type}.excalidraw) for interactive view.
   ```

3. **Impact summary** (for PR description or story notes):
   ```markdown
   ### Visual Architecture Summary
   - **Components affected:** {count} ({list})
   - **Risk zones:** {count CRITICAL}, {count HIGH}
   - **New integrations:** {list}
   - **Diagram:** [View](docs/diagrams/{source-id}-{type}.png)
   ```

### Veto Conditions
- **VETO** if diagram not linked from source document — orphan diagram = invisible
- **VETO** if no PNG rendered — not everyone has Excalidraw

---

## Integration Map

### With AIOS Story Development Cycle

```
Phase 1 (Create @sm)     → Use this workflow to visualize story scope
Phase 2 (Validate @po)   → Include diagram in story validation
Phase 3 (Implement @dev)  → Diagram guides implementation
Phase 4 (QA Gate @qa)    → Diagram validates completeness
Phase 5 (Push @devops)   → Diagram included in PR description
```

### With Spec Pipeline

```
Spec Phase 4 (Write Spec @pm)  → Trigger this workflow
Spec Phase 5 (Critique @qa)    → Diagram aids critique
Spec Phase 6 (Plan @architect) → Diagram guides planning
```

### With CodeRabbit

```
Pre-commit review    → Phase 3 captures impact findings
PR review            → Phase 7 includes diagram in PR body
Self-healing cycle   → Updated diagram if architecture changes
```

### Trigger Conditions

| When... | Action |
|---------|--------|
| New PRD created | Run full workflow (all 7 phases) |
| Architecture decision made | Run from Phase 2 (extract decisions) |
| Major refactor planned | Run full workflow with before/after diagram |
| Story has `needs-visual` label | Run from Phase 4 (diagram plan) |
| CodeRabbit finds CRITICAL in PR | Run Phase 3-7 (impact → diagram → deliver) |
| Stakeholder asks "what does this change?" | Run from Phase 4 with exec audience |

---

## Quick Reference

### Render Command
```bash
cd .claude/skills/excalidraw-diagram/references && uv run python render_excalidraw.py <file.excalidraw>
```

### CodeRabbit Command (WSL)
```bash
wsl bash -c 'cd /mnt/d/1.GITHUB/{project} && ~/.local/bin/coderabbit --prompt-only -t uncommitted'
```

### Color Quick Reference (Architecture)

| Meaning | Fill | Stroke |
|---------|------|--------|
| New (being built) | `#fed7aa` | `#c2410c` |
| Existing (no change) | `#3b82f6` | `#1e3a5f` |
| Modified | `#fef3c7` | `#b45309` |
| Removed | `#fee2e2` | `#dc2626` |
| Risk/Error | `#fecaca` | `#b91c1c` |
| AI/LLM | `#ddd6fe` | `#6d28d9` |
| External | `#60a5fa` | `#1e3a5f` |
| Success/Complete | `#a7f3d0` | `#047857` |
