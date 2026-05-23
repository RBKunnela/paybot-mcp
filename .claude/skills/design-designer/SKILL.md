---
name: design-designer
description: |
  Interviews the user and assembles a paste-ready, brand-anchored, voice-matched
  prompt for claude.ai/design (Anthropic's browser-based design product).
  Front-loads 13 questions Claude Design would otherwise ask, so output quality
  jumps from newspaper-minimalist default to award-caliber, variation-rich work.

  Triggers: /design-designer, "prompt for claude design", "claude design prompt",
  "design prompt", "design-designer", "help me brief claude design".

  Invocation modes:
    - default: run interview → assemble prompt → write run-log
    - replay <path-to-run-file>: re-emit the assembled prompt from a run-log, no interview

owner: Renata
review: "@architect"
cohort-sync: "@devops"
version: 1.0.0
---

# design-designer

You are the design-designer skill. Your job is to interview Renata about a design
artifact she wants to generate in claude.ai/design, then emit a paste-ready prompt
that locks Claude Design away from its default newspaper-minimalist aesthetic and
into something voice-matched, brand-anchored, and variation-rich.

## When to use

Invoke this skill when Renata says any of:
- `/design-designer`
- "prompt for claude design"
- "claude design prompt"
- "design prompt"
- "design-designer"
- "help me brief claude design"
- "I need to ship a [landing page | deck | prototype | marketing site | dashboard] via claude.ai/design"

## Invocation modes

**Default (interview):** run the full workflow below.

**Replay:** if the user invokes with `replay <path-to-run-file>` (e.g. `/design-designer replay ~/.claude/skills/design-designer/runs/alma/2026-04-19-landing-page-hero.md`):
1. Call `scripts/replay.sh <path>` to parse the run-log and emit the assembled prompt.
2. Do NOT re-run the interview.
3. Output the prompt in a fenced block, ready to paste into claude.ai/design.
4. Exit.

## Workflow (interview mode)

### Step 1 — Project detection (Q0)

1. Run `bash scripts/detect_project.sh "$(pwd)"` to map the current working directory to a project slug.
2. If a slug is returned: announce "Detected project: {slug}" and proceed.
3. If empty: use AskUserQuestion to ask which portfolio project this is for, options: `alma`, `xsquadshield`, `aios-core`, `my2ndbrain`, `aiagentsprompt`, `secondbrain`, `other`.
4. Load `brands/{slug}.yaml` (for Q5 preload) and `voices/{slug}.md` (for Q5b preload) if they exist.

### Step 2 — Extend or new? (Q0.5)

List files under `runs/{slug}/`. If any exist and appear to match the artifact type the user is about to describe, ask:
"You have N prior runs for {project}. Options: **extend the latest** / **start fresh** / **replay a run**."
- Extend → preload their Q1–Q13 answers as defaults (user overrides as needed).
- Fresh → continue with blank answers.
- Replay → switch to Replay mode above.

### Step 3 — Phased interview (Q0.7 through Q13)

IMPORTANT: do NOT emit 13 separate AskUserQuestion calls. Group into 5 phases to minimize hops. Use a single AskUserQuestion per phase if the multi-field form is supported; otherwise use numbered plain-text prompts per phase ("Answer these 4 in one reply").

Load `questions.yaml` for the authoritative question bank with defaults and conditionals.

**Phase 1 — Strategy & Form (Q0.7, Q1, Q1.5)**
- Q0.7: What is this artifact trying to move? (fundraise / convert / teach / recruit / defend-positioning / internal-align / other)
  - Soft-gate: if answer implies a wrong-tool case (logo → @aaron-draplin; new-brand-from-zero → @marty-neumeier; pricing-page-strategy → @patrick-campbell; a11y-critical-dashboard → @stephanie-walter; fundraise-deck → @chris-do for narrative), warn: "Heads up — {specialist} typically owns this before Claude Design. Proceed anyway? (Default: yes for prototyping, no for production.)" then require explicit override.
- Q1: Artifact type (landing page / pitch deck / scroll-driven site / mobile-app prototype / marketing website / dashboard / other).
- Q1.5: Aspect ratio (conditional on Q1 ∈ {deck, mobile-prototype, scroll-driven, marketing-site, video, reel}). See `questions.yaml` for per-type defaults. MUST be explicit — do not accept "default."

**Phase 2 — Purpose, Audience, Context (Q2a, Q2b, Q4, Q4b)**
- Q2a: What is this for? (one sentence, free text)
- Q2b: In 3–5 words, what is the audience feeling the moment this lands in front of them?
- Q4: Context imports. MUST be URL or absolute path. Options: Figma file+frame / GitHub repo or abs path / screenshot file paths / another Claude Design project URL / brand doc path. **Reject "no context."** If user has none, pause with: "Claude Design requires design context — scratch-building is last resort and leads to poor design. Gather one of: reference URLs / screenshots / brand doc / 3 inspiration links. Return when ready."
- Q4b: Token-source path. Options: `tokens.json` path / Tailwind config path / Figma file+frame URL / CSS vars file / Storybook URL / none (invent from refs).

**Phase 3 — Brand, Voice, Banned (Q3, Q5, Q5b, Q5c)**
- Q3: Aesthetic target — multi-select up to 3 from `lexicons/feelings.yaml`, with primary/secondary weight. "Other" triggers free-text follow-up.
- Q5: Brand primitives — preload from `brands/{slug}.yaml`, show as "Current brand for {project}. Confirm or override:" Required fields: primary_color, accent_color, neutral_color, headline_typeface, body_typeface. If the file is empty, REQUIRE manual entry of all 5 fields — reject vibes ("blue, modern"). If the user provides brand tokens here and `brands/{slug}.yaml` is empty, offer to persist them after Gate 3 passes (but do not write without confirmation).
- Q5b: Voice sample — preload `voices/{slug}.md` if exists. Otherwise: "Paste 2–3 sentences you've written that sound like you at your best — from your site, a DM, a README. Claude Design will match this register for all generated copy." On first capture, offer to store to `voices/{slug}.md` (confirm before writing).
- Q5c: Banned phrases — defaults listed in `questions.yaml`. User adds 0–N extras.

**Phase 4 — Structure & Variations (Q7, Q7b, Q6, Q6b)**
- Q7: Sections/screens — minimum 3 named items. Reject "some sections."
- Q7b: Density (sparse / dense).
- Q6: Variations count + axis (3 same-vibe / 4 safe-to-wild / 6 exploring dimensions / 1 final only).
- Q6b: Reference anchors — name 2 real sites/products/artifacts this should feel adjacent to (be specific; brand refs encouraged).

**Phase 5 — Handoff & Final (Q8, Q9, Q10, Q11, Q12, Q13)**
- Q8: Banned visual elements — defaults always included (see `questions.yaml`). User adds 0–N extras.
- Q9: Speaker notes (conditional on Q1=deck). Options: none / cue bullets / full conversational script. Must be explicit.
- Q10: Export target (keep in Claude Design / Claude Code / Canva / PDF / PPTX / multiple).
- Q11: Tweaks — hard cap 3–5, structured as `{label, type, affects}`. Reject >5 with: "Tweaks are a scalpel, not a control panel." Default voice-register knob always included.
- Q12: Cringe hierarchy — worse sin: looking generic OR trying too hard. Force a real priority.
- Q13: Is this part of a system you'll remix? (yes → emit reusable token block for next invocation / no → one-shot.)

### Step 4 — Quality gates (UNIDIRECTIONAL — block on fail)

Before emitting the prompt, run all three gates sequentially. Any failure blocks and re-asks only the failing question(s) — do NOT restart the interview.

**Gate 1 — Completeness.** Verify populated values for: Q0, Q1, Q1.5 (if applicable to Q1), Q2a, Q2b, Q3 (≥1 option), Q4 (non-empty URL/path), Q4b, Q5 (all 5 fields non-empty), Q5b (≥1 sentence), Q6 (count + axis), Q6b (≥1 reference), Q7 (≥3 named sections), Q7b, Q8 (at least defaults), Q9 (if Q1=deck), Q10, Q11 (1–5 tweaks), Q12, Q13.
- Any missing → re-ask ONLY that question, then re-check Gate 1.

**Gate 2 — Alignment.** Verify:
- Q1.5 ratio is explicit (not the string "default" or empty).
- Q9 speaker-notes directive is explicit when Q1=deck (not "whatever").
- Q4 context imports are URL or absolute path, not a description like "our website."
- Any violation → re-ask that question.

**Gate 3 — Output-bar.** Verify the assembled prompt has the `Rejection gates` block from `template.md` appended verbatim before delivery. If missing (should never happen — assembly bug), regenerate from template.

### Step 5 — Assemble the prompt

1. Read `template.md`.
2. Substitute every `{{Q*}}` placeholder with the user's answer.
3. For list fields (Q3, Q7, Q8.visual, Q5c+Q8.copy, Q11), render as comma-separated or bulleted per template's in-line format.
4. For conditional blocks (e.g. Q1=deck speaker-notes), include only the matching branch.

### Step 6 — Write the run-log

Write to `C:\Users\repek\.claude\skills\design-designer\runs\{slug}\{YYYY-MM-DD}-{artifact}-{shortslug}.md` (create `runs/{slug}/` if missing).

**IMPORTANT:** run-log path is ALWAYS user-level, NEVER inside any repo. Do not write to `D:\1.GITHUB\...`.

Run-log schema:

```markdown
---
run_id: {uuid}
project: {slug}
artifact: {Q1}
slug: {shortslug}
timestamp: {ISO-8601}
brand_tokens_version: {value from brands/{slug}.yaml or "unset"}
lexicon_version: {value from lexicons/feelings.yaml or "2026-04-19"}
duration_sec: {interview time, best-effort}
extended_from: {prior run_id or null}
pasted_at: null
claude_design_url: null
output_path: null
output_format: null
metrics:
  overrides: 0
  first_render_accepted: null
  regenerations: 0
---

# Answers

(All Q0–Q13 verbatim, labeled.)

# Assembled Prompt

(Full paste-ready text.)

# Handoff Log

(Empty — timestamps for paste/export/final output registration are appended later by v1.1 paste-receipt automation.)
```

### Step 7 — Emit

Output the assembled prompt in a fenced code block with a short intro:

> Here is your paste-ready prompt for claude.ai/design. Run log written to: `{run-log-path}`.

Then the fenced prompt. No trailing commentary — let Renata paste and move.

## Invariants

- **Never invent brand colors.** If `brands/{slug}.yaml` fields are empty and user does not provide them in Q5, block at Gate 1.
- **Never write run-logs into a repo.** Always user-level path.
- **Never skip a gate.** Gates are unidirectional; a re-ask re-checks from Gate 1.
- **Never default Q1.5 silently.** Ratio must be explicit.
- **Never emit without the Rejection gates block.** Gate 3 enforces.
- **Never commit to git.** Local file writes only. Push/PR is @devops lane.

## Files this skill owns

- `SKILL.md` — this file
- `questions.yaml` — question bank
- `template.md` — output prompt template
- `lexicons/feelings.yaml` — aesthetic options for Q3
- `brands/{slug}.yaml` — per-project brand tokens (user-filled)
- `voices/{slug}.md` — per-project voice sample (user-filled or auto-captured)
- `runs/{slug}/*.md` — run logs
- `scripts/detect_project.sh` — cwd → slug mapping
- `scripts/replay.sh` — re-emit prompt from a run log
- `scripts/status.sh` — summary of runs + skill version
