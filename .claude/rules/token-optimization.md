# Token Optimization — Unified Entry Point

globs: ["**/*.md", "**/*.yaml", "**/*.json"]

## 3 Tools, 1 Goal

| Tool | Purpose | When to Use | Command |
|------|---------|-------------|---------|
| **Context Surgeon** | Measure & cut auto-loaded overhead | Quick health check, dead ref removal | `/context-surgeon scan` or `cut` |
| **CELF** | Validate context architecture (8 layers) | New project setup, deep architecture audit | `/celf diagnose` or `scaffold` |
| **Analytics Pipeline** | Track tool usage trends over time | Generate promote/demote recommendations | `node .aiox-core/infrastructure/scripts/generate-optimization-report.js` |

## Decision Tree

```
"I want to optimize tokens" →
  ├─ Quick check? → /context-surgeon scan (30s, ~500 tok)
  ├─ Deep architecture review? → /celf diagnose (2min, ~2k tok)
  └─ Usage trends & recommendations? → generate-optimization-report.js
```

## Targets (from 10 Commandments)

- Overhead per session: **< 8k tokens**
- Commands count: **< 80**
- Agents count: **< 30**
- Usage ratio: **> 50%**
- Audit cycle: **every 14 days**

## Automatic Enforcement

- **SessionStart hook** checks last audit date, warns if > 14 days
- **TaskCompleted hook** collects tool usage analytics + prunes 30-day retention
- **Context Surgeon scan** measures actual overhead against targets

## Reference

- 10 Commandments: `.claude/skills/context-surgeon/references/token-economy.md`
- 14-day audit checklist: `.claude/skills/context-surgeon/checklists/token-audit-14d.md`
- Visual guide: `docs/research/2026-04-01-token-economy-source-code/token-economy-10-commandments-visual.md`
