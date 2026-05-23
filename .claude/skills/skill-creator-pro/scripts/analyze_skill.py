#!/usr/bin/env python3
"""
Skill Analyzer Pro - Suggests improvements for existing skills.

Usage:
    analyze_skill.py <path/to/skill>
"""

import sys
import re
from pathlib import Path


def analyze_skill(skill_path):
    """Analyze a skill and suggest improvements."""
    skill_path = Path(skill_path).resolve()
    suggestions = []
    stats = {}

    if not skill_path.exists():
        return {"error": "Directory does not exist"}, []

    skill_md = skill_path / "SKILL.md"
    if not skill_md.exists():
        return {"error": "SKILL.md not found"}, []

    content = skill_md.read_text(encoding='utf-8')

    # Stats
    files = list(skill_path.rglob("*"))
    stats["total_files"] = len([f for f in files if f.is_file()])
    stats["total_size_kb"] = sum(f.stat().st_size for f in files if f.is_file()) / 1024
    stats["word_count"] = len(content.split())
    stats["has_scripts"] = (skill_path / "scripts").exists()
    stats["has_references"] = (skill_path / "references").exists()
    stats["has_templates"] = (skill_path / "templates").exists()
    stats["has_agents"] = (skill_path / "agents").exists()
    stats["has_tasks"] = (skill_path / "tasks").exists()
    stats["has_checklists"] = (skill_path / "checklists").exists()
    stats["has_workflows"] = (skill_path / "workflows").exists()
    stats["has_data"] = (skill_path / "data").exists()

    # Determine skill tier
    if stats["has_agents"] and stats["has_tasks"]:
        stats["tier"] = "Tier 4: Squad"
    elif stats["has_checklists"] or stats["has_workflows"]:
        stats["tier"] = "Tier 3: Workflow"
    elif stats["has_references"] or (stats["has_scripts"] and stats["total_files"] > 3):
        stats["tier"] = "Tier 2: Domain Expert"
    else:
        stats["tier"] = "Tier 1: Simple Utility"

    # Extract frontmatter
    fm_match = re.match(r'^---\n(.*?)\n---', content, re.DOTALL)
    if fm_match:
        fm = fm_match.group(1)
        desc_match = re.search(r'description:\s*(.+?)(?=\n[a-z]|\n---|\Z)', fm, re.DOTALL)
        if desc_match:
            desc = desc_match.group(1).strip()
            stats["description_words"] = len(desc.split())
            if stats["description_words"] < 10:
                suggestions.append("DESCRIPTION: Add more detail about WHEN to use this skill (triggers, file types, task patterns)")
            if 'when' not in desc.lower() and 'use' not in desc.lower():
                suggestions.append("DESCRIPTION: Include trigger conditions (e.g., 'Use when user asks to...')")

    body = content.split('---', 2)[-1] if content.count('---') >= 2 else content

    # Structure analysis
    headings = re.findall(r'^#+\s+(.+)$', body, re.MULTILINE)
    stats["heading_count"] = len(headings)

    if len(headings) < 3:
        suggestions.append("STRUCTURE: Add more sections (Overview, Workflow, Resources recommended minimum)")

    # Code examples
    code_blocks = re.findall(r'```\w+', body)
    stats["code_blocks"] = len(code_blocks)
    if len(code_blocks) == 0:
        suggestions.append("EXAMPLES: Add code examples showing how the skill works in practice")

    # Progressive disclosure
    if stats["word_count"] > 5000 and not stats["has_references"]:
        suggestions.append("SIZE: SKILL.md exceeds 5k words. Move detailed content to references/ directory")

    # Resource optimization
    if stats["has_scripts"]:
        scripts = list((skill_path / "scripts").rglob("*"))
        script_count = len([f for f in scripts if f.is_file()])
        if script_count == 0:
            suggestions.append("SCRIPTS: scripts/ directory is empty. Add helper scripts or remove the directory")
    else:
        if 'script' in content.lower() or 'python' in content.lower():
            suggestions.append("SCRIPTS: SKILL.md mentions scripts but no scripts/ directory exists")

    if stats["has_references"]:
        refs = list((skill_path / "references").rglob("*"))
        ref_count = len([f for f in refs if f.is_file()])
        if ref_count == 0:
            suggestions.append("REFERENCES: references/ directory is empty")
    elif stats["word_count"] > 3000:
        suggestions.append("REFERENCES: Consider extracting detailed docs to references/ to keep SKILL.md lean")

    # Squad-specific
    if stats["has_agents"]:
        agents = [f for f in (skill_path / "agents").iterdir() if f.suffix == '.md']
        stats["agent_count"] = len(agents)
        if len(agents) < 2:
            suggestions.append("SQUAD: A squad typically needs 2+ specialist agents for meaningful collaboration")
        for a in agents:
            agent_content = a.read_text(encoding='utf-8')
            if len(agent_content) < 200:
                suggestions.append(f"AGENT: {a.name} is very short ({len(agent_content)} chars). Add expertise, methodology, output format")

    if stats["has_tasks"]:
        tasks = [f for f in (skill_path / "tasks").iterdir() if f.suffix == '.md']
        stats["task_count"] = len(tasks)

    if not stats["has_checklists"] and stats.get("tier", "").startswith("Tier 3") or stats.get("tier", "").startswith("Tier 4"):
        suggestions.append("QUALITY: Add a checklists/ directory with validation criteria for outputs")

    return stats, suggestions


def main():
    if len(sys.argv) != 2:
        print("Usage: analyze_skill.py <path/to/skill>")
        sys.exit(1)

    stats, suggestions = analyze_skill(sys.argv[1])

    if "error" in stats:
        print(f"Error: {stats['error']}")
        sys.exit(1)

    print(f"=== Skill Analysis: {sys.argv[1]} ===\n")

    print("Stats:")
    for k, v in stats.items():
        print(f"  {k}: {v}")

    print(f"\nSuggestions ({len(suggestions)}):")
    if suggestions:
        for i, s in enumerate(suggestions, 1):
            print(f"  {i}. {s}")
    else:
        print("  No suggestions - skill looks good!")

    sys.exit(0)


if __name__ == "__main__":
    main()
