# voices/ — intentionally empty in this repo

Voice profiles live **user-level only** at:

    ~/.claude/skills/design-designer/voices/

This repo copy of the `design-designer` skill must NOT accumulate
voice profiles. Reason: voice profiles capture Renata's personal
writing voice (phrase-level patterns from `humanize-message` and
journaling corpus); storing copies in each cohort repo would cause
drift.

## Policy (from 5-agent roundtable, 2026-04-19)

Per `@dave-malouf`'s DesignOps recommendation, this skill uses a
**hybrid cohort-sync**:

- Skill CODE — mirrored to each cohort repo (here).
- `brands/`, `voices/`, `runs/` — user-level only.

## Adding a new voice profile?

Edit at `~/.claude/skills/design-designer/voices/<name>.yaml` on
your own machine. Do NOT add voice YAMLs to this directory.
