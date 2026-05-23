---
name: squad-orchestrator
description: |
  Squad Orchestrator — The front door to the AIOS ecosystem.

  Given any project or task, this skill:
  1. Discovers all available squads and agents
  2. Analyzes the user's project needs
  3. Recommends which squads to use (3 Circles model)
  4. Composes a custom workflow from the right agents
  5. Executes it phase by phase

  Also serves as a teaching guide for understanding how to use squads,
  compose workflows, and leverage 200+ agents efficiently.

  Use when: starting any project and unsure which squads/agents to use,
  wanting to compose a multi-squad workflow, or learning the ecosystem.
---

# Squad Orchestrator

The front door to the AIOS ecosystem. Turns any project description into an orchestrated
workflow using the right squads and agents.

## Invocation

```
/squad-orchestrator "describe your project or task"
```

## How It Works

```
USER: "I need to build X"
         |
   [DISCOVER] — Scan all available squads, agents, tasks
         |
   [UNDERSTAND] — Classify project type, identify needs
         |
   [RECOMMEND] — 3 Circles: Core / Specialists / Amplifiers
         |
   [COMPOSE] — Design custom workflow with phases, agents, gates
         |
   [APPROVE] — Present to user for review
         |
   [EXECUTE] — Run phase by phase with the selected agents
```

---

# PART 1: TEACHING GUIDE — How the Ecosystem Works

## The 3 Circles Model

Every project uses agents organized in 3 concentric circles:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   CIRCLE 3: AMPLIFIERS                                  │
│   Squads that enhance, optimize, scale                  │
│   Called AFTER core work is done                        │
│                                                         │
│   ┌─────────────────────────────────────────────┐       │
│   │                                             │       │
│   │   CIRCLE 2: SPECIALISTS                     │       │
│   │   Domain squads matched to project needs    │       │
│   │   Called WHEN their expertise is needed      │       │
│   │                                             │       │
│   │   ┌─────────────────────────────────┐       │       │
│   │   │                                 │       │       │
│   │   │   CIRCLE 1: CORE                │       │       │
│   │   │   Always-active foundation      │       │       │
│   │   │   Drives the entire pipeline    │       │       │
│   │   │                                 │       │       │
│   │   └─────────────────────────────────┘       │       │
│   │                                             │       │
│   └─────────────────────────────────────────────┘       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Circle 1: CORE — The Engine

These agents drive ANY project. They handle planning, execution, and delivery.

**For Software Projects:**
| Agent | Role | When Active |
|-------|------|-------------|
| @pm (Morgan) | Define scope, create epics | Planning |
| @architect (Aria) | Design architecture | Planning |
| @sm (River) | Break into stories | Planning |
| @po (Pax) | Validate stories | Planning |
| @dev (Dex) | Implement code | Execution |
| @qa (Quinn) | Quality gates, testing | Verification |
| @devops (Gage) | Deploy, push | Delivery |

**For Content Projects:**
| Agent | Role | When Active |
|-------|------|-------------|
| Content Chief | Strategy, routing | Planning |
| Specialist writer | Create content | Execution |
| Devil Advocate | Challenge assumptions | Review |
| Social Strategist | Platform optimization | Distribution |

**For Business Projects:**
| Agent | Role | When Active |
|-------|------|-------------|
| @analyst (Alex) | Research, analysis | Planning |
| @pm (Morgan) | Strategy, roadmap | Planning |
| Advisory board | Strategic decisions | Key moments |

**Rule:** Circle 1 agents are ALWAYS present. They run the pipeline.

### Circle 2: SPECIALISTS — Called When Needed

These squads have deep domain expertise. You bring them in when the project
touches their domain.

**Selection Logic:** Match project keywords to squad capabilities:

