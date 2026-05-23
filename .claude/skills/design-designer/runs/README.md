# runs/ — intentionally empty in this repo

Run logs (completed `design-designer` sessions) live **user-level
only** at:

    ~/.claude/skills/design-designer/runs/

This repo copy of the `design-designer` skill must NOT accumulate
run logs. Reason: run logs are Renata's personal design-brief
history (sometimes with draft copy, client names, or unreleased
brand ideas) — not repo-shareable material.

## Policy (from 5-agent roundtable, 2026-04-19)

Per `@dave-malouf`'s DesignOps recommendation, this skill uses a
**hybrid cohort-sync**:

- Skill CODE — mirrored to each cohort repo (here).
- `brands/`, `voices/`, `runs/` — user-level only.

## Replaying a past run?

Use the user-level path. From any machine where the user-level
skill is installed:

    bash ~/.claude/skills/design-designer/scripts/replay.sh <run-id>

Do NOT commit run logs to this directory.
