# Agent Instructions

> **🔒 CRITICAL: Do not modify this file. It is a shared SOP. Only the human user can update these rules.**

## Project Context

**Before starting any task**, read `CONTEXT-MEMORY.md`. It contains architecture decisions, lessons learned, and project state that you MUST incorporate into your work.

You are responsible for maintaining `CONTEXT-MEMORY.md`. Update it **only** when you discover something a future session would otherwise get wrong — non-obvious platform constraints, architectural patterns, or environmental quirks. Do **not** use it as a change log or to record individual bug fixes. Ask yourself: _"Would a capable developer, reading only the code and this file, make this mistake again?"_ If no, don't record it.

If you make a mistake, encounter a bug that takes more than one attempt to fix, or if I give you a direct preference (e.g., "always run tests"), you MUST:

1.  **Analyze:** Identify the root cause of the error or the core requirement.
2.  **Route:** Decide where the knowledge belongs before recording it:
    - **Specific file** → add a comment in that file explaining the _why_. Do NOT duplicate it in `CONTEXT-MEMORY.md`. If the fix is already self-evident from well-commented code, no further recording is needed.
    - **Cross-cutting / architectural / no single file home** → record in `CONTEXT-MEMORY.md`, but only if the knowledge represents a reusable principle that a future session would otherwise get wrong. Do not record one-off fixes.
    - **Rule of thumb:** if the knowledge would go stale or become wrong when the relevant code is refactored, it belongs in the code — not in a memory file.
3.  **Record:** If `CONTEXT-MEMORY.md` is the right place (step 2), update it by integrating the knowledge into the relevant existing section, grouped by topic. **Do not append chronologically. Do not add a "discovery log" or dated entries. Edit the document so it reads as a current, structured reference — not a history.**
4.  **Prevent:** Formulate a rule for yourself to prevent this specific issue in the future.

## Workspace

This is a **pnpm workspace monorepo** orchestrated by **Turborepo** (`turbo.json`). All packages live under the `apps/` and `packages/` directories.

- `pnpm` — package manager & workspace orchestration
- `turbo` — task runner (build, dev, lint pipelines defined in `turbo.json`)

## Environment

The workspace is provisioned automatically via `workplace/setup.sh` on session start. The following are installed globally and available on PATH:

- `agent-browser` — headless browser automation
- `dotenvx` — secret decryption
- `wrangler` — Cloudflare deployment
- `pnpm` — package manager

Do not re-run `setup.sh` manually unless the environment appears broken.

## Commands

```bash
pnpm dev              # start all apps in dev mode (Vite HMR at http://localhost:5173)
pnpm build            # build all apps
pnpm lint             # lint all apps
```

## Development vs. Completion

### During development — fast iteration

Use `pnpm dev` (or `pnpm --filter web dev`) for instant Vite HMR feedback while writing code. Use this freely during a task for rapid iteration. Localhost is a development tool only — **it is not a completion gate**.

### Task completion — mandatory

A task is **not complete** until it has been deployed to a Cloudflare branch preview and verified there. Do not mark a task done based on localhost behaviour alone.

## Secrets

Secrets are encrypted in `.env` and decrypted at runtime by dotenvx. The private key is provided via the `DOTENV_PRIVATE_KEY` environment variable (`.env.keys` does not exist in this sandbox). To run a command with secrets available:

```bash
dotenvx run -- <command>
```

To add or update a secret:

```bash
dotenvx set KEY value
```

Never expose or log secret values.

## Deployment

Branch previews deploy to Cloudflare Workers. After deployment, the preview URL is written to `.preview-url.md` at the repo root.

```bash
pnpm --filter web preview:wrangler   # deploy preview, writes URL to .preview-url.md
```

Read `.preview-url.md` to get the URL — do not guess or construct it manually.

## Browser Automation

Use `agent-browser` to verify deployed output or test the running dev server.

```bash
agent-browser open <url>
agent-browser snapshot                   # get accessibility tree with element refs
agent-browser click @ref
agent-browser fill @ref "value"
agent-browser screenshot --full <path>
```

Full skill documentation: `.agents/skills/agent-browser/SKILL.md`

## Screenshots

> ⚠️ **Screenshots must be taken from the Cloudflare preview URL, never from localhost.**
> Read `.preview-url.md` after deployment and open that URL before screenshotting.