| If Project Involves... | Use This Squad | Key Capability |
|------------------------|----------------|----------------|
| Jira, Xray, Confluence | enterprise-qa-devops | Atlassian automation |
| Database, schema | @data-engineer + domain-decoder | DB design + code analysis |
| UI/UX, design system | design + @ux | Component design + accessibility |
| YouTube content | youtube-scripts + youtube-title + youtube-outlier | Full YouTube pipeline |
| Sales copy, landing pages | copywriting-masters or content-engine | Conversion copy |
| Revenue, offers, pricing | hormozi | $100M business frameworks |
| Personal brand, solopreneur | koe | One-person business system |
| Learning/education content | teachers-online + dopamine-learning | Science-based education |
| Team structure, org design | team-taxonomy | Team Topologies |
| New squad creation | squad-creator + squad-prep | Squad building pipeline |
| Mind cloning | clone-engineering + etl-data-collector | MMOS cognitive cloning |
| Brownfield/legacy code | domain-decoder | Code DNA extraction |
| Prioritization | priorize | 23 techniques |
| Bug investigation | quality-shield | Root cause + regression |
| Academic research | academic-research | PRISMA reviews, papers |
| Accounting (BR) | contabil | MEI/Simples Nacional |
| Creative branding | squad-criativos | Full creative agency |
| ClickUp/PM tools | project-management-clickup | Workspace architecture |
| AI deployments | autoclaw | OpenClaw whitelabel |

**Rule:** Only bring in specialists you actually need. Most projects use 2-5 specialist squads.

### Circle 3: AMPLIFIERS — After Core Work

These squads enhance what's already built. They optimize, scale, and extend.

| Squad | What It Amplifies |
|-------|-------------------|
| skill-tester | Compare outputs, A/B test approaches |
| quality-shield | Post-build regression checks |
| team-taxonomy | Optimize agent collaboration patterns |
| priorize | Reprioritize when scope changes |
| marketing-opes | Strategic advisory for business decisions |

**Rule:** Amplifiers run AFTER the main work is done. Don't use them during core execution.

---

## Project Classification Taxonomy

When a user describes their project, classify it into one of these types
to determine which Circle 1 (CORE) agents to activate:

```
PROJECT TYPES
├── SOFTWARE BUILD
│   ├── Greenfield (new project from scratch)
│   ├── Brownfield (enhance existing codebase)
│   ├── Feature (add capability to existing project)
│   ├── Bug Fix (diagnose and fix issues)
│   └── Refactor (restructure without changing behavior)
│
├── CONTENT CREATION
│   ├── Video (YouTube, course, explainer)
│   ├── Written (blog, newsletter, documentation)
│   ├── Copy (sales page, VSL, ads, email)
│   └── Educational (curriculum, lesson, course)
│
├── BUSINESS STRATEGY
│   ├── Offer Design (pricing, packaging, positioning)
│   ├── Growth (marketing, acquisition, retention)
│   ├── Operations (process, tooling, automation)
│   └── Analysis (research, competitive, market)
│
├── SQUAD BUILDING
│   ├── New Squad (create from scratch)
│   ├── Mind Clone (clone an expert)
│   ├── Squad Extension (add agents to existing)
│   └── Squad Optimization (improve existing)
│
└── LEARNING DESIGN
    ├── Course Creation (structured curriculum)
    ├── Gamified Learning (dopamine-based)
    └── Skill Training (hands-on, practical)
```

---

## Workflow Composition Patterns

There are 5 fundamental patterns for composing agents into workflows:

### Pattern 1: Sequential Pipeline

```
Agent A → Agent B → Agent C → Agent D
```

**Use when:** Each step depends on the previous step's output.
**Example:** @sm creates stories → @po validates → @dev implements → @qa reviews

### Pattern 2: Parallel Execution

```
        ┌→ Agent A ─┐
Input ──┼→ Agent B ──┼── Consolidate → Output
        └→ Agent C ─┘
```

**Use when:** Multiple independent analyses needed, then consolidated.
**Example:** enhance-workflow Phase 3 (Roundtable) — 4 agents review in parallel

### Pattern 3: Wave Execution

```
Wave 1: [Story A, Story B] (parallel)
         ↓ gate
Wave 2: [Story C, Story D] (parallel, depends on Wave 1)
         ↓ gate
Wave 3: [Story E] (depends on Wave 2)
```

**Use when:** Multiple items to process, some depend on others.
**Example:** epic-orchestration — stories grouped into dependency waves

### Pattern 4: Hub-and-Spoke (Chief + Specialists)

```
              ┌→ Specialist A
User → Chief ─┼→ Specialist B
              └→ Specialist C
              ↓
         Chief consolidates
```

**Use when:** A chief/router analyzes the request and delegates to the right specialist.
**Example:** copywriting-masters (copy-maestro routes to the right copywriter)

