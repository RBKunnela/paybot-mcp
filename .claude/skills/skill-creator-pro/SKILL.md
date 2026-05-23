---
name: skill-creator-pro
description: |
  Advanced Skill Creator with knowledge from Anthropic's official cookbooks, SDK demos, tool patterns,
  and API examples. Creates three types of skills: (1) Claude Code skills (.claude/skills/ with SKILL.md),
  (2) API Skills (Anthropic Skills API beta with code execution), (3) Agent SDK skills (claude-agent-sdk
  with hooks, tools, subagents). Includes deep research, pattern analysis, quality validation, and
  packaging. Pipeline: Research Domain -> Select Skill Type -> Plan Contents -> Init -> Build -> Validate -> Package.
  Use when: creating new skills, upgrading existing skills, converting workflows to reusable skills,
  or building agent SDK integrations with custom tools.
---

# Skill Creator Pro

Creates production-quality skills by leveraging patterns from Anthropic's official repositories:
cookbooks, SDK demos, tool packages, and API examples.

## Three Skill Types

### Type 1: Claude Code Skill (`.claude/skills/`)

Local skills loaded into Claude Code sessions. Structure:

```
skill-name/
├── SKILL.md              # Required: frontmatter + instructions
├── scripts/              # Executable code (Python/Bash)
├── references/           # Documentation loaded on-demand
├── templates/            # Output templates and examples
├── assets/               # Files used in output (images, fonts)
├── checklists/           # Validation checklists
├── data/                 # Knowledge base files
├── tasks/                # Task definitions (for squad-style skills)
├── agents/               # Agent definitions (for squad-style skills)
└── workflows/            # Multi-step workflow definitions
```

**Progressive Disclosure**: Metadata (~100 words, always loaded) -> SKILL.md body (<5k words, on trigger) -> bundled resources (unlimited, on demand).

### Type 2: API Skill (Anthropic Skills API Beta)

Cloud-hosted skills created via `client.beta.skills.create()`. Structure:

```
skill-name/
├── SKILL.md              # Required: name + description frontmatter
├── scripts/              # Python scripts executed in sandbox
└── REFERENCE.md          # Optional reference documentation
```

**API Operations**: `create()`, `retrieve()`, `list()`, `delete()`, version management.
**Built-in Skills**: `xlsx`, `pptx`, `pdf`, `docx` (reference by skill_id).
**Beta Headers Required**: `code-execution-2025-08-25`, `files-api-2025-04-14`, `skills-2025-10-02`.

### Type 3: Agent SDK Skill (claude-agent-sdk)

Skills embedded in Agent SDK applications. Two patterns:

**A. Project Skills** (loaded via `settingSources: ['project']`):
```
agent/.claude/skills/skill-name/
├── SKILL.md
└── templates/            # Code templates for generation
```

**B. Custom MCP Tools** (programmatic):
```typescript
import { tool, createSdkMcpServer } from '@anthropic-ai/claude-agent-sdk';

const server = createSdkMcpServer({
  name: "my-tools",
  tools: [
    tool("tool_name", "description", { schema }, async (args) => {
      return { content: [{ type: "text", text: result }] };
    })
  ]
});
```

## Skill Creation Pipeline

### Phase 1: Research Domain

Before building, understand the domain deeply. Use these strategies:

**For known domains** (user provides examples):
1. Ask 2-3 clarifying questions about usage patterns
2. Identify what varies per execution vs. what stays constant
3. Map examples to skill anatomy (scripts? references? templates?)

