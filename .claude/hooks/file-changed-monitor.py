#!/usr/bin/env python3
"""
FileChanged Hook — Live File Monitoring
Fires when a watched file changes on disk.
Logs change events for observability and drift detection.
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

    project_dir = os.environ.get("CLAUDE_PROJECT_DIR", ".")
    log_dir = os.path.join(project_dir, ".aios", "logs")
    os.makedirs(log_dir, exist_ok=True)

    log_entry = {
        "event": "file_changed",
        "timestamp": datetime.now().isoformat(),
        "data": hook_input
    }

    log_file = os.path.join(log_dir, "file-changes.jsonl")
    with open(log_file, "a", encoding="utf-8") as f:
        f.write(json.dumps(log_entry) + "\n")

    result = {"decision": "allow"}
    print(json.dumps(result))

if __name__ == "__main__":
    main()