### Pattern 5: Feedback Loop

```
Agent A → Agent B → Gate
                     ↓ PASS → Continue
                     ↓ FAIL → Back to Agent A (with feedback)
```

**Use when:** Quality must be verified before proceeding.
**Example:** story-development-cycle — QA rejects → back to Dev with checklist

### Combining Patterns

Real workflows combine these patterns. The `idea-to-deploy` skill combines:
- Sequential (Phase 1 → 2 → 3 → 4 → 5 → 6 → 7)
- Parallel (Phase 1: @pm + @architect run together)
- Wave (Phase 4: stories in dependency waves)
- Feedback Loop (Phase 5: QA gate can reject back to Phase 4)

---

## Agent Collaboration Rules

### How Agents Communicate

Agents communicate through **FILES**, not messages:

```
Phase 1 agent saves → outputs/{workflow}/{slug}/01-result.md
Phase 2 agent reads → outputs/{workflow}/{slug}/01-result.md
Phase 2 agent saves → outputs/{workflow}/{slug}/02-result.md
...
```

**Why files, not messages?** Each agent runs in its own context (no shared memory).
Files are the persistent bridge between agent contexts.

### The Orchestrator Role

The orchestrator (you, the main session) coordinates:
1. Spawns agents via Task tool
2. Waits for completion (blocking)
3. Reads output artifacts
4. Decides next phase
5. Passes context to next agent

### Permission Model

| Agent | Can Read | Can Write | Can Push | Can Code |
|-------|----------|-----------|----------|----------|
| @pm | Everything | Plans, epics | No | No |
| @po | Everything | Validation reports | No | No |
| @sm | Everything | Stories | No | No |
| @dev | Everything | Code, tests | No | Yes |
| @qa | Everything | Reports, minor fixes | No | Yes (fixes) |
| @devops | Everything | CI/CD, configs | Yes (EXCLUSIVE) | Yes (infra) |
| @architect | Everything | Architecture docs | No | No |

**Only @devops can push to remote.** This is a non-negotiable rule.

### Anti-Patterns

| Anti-Pattern | Why It Fails | Do This Instead |
|-------------|-------------|-----------------|
| Spawn 10 agents at once | Context overload, wasted tokens | Spawn per phase, 2-4 parallel max |
| Agent talks to agent via SendMessage | Messages are ephemeral, context-limited | Save to file, next agent reads file |
| Same agent does everything | Jack-of-all-trades produces mediocre results | Specialist per concern |
| Skip quality gates | Bad output cascades downstream | Always gate before proceeding |
| Use Opus for everything | Expensive, slow, unnecessary | Haiku for search, Sonnet for work, Opus for architecture |

---

## Common Workflow Templates

### Template 1: Software Feature (Full SDLC)

```
Use skill: /idea-to-deploy

Core: @pm → @architect → @sm → @po → @dev → @qa → @devops
Specialists: enterprise-qa-devops (Jira/Xray), quality-shield
Pattern: Sequential + Wave (parallel stories) + Feedback Loop (QA gate)
```

### Template 2: YouTube Video (Script to Upload)

```
Core: content chief → specialist writer → scorer
Specialists: youtube-scripts (write), youtube-title (title), youtube-outlier (strategy)
Pattern: Sequential pipeline

Phases:
1. youtube-outlier:audit-channel → understand positioning
2. youtube-scripts:write-script → retention-optimized script
3. youtube-title:generate-titles → CTR-optimized title options
4. youtube-scripts:score-script → quality validation
```

### Template 3: Launch Campaign (Offer to Revenue)

```
Core: hormozi-chief → specialists
Specialists: hormozi (offers, pricing, launch), copywriting-masters (copy), content-engine (content)
Pattern: Hub-and-Spoke + Sequential

Phases:
1. hormozi:diagnose-business-stage → where you are
2. hormozi:create-grand-slam-offer → irresistible offer
3. copywriting-masters:create-sales-page → conversion copy
4. content-engine:write-ad → traffic creative
5. hormozi:create-launch-timeline → execution plan
```

### Template 4: New Squad Creation