**For unknown domains** (need research):
1. Use `/autoresearch` or `deep-researcher` agent for domain analysis
2. Check existing squads in `.claude/skills/` for similar patterns
3. Search cookbooks at `D:\workspace\claude\claude-cookbooks\` for relevant patterns
4. Search demos at `D:\workspace\claude\claude-agent-sdk-demos\` for integration examples

**Analysis questions**:
- What triggers this skill? (user prompt, file type, task type)
- What's the core workflow? (sequential steps, decision tree, parallel tasks)
- What reusable resources exist? (scripts, schemas, templates, APIs)
- What's the expertise level? (simple utility vs. domain expert vs. multi-agent squad)

### Phase 2: Select Skill Type

| Factor | Claude Code Skill | API Skill | Agent SDK Skill |
|--------|------------------|-----------|-----------------|
| **Runtime** | Claude Code CLI/IDE | Anthropic API cloud | Custom Node/Python app |
| **Tools** | All Claude Code tools | Code execution sandbox | Configurable tool set |
| **Persistence** | Local filesystem | Cloud-managed versions | Application-managed |
| **Complexity** | Simple to Squad-level | Simple to moderate | Simple to complex |
| **Distribution** | Copy directory or zip | API skill_id reference | npm/pip package |
| **Best for** | Workflows, domain knowledge | Document generation | Custom integrations |

### Phase 3: Plan Contents

Analyze each usage example to determine reusable resources:

| If you find yourself... | Create a... | In directory... |
|------------------------|-------------|-----------------|
| Rewriting the same code | Script | `scripts/` |
| Rediscovering the same docs | Reference file | `references/` |
| Starting from the same template | Asset/template | `assets/` or `templates/` |
| Following the same steps | Workflow in SKILL.md | Body of SKILL.md |
| Checking the same criteria | Checklist | `checklists/` |
| Needing the same data | Knowledge base | `data/` |
| Defining specialist roles | Agent definitions | `agents/` |
| Decomposing into subtasks | Task definitions | `tasks/` |

### Phase 4: Initialize

Run the init script to scaffold:

```bash
python .claude/skills/skill-creator-pro/scripts/init_skill.py <skill-name> --path <output-dir> --type <code|api|sdk|squad>
```

Types:
- `code` — Standard Claude Code skill (default)
- `api` — API Skill with sandbox scripts
- `sdk` — Agent SDK skill with tool definitions
- `squad` — Multi-agent squad with agents, tasks, workflows, checklists

### Phase 5: Build

#### Writing SKILL.md

**Frontmatter** (always loaded, ~100 words max):
```yaml
---
name: kebab-case-name
description: |
  Clear explanation of what this skill does and WHEN to use it.
  Include trigger phrases, file types, or task patterns.
  Write in third person ("This skill creates..." not "Create...").
---
```

**Body** (loaded on trigger, <5k words target):
- Write in imperative/infinitive form (verb-first instructions)
- Include concrete examples with realistic inputs/outputs
- Reference scripts/references by relative path
- Use decision trees for complex workflows
- Include error handling guidance

**Writing quality rules**:
- Information lives in EITHER SKILL.md OR references, never both
- Keep SKILL.md lean; move detailed schemas/docs to `references/`
- For large reference files (>10k words), include grep patterns in SKILL.md
- Scripts may be executed without loading into context (token-efficient)

#### Skill Structure Patterns

**Pattern 1: Workflow-Based** (sequential processes)
```markdown
## Overview
## Workflow Decision Tree
## Step 1: [Action]
## Step 2: [Action]
## Error Handling
```

**Pattern 2: Task-Based** (tool collections)
```markdown
## Overview
## Quick Start
## Task Category 1
## Task Category 2
## Reference
```

**Pattern 3: Reference/Guidelines** (standards)
```markdown
## Overview
## Guidelines
## Specifications
## Usage Examples
```

**Pattern 4: Squad** (multi-agent)
```markdown
## Overview
## Agents
## Tasks
## Workflows
## Checklists
```

**Pattern 5: Orchestrator-Workers** (from cookbooks)
```markdown
## Overview
## Orchestrator Prompt
## Worker Prompts
## Processing Pipeline
## Result Synthesis
```

### Phase 6: Validate

Run validation before packaging:

```bash
python .claude/skills/skill-creator-pro/scripts/validate_skill.py <path/to/skill>
```

Validates:
- YAML frontmatter format and required fields
- Name is kebab-case, <=40 characters
- Description is specific and actionable (not generic)
- No angle brackets in description
- Directory structure matches skill type
- Total size under 8MB (API skills limit)
- No duplicate information between SKILL.md and references
- Scripts are executable
- References are referenced from SKILL.md
- No TODO placeholders remain

### Phase 7: Package

```bash
python .claude/skills/skill-creator-pro/scripts/package_skill.py <path/to/skill> [output-dir]
```

Creates a distributable zip with validated structure.

## Pattern Catalog

Read `references/pattern-catalog.md` for the complete catalog of patterns extracted from:
- Anthropic cookbooks (orchestrator-workers, evaluator-optimizer, context engineering)
- Agent SDK demos (email actions/listeners, research subagents, custom MCP tools)
- Tool packages (BaseTool, ToolUser, search tools, SQL tools)
- API Skills (financial analysis, brand guidelines, financial models)

## Upgrading Existing Skills

To upgrade an existing skill:

1. Read the current SKILL.md and all bundled resources
2. Run `validate_skill.py` to identify issues
3. Run `analyze_skill.py` to get improvement suggestions
4. Apply improvements following the pattern catalog
5. Re-validate and package

```bash
python .claude/skills/skill-creator-pro/scripts/analyze_skill.py <path/to/skill>
```

## Converting Workflows to Skills

To convert a manual workflow into a reusable skill:

1. **Capture the workflow** — Document each step as performed manually
2. **Identify constants** — What stays the same every time? (-> SKILL.md body)
3. **Identify variables** — What changes per execution? (-> parameters/inputs)
4. **Extract scripts** — What code gets rewritten? (-> `scripts/`)
5. **Extract knowledge** — What docs get re-read? (-> `references/`)
6. **Extract templates** — What starting points get reused? (-> `templates/` or `assets/`)
7. **Write SKILL.md** — Describe the workflow with references to all resources
8. **Test & iterate** — Use the skill on real tasks, notice gaps, improve

## Squad-Style Skills

For complex domains requiring multiple specialist perspectives, create squad-style skills:

```
squad-name/
├── SKILL.md              # Chief/router: decides which agent handles the request
├── agents/               # One .md per specialist agent
│   ├── specialist-a.md   # Persona, expertise, when to use
│   └── specialist-b.md
├── tasks/                # Discrete operations agents can perform
│   ├── task-1.md         # Inputs, outputs, steps, validation
│   └── task-2.md
├── workflows/            # Multi-step orchestrations
│   └── main-workflow.md  # Pipeline connecting tasks and agents
├── checklists/           # Quality gates
│   └── quality-gate.md
├── data/                 # Domain knowledge base
│   └── domain-kb.md
├── templates/            # Output templates
│   └── report-tmpl.md
└── README.md             # Squad documentation
```

**Agent definition format** (`agents/specialist.md`):
```markdown
---
name: specialist-name
description: What this specialist does and when to route to them
model: sonnet  # or haiku, opus
allowed-tools: Read, Write, Edit, Bash, WebSearch
---

