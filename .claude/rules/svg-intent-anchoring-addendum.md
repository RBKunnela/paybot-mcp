# SVG-1 Addendum: Cross-Check with Typed Task Packet (AIDR-020)

globs: ["docs/stories/**/*.md", ".aios-core/development/tasks/qa-gate.md", ".aios-core/development/tasks/dev-develop-story.md"]

## Purpose

This addendum extends `svg-intent-anchoring.md` with the new cross-check enabled by AIDR-020 (Typed Task Packet). It does NOT replace SVG-1 — it strengthens it.

## What Changed

Before AIDR-020, SVG-1 had **one anchor**: `semantic-intent.md` (3-5 sentences of user-outcome prose). @qa Phase 6.4 (Adversarial Semantic Review) cross-checked the implementation against this single anchor, but the same-model blind spot meant a plausible-but-wrong implementation could match plausible-but-wrong intent.

After AIDR-020, every story has **two anchors**:

1. **`semantic-intent.md`** — prose, user-outcome focused, *what the user wants*
2. **`task_packet.objective`** (in story front-matter YAML) — structured, contract-focused, *what we are obligated to deliver*

Both must exist. Both must be **semantically aligned**. @qa cross-checks them against each other in addition to cross-checking each against the implementation.

## The Rule

**Every story with acceptance criteria MUST have BOTH artifacts.**

| Phase | Artifact | Owner | Validator |
|---|---|---|---|
| Pre-implementation | `semantic-intent.md` | @dev (after reading first task) | @po |
| Pre-implementation | `task_packet:` block in story | @sm (during draft) | @po |
| Post-implementation | `semantic-mapping.md` | @dev | @qa Phase 6.4 |

## The Cross-Check (Phase 6.4 Enhanced)

@qa Phase 6.4 (Adversarial Semantic Review) now performs **three** comparisons:

1. **Intent ↔ Implementation** (existing) — does `semantic-mapping.md` show how each AC is fulfilled per `semantic-intent.md`?
2. **Packet ↔ Implementation** (new) — does the diff stay within `task_packet.scope.files_may_touch`? Does each AC in `task_packet.acceptance_tests` have a passing test?
3. **Intent ↔ Packet** (new — the breakthrough) — does `task_packet.objective` describe an outcome consistent with `semantic-intent.md`? If they drift, the story itself is internally inconsistent regardless of how good the implementation is.

The third check is the new defence against same-model blind spots. The intent and the packet are produced by **different agents at different phases** (intent: @dev pre-impl, packet: @sm at draft). When they disagree, that's a signal worth a human pause — even if the implementation matches one of them.

## Failure Modes Caught

| Failure | Caught by | How |
|---|---|---|
| Plausible-but-wrong code matches plausible intent | Check 3 | Packet objective contradicts intent → flag |
| Code touches out-of-scope files | Check 2 | `files_must_not_touch` violated → fail |
| AC has no test | Check 2 | `acceptance_tests` entry has no passing test → fail |
| Story drift from user request | Check 3 | Intent and packet disagree → @po investigates which is right |
| Intent drift from packet | Check 3 | Same as above — @po decides which to update |

## Enforcement by Environment

**DEV** — Check 1 enforced (existing); Checks 2 & 3 advisory (warn if drift)
**STAGING** — All three checks enforced; FAIL on drift
**PROD** — All three enforced + framework-audit.js gates the PR if any story is missing either artifact

## Why This Strengthens SVG-1

The original SVG-1 acknowledges the self-consistency problem:

> "All AIOS agents (@dev, @qa, @architect) are the same underlying LLM. When @qa reviews @dev's work, the same model that produces a plausible-but-wrong output is evaluating whether it's plausible-but-wrong."

A second anchor produced at a different phase by a different agent is the cheapest available defense against this. It's not perfect — both agents are the same model — but the **temporal and contextual gap** between drafting (@sm at story creation) and intent extraction (@dev at first-read) is enough to surface most plausible-but-wrong implementations as a packet/intent drift.

## Synergy with Other AIDRs

- **SVG-1** (parent) — this addendum extends, never replaces
- **AIDR-005 (Task-First Workflow)** — packet is the typed task envelope
- **AIDR-009 (Quality Foundation)** — Phase 6.4 is part of the 12-check matrix
- **AIDR-013 (Enforcement vs Implementation Gap)** — framework-audit.js enforces both artifacts exist
- **AIDR-018 (Lifecycle)** — both artifacts are produced against fully-loaded agents
- **AIDR-019 (Failure Taxonomy)** — drift is a typed failure (`SemanticDrift`, future addition)
- **AIDR-020 (Typed Task Packet)** — defines the packet schema this addendum cross-references

## Reference

Original rule: `.claude/rules/svg-intent-anchoring.md`
Packet template: `.aios-core/development/templates/task-packet-tmpl.yaml`
Decision record: `docs/architecture/aidr/AIDR-020-typed-task-packet.md`
