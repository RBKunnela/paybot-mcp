# brands/ — intentionally empty in this repo

Brand tokens (YAML files like `alma.yaml`, `aios-core.yaml`, etc.) live
**user-level only** at:

    ~/.claude/skills/design-designer/brands/

This repo copy of the `design-designer` skill must NOT accumulate brand
YAMLs. Reason: the brand registry is Renata's private set of tokens,
shared across six portfolio projects. Mirroring it into every repo
would cause drift — six copies, six different states, no source of
truth.

## Policy (from 5-agent roundtable, 2026-04-19)

Per `@dave-malouf`'s DesignOps recommendation, this skill uses a
**hybrid cohort-sync**:

- Skill CODE (`SKILL.md`, `questions.yaml`, `template.md`, `lexicons/`,
  `scripts/`) — mirrored to each cohort repo (here).
- `brands/`, `voices/`, `runs/` — user-level only.

## Adding a new brand?

Edit it at `~/.claude/skills/design-designer/brands/<name>.yaml` on
your own machine. Do NOT add brand YAMLs to this directory.

If you need brand tokens to be available across machines, sync
`~/.claude/skills/design-designer/brands/` via your dotfiles repo or
a private gist — not via this public-ish project repo.