# Specialist Name

## Expertise
[What this agent knows deeply]

## When to Use
[Routing criteria]

## Methodology
[How this agent approaches problems]
```

**Task definition format** (`tasks/task-name.md`):
```markdown
# Task: Task Name

## Purpose
[What this task accomplishes]

## Inputs
- input_1: description
- input_2: description

## Steps
1. [Step with clear action]
2. [Step with clear action]

## Outputs
- output_1: description

## Validation
- [ ] Check 1
- [ ] Check 2
```

## API Skill Development

For creating Anthropic API Skills (beta):

```python
from anthropic import Anthropic
from anthropic.lib import files_from_dir

client = Anthropic()

# Create skill from directory
skill = client.beta.skills.create(
    display_title="My Skill",
    files=files_from_dir("path/to/skill")
)

# Use skill in messages
response = client.beta.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=4096,
    container={"skills": [
        {"type": "custom", "skill_id": skill.id, "version": "latest"},
        {"type": "anthropic", "skill_id": "xlsx", "version": "latest"}
    ]},
    tools=[{"type": "code_execution_20250825", "name": "code_execution"}],
    messages=[{"role": "user", "content": "Your prompt"}],
    betas=["code-execution-2025-08-25", "files-api-2025-04-14", "skills-2025-10-02"]
)
```

## Agent SDK Skill Development

For creating skills in Agent SDK apps:

```typescript
import { query, tool, createSdkMcpServer } from '@anthropic-ai/claude-agent-sdk';

// Custom MCP tools
const myServer = createSdkMcpServer({
  name: "my-domain",
  tools: [
    tool("operation_name", "What it does", {
      param: z.string().describe("Parameter description")
    }, async ({ param }) => {
      // Implementation
      return { content: [{ type: "text", text: result }] };
    })
  ]
});

// Agent with hooks for validation
const result = query({
  prompt: "Task description",
  options: {
    model: "sonnet",
    allowedTools: ["mcp__my-domain__operation_name", "Read", "Write"],
    mcpServers: { "my-domain": myServer },
    settingSources: ['project'], // Load .claude/skills/
    hooks: {
      PreToolUse: [{
        matcher: "Write|Edit",
        hooks: [async (input) => {
          // Validate before tool execution
          return { continue: true };
        }]
      }]
    }
  }
});
```

## Resources

- **Init script**: `scripts/init_skill.py` — Scaffold new skills
- **Validate script**: `scripts/validate_skill.py` — Check skill quality
- **Analyze script**: `scripts/analyze_skill.py` — Suggest improvements
- **Package script**: `scripts/package_skill.py` — Create distributable zip
- **Pattern catalog**: `references/pattern-catalog.md` — All patterns from official repos
- **Skill anatomy**: `references/skill-anatomy.md` — Deep dive into skill structure
- **Examples index**: `references/examples-index.md` — Index of all available examples
- **Templates**: `templates/` — Starter templates for each skill type
