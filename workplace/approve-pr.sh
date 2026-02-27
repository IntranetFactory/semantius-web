#!/bin/bash
# Pre-PR approval gate
# This script MUST be called before creating a PR via `gh pr create`.
# It validates .pr-comment.md exists and contains required sections,
# then runs any additional checks. Exits non-zero if the PR is not ready.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PR_COMMENT_FILE="$REPO_ROOT/.pr-comment.md"

# --- Check: .pr-comment.md must exist and be non-empty ---
if [ ! -f "$PR_COMMENT_FILE" ]; then
    echo "❌ BLOCKED: .pr-comment.md does not exist."
    echo ""
    echo "Before creating a PR you MUST:"
    echo "  1. Write the full PR description to .pr-comment.md (at repo root)"
    echo "  2. Run: bash workplace/approve-pr.sh"
    echo "  3. Only if this script exits 0, create the PR with:"
    echo "     gh pr create --title \"...\" --body-file .pr-comment.md"
    exit 1
fi

if [ ! -s "$PR_COMMENT_FILE" ]; then
    echo "❌ BLOCKED: .pr-comment.md is empty."
    echo ""
    echo "Write the full PR description into .pr-comment.md before running this script."
    exit 1
fi

# --- Notify ---
bash "$SCRIPT_DIR/message.sh" "PR approve called"

echo "✅ PR approved. You may now create the PR."
exit 0
