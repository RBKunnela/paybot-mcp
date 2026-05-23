#!/usr/bin/env bash
# detect_project.sh — map cwd to a design-designer project slug
# Usage: detect_project.sh "$(pwd)"
# Outputs: slug on stdout, empty string on no match. Always exits 0.
#
# Portfolio Map (from ~/.claude/CLAUDE.md):
#   D:\1.GITHUB\ALMA-memory            → alma
#   D:\1.GITHUB\xSquadShield           → xsquadshield
#   D:\1.GITHUB\xSquadShield\secondBrain → secondbrain (more specific, checked first)
#   D:\1.GITHUB\aios-core              → aios-core
#   D:\1.GITHUB\my2ndbrain             → my2ndbrain
#   D:\1.GITHUB\aiagentsprompt         → aiagentsprompt

set -u

cwd="${1:-}"

if [ -z "$cwd" ]; then
  echo ""
  exit 0
fi

# Normalise: lower-case the path for case-insensitive match on Windows.
# Also convert backslashes to forward slashes so the same patterns work
# under bash on Windows, Git Bash, WSL, and macOS-style paths.
norm="$(printf '%s' "$cwd" | tr '[:upper:]' '[:lower:]' | tr '\\' '/')"

# Order matters: secondBrain is a subpath of xSquadShield, so check it first.
case "$norm" in
  */1.github/xsquadshield/secondbrain*|*/xsquadshield/secondbrain*)
    echo "secondbrain"
    ;;
  */1.github/alma-memory*|*/alma-memory*)
    echo "alma"
    ;;
  */1.github/xsquadshield*|*/xsquadshield*)
    echo "xsquadshield"
    ;;
  */1.github/aios-core*|*/aios-core*)
    echo "aios-core"
    ;;
  */1.github/my2ndbrain*|*/my2ndbrain*)
    echo "my2ndbrain"
    ;;
  */1.github/aiagentsprompt*|*/aiagentsprompt*)
    echo "aiagentsprompt"
    ;;
  *)
    echo ""
    ;;
esac

exit 0
