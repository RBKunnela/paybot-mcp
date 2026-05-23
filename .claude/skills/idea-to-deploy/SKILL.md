---
name: idea-to-deploy
description: |
  Idea-to-Deploy Bridge Workflow - Full SDLC orchestration connecting AIOS core agents
  to enterprise-qa-devops (Jira/Xray/Confluence).

  7-phase pipeline: Idea -> Epic -> Stories -> Test Plan -> Implement -> Quality Gate -> Deploy -> Verify & Close.

  Bridges Circle 1 (AIOS Builders: PM/PO/SM/Dev/QA/DevOps/Architect) with Circle 2
  (Enterprise QA-DevOps: Jira/Xray/Confluence) into a single repeatable workflow.

  Use when: starting a new feature or epic that needs Jira tracking, Xray test management,
  and Confluence documentation alongside AIOS agent orchestration.
---

# Idea-to-Deploy Bridge Workflow

Full software development lifecycle orchestration connecting AIOS core agents to Jira, Xray, and Confluence.

## Overview

```
/idea-to-deploy "description of the feature/epic"

Phase 1: Idea -> Epic       @pm + @architect           -> epic definition + Jira Epic
Phase 2: Epic -> Stories     @sm + @po                  -> stories + Jira Stories
Phase 3: Test Plan           @qa                        -> test plan + Xray Test Sets
Phase 4: Implement           @dev (parallel per story)  -> code + commits
Phase 5: Quality Gate        @qa + quality-shield       -> review + Xray results
Phase 6: Deploy              @devops                    -> push + release
Phase 7: Verify & Close      @qa + @confluence          -> docs + close Jira
```

## Pipeline Architecture

```
                    CIRCLE 1: AIOS BUILDERS              CIRCLE 2: ENTERPRISE QA-DEVOPS
                    ========================              ============================

Phase 1  ┌─────────────────────────────┐    ┌──────────────────────────┐
IDEA ->  │ @pm (Morgan) defines scope  │───>│ @jira creates Epic       │
EPIC     │ @architect (Aria) designs   │    │ (project, summary, type) │
         └─────────────────────────────┘    └──────────────────────────┘
                      │
Phase 2  ┌─────────────────────────────┐    ┌──────────────────────────┐
EPIC ->  │ @sm (River) creates stories │───>│ @jira bulk-creates       │
STORIES  │ @po (Pax) validates (10chk) │    │ Stories linked to Epic   │
         └─────────────────────────────┘    └──────────────────────────┘
                      │
Phase 3  ┌─────────────────────────────┐    ┌──────────────────────────┐
TEST     │ @qa (Quinn) designs tests   │───>│ @xray creates Test Sets  │
PLAN     │ per story acceptance criteria│    │ linked to Stories        │
         └─────────────────────────────┘    └──────────────────────────┘
                      │
Phase 4  ┌─────────────────────────────┐
IMPLEMENT│ @dev (Dex) implements       │    (no enterprise tools -
         │ parallel per story          │     pure code phase)
         └─────────────────────────────┘
                      │
Phase 5  ┌─────────────────────────────┐    ┌──────────────────────────┐
QUALITY  │ @qa reviews + quality gate  │───>│ @xray records results    │
GATE     │ quality-shield regression   │    │ @jira transitions status │
         └─────────────────────────────┘    └──────────────────────────┘
                      │
Phase 6  ┌─────────────────────────────┐    ┌──────────────────────────┐
DEPLOY   │ @devops pushes + tags       │───>│ @jira marks Released     │
         │                             │    │                          │
         └─────────────────────────────┘    └──────────────────────────┘
                      │
Phase 7  ┌─────────────────────────────┐    ┌──────────────────────────┐
VERIFY   │ @qa final verification      │───>│ @xray coverage report    │
& CLOSE  │                             │    │ @confluence release page │
         └─────────────────────────────┘    └──────────────────────────┘
```

## AGENT_MAP

```yaml
# Circle 1: AIOS Core Agents
AGENT_MAP:
  pm: "aios-pm"
  po: "aios-po"
  sm: "aios-sm"
  dev: "aios-dev"
  qa: "aios-qa"
  devops: "aios-devops"
  architect: "aios-architect"
```

