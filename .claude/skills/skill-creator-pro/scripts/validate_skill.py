#!/usr/bin/env python3
"""
Skill Validator Pro - Comprehensive validation for all skill types.

Usage:
    validate_skill.py <path/to/skill>
"""

import sys
import re
import os
from pathlib import Path


def validate_skill(skill_path):
    """Validate a skill directory. Returns (valid, issues, warnings)."""
    skill_path = Path(skill_path).resolve()
    issues = []
    warnings = []

    # 1. Directory exists
    if not skill_path.exists():
        return False, ["Directory does not exist"], []
    if not skill_path.is_dir():
        return False, ["Path is not a directory"], []

    # 2. SKILL.md exists
    skill_md = skill_path / "SKILL.md"
    if not skill_md.exists():
        return False, ["SKILL.md not found"], []

    content = skill_md.read_text(encoding='utf-8')

    # 3. Frontmatter validation
    if not content.startswith("---"):
        issues.append("SKILL.md must start with YAML frontmatter (---)")
    else:
        match = re.match(r'^---\n(.*?)\n---', content, re.DOTALL)
        if not match:
            issues.append("Invalid YAML frontmatter format")
        else:
            fm = match.group(1)

            # Required fields
            if 'name:' not in fm:
                issues.append("Missing 'name' in frontmatter")
            else:
                name_match = re.search(r'name:\s*(\S+)', fm)
                if name_match:
                    name = name_match.group(1).strip()
                    if not re.match(r'^[a-z0-9][a-z0-9-]*[a-z0-9]$', name) and len(name) > 1:
                        issues.append(f"Name '{name}' must be kebab-case (lowercase, digits, hyphens)")
                    if len(name) > 40:
                        issues.append(f"Name '{name}' exceeds 40 characters ({len(name)})")
                    if '--' in name:
                        issues.append(f"Name '{name}' contains consecutive hyphens")
                    # Check name matches directory
                    if name != skill_path.name:
                        warnings.append(f"Name '{name}' does not match directory '{skill_path.name}'")

            if 'description:' not in fm:
                issues.append("Missing 'description' in frontmatter")
            else:
                desc_match = re.search(r'description:\s*(.+?)(?=\n\w|\n---|\Z)', fm, re.DOTALL)
                if desc_match:
                    desc = desc_match.group(1).strip()
                    if '<' in desc or '>' in desc:
                        issues.append("Description cannot contain angle brackets")
                    if len(desc) < 20:
                        warnings.append("Description is very short (< 20 chars)")
                    if 'TODO' in desc:
                        issues.append("Description contains TODO placeholder")

            # Frontmatter size
            if len(fm) > 1024:
                issues.append(f"Frontmatter exceeds 1024 chars ({len(fm)})")

    # 4. Body validation
    body = content.split('---', 2)[-1] if content.count('---') >= 2 else ""
    if 'TODO' in body:
        warnings.append(f"SKILL.md body contains {body.count('TODO')} TODO placeholders")

    word_count = len(body.split())
    if word_count > 5000:
        warnings.append(f"SKILL.md body is {word_count} words (target: <5000)")

    # 5. Directory structure validation
    total_size = sum(f.stat().st_size for f in skill_path.rglob("*") if f.is_file())
    if total_size > 8 * 1024 * 1024:
        issues.append(f"Total size exceeds 8MB ({total_size / (1024*1024):.1f}MB)")

    # 6. Check for unreferenced resources
    refs_dir = skill_path / "references"
    if refs_dir.exists():
        for ref_file in refs_dir.iterdir():
            if ref_file.is_file() and ref_file.name not in content:
                warnings.append(f"Reference '{ref_file.name}' not mentioned in SKILL.md")

    scripts_dir = skill_path / "scripts"
    if scripts_dir.exists():
        for script in scripts_dir.iterdir():
            if script.is_file() and script.name not in content:
                warnings.append(f"Script '{script.name}' not mentioned in SKILL.md")

    # 7. Squad-specific validation
    agents_dir = skill_path / "agents"
    tasks_dir = skill_path / "tasks"
    if agents_dir.exists():
        agent_count = len([f for f in agents_dir.iterdir() if f.is_file()])
        if agent_count == 0:
            issues.append("agents/ directory exists but is empty")
        for agent_file in agents_dir.iterdir():
            if agent_file.suffix == '.md':
                agent_content = agent_file.read_text(encoding='utf-8')
                if not agent_content.startswith('---'):
                    warnings.append(f"Agent '{agent_file.name}' missing frontmatter")

    if tasks_dir.exists():
        task_count = len([f for f in tasks_dir.iterdir() if f.is_file()])
        if task_count == 0:
            issues.append("tasks/ directory exists but is empty")

    valid = len(issues) == 0
    return valid, issues, warnings


def main():
    if len(sys.argv) != 2:
        print("Usage: validate_skill.py <path/to/skill>")
        sys.exit(1)

    skill_path = sys.argv[1]
    valid, issues, warnings = validate_skill(skill_path)

    if valid and not warnings:
        print(f"PASS: Skill at '{skill_path}' is valid!")
    elif valid:
        print(f"PASS (with warnings): Skill at '{skill_path}'")
        for w in warnings:
            print(f"  WARNING: {w}")
    else:
        print(f"FAIL: Skill at '{skill_path}' has issues:")
        for i in issues:
            print(f"  ERROR: {i}")
        for w in warnings:
            print(f"  WARNING: {w}")

    sys.exit(0 if valid else 1)


if __name__ == "__main__":
    main()