```
Core: squad-prep → squad-creator
Specialists: etl-data-collector (sources), clone-engineering (minds), team-taxonomy (structure)
Pattern: Sequential pipeline

Phases:
1. squad-prep:workflow-a-expert-squad → design document (SPD)
2. etl-data-collector:collect-all-sources → raw materials
3. clone-engineering:start-pipeline → clone target minds
4. squad-creator:create-squad → build the squad
5. skill-tester:compare-skills → validate quality
```

### Template 5: Course Creation (Educational)

```
Core: teachers-online chief → educator specialists
Specialists: teachers-online (content), dopamine-learning (engagement), teachers-squad (pedagogy)
Pattern: Hub-and-Spoke + Parallel

Phases:
1. teachers-squad:create-curriculum → structure + objectives
2. dopamine-learning:analyze-learner-profile → engagement design
3. teachers-online:create-course-module → content per module (parallel)
4. dopamine-learning:design-feedback-layers → assessment system
5. teachers-online:adapt-for-platform → platform-specific formatting
```

### Template 6: Brownfield Enhancement

```
Core: @architect → @analyst → roundtable → @pm
Specialists: domain-decoder (code analysis), quality-shield (regression)
Pattern: Sequential + Parallel (roundtable)

Use skill: /enhance-workflow

Phases:
1. domain-decoder:quick-scan → understand the codebase
2. @architect: discovery → technical mapping
3. @analyst: research → strategic analysis
4. Roundtable: 4 agents parallel → cross-functional review
5. @pm: create epic → structured execution plan
```

---

# PART 2: ORCHESTRATOR EXECUTION PROTOCOL

## Phase 0: DISCOVER — Scan Available Squads

The orchestrator automatically discovers what's available by scanning:

```
Locations to scan:
1. squads/*/README.md — Squad overviews
2. .aios-core/development/agents/ — Core agents
3. .aios-core/development/workflows/ — Core workflows
```

Build a capability inventory:

```
For each squad:
- Name
- Agent count
- Core capability (from README)
- Available tasks
- Available workflows
- Domain keywords (for matching)
```

**Implementation:** Use a Haiku agent to scan and build the inventory:

```
Task(
  prompt: "Scan all squads in squads/ and .aios-core/development/. For each, read README.md and list: name, agents, capability, tasks, workflows. Return as structured inventory.",
  subagent_type: "Explore",
  model: "haiku",
  mode: "bypassPermissions"
)
```

Save inventory to: `outputs/orchestrator/{slug}/00-inventory.md`

---

## Phase 1: UNDERSTAND — Classify the Project

Collect from the user:

1. **What:** Project/task description
2. **Goal:** What outcome they want
3. **Context:** Existing codebase? New project? Content? Business?

Then classify:

```
Input: user description
  ↓
Classify project type (from taxonomy above)
  ↓
Identify primary domain keywords
  ↓
Determine which Circle 1 (CORE) agents apply
  ↓
Output: project profile
```

Save profile to: `outputs/orchestrator/{slug}/01-project-profile.md`

---

## Phase 2: RECOMMEND — 3 Circles Selection

Match project needs to available squads:

**Step 2a: Select Circle 1 (CORE)**

Based on project type:
- Software → AIOS core agents (pm, architect, sm, po, dev, qa, devops)
- Content → Content chief + specialist writers
- Business → Analyst + PM + advisory
- Squad Building → Squad prep + squad creator
- Learning → Teachers chief + educator specialists

**Step 2b: Select Circle 2 (SPECIALISTS)**

Match domain keywords from project profile to squad capabilities:

```
For each squad in inventory:
  score = count(project_keywords ∩ squad_keywords)
  if score > threshold: recommend as specialist
```

**Step 2c: Select Circle 3 (AMPLIFIERS)**

Based on project maturity:
- New project → skill-tester (validate approach)
- Existing project → quality-shield (regression), team-taxonomy (optimization)
- Business → marketing-opes (strategic advisory), priorize (prioritization)

**Step 2d: Present Recommendation**

Show the user:

```markdown
## Recommended Squad Selection

### Circle 1: CORE (Always Active)
- @pm (Morgan) — scope and planning
- @architect (Aria) — technical design
- ...

### Circle 2: SPECIALISTS (Called When Needed)
- enterprise-qa-devops — Jira/Xray integration
- quality-shield — regression protection
- ...

### Circle 3: AMPLIFIERS (After Core Work)
- skill-tester — validate outputs
- ...

### Not Recommended (and why)
- hormozi — not a revenue/offer project
- youtube-scripts — not a video project
- ...
```

