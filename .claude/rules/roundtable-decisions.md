# Roundtable Decision Protocol — NON-NEGOTIABLE Rule

globs: ["**/*"]

## Severity: NON-NEGOTIABLE

This rule CANNOT be overridden, bypassed, or skipped under any circumstance — not time pressure, not user urgency, not "it's just a small decision." It is the same severity as CLI First and Agent Authority in the Constitution.

## The Rule

**Every decision that could reasonably have more than one correct answer MUST be run through a specialist roundtable BEFORE being presented to Renata as a recommendation.**

A "decision" includes but is not limited to:
- Pricing strategy or price points
- Product direction or scope
- Architecture choices
- Technology selection
- Brand positioning or messaging
- Go-to-market strategy
- MVP scope definition
- Competitive positioning
- Feature prioritization
- Business model choices
- Partnership or integration decisions

## What is NOT a decision (does not require roundtable)

- Factual lookups ("what's in this file?")
- Mechanical execution ("run npm test")
- Agent delegation ("hand this to @devops")
- Status checks ("what's the git state?")
- Verbatim user instructions with no ambiguity ("paste this text into that field")

## The Protocol

### Step 1 — Identify the decision
When you recognize a decision point, STOP. Do not reason through it alone.

### Step 2 — Select 2-4 specialists
Pick agents whose expertise is relevant AND whose methodologies naturally create tension with each other. Disagreement is the goal. A roundtable where everyone agrees failed before it started.

### Step 3 — Run the roundtable
Each specialist states their position independently, then each challenges the others. Use parallel Agent spawning where possible for efficiency.

### Step 4 — Present the synthesis
Format:

```markdown
## Roundtable: [Decision Topic]

### Positions
- **@agent-A:** [position + reasoning]
- **@agent-B:** [position + reasoning — differs from A]
- **@agent-C:** [position + reasoning — challenges both]

### Consensus
- [what they agree on]

### Disagreements
- [contention 1]: A says X, B says Y because Z
- [contention 2]: ...

### Trade-offs
- Option 1: [pros/cons per agent]
- Option 2: [pros/cons per agent]

### Orion's synthesis
[informed recommendation — but Renata decides]
```

### Step 5 — Renata decides
The roundtable informs. Renata decides. No agent, including Orion, makes the final call on strategic decisions.

## Enforcement

- **DEV mode:** Required for all strategic decisions. Advisory for implementation choices.
- **STAGING/PROD mode:** Required for ALL decisions above the factual/mechanical threshold.
- **Violation:** If a strategic decision was made without a roundtable, it must be flagged and re-run before any downstream work depends on it.

## Why This Exists

Single-AI reasoning produces plausible-but-wrong conclusions that sound confident. The same model that generates a recommendation is the same model that evaluates whether it's good — creating a self-consistency blind spot (see SVG-1 Intent Anchoring for the same problem in code). Multiple specialist perspectives break this blind spot by forcing explicit disagreement before convergence.

"Multiple takes lead to better understanding the problem because one AI can and should challenge the assertions of the other." — Renata, 2026-04-09
