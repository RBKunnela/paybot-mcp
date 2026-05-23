# Color Palette & Brand Style — Dark Theme

**This is the single source of truth for all colors and brand-specific styles.** To customize diagrams for your own brand, edit this file — everything else in the skill is universal.

**DEFAULT THEME: DARK.** All diagrams use a dark canvas background unless explicitly requested otherwise.

---

## Background

| Property | Value |
|----------|-------|
| Canvas background | `#1e1e2e` |

---

## Shape Colors (Semantic)

Colors encode meaning, not decoration. Each semantic purpose has a fill/stroke pair optimized for dark backgrounds.

| Semantic Purpose | Fill | Stroke |
|------------------|------|--------|
| Primary/Neutral | `#3b82f6` | `#93c5fd` |
| Secondary | `#2563eb` | `#60a5fa` |
| Tertiary | `#1d4ed8` | `#93c5fd` |
| Start/Trigger | `#c2410c` | `#fed7aa` |
| End/Success | `#047857` | `#a7f3d0` |
| Warning/Reset | `#991b1b` | `#fecaca` |
| Decision | `#b45309` | `#fef3c7` |
| AI/LLM | `#6d28d9` | `#ddd6fe` |
| Inactive/Disabled | `#1e3a5f` | `#64748b` (use dashed stroke) |
| Error | `#b91c1c` | `#fecaca` |

**Rule**: On dark backgrounds, use lighter strokes with darker fills for contrast. Fills are darker, strokes are lighter — inverted from light theme.

---

## Text Colors (Hierarchy)

Use color on free-floating text to create visual hierarchy without containers.

| Level | Color | Use For |
|-------|-------|---------|
| Title | `#93c5fd` | Section headings, major labels |
| Subtitle | `#60a5fa` | Subheadings, secondary labels |
| Body/Detail | `#94a3b8` | Descriptions, annotations, metadata |
| On dark fills | `#f1f5f9` | Text inside dark-colored shapes |
| On light fills | `#1e293b` | Text inside light-colored shapes (rare on dark theme) |

---

## Evidence Artifact Colors

Used for code snippets, data examples, and other concrete evidence inside technical diagrams.

| Artifact | Background | Text Color |
|----------|-----------|------------|
| Code snippet | `#0f172a` | Syntax-colored (language-appropriate) |
| JSON/data example | `#0f172a` | `#22c55e` (green) |

---

## Default Stroke & Line Colors

| Element | Color |
|---------|-------|
| Arrows | Use the stroke color of the source element's semantic purpose |
| Structural lines (dividers, trees, timelines) | `#64748b` (slate) |
| Marker dots (fill + stroke) | Fill `#3b82f6`, Stroke `#93c5fd` |

---

## Light Theme Override

If a user explicitly requests light theme, use these overrides:

| Property | Light Value |
|----------|-------------|
| Canvas background | `#ffffff` |
| Title text | `#1e40af` |
| Subtitle text | `#3b82f6` |
| Body text | `#64748b` |
| On dark fills | `#ffffff` |
| On light fills | `#374151` |
| Shape fills | Use lighter versions (swap fill/stroke from dark theme) |
