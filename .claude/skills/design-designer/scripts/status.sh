#!/usr/bin/env bash
# status.sh — summary of design-designer state
# Usage: status.sh
# Outputs: skill version + per-project run counts + total runs.
# v1 scope: status summary only. Full maturity self-check lands in v1.1.

set -u

# Resolve skill root relative to this script, so it works from any cwd.
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
skill_root="$(cd "$script_dir/.." && pwd)"
runs_dir="$skill_root/runs"

skill_version="1.0.0"

echo "design-designer — status"
echo "========================"
echo "Skill version: $skill_version"
echo "Skill root:    $skill_root"
echo ""

if [ ! -d "$runs_dir" ]; then
  echo "No runs/ directory found."
  exit 0
fi

total=0
project_count=0

echo "Runs per project:"
# Iterate project subdirs under runs/. Sort for stable output.
for project_dir in "$runs_dir"/*/; do
  [ -d "$project_dir" ] || continue
  project="$(basename "$project_dir")"
  # Skip the .gitkeep sentinel if it somehow slipped in as a dir.
  [ "$project" = ".gitkeep" ] && continue
  count=$(find "$project_dir" -maxdepth 1 -type f -name '*.md' 2>/dev/null | wc -l | tr -d ' ')
  printf "  %-20s %s\n" "$project" "$count"
  total=$((total + count))
  project_count=$((project_count + 1))
done

if [ "$project_count" -eq 0 ]; then
  echo "  (no project run directories yet)"
fi

echo ""
echo "Total runs: $total"
echo "Projects with runs: $project_count"

exit 0