Ask user to approve or adjust the selection.

Save to: `outputs/orchestrator/{slug}/02-squad-selection.md`

---

## Phase 3: COMPOSE — Design the Workflow

Based on the selected squads and project type, compose a custom workflow.

**Step 3a: Determine Workflow Pattern**

| Project Type | Primary Pattern | Secondary |
|-------------|----------------|-----------|
| Software Feature | Sequential + Wave | Feedback Loop |
| Content Creation | Hub-and-Spoke | Sequential |
| Business Strategy | Sequential | Parallel |
| Squad Building | Sequential Pipeline | — |
| Learning Design | Hub-and-Spoke | Parallel |

**Step 3b: Define Phases**

For each phase define:
- Phase number and name
- Agent(s) assigned (from selected squads)
- Input (which previous phase artifacts to read)
- Mission (what the agent must do)
- Output (artifact file to save)
- Quality gate (pass/fail criteria)
- Failure action (retry, skip, escalate)

**Step 3c: Define Dependencies**

```
Phase 1: no dependencies
Phase 2: depends on Phase 1
Phase 3: depends on Phase 2
Phase 4a, 4b, 4c: depend on Phase 3, run in parallel
Phase 5: depends on all of Phase 4
...
```

**Step 3d: Present Workflow**

Show the user the composed workflow:

```markdown
## Composed Workflow: {project name}

### Phases
| # | Phase | Agent(s) | Pattern | Gate |
|---|-------|----------|---------|------|
| 1 | Planning | @pm + @architect | Parallel | Scope approved |
| 2 | Stories | @sm + @po | Sequential | All validated |
| 3 | ... | ... | ... | ... |

### Dependency Graph
Phase 1 → Phase 2 → Phase 3
                  → Phase 4a ┐
                  → Phase 4b ├→ Phase 5
                  → Phase 4c ┘

### Estimated Agents: {N}
### Estimated Phases: {N}
```

Ask user to approve, adjust, or regenerate.

Save to: `outputs/orchestrator/{slug}/03-workflow.md`

---

## Phase 4: EXECUTE — Run the Workflow

Once approved, execute the composed workflow:

### Setup

```
mkdir -p outputs/orchestrator/{slug}/
TeamCreate(team_name: "orch-{slug}")
```

Create tasks with dependencies matching the composed workflow.

### Execution Loop

For each phase in the workflow:

```
1. Read the phase definition from 03-workflow.md
2. TaskUpdate(taskId: "{phase_id}", status: "in_progress")
3. Spawn agent(s) via Task tool:
   - subagent_type from AGENT_MAP
   - team_name: "orch-{slug}"
   - mode: "bypassPermissions"
   - Prompt includes: mission, inputs (previous artifacts), output path
4. Wait for completion (Task blocking)
5. Read output artifact
6. Evaluate quality gate
   - PASS → TaskUpdate(status: "completed"), proceed to next phase
   - FAIL → Apply failure action (retry, escalate to user, skip)
7. Repeat for next phase
```

### Parallel Phases

When multiple phases can run in parallel:

```
Task(..., run_in_background: true)  → agent_1
Task(..., run_in_background: true)  → agent_2
Task(..., run_in_background: true)  → agent_3

TaskOutput(task_id: "agent_1", block: true)
TaskOutput(task_id: "agent_2", block: true)
TaskOutput(task_id: "agent_3", block: true)
```

### Quality Gates

After each phase, verify:

```
1. Output artifact exists and is non-empty
2. Phase-specific criteria met (from workflow definition)
3. No blocking errors reported
```

If gate fails:
- Retry once with adjusted prompt
- If still fails, present to user with options: fix manually, skip, abort

### Model Routing

| Agent Type | Model | Rationale |
|-----------|-------|-----------|
| Discovery/scan agents | Haiku | Fast, cheap, data gathering |
| Planning agents (@pm, @sm, @po) | Sonnet | Standard planning work |
| Implementation agents (@dev) | Sonnet | Standard coding work |
| Architecture agents (@architect) | Sonnet (escalate to Opus if complex) | Design decisions |
| Quality agents (@qa) | Sonnet | Review and validation |
| Specialist squad agents | Sonnet | Domain expertise |

