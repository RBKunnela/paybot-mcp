#!/usr/bin/env python3
"""
Skill Initializer Pro - Creates skills with type-specific scaffolding.

Usage:
    init_skill.py <skill-name> --path <path> [--type <code|api|sdk|squad>]

Types:
    code  - Standard Claude Code skill (default)
    api   - Anthropic API Skill (beta, with code execution)
    sdk   - Agent SDK skill with tool definitions
    squad - Multi-agent squad with agents, tasks, workflows
"""

import sys
import os
from pathlib import Path

SKILL_TYPES = {
    "code": {
        "dirs": ["scripts", "references", "assets"],
        "description": "Standard Claude Code skill"
    },
    "api": {
        "dirs": ["scripts"],
        "description": "Anthropic API Skill (beta)"
    },
    "sdk": {
        "dirs": ["templates"],
        "description": "Agent SDK skill with tool definitions"
    },
    "squad": {
        "dirs": ["agents", "tasks", "workflows", "checklists", "data", "templates", "scripts"],
        "description": "Multi-agent squad"
    }
}

CODE_SKILL_MD = """---
name: {name}
description: |
  [TODO: What this skill does and WHEN to use it.
  Be specific about triggers: file types, task patterns, user phrases.
  Write in third person.]
---

# {title}

## Overview

[TODO: 1-2 sentences explaining what this skill enables]

## When to Use

[TODO: Specific scenarios that trigger this skill]

## Workflow

[TODO: Step-by-step workflow or decision tree]

## Resources

- `scripts/` — Executable helpers
- `references/` — Documentation loaded on-demand
- `assets/` — Files used in output
"""

API_SKILL_MD = """---
name: {name}
description: |
  [TODO: What this skill does. Will run in Anthropic's code execution sandbox.
  Include what file types it generates (xlsx, pdf, pptx, docx).]
---

# {title}

## Overview

[TODO: 1-2 sentences explaining what this skill creates]

## Capabilities

[TODO: List what this skill can generate/analyze]

## Input Format

[TODO: What data formats are accepted]

## Output Format

[TODO: What files are generated and their structure]

## Scripts

- `scripts/main.py` — Core processing logic

## Usage Example

[TODO: Example prompt that would trigger this skill]
"""

SDK_SKILL_MD = """---
name: {name}
description: |
  [TODO: What this skill does in the Agent SDK context.
  Describe the tools provided and when they trigger.]
allowed-tools: Read, Write, Edit, Glob
---

# {title}

## Overview

[TODO: 1-2 sentences explaining what this skill enables]

## How It Works

[TODO: Describe the tool/action pattern]

## Creating a [TODO: artifact type]

### 1. Understand the Request
[TODO: What to parse from user input]

### 2. Write the File
[TODO: File structure and conventions]

### 3. Confirm with User
[TODO: Validation and feedback]

## Templates

Reference template files for common patterns:
- `templates/example.ts` — [TODO: description]

## Best Practices

1. [TODO: Best practice 1]
2. [TODO: Best practice 2]
"""

SQUAD_SKILL_MD = """---
name: {name}
description: |
  [TODO: What this squad does. Describe the chief/router role.
  Include what domains it covers and when to route here.]
---

# {title}

## Overview

[TODO: What this squad accomplishes as a team]

## Agents

| Agent | Expertise | When to Route |
|-------|-----------|---------------|
| [TODO] | [TODO] | [TODO] |

Read agent definitions in `agents/` for full details.

## Tasks

| Task | Purpose | Agent |
|------|---------|-------|
| [TODO] | [TODO] | [TODO] |

Read task definitions in `tasks/` for full details.

## Workflows

| Workflow | Steps | Trigger |
|----------|-------|---------|
| [TODO] | [TODO] | [TODO] |

## Quality Gates

See `checklists/` for validation criteria.
"""