Enterprise QA-DevOps agents are invoked via their task skills (not as subagent_type):
- `enterprise-qa-devops:tasks:jira-create-issue` — single Jira issue
- `enterprise-qa-devops:tasks:jira-bulk-create` — batch Jira issues
- `enterprise-qa-devops:tasks:jira-update-status` — transition status
- `enterprise-qa-devops:tasks:jira-search` — JQL queries
- `enterprise-qa-devops:tasks:xray-create-test` — create test cases
- `enterprise-qa-devops:tasks:xray-create-execution` — create test execution
- `enterprise-qa-devops:tasks:xray-coverage-report` — test coverage
- `enterprise-qa-devops:tasks:confluence-create-page` — wiki page
- `enterprise-qa-devops:tasks:confluence-from-template` — templated page

## Context Loading (Automatic)

Each AIOS agent wrapper (`.claude/agents/aios-*.md`) automatically loads:
- Git status, branch, permissions
- Gotchas filtered by domain
- Technical preferences
- Project status

**No need to include context loading instructions in prompts** - the wrappers handle it.

## Input Collection

Collect from user (use AskUserQuestion if needed):

1. **Feature**: What feature/epic to build? (description, objective, business value)
2. **Project**: Which Jira project key? (e.g., `PAY`, `PAYBOT`)
3. **Target repo**: Which repository? (defaults to current working directory)
4. **Mode**: `auto` (minimal prompts), `interactive` (checkpoints), `preflight` (full planning)

If the user already provided sufficient context in arguments, skip collection and start directly.

## Setup

### Artifact Directory

Create artifact output directory:

```
outputs/idea-to-deploy/{slug}/
```

Where `{slug}` is the feature name in snake_case (e.g., `payment_gateway`, `user_auth`).

### Team Creation

```
TeamCreate(team_name: "i2d-{slug}")
```

### Task Creation (with dependencies)

Create 7 sequential tasks:

| ID | Task | Agents | Blocked By |
|----|------|--------|------------|
| 1 | Phase 1: Idea to Epic - Architecture + Epic definition | pm, architect | - |
| 2 | Phase 2: Epic to Stories - Story breakdown + Jira sync | sm, po | 1 |
| 3 | Phase 3: Test Plan - Test design + Xray sync | qa | 2 |
| 4 | Phase 4: Implement - Code per story | dev | 3 |
| 5 | Phase 5: Quality Gate - Review + Xray results | qa | 4 |
| 6 | Phase 6: Deploy - Push + release | devops | 5 |
| 7 | Phase 7: Verify & Close - Docs + close issues | qa | 6 |

## Execution Pattern (CRITICAL)

### How Agent Waiting Works

The `Task` tool has **native blocking behavior** - it automatically waits for the agent to complete before returning. You do NOT need any manual waiting mechanism.

### Sequential Phases (all 7 phases)

```
# Task tool WITHOUT run_in_background = BLOCKS until agent completes
Task(prompt: "...", subagent_type: "aios-pm", mode: "bypassPermissions")
# When execution reaches here, the agent is DONE
TaskUpdate(taskId: "X", status: "completed")
```

### Parallel Sub-phases (Phase 1: pm + architect, Phase 4: multiple stories)

```
# Spawn agents in a SINGLE message with run_in_background: true
Task(prompt: "agent 1...", subagent_type: "aios-pm", run_in_background: true)
Task(prompt: "agent 2...", subagent_type: "aios-architect", run_in_background: true)

# Wait for each
TaskOutput(task_id: "id_1", block: true)
TaskOutput(task_id: "id_2", block: true)
```

### Enterprise Task Invocation

Enterprise QA-DevOps tasks (Jira/Xray/Confluence) are invoked by the orchestrator
directly after each AIOS phase completes. The orchestrator reads the phase output
artifact and calls the enterprise task skill inline.

### NEVER DO THIS (Anti-Patterns)

```
# WRONG: Sleep loops, polling, periodic file checking, SendMessage polling
# The Task tool handles ALL waiting automatically. Trust the blocking mechanism.
```

