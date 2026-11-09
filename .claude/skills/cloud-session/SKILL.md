---
name: cloud-session
description: How the kit works in a Claude Code cloud session (claude.ai/code, the mobile app, or any session where CLAUDE_CODE_REMOTE=true). Use it at the START of every cloud session, before touching code, and at the END of every unit in one, instead of git-flow's closing. The container is deleted when the session ends - this skill restores the local context/, maps gh/pwsh/Docker to what the cloud has, and closes each unit with a PR that the agent itself merges into main once CI is green, so nothing is left unintegrated.
---

# Cloud session

A cloud session runs in a fresh container with only the repo cloned. Three things differ from
César's machine, and each one has burned work before it was written down:

| On the machine | In the cloud | Consequence |
|---|---|---|
| Skills and agents in `~/.claude/` | Only what is committed in the repo's `.claude/` loads | The project carries its copy of the kit's skills and agents (`kit-update` keeps it in sync) |
| The folder stays | The container is **deleted** when the session ends | What is not on GitHub is lost: uncommitted code, unpushed branches, the gitignored `context/` files |
| Open PRs wait for César | Nobody comes back to an ephemeral branch | Each unit ends **merged into `main`** (César's decision, 2026-10-20: work left in open cloud PRs was being forgotten) |

Check you are in one: `echo $CLAUDE_CODE_REMOTE` → `true`. If it is not, this skill does not
apply: use `git-flow` as always.

**Language:** everything you tell César, commits and PRs, in Spanish. Projects created before
kit 3.8.0 keep their `context/` in Spanish (`pendientes.md`, Spanish headings): use them as
they are.

---

## 1. At the start

The project's `SessionStart` hook (`.claude/settings.json` → `scripts/cloud-setup.sh`) already
ran `bun install` and `bun run context:restore`. Check it, do not redo it blindly:

```bash
ls node_modules >/dev/null && ls context/CURRENT_PHASE.md
```

- `node_modules` missing → `bun install`.
- `context/CURRENT_PHASE.md` missing → `bun run context:restore` (brings the local files back
  from the `context-state` branch). If there is no `context-state` either, say so to César in
  one line: you start without the working state (phase, wave, pending content), and you
  rebuild it only from `git log` and the open PRs, never by inventing it.
- The project has no `scripts/cloud-setup.sh` or `.claude/skills/` → it is on a kit older than
  3.10.0: say so and suggest `/kit-update` (it also runs in the cloud).

**Branch:** if the session's instructions assign a branch (`claude/…`), that is the unit's
branch: do not create the `<type>/<desc>` of `git-flow` §1.2, and do not push to another one.
Without an assigned branch, `git-flow` §1.2 as always.

### What the cloud does not have, and what replaces it

| Kit step | In the cloud |
|---|---|
| `gh pr create`, `gh api`, `gh pr view` | `gh auth status` first; if it is not authenticated, the GitHub MCP tools (`mcp__github__create_pull_request`, `pull_request_read`, `merge_pull_request`…; load them with ToolSearch) |
| `pwsh`, `wt.ps1` (worktree pool), `new-project.ps1` | There is no PowerShell. `orchestrate` does not use the pool here: the wave's units go **one after another** in this session, each closed with §2 before the next one opens |
| `bun run qa:local` (Supabase in Docker / Firebase emulators) | No Docker: `--offline` (guest only) and say what was not tested with accounts. Firebase: the emulators need Java and `firebase-tools`; if the container has a JDK they work, otherwise `--offline` too |
| `.env.local` (`vercel env pull`) | `cloud-setup.sh` pulls it at start when the cloud environment has `VERCEL_TOKEN` (secret), `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` (and `VERCEL_ENV_FILE` if the app is not at the root) and allows `api.vercel.com` (`reference/tech/vercel.md` §2d). Without them: say so and point César to that setup. **Never ask César to paste keys or a `.env` into the chat**: it stays in the transcript; if he does, use it only in the container's gitignored file and tell him to rotate what he pasted. A missing variable is reported, never invented or hardcoded |
| Playwright (`shots`, axe, QA scripts) | The container brings Chromium in `/opt/pw-browsers`, often a different build from the one the installed `playwright` expects ("Executable doesn't exist"). Do not download another: point to it, `chromium.launch({ executablePath })` with the path `ls -d /opt/pw-browsers/chromium_headless_shell-*/*/chrome-headless-shell` gives (KREA) |
| Dev server, screenshots | Allowed (it is your container). `shots:publish` pushes to `pr-shots`: if the push is refused, the screenshots go as "no disponibles — <motivo>" |
| `kit-update` | Works: it clones the kit and downloads `pwsh` to the scratchpad (its "Cloud session" section) |

---

## 2. Closing a unit: PR, green CI, merge

Instead of `git-flow` §2A/§2B (whatever `GIT_STATE.md` says: in the cloud there is always a
remote). The gates of `git-flow` §2.1 do not change: a11y, seo, build, typecheck, lint, the
full test suite, **closing QA (5b)**, changeset, screenshots, prune `context/`, kit feedback.

**Closing QA before merging.** You merge yourself, so nobody else will ask for it: a unit
that completes a risk flow (auth, data that is saved, payments) gets `functional-qa`,
launched here before step 6 (`--offline` or the emulators, whatever the cloud allows).
`design-qa` is not run per page: it belongs to the version QA (phase 09). A
High or Critical finding is fixed in the same PR before merging. What could not be tested
in the cloud goes as `QA pendiente: …` to "Blocked" of `CURRENT_PHASE.md` and to the PR body,
and is repeated in the last message (§3). Why: six cloud PRs in inversiones-js were merged
with no QA and three High data-loss findings came out weeks later.

1. **Back up `context/`**: `bun run context:backup`. It is the only copy of the working state
   that survives the container. If the push to `context-state` is refused, paste the changed
   local files into the PR body inside a `<details>` ("Estado de context/ — sin respaldo")
   so they are not lost, and tell César.
2. **Commit and push** the unit's files on the branch (`git add` with paths, never `-A`).
3. **PR** against `main`, with `.github/pull_request_template.md`. In the body, one line:
   "Sesión cloud: lo mergeo yo con CI verde (decisión de César)".
4. **Wait for CI** without polling with `sleep`: subscribe to the PR's activity
   (`subscribe_pr_activity`) and the CI result wakes the session. If the repo has no checks
   on the PR, there is nothing to wait for.
5. **CI red** → it is yours: fix, push, wait again. Never merge red, never skip, disable or
   quarantine a test to get green.
6. **CI green** → merge it yourself, **squash** (`merge_pull_request` with `merge_method:
   squash`, or `gh pr merge --squash`). Never `--admin` or any bypass: if `main`'s protection
   asks for a human review, the PR stays open and you tell César exactly that, with the link.
7. **After the merge**: if another unit follows, restart the branch from the updated `main`
   (`git fetch origin main && git checkout -B <branch> origin/main`) and open the next one.
   Never stack new commits on an already-merged PR.
   If the remote branch still exists (the repo does not delete branches on merge), its tip
   is the old commit the squash already integrated, and a push of the restarted branch is
   refused as non-fast-forward. **Never force** (the classifier blocks `--force-with-lease`
   anyway): `git merge --no-edit origin/<branch>` — it changes no file, since `main`
   already has that content — and a normal push (KREA ×3). Better, tell César once to turn
   on Settings › General › "Automatically delete head branches".

**Never merged by you**, even in the cloud: the `chore(release): version` PR (César publishes
when he wants), and a PR whose unit César asked to review before merging.

## 3. Before the session ends

Nothing stays only in the container. Check:

```bash
git status --short                         # nothing of the unit left uncommitted
git log origin/main..HEAD --oneline        # nothing unpushed or unmerged
```

The last message to César, in Spanish: each PR with its link and whether it is **merged**
(and the commit on `main`) or **open and why** (red CI you could not fix, a review the
protection demands), whether `context/` got backed up, what you could not verify in the
cloud (Docker, real accounts, missing variables), and every `QA pendiente` left.