All verification screenshots **must** be saved to the `screenshots/` folder at the repo root.

Filename format: `YYYYMMDDHHMMSS-<short-title>.png`
Example: `20240315143022-checkout-flow.png`

## Verification Workflow

When asked to implement and verify a change:

1. Make the change
2. Use `pnpm dev` during development for fast feedback (localhost is for iteration only)
3. `pnpm build` — confirm no build errors
4. `pnpm preview:wrangler` — deploy to Cloudflare via turbo (**run from repo root**)
5. Read `.preview-url.md` — this is the only valid URL for verification screenshots

```bash
   cat .preview-url.md   # e.g. https://abc123.your-project.workers.dev
```

6. `agent-browser open <url-from-.preview-url.md>` — **use this URL, not localhost**
7. `agent-browser screenshot --full screenshots/YYYYMMDDHHMMSS-<short-title>.png`
8. Confirm the screenshot URL/title bar reflects the Cloudflare domain, not localhost

---

## Pre-PR Checklist — COMPLETE THIS BEFORE report_progress

> ❌ **Known failure mode:** Finishing the task and taking screenshots but submitting the PR without the preview URL or without screenshots embedded in the PR description body. Screenshots saved to disk do NOT count. They must be visible inline in the PR description using an absolute GitHub URL.

> ❌ **Known failure mode:** Omitting the `CONTEXT-MEMORY.md` update status from the PR description. This section is mandatory on every PR, even when no update was made.

Before calling `report_progress`, verify every item below. **If any item is unchecked, fix it before proceeding.**

- [ ] I have run `cat .preview-url.md` and have the full Cloudflare URL in hand
- [ ] The full preview URL is pasted as a **bare URL** in the PR description (not hidden behind link text)
- [ ] At least one screenshot was taken from the Cloudflare preview URL (not localhost)
- [ ] That screenshot is saved under `screenshots/` with the correct filename format
- [ ] That screenshot is embedded in the PR description using an absolute `raw.githubusercontent.com` URL
- [ ] The PR description includes the `CONTEXT-MEMORY.md` section stating whether it was updated and why

---

## PR Description Requirements — MANDATORY FOR EVERY PR

Copy the template below and fill in every placeholder. Do not paraphrase or omit sections.

```markdown
- [x] <task summary>

## Preview

<paste the full URL from .preview-url.md here — bare URL, no link text>

## Screenshots

![<short description of what the screenshot shows>](https://raw.githubusercontent.com/IntranetFactory/agbr-test/<branch-name>/screenshots/<YYYYMMDDHHMMSS-short-title>.png)

## CONTEXT-MEMORY.md

<Updated — describe which section was changed and what knowledge was added> OR <No update needed — reason>
```

### Preview URL rules

- Read the URL from `.preview-url.md` — never guess or construct it
- Paste it as a bare URL so it is fully visible to reviewers

> ❌ Wrong: `[Live preview →](https://copilot-...)` — URL is hidden behind link text
> ✅ Correct: `https://copilot-...` — full URL visible

### Screenshot rules

- Screenshots must come from the Cloudflare preview URL, not localhost
- Embed screenshots using absolute `raw.githubusercontent.com` URLs — relative paths do not render in GitHub PRs before the branch is merged

URL format:

```
https://raw.githubusercontent.com/IntranetFactory/agbr-test/<branch-name>/screenshots/YYYYMMDDHHMMSS-short-title.png
```

> ❌ Wrong: `![alt](screenshots/file.png)` — broken image in PR (relative path, branch not yet merged)
> ✅ Correct: `![alt](https://raw.githubusercontent.com/IntranetFactory/agbr-test/<branch>/screenshots/file.png)`

### CONTEXT-MEMORY.md update status rules

This section is **required on every PR without exception**, even when no update was made.

When updating `CONTEXT-MEMORY.md`, integrate new knowledge into the relevant existing section grouped by topic. Do not append entries chronologically, do not create a "discovery log", and do not add dated entries. The file must always read as a structured, current reference — not a history.

> ❌ Wrong: omitting the section entirely
> ✅ Correct: `Updated — added constraint to the Authentication section: tokens must be refreshed before deploy`
> ✅ Correct: `No update needed — change was a cosmetic CSS fix with no architectural impact`
