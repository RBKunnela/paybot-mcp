# Command: visual-engineers

Activate the Visual Communication Engineers Squad to transform architecture reviews into visual explanations.

## Usage

### Basic Activation
```bash
/visual-engineers
```
Launches the Visual Orchestrator to coordinate the workflow.

### With Problem Description
```bash
/visual-engineers {problem-description}
```
Directly route a problem to the appropriate agent (architecture, database, feature, bug).

### With CodeRabbit Output
```bash
/visual-engineers --coderabbit {file-path}
```
Import CodeRabbit review findings and visualize the issues.

### With Specific Audience
```bash
/visual-engineers --for {role1},{role2},{role3}
```
Generate role-specific communication templates (PM, Dev, QA, DevOps, Architect, DBA, PO, SM).

### With Storage Path
```bash
/visual-engineers --storage docs/visuals/architecture/PR-1234-issue-name
```
Save diagrams and artifacts to specific location.

## Examples

### Scenario 1: Architecture Refactor
```bash
/visual-engineers
Service boundary needs clarification in payment processing module

Affected roles: Architects, Developers
```

### Scenario 2: Database Migration
```bash
/visual-engineers --for PM,Dev,DBA
We're migrating from monolithic user table to sharded model
```

### Scenario 3: From CodeRabbit
```bash
/visual-engineers --coderabbit .coderabbit-review.md --storage docs/visuals/architecture/PR-5678
```

## What Happens

1. **Visual Orchestrator** routes to appropriate agent tier
2. **Visual Architect** decomposes problem into visual structures
3. **Visual Communicator** adapts complexity for each role
4. **Code Integrator** maps visual elements to code changes
5. **Team Validates** shared understanding before implementation
6. **CodeRabbit Re-reviews** to confirm recommendations

## Output Artifacts

- **Excalidraw Diagram** — Problem + solution visualized
- **Role-Specific Templates** — PM/Dev/QA/DevOps perspectives
- **Specification Document** — Visual-to-technical requirements
- **Implementation Roadmap** — Code change checklist

## Integration

### With @architect
When planning architecture changes, use:
```bash
@architect
*plan-architecture payment-service-refactor

/visual-engineers
[problem description from architect]
```

### With GitHub/Jira
Diagrams auto-link from PR descriptions and issue comments.

### Team Activation
Share the generated ACTIVATION.md quickstart with your team:
- 5-minute quickstart
- 10-minute deep dive
- Common workflows
- Troubleshooting guide

## Related Commands

- `/tech-search` — Find architectural patterns and examples
- `/story` — Create story from architecture decision
- `@architect` — Architecture planning and design
- `@qa` — Quality validation of architectural approach

## Status

✅ Production Ready | 27 squad files | 5 agents | 3 workflows | 8 templates