---

## Phase 5: FINALIZE — Summary and Cleanup

After all phases complete:

```markdown
## Orchestration Complete: {project name}

### Project Type: {type}
### Squads Used: {list}
### Phases Executed: {N}/{N}

### Generated Artifacts
| Phase | File | Agent | Status |
|-------|------|-------|--------|
| 1 | 01-{name}.md | @pm | Done |
| 2 | 02-{name}.md | @architect | Done |
| ... | ... | ... | ... |

### Quality Gates
| Phase | Gate | Result |
|-------|------|--------|
| 1 | Scope approved | PASS |
| 2 | Stories validated | PASS |
| ... | ... | ... |

### Next Steps
1. {context-specific recommendation}
2. {context-specific recommendation}
3. {context-specific recommendation}
```

Cleanup:
- Send shutdown_request to all agents
- TeamDelete after all agents shut down
- Present final summary to user

---

## Error Handling

### Agent Spawn Failure
- Log error, retry once
- If retry fails, skip phase and note it for manual execution

### Artifact Missing
- Check if agent completed (TaskOutput)
- If agent completed but no artifact, re-spawn with explicit save instruction

### Quality Gate Failure
- Present failure details to user
- Options: retry phase, adjust requirements, skip with documented gap, abort

### Enterprise Tool Failures (Jira, Xray, etc.)
- Continue the workflow (enterprise tools are optional enhancements)
- Log all failures for manual resolution at the end
- The workflow produces value even without enterprise integration

---

## Implementation Notes

- Each agent runs in its own context (no shared memory)
- Communication between phases is via FILES (not messages)
- The orchestrator coordinates quality between phases
- If an agent fails, recreate and re-spawn
- Use `mode: "bypassPermissions"` for all agents that need file access
- Specialist squad tasks can be invoked via Skill tool when needed
- The orchestrator adapts the workflow dynamically — if a phase produces unexpected output, adjust subsequent phases
- Save all decisions and rationale for reproducibility

---

## Quick Reference: All Available Squads

### Builders (Infrastructure & Development)
| Squad | Agents | Use For |
|-------|--------|---------|
| AIOS Core | 12 | PM, PO, SM, Dev, QA, DevOps, Architect, Analyst, Data Eng, UX |
| squad-creator | 3+ | Building new squads from elite minds |
| squad-prep | 1 | Planning squad design before creation |
| domain-decoder | 8 | Extracting business rules from legacy code |
| enterprise-qa-devops | 4 | Jira, Xray, Confluence, O365 automation |
| quality-shield | 5 | Bug resolution, regression, production monitoring |
| skill-tester | 4 | A/B testing skills, agents, prompts |
| autoclaw | 1 | OpenClaw whitelabel deployment |
| alma-integration | 3 | Cross-agent memory and trust |
| project-management-clickup | 9 | ClickUp workspace architecture |

### Specialists (Domain Expertise)
| Squad | Agents | Use For |
|-------|--------|---------|
| content-engine | 20 | Full-stack content creation |
| copywriting-masters | 16 | Legendary copywriter clones |
| hormozi | 15 | $100M business system |
| design | 16 | Design system lifecycle |
| teachers-online | 11 | Online education content |
| teachers-squad | 10 | Classroom education |
| neuroplasticity | 11 | Brain optimization |
| dopamine-learning | 10 | Science-based learning design |
| youtube-scripts | 10 | YouTube scriptwriting |
| youtube-title | 8 | CTR-optimized titles |
| youtube-outlier | 5 | YouTube growth strategy |
| koe | 9 | One-person business |
| clone-engineering | 5 | Cognitive cloning (MMOS) |
| academic-research | 6 | Academic research and papers |
| etl-data-collector | 6 | Industrial ETL pipeline |
| contabil | 5 | Brazilian accounting |
| copy-juridica-etica | 6 | Legal copywriting |
| team-taxonomy | 6 | Organization and team design |
| priorize | 3 | 23 prioritization techniques |
| marketing-opes | 4 | Strategic advisory board |
| squad-criativos | 43 | Full creative agency |
