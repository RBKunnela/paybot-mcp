# Skill Anatomy — Deep Dive

## The Three Skill Ecosystems

### 1. Claude Code Skills (`.claude/skills/`)

**Loading mechanism**: Claude Code scans `.claude/skills/*/SKILL.md` and loads frontmatter metadata into context. When a skill triggers, the full SKILL.md body is loaded. Resources are loaded on-demand by the agent.

**File structure**:
```
.claude/skills/skill-name/
├── SKILL.md              # Required: YAML frontmatter + markdown body
├── scripts/              # Executable code (run via Bash tool)
├── references/           # Docs loaded via Read tool when needed
├── templates/            # Output templates and starters
├── assets/               # Non-context files (images, fonts, boilerplate)
├── checklists/           # Validation criteria (for squad-style skills)
├── data/                 # Knowledge base files
├── tasks/                # Task definitions (for squad-style skills)
├── agents/               # Agent definitions (for squad-style skills)
└── workflows/            # Multi-step workflows (for squad-style skills)
```

**SKILL.md anatomy**:
```markdown
---
name: kebab-case-name              # Required. Must match directory name.
description: |                      # Required. Determines when skill triggers.
  What this skill does and WHEN to use it.
  Include trigger phrases, file types, task patterns.
allowed-tools: Read, Write, Bash    # Optional. Restrict tool access.
---

# Skill Title

## Body content
[Loaded when skill triggers. <5k words target.]
[Imperative/infinitive form. References to scripts/references/assets.]
```

**Frontmatter constraints**:
- `name`: kebab-case, <=40 chars, lowercase + digits + hyphens only
- `description`: No angle brackets, <1024 chars, specific about triggers
- Must start with `---` and end with `---`

### 2. API Skills (Anthropic Skills API Beta)

**Loading mechanism**: Uploaded to Anthropic cloud via Skills API. Referenced by `skill_id` in messages. Executed in sandboxed code execution environment.

**File structure**:
```
skill-name/
├── SKILL.md              # Required: name + description frontmatter
├── scripts/              # Python scripts for code execution sandbox
└── REFERENCE.md          # Optional reference documentation
```

**API workflow**:
```python
# Upload
from anthropic.lib import files_from_dir
skill = client.beta.skills.create(
    display_title="Name", files=files_from_dir("path/to/skill")
)

# Use
response = client.beta.messages.create(
    container={"skills": [
        {"type": "custom", "skill_id": skill.id, "version": "latest"}
    ]},
    tools=[{"type": "code_execution_20250825", "name": "code_execution"}],
    betas=["code-execution-2025-08-25", "files-api-2025-04-14", "skills-2025-10-02"],
    ...
)

# Version management
new_version = client.beta.skills.versions.create(
    skill_id=skill.id, files=files_from_dir("path/to/updated/skill")
)
```

**Constraints**:
- Total skill size: <8MB
- Code execution required (tool type: `code_execution_20250825`)
- Built-in skills: `xlsx`, `pptx`, `pdf`, `docx`

### 3. Agent SDK Skills

**Loading mechanism**: Either loaded from `.claude/skills/` via `settingSources: ['project']`, or defined programmatically as custom MCP tools.

**Project skills** (same as Claude Code, loaded by SDK):
```typescript
const result = query({
  prompt: "...",
  options: {
    settingSources: ['project'], // Loads .claude/skills/
    allowedTools: ['Skill', 'Read', 'Write']
  }
});
```

**Programmatic skills** (custom MCP server tools):
```typescript
import { tool, createSdkMcpServer } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';

const mySkill = createSdkMcpServer({
  name: "my-domain",
  tools: [
    tool("operation", "What it does", {
      input: z.string().describe("Input description")
    }, async ({ input }) => ({
      content: [{ type: "text", text: `Result: ${input}` }]
    }))
  ]
});
```

---

## Skill Complexity Tiers

### Tier 1: Simple Utility
Single-purpose skill with optional scripts.
```
skill-name/
├── SKILL.md
└── scripts/helper.py     # Optional
```
**Examples**: pdf-editor, image-rotator, csv-converter

### Tier 2: Domain Expert
Skill with knowledge base references and multiple scripts.
```
skill-name/
├── SKILL.md
├── scripts/
│   ├── analyze.py
│   └── report.py
├── references/
│   ├── schema.md
│   └── api-docs.md
└── templates/
    └── report-template.md
```
**Examples**: financial-analyzer, brand-guidelines, bigquery-helper

### Tier 3: Workflow Skill
Multi-step skill with decision trees and quality gates.
```
skill-name/
├── SKILL.md
├── scripts/
├── references/
├── templates/
└── checklists/
    └── quality-gate.md
```
**Examples**: code-reviewer, cookbook-audit, doc-generator

### Tier 4: Squad Skill
Full multi-agent system with agents, tasks, workflows.
```
squad-name/
├── SKILL.md              # Chief/router
├── agents/               # Specialist agents
├── tasks/                # Discrete operations
├── workflows/            # Multi-step orchestrations
├── checklists/           # Quality gates
├── data/                 # Knowledge base
├── templates/            # Output templates
├── scripts/              # Automation scripts
└── README.md             # Squad documentation
```
**Examples**: copywriting-squad, design, domain-decoder, quality-shield

---

## Quality Indicators

### Excellent Skills
- Description is specific about triggers ("Use when user asks to rotate a PDF")
- SKILL.md <5k words with clear workflow
- Scripts handle edge cases
- References are referenced from SKILL.md
- Examples show realistic inputs/outputs

### Poor Skills
- Generic description ("A useful skill for various tasks")
- SKILL.md is a wall of text with no structure
- Scripts are untested
- References exist but aren't referenced
- No examples or edge case handling
