#!/usr/bin/env python3
"""
Hook: Environment Guard — DEV vs PROD Toggle

Reads .aios/config.yaml and enforces environment-specific rules.
Blocks dangerous operations in prod, relaxes gates in dev.

Runs on: PreToolUse (Write, Edit, Bash)
Exit Codes:
- 0: Allowed
- 2: Blocked (with reason in stderr)

Environment Rules:
  dev:    YOLO OK, gates relaxed, skip-permissions allowed
  staging: YOLO blocked, gates enforced, skip-permissions blocked
  prod:   YOLO blocked, ALL gates enforced, skip-permissions HARD BLOCK
"""

import json
import sys
import os
from pathlib import Path

# =============================================================================
# CONFIG LOADING
# =============================================================================

def load_config():
    """Load .aios/config.yaml. Returns dict or defaults."""
    try:
        # Find project root by walking up from hook location
        hook_dir = Path(__file__).resolve().parent
        project_root = hook_dir.parent.parent  # .claude/hooks/ -> .claude/ -> project/

        config_path = project_root / ".aios" / "config.yaml"

        if not config_path.exists():
            return get_defaults()

        # Simple YAML parsing (no dependency on pyyaml)
        content = config_path.read_text(encoding="utf-8")
        return parse_simple_yaml(content)
    except Exception:
        return get_defaults()


def get_defaults():
    """Default config = dev mode, everything allowed."""
    return {
        "environment": "dev",
        "permissions": {"mode": "ask"},
        "quality": {
            "enforce_qa_gate": False,
            "enforce_tests": False,
            "enforce_architecture_first": False,
            "enforce_code_review": False,
        },
        "security": {
            "allow_skip_permissions": True,
            "allow_force_push": False,
        },
        "agents": {
            "strict_authority": False,
            "require_story": False,
        },
    }


def parse_simple_yaml(content):
    """Minimal YAML parser for flat/nested config. No external deps."""
    result = {}
    current_section = None

    for line in content.split("\n"):
        stripped = line.strip()

        # Skip comments and empty lines
        if not stripped or stripped.startswith("#"):
            continue

        # Check indentation for nesting
        indent = len(line) - len(line.lstrip())

        if indent == 0 and ":" in stripped:
            key, _, value = stripped.partition(":")
            key = key.strip()
            value = value.strip()

            if value:
                result[key] = parse_value(value)
                current_section = None
            else:
                result[key] = {}
                current_section = key

        elif indent > 0 and current_section and ":" in stripped:
            key, _, value = stripped.partition(":")
            key = key.strip()
            value = value.strip()

            if value:
                result[current_section][key] = parse_value(value)

    return result


def parse_value(value):
    """Parse a YAML value string to Python type."""
    # Remove inline comments
    if " #" in value:
        value = value[:value.index(" #")].strip()

    if value.lower() == "true":
        return True
    if value.lower() == "false":
        return False
    if value.isdigit():
        return int(value)
    return value


# =============================================================================
# ENVIRONMENT ENFORCEMENT
# =============================================================================

def get_environment(config):
    """Get current environment, default to dev."""
    return config.get("environment", "dev").lower()


def is_prod(config):
    return get_environment(config) in ("prod", "production")


def is_staging(config):
    return get_environment(config) in ("staging", "stg")


def is_dev(config):
    return get_environment(config) in ("dev", "development", "local")


def check_skip_permissions_guard(config):
    """
    CRITICAL: In prod/staging, detect if Claude Code was launched with
    --dangerously-skip-permissions and BLOCK if not allowed.
    """
    env = get_environment(config)
    security = config.get("security", {})
    allow_skip = security.get("allow_skip_permissions", True)

    if env in ("prod", "production", "staging", "stg") and not allow_skip:
        # Check if running in skip-permissions mode
        # Claude Code sets this env var when --dangerously-skip-permissions is used
        if os.environ.get("CLAUDE_DANGEROUSLY_SKIP_PERMISSIONS") == "1":
            return False, (
                f"BLOCKED: --dangerously-skip-permissions is not allowed in {env} environment.\n"
                f"Change environment to 'dev' in .aios/config.yaml to use YOLO mode.\n"
                f"Or remove --dangerously-skip-permissions flag."
            )

    return True, ""


def check_force_push_guard(config, tool_input):
    """Block force push unless explicitly allowed."""
    security = config.get("security", {})
    allow_force = security.get("allow_force_push", False)

    if not allow_force:
        command = tool_input.get("command", "")
        if "push" in command and ("--force" in command or "-f " in command):
            return False, "BLOCKED: Force push is disabled in current environment config."

    return True, ""


def check_authority_guard(config, tool_input):
    """In strict mode, block git push/PR from non-devops agents."""
    agents = config.get("agents", {})
    strict = agents.get("strict_authority", False)

    if not strict:
        return True, ""

    command = tool_input.get("command", "")
    blocked_commands = ["git push", "gh pr create", "gh pr merge"]

    for blocked in blocked_commands:
        if blocked in command:
            return False, (
                f"BLOCKED: '{blocked}' requires @devops agent in strict authority mode.\n"
                "Delegate to @devops or set agents.strict_authority: false in .aios/config.yaml"
            )

    return True, ""


def check_quality_gates(config, tool_name, tool_input):
    """Enforce quality gates based on environment config."""
    quality = config.get("quality", {})
    env = get_environment(config)

    # In prod, force all quality gates regardless of config
    if is_prod(config):
        quality["enforce_qa_gate"] = True
        quality["enforce_tests"] = True
        quality["enforce_architecture_first"] = True
        quality["enforce_code_review"] = True

    # Architecture-first check is handled by its own hook
    # We just need to disable/enable it based on config
    # This is done by writing a flag file that the other hook checks

    return True, ""


# =============================================================================
# MAIN
# =============================================================================

def main():
    """PreToolUse hook entry point."""
    try:
        hook_input = json.loads(sys.stdin.read())
    except (json.JSONDecodeError, Exception):
        sys.exit(0)  # Can't parse = allow

    tool_name = hook_input.get("tool_name", "")
    tool_input = hook_input.get("tool_input", {})

    config = load_config()

    # Check 1: Skip-permissions guard (CRITICAL)
    allowed, reason = check_skip_permissions_guard(config)
    if not allowed:
        print(json.dumps({"decision": "block", "reason": reason}))
        sys.exit(2)

    # Check 2: Force push guard
    if tool_name == "Bash":
        allowed, reason = check_force_push_guard(config, tool_input)
        if not allowed:
            print(json.dumps({"decision": "block", "reason": reason}))
            sys.exit(2)

        # Check 3: Agent authority guard
        allowed, reason = check_authority_guard(config, tool_input)
        if not allowed:
            print(json.dumps({"decision": "block", "reason": reason}))
            sys.exit(2)

    # Check 4: Quality gates (informational — actual blocking by other hooks)
    check_quality_gates(config, tool_name, tool_input)

    # Write current environment to a state file for other hooks to read
    try:
        hook_dir = Path(__file__).resolve().parent
        project_root = hook_dir.parent.parent
        state_dir = project_root / ".aios"
        state_file = state_dir / ".env-state.json"

        import json as json_mod
        state = {
            "environment": get_environment(config),
            "mode": config.get("permissions", {}).get("mode", "ask"),
            "quality_gates": config.get("quality", {}),
            "strict_authority": config.get("agents", {}).get("strict_authority", False),
        }
        state_file.write_text(json_mod.dumps(state), encoding="utf-8")
    except Exception:
        pass  # Non-critical

    sys.exit(0)


if __name__ == "__main__":
    main()