---

## Phase Execution

### Phase 1: Idea to Epic (@pm + @architect -> @jira)

**Goal:** Transform a raw idea into a structured Epic with architecture, then create it in Jira.

**Step 1a: Architecture Design** (parallel with 1b)

Spawn architect via Task tool:
- `subagent_type`: "aios-architect"
- `team_name`: "i2d-{slug}"
- `name`: "architect"
- `mode`: "bypassPermissions"

**Agent prompt:**

```
## Mission: epic-architecture

## Context
Feature: {feature description from user}
Target repo: {repo path}

## Mission
Design the technical architecture for this feature:

1. **Current State Analysis**
   - Project structure and tech stack
   - Existing patterns and conventions
   - Integration points affected

2. **Architecture Design**
   - High-level system design
   - Component breakdown
   - Data flow and API contracts
   - Database schema changes (if any)
   - Security considerations

3. **Technical Decisions**
   - Recommended approach with trade-offs
   - Technology choices justified
   - Performance considerations
   - Scalability plan

4. **Implementation Strategy**
   - Suggested story breakdown (components/features)
   - Dependencies between components
   - Risk assessment

## Output
Save to: outputs/idea-to-deploy/{slug}/01a-architecture.md

Format:
# Architecture Design - {feature name}
## Executive Summary
## Current State
## Architecture Design
## Technical Decisions
## Implementation Strategy
## Risks and Mitigations
```

**Step 1b: Epic Definition** (parallel with 1a)

Spawn PM via Task tool:
- `subagent_type`: "aios-pm"
- `team_name`: "i2d-{slug}"
- `name`: "pm"
- `mode`: "bypassPermissions"

**Agent prompt:**

```
## Mission: define-epic

## Context
Feature: {feature description from user}

## Mission
Define the complete Epic for this feature:

1. **Epic Definition**
   - Clear, descriptive title
   - Business objective (problem it solves)
   - Success metrics (measurable KPIs)
   - Scope: what is IN and what is OUT
   - Target users/personas

2. **Value Proposition**
   - Business value justification
   - User impact assessment
   - Priority rationale

3. **High-Level Requirements**
   - Functional requirements (bulleted list)
   - Non-functional requirements (performance, security, scalability)
   - Constraints and assumptions

4. **Stakeholder Map**
   - Who benefits from this
   - Who needs to approve
   - Who will be impacted

## Output
Save to: outputs/idea-to-deploy/{slug}/01b-epic-definition.md

Format:
# Epic Definition - {feature name}
## Title
## Business Objective
## Success Metrics
## Scope
## Requirements
## Stakeholders
```

**Step 1c: Consolidate + Create Jira Epic** (after 1a and 1b complete)

After both agents return, the orchestrator:

1. Read `01a-architecture.md` and `01b-epic-definition.md`
2. Consolidate into `outputs/idea-to-deploy/{slug}/01-epic.md`
3. Create the Jira Epic using the Skill tool:

```
Skill(skill: "enterprise-qa-devops:tasks:jira-create-issue", args: "--project {PROJECT} --type Epic --summary '{epic title}' --description '{epic description with architecture summary}'")
```

4. Record the returned Epic key (e.g., `PAY-100`) in `01-epic.md`

Then:
1. `TaskUpdate(taskId: "1", status: "completed")`
2. `TaskUpdate(taskId: "2", status: "in_progress")`
3. Proceed to Phase 2.

---

### Phase 2: Epic to Stories (@sm + @po -> @jira)

**Goal:** Break the Epic into implementable stories, validate them, then sync to Jira.

**Step 2a: Story Breakdown** (@sm)

Spawn SM via Task tool:
- `subagent_type`: "aios-sm"
- `team_name`: "i2d-{slug}"
- `name`: "sm"
- `mode`: "bypassPermissions"

**Agent prompt:**

