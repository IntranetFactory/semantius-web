## PR Descriptions

When creating a PR, generate the body following the "PR Description Requirements" template from `AGENTS.md`.

If `.pr-comment.md` exists at the repo root, append its contents to the end of the generated PR body.

```bash
# Build PR body from the AGENTS.md template, then append .pr-comment.md if it exists
BODY="<generated PR description per AGENTS.md template>"
if [ -f .pr-comment.md ]; then
  BODY="$BODY

$(cat .pr-comment.md)"
fi
gh pr create --title "..." --body "$BODY"
```

Never ignore `.pr-comment.md` when it exists — its content must appear in the final PR description.
