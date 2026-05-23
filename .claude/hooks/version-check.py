#!/usr/bin/env python3
"""
SessionStart Hook — Claude Code Version Change Detector

Compares current `claude --version` with stored version in `.claude/.claude-code-version`.
If version changed: injects reminder to run /claude-md-lint.
If same: no-op (zero overhead).
"""
import json
import sys
import os
import subprocess


def get_claude_version():
    """Get current Claude Code version via CLI."""
    try:
        result = subprocess.run(
            ["claude", "--version"],
            capture_output=True, text=True, timeout=5
        )
        # Output is like "2.1.90 (Claude Code)" — extract version number
        version = result.stdout.strip().split()[0] if result.stdout.strip() else None
        return version
    except Exception:
        return None


def main():
    try:
        hook_input = json.loads(sys.stdin.read()) if not sys.stdin.isatty() else {}
    except (json.JSONDecodeError, Exception):
        hook_input = {}

    result = {"decision": "approve"}

    project_dir = os.environ.get("CLAUDE_PROJECT_DIR", ".")
    version_file = os.path.join(project_dir, ".claude", ".claude-code-version")

    current_version = get_claude_version()
    if not current_version:
        print(json.dumps(result))
        return

    stored_version = None
    if os.path.exists(version_file):
        try:
            with open(version_file, "r", encoding="utf-8") as f:
                stored_version = f.read().strip()
        except Exception:
            stored_version = None

    if stored_version and stored_version != current_version:
        result["additionalContext"] = (
            f"Claude Code version changed: {stored_version} → {current_version}. "
            f"Run `/claude-md-lint` to check if any CLAUDE.md rules are now redundant "
            f"with native Claude Code improvements."
        )

    # Always update stored version
    try:
        os.makedirs(os.path.dirname(version_file), exist_ok=True)
        with open(version_file, "w", encoding="utf-8") as f:
            f.write(current_version)
    except Exception:
        pass

    print(json.dumps(result))


if __name__ == "__main__":
    main()