```
## Mission: break-epic-into-stories

## Inputs
Read: outputs/idea-to-deploy/{slug}/01-epic.md

## Mission
Break this Epic into implementable stories:

1. **Story Decomposition**
   For each story create:
   - Title: clear, action-oriented
   - Description: "As [persona], I want [action], so that [benefit]"
   - Acceptance Criteria: testable Given/When/Then format
   - Story Points: fibonacci (1, 2, 3, 5, 8, 13)
   - Dependencies: which stories must complete first
   - Assigned executor: @dev, @data-engineer, @devops, or @ux

2. **Implementation Order**
   - Group stories into waves (can be parallel within wave)
   - Define wave dependencies
   - Identify critical path

3. **Story Summary Table**
   | # | Title | Points | Wave | Executor | Dependencies |
   |---|-------|--------|------|----------|--------------|

## Output
Save to: outputs/idea-to-deploy/{slug}/02a-stories.md

Format:
# Story Breakdown - {epic title}
## Epic Reference: {epic key}
## Summary Table
## Stories (detailed, one per section)
## Implementation Order (waves)
```

**Step 2b: Story Validation** (@po)

Spawn PO via Task tool:
- `subagent_type`: "aios-po"
- `team_name`: "i2d-{slug}"
- `name`: "po"
- `mode`: "bypassPermissions"

**Agent prompt:**

```
## Mission: validate-stories

## Inputs
Read: outputs/idea-to-deploy/{slug}/01-epic.md
Read: outputs/idea-to-deploy/{slug}/02a-stories.md

## Mission
Validate each story with the 10-point checklist:

For each story verify:
- [ ] 1. Title clear and objective
- [ ] 2. Complete problem/need description
- [ ] 3. Testable acceptance criteria (Given/When/Then)
- [ ] 4. Well-defined scope (IN and OUT)
- [ ] 5. Dependencies mapped
- [ ] 6. Appropriate complexity estimate
- [ ] 7. Business value identified
- [ ] 8. Risks documented
- [ ] 9. Clear Definition of Done
- [ ] 10. Alignment with Epic

Report:
- APPROVED stories (passed all 10)
- NEEDS REVISION stories (with specific feedback per failed check)

## Output
Save to: outputs/idea-to-deploy/{slug}/02b-validation.md

Format:
# Story Validation Report
## Summary: X/Y stories approved
## Per-Story Results (table with 10 checks each)
## Revision Requests (if any)
```

**Step 2c: Sync Stories to Jira** (after 2a and 2b complete)

After both agents return, the orchestrator:

1. Read `02a-stories.md` and `02b-validation.md`
2. If any stories need revision, note them but proceed with approved stories
3. Consolidate into `outputs/idea-to-deploy/{slug}/02-stories.md`
4. Create Jira stories using the Skill tool:

```
Skill(skill: "enterprise-qa-devops:tasks:jira-bulk-create", args: "--project {PROJECT} --parent {EPIC_KEY} --issues '[{story definitions as JSON}]'")
```

5. Record the returned Story keys in `02-stories.md`

Then:
1. `TaskUpdate(taskId: "2", status: "completed")`
2. `TaskUpdate(taskId: "3", status: "in_progress")`
3. Proceed to Phase 3.

---

### Phase 3: Test Plan (@qa -> @xray)

**Goal:** Design test cases per story based on acceptance criteria, then create them in Xray.

Spawn QA via Task tool:
- `subagent_type`: "aios-qa"
- `team_name`: "i2d-{slug}"
- `name`: "qa"
- `mode`: "bypassPermissions"

**Agent prompt:**

```
## Mission: design-test-plan

## Inputs
Read: outputs/idea-to-deploy/{slug}/01-epic.md
Read: outputs/idea-to-deploy/{slug}/02-stories.md

## Mission
Design a comprehensive test plan:

1. **Test Strategy**
   - Test levels: unit, integration, e2e
   - Test approach per story
   - Coverage targets

2. **Test Cases per Story**
   For each story, derive test cases from acceptance criteria:
   - Test ID: TC-{story#}-{seq}
   - Title: descriptive test name
   - Type: Manual | Cucumber | Generic
   - Preconditions
   - Steps (numbered)
   - Expected Result
   - Linked Story: {story key}
   - Priority: High | Medium | Low

3. **Test Set Organization**
   - Group test cases into Test Sets (by story or by feature area)
   - Define execution order

4. **Test Summary Table**
   | Test ID | Title | Type | Story | Priority |
   |---------|-------|------|-------|----------|

## Output
Save to: outputs/idea-to-deploy/{slug}/03-test-plan.md

Format:
# Test Plan - {epic title}
## Test Strategy
## Test Summary Table
## Test Cases (detailed, one per section)
## Test Sets
```

