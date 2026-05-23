#!/usr/bin/env bash
# replay.sh — re-emit the assembled prompt from a design-designer run-log
# Usage: replay.sh <path-to-run-file>
# Outputs: the contents of the "# Assembled Prompt" section to stdout
# Exits: 0 on success, 1 if file missing or section not found

set -u

runfile="${1:-}"

if [ -z "$runfile" ]; then
  echo "usage: replay.sh <path-to-run-file>" >&2
  exit 1
fi

if [ ! -f "$runfile" ]; then
  echo "error: run file not found: $runfile" >&2
  exit 1
fi

# Extract text between "# Assembled Prompt" and the next "# " top-level header
# (or EOF). Uses awk to avoid sed's portability quirks across Git Bash / macOS.
awk '
  /^# Assembled Prompt[[:space:]]*$/ { in_section = 1; next }
  in_section && /^# / { in_section = 0 }
  in_section { print }
' "$runfile"

# Verify we actually emitted something
if ! awk '/^# Assembled Prompt[[:space:]]*$/ { found = 1 } END { exit !found }' "$runfile"; then
  echo "error: '# Assembled Prompt' section not found in $runfile" >&2
  exit 1
fi

exit 0
