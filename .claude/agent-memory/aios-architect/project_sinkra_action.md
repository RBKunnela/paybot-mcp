---
name: sinkra-action
description: Private GitHub Action at RBKunnela/sinkra-action — 9-agent AIOX validation council as a PR gate. v0.1 committed 2026-05-22.
metadata:
  type: project
---

sinkra-action is a private GitHub Action that runs every PR past the 9-agent AIOX council (architect, analyst, data-engineer, dev, devops, pm, po, qa, sm) in parallel and posts a unified verdict as a sticky PR comment + `sinkra/verdict` check-run.

**Why:** It is the operational expression of `.claude/rules/svg-intent-anchoring.md`, `.claude/rules/quality-foundation.md`, and `.claude/rules/roundtable-decisions.md`. Same-model blind spot is acknowledged; the council is necessary but not sufficient — CODEOWNERS human review still required for financial paths. See [[feedback_scope_discipline]] for the related decision rule.

**How to apply:** Pilot first on paybot-core (low traffic, easy to roll back). Add `ZAI_API_KEY` to repo secrets. Drop in `.github/workflows/sinkra.yml` per `D:\1.GITHUB\sinkra-action\docs\SETUP.md`. Observe verdicts for a week before flipping `sinkra/verdict` to a required status check.

**Repo state at 2026-05-22:**
- Path: `D:\1.GITHUB\sinkra-action`
- Remote: `RBKunnela/sinkra-action` (PRIVATE)
- Initial commit: `cc2eea6` (21 files, ~2,300 LOC)
- `dist/` NOT YET BUILT — Z.AI migration in progress by @dev. Next-session immediate: `npm install && npm run build`, commit `dist/`, `git tag v0.1.0 && git push origin v0.1.0`.

**Stack:**
- TypeScript GitHub Action, `runs.using: node20`
- LLM provider: **Z.AI (Zhipu / BigModel)** via OpenAI-compatible client
- Base URL: `https://api.z.ai/api/paas/v4`
- Default model: `glm-4.6`
- Required secret in consumer repo: `ZAI_API_KEY` (NOT `ANTHROPIC_API_KEY`)
- Other deps: `@actions/core`, `@actions/github`, `zod`, OpenAI Node SDK

**Documentation:**
- `D:\1.GITHUB\sinkra-action\README.md` — public-facing entry
- `D:\1.GITHUB\sinkra-action\docs\ARCHITECTURE.md` — design + data flow + extension points
- `D:\1.GITHUB\sinkra-action\docs\SETUP.md` — consumer-repo setup steps
- `D:\1.GITHUB\sinkra-action\docs\AGENTS.md` — per-agent reference (lens, veto, risk, anti-patterns)
- `D:\1.GITHUB\sinkra-action\docs\TROUBLESHOOTING.md` — common issues
- `D:\1.GITHUB\sinkra-action\CHANGELOG.md` — v0.1.0 release notes

**Verdict aggregation rule** (locked in `src/verdict.ts::aggregate`):
- Any FAIL → `failure`
- Max risk ≥ MEDIUM (even with no FAIL) → `failure`
- All PASS + max risk ≤ VERY_LOW → `success`
- Mixed PASS/CONCERNS + max risk ≤ VERY_LOW → `success` (with CONCERNS note)
- Anything else → `neutral`

**Roadmap (v0.2 candidates):**
- CLI wrapper for local dry-runs
- Per-agent allowlist (`agents: dev,qa`)
- Prompt caching once Z.AI exposes the primitive
- Golden-PR regression suite
- Multi-provider routing (v0.3) — break same-model collapse by routing 1-2 agents through a different vendor