After the QA agent returns, the orchestrator:

1. Read `03-test-plan.md`
2. Create Xray test cases using the Skill tool:

For each test case:
```
Skill(skill: "enterprise-qa-devops:tasks:xray-create-test", args: "--project {PROJECT} --type Manual --summary '{test title}' --steps '[{steps}]' --linkedIssue {STORY_KEY}")
```

3. Create a Test Execution container:
```
Skill(skill: "enterprise-qa-devops:tasks:xray-create-execution", args: "--project {PROJECT} --summary 'Test Execution: {epic title}' --testKeys '[{test keys}]'")
```

4. Record all Xray keys in `03-test-plan.md`

Then:
1. `TaskUpdate(taskId: "3", status: "completed")`
2. `TaskUpdate(taskId: "4", status: "in_progress")`
3. Proceed to Phase 4.

---

### Phase 4: Implement (@dev, parallel per story)

**Goal:** Implement each story following the story-development-cycle pattern.

This phase follows the `epic-orchestration.yaml` pattern: stories execute in waves,
with parallel execution within each wave (max_concurrency from epic-orchestration).

**For each wave of stories:**

Spawn one @dev per story in the wave, in parallel:

**Agent prompt (per story):**

```
## Mission: implement-story

## Inputs
Read: outputs/idea-to-deploy/{slug}/01-epic.md (architecture context)
Read: outputs/idea-to-deploy/{slug}/02-stories.md (find YOUR story: {story title})
Read: outputs/idea-to-deploy/{slug}/03-test-plan.md (test cases for YOUR story)

## Story to Implement
{story title}
Jira Key: {STORY_KEY}
Acceptance Criteria: {copied from stories file}

## Mission
Implement this story completely:

1. **Analyze** acceptance criteria and test cases
2. **Plan** implementation approach
3. **Code** following project patterns and conventions
4. **Test** write unit tests covering acceptance criteria
5. **Commit** atomic commits with conventional format: feat: {description} [{STORY_KEY}]
6. **Report** list of files modified, test results, commit hashes

## Output
Save to: outputs/idea-to-deploy/{slug}/04-impl-{story_slug}.md

Format:
# Implementation Report - {story title}
## Story: {STORY_KEY}
## Approach
## Files Modified
## Tests Written
## Commits
## Status: Complete | Partial (with explanation)
```

Spawn stories in parallel using `run_in_background: true`, then `TaskOutput` to wait.

After all stories in a wave complete, proceed to next wave.
After all waves complete, consolidate into `outputs/idea-to-deploy/{slug}/04-implementation.md`.

Then:
1. `TaskUpdate(taskId: "4", status: "completed")`
2. `TaskUpdate(taskId: "5", status: "in_progress")`
3. Proceed to Phase 5.

---

### Phase 5: Quality Gate (@qa + quality-shield -> @xray)

**Goal:** Review all implementations, run quality checks, record results in Xray.

Spawn QA via Task tool:
- `subagent_type`: "aios-qa"
- `team_name`: "i2d-{slug}"
- `name`: "qa-gate"
- `mode`: "bypassPermissions"

**Agent prompt:**

