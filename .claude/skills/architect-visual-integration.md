# Skill: architect-visual-integration

Auto-activate the Visual Communication Engineers Squad when @architect is planning or modifying architectural components.

## Trigger Patterns

The skill activates when @architect initiates work with keywords:

### Planning Mode
- `*plan-architecture {component}`
- `*design-system {feature}`
- `*architect-{any-task}`
- Messages containing: plan, design, architecture, refactor, migrate, restructure

### Modification Mode
- `*modify-{component}`
- `*update-{service}`
- `*refactor-{module}`
- Messages containing: modify, change, update, improve, optimize, refactor, consolidate

### Problem Analysis
- `*analyze-{issue}`
- `*diagnose-{problem}`
- Messages containing: coupling, boundary, dependency, constraint, bottleneck

## Behavior

### Level 1: Suggestion (Default)
When @architect starts planning work, the skill:
1. Detects the architecture task
2. Suggests visual-engineers activation
3. Provides context: current decision, affected teams, complexity estimate
4. Asks if architect wants to visualize this

```
🎨 Architecture Visualization Ready
Your task affects multiple services. Want me to activate the Visual Communication Engineers to create diagrams that explain this to the team?

Impact: {affected_systems}
Complexity: {estimated_complexity}
Audience: {stakeholders}

/visual-engineers --for {recommended_roles}
```

### Level 2: Auto-Activate (With Permission)
If user has set preference or explicitly requested:
1. Auto-activate visual-engineers orchestrator
2. Pass architect's task context
3. Generate diagrams in real-time as architect works
4. Create role-specific communication templates

### Level 3: Integration (Full Flow)
1. Architect defines the change
2. Visual squad creates visualization
3. Team reviews diagram (challenge-understanding)
4. Code Integrator generates implementation plan
5. Architect executes with confidence

## Integration Points

### With @architect Commands
| Command | Visual Trigger | Output |
|---------|---|---|
| `*plan-architecture` | Auto-suggest | Diagram + spec |
| `*design-system` | Auto-suggest | Component diagrams |
| `*modify-service` | Auto-suggest | Before/after comparison |
| `*refactor-module` | Auto-suggest | Dependency graph + plan |
| `*diagnose-coupling` | Auto-activate | Root cause visualization |

### With Story Workflow
When @architect contributes to story planning:
1. Story includes architecture decision
2. Skill detects complexity
3. Suggests visual validation before implementation
4. Creates handoff to @dev with diagram context

### With @dev Implementation
When @dev implements architect's decisions:
1. Diagram context available in story
2. Code Integrator recommendations loaded
3. Quality gates check visual-to-code mapping
4. Tests validate implementation follows diagram

## Configuration

### Set Preference
```bash
/architect-visual-integration --mode {suggestion|auto|full}
```

**Options:**
- `suggestion` — Always ask before activating (default)
- `auto` — Auto-activate for planning tasks only
- `full` — Auto-activate + generate all artifacts

### Disable for Specific Tasks
```bash
/architect-visual-integration --skip-visual
```
For simple decisions that don't need visualization.

## Example Workflows

### Workflow 1: Service Boundary Refactor
```
@architect
*plan-architecture payment-service-boundary

[Architect defines current coupling issues]

🎨 Suggestion appears:
"This affects 3 services. Ready to visualize?"

/visual-engineers
[CodeRabbit findings pasted]

→ Diagram created
→ PM/Dev/QA versions generated
→ Team validates
→ Code changes recommended
```

### Workflow 2: Database Migration Planning
```
@architect
*plan-architecture user-table-sharding

[Architect outlines migration strategy]

🎨 Auto-activated (if mode=auto):
→ Visual Spec Bridge creates migration diagram
→ Timeline visualization generated
→ Rollback strategy documented
→ @data-engineer gets context for implementation
```

### Workflow 3: System Redesign
```
@architect
*design-system notification-service

[Complex multi-component decision]

🎨 Full flow (if mode=full):
→ Current system diagram from codebase scan
→ Proposed architecture visualized
→ All stakeholder perspectives created
→ Implementation roadmap generated
→ Team reviews and validates
→ @dev has everything needed to build
```

## Smart Context Passing

The skill automatically extracts and passes:
- **What:** The architectural decision or change
- **Why:** Business drivers and constraints
- **Who:** Affected teams and stakeholders
- **When:** Timeline and dependencies
- **Where:** System boundaries and integration points

This context becomes input to visual-engineers, reducing need for re-explanation.

## Anti-Patterns

The skill WON'T trigger on:

- ❌ Simple bug fixes (use @qa instead)
- ❌ Documentation updates (use /story instead)
- ❌ Code formatting/linting (use @dev directly)
- ❌ Local optimization (< 2 services affected)
- ❌ One-off configuration changes

## Activation

Add to `.claude/settings.local.json`:

```json
{
  "hooks": [
    {
      "type": "toolUse",
      "tool": "Agent",
      "condition": "subagent_type == 'architect'",
      "action": "invoke",
      "skill": "architect-visual-integration"
    }
  ]
}
```

Or use the command:

```bash
/architect-visual-integration --enable
```

## Status

✅ Ready to Deploy | Integrates with @architect | 3 trigger modes | Team-aware
