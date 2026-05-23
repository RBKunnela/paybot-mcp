# AIOS - Autonomous Intelligence Operating System
## Main Command Interface

**Type**: System Command
**Status**: Active
**Version**: 4.1

---

## 🚀 Quick Start

```
/AIOS:agents:agent-name      → Invoke specific agent
@agent-name                   → Direct mention (shorthand)
/AIOS:agents:dev              → Invoke dev agent (Dex)
/AIOS:agents:qa               → Invoke qa agent (Quinn)
/AIOS:agents:architect        → Invoke architect agent (Aria)
```

---

## 📋 Available Agents

### Development
- `@dev` (Dex) — Full-stack developer, code implementation
- `@architect` (Aria) — System design, technical decisions
- `@devops` (Gage) — CI/CD, git operations

### Quality & Testing
- `@qa` (Quinn) — Testing, quality assurance, validation
- `@data-engineer` (Dara) — Database design, data architecture

### Product & Strategy
- `@pm` (Morgan) — Product management, roadmap
- `@po` (Pax) — Product owner, story creation, acceptance
- `@sm` (River) — Scrum master, process/coordination

### Analysis & Design
- `@analyst` (Alex) — Research, data analysis
- `@ux-design-expert` (Uma) — UX/UI design, user experience

---

## 🎯 Common Commands

### Agent Interaction
```
@dev *task "Implement feature X"           → Assign task to dev
@qa *review "Story 5.2"                   → Request QA review
@architect *design "New API endpoint"     → Get architecture advice
@po *create-story "Feature description"   → Create new story
```

### Story Management
```
@po *create-story                         → Create new story
@dev *task story-id                       → Work on story
@qa *test story-id                        → Test story
@devops *push                             → Push to git (EXCLUSIVE to @devops)
```

### Help & System
```
@dev *help                                → Get agent help
/AIOS:agents:*                            → List all agents
*exit                                     → Exit current agent
```

---

## 🔄 Two-Step Delegation Pattern

**Step 1**: Dev agent (@dev) analyzes, proposes, implements
```
@dev *task 7.1
→ Loads context
→ Analyzes story
→ Makes implementation decisions
→ Modifies files
→ Ready for handoff
```

**Step 2**: QA agent (@qa) reviews and validates
```
@qa *review
→ Inherits all dev context
→ Knows what changed
→ Knows dev decisions
→ Gives PASS/FAIL verdict
→ Provides feedback
```

---

## 💡 Best Practices

1. **Load story first**: Always start with story context
2. **One task at a time**: Focus on single story per session
3. **Capture decisions**: Document why, not just what
4. **Use handoff protocol**: Save state before context fills
5. **Two-step review**: Dev + QA for all features

---

## 📚 Related Resources

- **Constitution**: `.aios-core/constitution.md` — Core principles
- **Stories**: `docs/stories/` — All development stories
- **Squads**: `squads/` — Specialized agent teams
- **Skills**: `.claude/skills/` — Reusable capabilities
- **Commands**: `.claude/commands/` — All available commands

---

## ⚙️ Configuration

**Default Settings** (in `.claude/CLAUDE.md`):
- Token warning threshold: 70%
- Context block threshold: 85%
- Auto-clear protocol: Enabled
- Hook system: Active
- Session state tracking: Enabled

**Modify**: Edit `.claude/CLAUDE.md` to customize behavior

---

## 🎓 Learning Path

1. **Start**: Read Constitution (`constitution.md`)
2. **Understand**: Learn agent personas
3. **Practice**: Work on a story with @dev + @qa
4. **Master**: Use squads for complex workflows
5. **Advanced**: Build custom agents/squads

---

## 📞 Quick Reference

| Command | Agent | Purpose |
|---------|-------|---------|
| `@dev` | Dex | Code development |
| `@qa` | Quinn | Testing & validation |
| `@architect` | Aria | Design decisions |
| `@pm` | Morgan | Product strategy |
| `@po` | Pax | Story creation |
| `@analyst` | Alex | Research & analysis |
| `@devops` | Gage | Git & deployment |

---

## ✨ Key Features

✅ **Autonomous agents** — Work independently or together
✅ **Story-driven** — Everything connected to stories
✅ **Decision tracking** — Why, not just what
✅ **Quality gates** — Automated validation
✅ **Session continuity** — Handoff protocol
✅ **Expandable** — Add squads and skills

---

**Status**: Active & Ready
**Last Updated**: 2026-03-15
**Documentation**: Complete

To activate an agent, use: `@agent-name *help`