```
## Mission: quality-gate-review

## Inputs
Read ALL files in: outputs/idea-to-deploy/{slug}/
- 01-epic.md (requirements)
- 02-stories.md (stories with acceptance criteria)
- 03-test-plan.md (expected test cases)
- 04-implementation.md (what was implemented)
- 04-impl-*.md (per-story implementation reports)

## Mission
Execute comprehensive quality gate review:

1. **Acceptance Criteria Verification**
   Per story: does the implementation satisfy ALL acceptance criteria?
   - [ ] Criteria met
   - [ ] Tests cover the criteria
   - [ ] No regressions introduced

2. **Code Quality Review**
   - [ ] Follows project patterns and conventions
   - [ ] No security vulnerabilities (OWASP basics)
   - [ ] No performance regressions
   - [ ] Proper error handling
   - [ ] Clean, readable code

3. **Test Execution**
   Run: npm test (or project-specific test command)
   Capture results.

4. **Regression Check**
   Use quality-shield patterns:
   - Check known interconnections
   - Verify no existing features broken
   - Validate integration points

5. **Gate Decision**
   - PASS: All criteria met, tests pass, no regressions
   - FAIL: List specific failures with remediation steps

## Output
Save to: outputs/idea-to-deploy/{slug}/05-quality-gate.md

Format:
# Quality Gate Report - {epic title}
## Gate Decision: PASS | FAIL
## Per-Story Results
## Code Quality Summary
## Test Results
## Regression Check
## Issues Found (if any)
## Remediation Steps (if FAIL)
```

After QA returns, the orchestrator:

1. Read `05-quality-gate.md`
2. If FAIL: stop pipeline, present issues to user, ask for remediation approach
3. If PASS: record results in Xray

```
Skill(skill: "enterprise-qa-devops:tasks:xray-create-execution", args: "--project {PROJECT} --summary 'QA Gate: {epic title}' --testKeys '[{test keys}]' --status PASS")
```

4. Update Jira story statuses:
```
Skill(skill: "enterprise-qa-devops:tasks:jira-update-status", args: "--issue {STORY_KEY} --status 'Done'")
```

Then:
1. `TaskUpdate(taskId: "5", status: "completed")`
2. `TaskUpdate(taskId: "6", status: "in_progress")`
3. Proceed to Phase 6.

---

### Phase 6: Deploy (@devops)

**Goal:** Push code, create release tag, update Jira.

Spawn DevOps via Task tool:
- `subagent_type`: "aios-devops"
- `team_name`: "i2d-{slug}"
- `name`: "devops"
- `mode`: "bypassPermissions"

**Agent prompt:**

```
## Mission: deploy-release

## Inputs
Read: outputs/idea-to-deploy/{slug}/05-quality-gate.md (confirm PASS)
Read: outputs/idea-to-deploy/{slug}/04-implementation.md (commits to push)

## Mission
Execute deployment:

1. **Pre-Deploy Checks**
   - Verify quality gate PASSED
   - Run lint: npm run lint
   - Run typecheck: npm run typecheck
   - Run tests: npm test
   - All must pass before proceeding

2. **Push**
   - Push current branch to remote
   - Create PR if on feature branch

3. **Tag Release** (if applicable)
   - Create git tag with version
   - Format: v{major}.{minor}.{patch}

4. **Report**
   - Push status
   - PR URL (if created)
   - Tag created
   - Any deployment notes

## Output
Save to: outputs/idea-to-deploy/{slug}/06-deploy.md

Format:
# Deploy Report - {epic title}
## Pre-Deploy Check Results
## Push Status
## PR / Tag
## Deployment Notes
```

After DevOps returns, the orchestrator:

1. Read `06-deploy.md`
2. Update Jira Epic status:
```
Skill(skill: "enterprise-qa-devops:tasks:jira-update-status", args: "--issue {EPIC_KEY} --status 'Done'")
```

Then:
1. `TaskUpdate(taskId: "6", status: "completed")`
2. `TaskUpdate(taskId: "7", status: "in_progress")`
3. Proceed to Phase 7.

---

### Phase 7: Verify & Close (@qa -> @xray + @confluence)

**Goal:** Final verification, generate coverage report, create Confluence release page, close everything.

Spawn QA via Task tool:
- `subagent_type`: "aios-qa"
- `team_name`: "i2d-{slug}"
- `name`: "qa-verify"
- `mode`: "bypassPermissions"

**Agent prompt:**