SQUAD_AGENT_TMPL = """---
name: {agent_name}
description: [TODO: What this agent specializes in and when to route to them]
model: sonnet
allowed-tools: Read, Write, Edit, Bash
---

# {agent_title}

## Expertise

[TODO: Deep domain knowledge this agent possesses]

## When to Use

[TODO: Routing criteria — what requests go to this agent]

## Methodology

[TODO: How this agent approaches problems step by step]

## Output Format

[TODO: What this agent produces]
"""

SQUAD_TASK_TMPL = """# Task: {task_name}

## Purpose

[TODO: What this task accomplishes]

## Inputs

- input_1: [TODO: description]

## Steps

1. [TODO: Clear action step]
2. [TODO: Clear action step]

## Outputs

- output_1: [TODO: description]

## Validation

- [ ] [TODO: Check 1]
- [ ] [TODO: Check 2]
"""


def title_case(name):
    return ' '.join(w.capitalize() for w in name.split('-'))


def init_skill(name, path, skill_type="code"):
    skill_dir = Path(path).resolve() / name

    if skill_dir.exists():
        print(f"Error: Directory already exists: {skill_dir}")
        return None

    skill_dir.mkdir(parents=True)
    print(f"Created: {skill_dir}")

    # Create type-specific directories
    for d in SKILL_TYPES[skill_type]["dirs"]:
        (skill_dir / d).mkdir()

    # Write SKILL.md
    title = title_case(name)
    templates = {"code": CODE_SKILL_MD, "api": API_SKILL_MD, "sdk": SDK_SKILL_MD, "squad": SQUAD_SKILL_MD}
    (skill_dir / "SKILL.md").write_text(templates[skill_type].format(name=name, title=title))
    print(f"Created: SKILL.md ({skill_type} type)")

    # Type-specific files
    if skill_type == "api":
        (skill_dir / "scripts" / "main.py").write_text(
            f'"""Main processing script for {name}"""\n\ndef process(data):\n    # TODO: Implement\n    pass\n'
        )

    elif skill_type == "sdk":
        (skill_dir / "templates" / "example.ts").write_text(
            f'// Template for {name}\n// TODO: Add template content\n'
        )

    elif skill_type == "squad":
        # Create example agent
        agent_content = SQUAD_AGENT_TMPL.format(
            agent_name=f"{name}-specialist",
            agent_title=f"{title} Specialist"
        )
        (skill_dir / "agents" / "specialist.md").write_text(agent_content)

        # Create example task
        task_content = SQUAD_TASK_TMPL.format(task_name=f"Main {title} Task")
        (skill_dir / "tasks" / "main-task.md").write_text(task_content)

        # Create example checklist
        (skill_dir / "checklists" / "quality-gate.md").write_text(
            f"# Quality Gate: {title}\n\n- [ ] All inputs validated\n- [ ] Output matches spec\n- [ ] No regressions\n"
        )

        # Create README
        (skill_dir / "README.md").write_text(f"# {title} Squad\n\n[TODO: Squad documentation]\n")

        print("Created: agents/specialist.md, tasks/main-task.md, checklists/quality-gate.md, README.md")

    print(f"\nSkill '{name}' ({skill_type}) initialized at {skill_dir}")
    print("\nNext: Edit SKILL.md to replace TODO items, then validate with validate_skill.py")
    return skill_dir


def main():
    args = sys.argv[1:]
    if len(args) < 3 or '--path' not in args:
        print("Usage: init_skill.py <name> --path <path> [--type <code|api|sdk|squad>]")
        print("\nTypes: code (default), api, sdk, squad")
        sys.exit(1)

    name = args[0]
    path = args[args.index('--path') + 1]
    skill_type = args[args.index('--type') + 1] if '--type' in args else "code"

    if skill_type not in SKILL_TYPES:
        print(f"Error: Unknown type '{skill_type}'. Use: {', '.join(SKILL_TYPES.keys())}")
        sys.exit(1)

    result = init_skill(name, path, skill_type)
    sys.exit(0 if result else 1)


if __name__ == "__main__":
    main()
