# Environment Mode — DEV vs PROD Toggle

## How It Works

The file `.aios/config.yaml` controls environment behavior. Read it at session start.

## Environment Rules

### DEV Mode (`environment: dev`)
- `--dangerously-skip-permissions` / YOLO mode: **ALLOWED**
- Quality gates (QA, tests, architecture-first): **RELAXED** (optional)
- Agent authority: **RELAXED** (any agent can push/PR)
- Story requirement: **RELAXED** (can code without story)
- Code review: **OPTIONAL**
- This is for fast local iteration. Move fast, break things, fix them.

### STAGING Mode (`environment: staging`)
- `--dangerously-skip-permissions` / YOLO mode: **BLOCKED**
- Quality gates: **ENFORCED**
- Agent authority: **STRICT** (@devops only for push/PR)
- Story requirement: **REQUIRED**
- Code review: **REQUIRED**

### PROD Mode (`environment: prod`)
- `--dangerously-skip-permissions` / YOLO mode: **HARD BLOCKED**
- Quality gates: **ALL ENFORCED**, cannot be overridden
- Agent authority: **STRICT**, no exceptions
- Story requirement: **REQUIRED**, no exceptions
- Code review: **REQUIRED**
- Signed commits: **REQUIRED**
- Min test coverage: **80%**

## Toggle Commands

Switch environment by editing `.aios/config.yaml`:
```yaml
environment: dev    # or: staging, prod
```

Or copy a preset:
```bash
cp .aios/presets/dev.yaml .aios/config.yaml      # Switch to dev
cp .aios/presets/prod.yaml .aios/config.yaml     # Switch to prod
cp .aios/presets/staging.yaml .aios/config.yaml  # Switch to staging
```

## Reading Current Mode

Check `.aios/config.yaml` → `environment` field. If file doesn't exist, default to `dev`.

When `environment: dev`:
- Skip quality gate checks unless user explicitly asks
- Don't enforce story requirement
- Don't block git push from any agent
- Allow autonomous operation

When `environment: prod`:
- ALWAYS enforce all quality gates
- ALWAYS require story before coding
- ALWAYS delegate push/PR to @devops
- NEVER skip code review