```
## Mission: verify-and-close

## Inputs
Read ALL files in: outputs/idea-to-deploy/{slug}/

## Mission
Final verification and closure:

1. **Post-Deploy Verification**
   - Verify deployment succeeded
   - Run smoke tests if available
   - Confirm no regressions in production/staging

2. **Coverage Summary**
   - Stories completed: X/Y
   - Test cases passed: X/Y
   - Code coverage: X%
   - Acceptance criteria met: X/Y

3. **Release Notes**
   Compile release notes from all implementation reports:
   - What was added/changed
   - Breaking changes (if any)
   - Known issues (if any)
   - Migration steps (if any)

4. **Lessons Learned**
   - What went well
   - What could improve
   - Recommendations for next iteration

## Output
Save to: outputs/idea-to-deploy/{slug}/07-verify-close.md

Format:
# Verification & Closure - {epic title}
## Verification Results
## Coverage Summary
## Release Notes
## Lessons Learned
```

After QA returns, the orchestrator:

1. Read `07-verify-close.md`
2. Generate Xray coverage report:
```
Skill(skill: "enterprise-qa-devops:tasks:xray-coverage-report", args: "--project {PROJECT} --epic {EPIC_KEY}")
```

3. Create Confluence release page:
```
Skill(skill: "enterprise-qa-devops:tasks:confluence-create-page", args: "--space {SPACE} --title 'Release: {epic title}' --content '{release notes from 07-verify-close.md}'")
```

4. Record Confluence page URL in `07-verify-close.md`

Then:
1. `TaskUpdate(taskId: "7", status: "completed")`
2. Proceed to Finalization.

---

## Finalization

After Phase 7 completes:

1. **Present summary** to user:

```markdown
## Idea-to-Deploy Complete: {feature name}

### Pipeline Summary
- Epic: {EPIC_KEY} - {epic title}
- Stories: {N} stories ({total} story points)
- Tests: {N} test cases ({pass_rate}% pass rate)
- Commits: {N} commits across {N} files

### Generated Artifacts
| Phase | File | Description |
|-------|------|-------------|
| 1 | `01-epic.md` | Architecture + Epic definition |
| 2 | `02-stories.md` | Stories breakdown + validation |
| 3 | `03-test-plan.md` | Test plan + Xray test cases |
| 4 | `04-implementation.md` | Implementation reports |
| 5 | `05-quality-gate.md` | Quality gate results |
| 6 | `06-deploy.md` | Deployment report |
| 7 | `07-verify-close.md` | Verification + release notes |

### Enterprise Integration
- Jira Epic: {EPIC_KEY} (Done)
- Jira Stories: {STORY_KEYS} (Done)
- Xray Tests: {TEST_KEYS} (Passed)
- Confluence: {PAGE_URL}

### Next Steps
1. Review release notes at Confluence
2. Monitor production for issues
3. Plan next iteration
```

2. **Cleanup**:
   - Send shutdown_request to all remaining agents
   - Execute TeamDelete after all agents shut down

## Error Handling

### Phase Failure Protocol

If any phase fails:

1. **Phase 1-3 (Planning):** Report failure, ask user for guidance, retry phase
2. **Phase 4 (Implementation):** Individual story failures don't block other stories.
   Failed stories are flagged and can be retried independently.
3. **Phase 5 (Quality Gate FAIL):** Stop pipeline. Present issues to user.
   Options: fix and re-run Phase 4-5, or skip with documented tech debt.
4. **Phase 6 (Deploy):** Roll back if possible, report to user immediately.
5. **Phase 7 (Verify):** Log issues, create follow-up Jira tickets for post-release fixes.

### Enterprise Tool Failures

If Jira/Xray/Confluence calls fail:
- Log the failure in the phase artifact
- Continue the AIOS pipeline (don't block on enterprise tool issues)
- Present all enterprise sync failures at the end for manual resolution
- The pipeline produces value even without enterprise integration

## Implementation Notes

- Each spawned agent runs in its own context (no shared memory)
- Communication between phases is via FILES (not messages)
- The team lead (orchestrator) coordinates and ensures quality between phases
- If an agent fails, recreate the task and re-spawn the agent
- Phase 4 stories can run in PARALLEL for efficiency
- Always use `mode: "bypassPermissions"` for agents that need to read/write files
- Enterprise tasks are called by the orchestrator, not by individual agents
- Jira keys are threaded through all phases via artifact files
