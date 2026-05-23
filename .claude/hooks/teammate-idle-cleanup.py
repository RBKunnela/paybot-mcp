#!/usr/bin/env python3
"""
TeammateIdle Hook — Swarm Cleanup
Fires when an agent team teammate goes idle.
Logs idle events for monitoring and suggests cleanup.
"""
import json
import sys
import os
from datetime import datetime

def main():
    try:
        hook_input = json.loads(sys.stdin.read()) if not sys.stdin.isatty() else {}
    except (json.JSONDecodeError, Exception):
        hook_input = {}

    # Log idle event for observability
    project_dir = os.environ.get("CLAUDE_PROJECT_DIR", ".")
    log_dir = os.path.join(project_dir, ".aios", "logs")
    os.makedirs(log_dir, exist_ok=True)

    log_entry = {
        "event": "teammate_idle",
        "timestamp": datetime.now().isoformat(),
        "data": hook_input
    }

    log_file = os.path.join(log_dir, "teammate-events.jsonl")
    with open(log_file, "a", encoding="utf-8") as f:
        f.write(json.dumps(log_entry) + "\n")

    # Output: allow the event, add context suggestion
    result = {
        "decision": "allow",
        "reason": "Teammate idle logged. Consider TeamDelete if task complete."
    }
    print(json.dumps(result))

if __name__ == "__main__":
    main()
