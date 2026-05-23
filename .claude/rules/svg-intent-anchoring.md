# SVG-1: Intent Anchoring — Enforcement Rule

globs: ["docs/stories/**/*.md", ".aios-core/development/tasks/dev-develop-story.md"]

## Purpose

Forces a reasoning step that is currently skipped: "does my code serve the user's goal, or just match the words?" This is the foundation of the Semantic Validation Gates (SVG) system.

## When This Applies

Every story that has acceptance criteria. Applies during `dev-develop-story.md` execution.

## Rule: @dev MUST Produce Two Artifacts

### 1. Semantic Intent (Pre-Implementation)

**When:** BEFORE writing any implementation code, after reading the first task.
**What:** Extract a 3-5 sentence statement describing WHAT the feature achieves for the user.
**Where:** `docs/stories/{storyId}/semantic-intent.md`
**Template:** `.aios-core/development/templates/semantic-intent-tmpl.md`

The intent describes **outcomes**, not code:
- GOOD: "The user can see which opportunities match their criteria without manually comparing fields."
- BAD: "The Edge Function compares pgvector embeddings and returns matching rows."

### 2. Semantic Mapping (Post-Implementation)

**When:** AFTER all tasks pass, BEFORE quality gates and CodeRabbit.
**What:** Map each AC to the code path that implements it + WHY it fulfills user intent.
**Where:** `docs/stories/{storyId}/semantic-mapping.md`
**Template:** `.aios-core/development/templates/semantic-mapping-tmpl.md`

### Skip Conditions

- Story has NO acceptance criteria → skip both, log `[SVG-1] No AC — skipping intent anchoring`
- Story is documentation-only → skip both
- Story is chore/config (no user-facing change) → skip both

### Environment Behavior

| Mode | Intent (pre) | Mapping (post) |
|------|-------------|----------------|
| DEV | Advisory — produce if possible, warn if skipped | Advisory |
| STAGING | Required — VETO if missing on stories with AC | Required |
| PROD | Required — BLOCK if missing | Required |

## Why This Exists

All AIOS agents (@dev, @qa, @architect) are the same underlying LLM. When @qa reviews @dev's work, the same model that produces a plausible-but-wrong output is evaluating whether it's plausible-but-wrong. Intent Anchoring creates an anchor point that @qa's Phase 6.4 Adversarial Semantic Review can cross-check against — breaking the self-consistency blind spot.

**AIDR Reference:** SVG proposal at `docs/architecture/proposals/SVG-semantic-validation-gates.md`
**Architectural Review:** `docs/architecture/reviews/SVG-architectural-review.md`

## Downstream Consumers

- **@qa Phase 6.4** — Intent Cross-Check compares semantic-mapping.md against semantic-intent.md
- **Veritas** — Same-model discount (0.85) is recovered when intent cross-check finds no gaps
- **ALMA** — Semantic failures detected by Phase 6.4 are stored as anti-patterns for future reviews
