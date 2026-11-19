---
name: git-flow
description: The kit's branch and commit flow. Use it whenever a unit of work (phase, section, component, feature) is about to start, and whenever a unit of work is finished and ready for review. It has two modes per context/GIT_STATE.md - "pr" (branch → push → Pull Request that César reviews and merges; the normal case with a GitHub repo) and "local" (approval pause → commit → merge into the base). Covers branches, Conventional Commits, verification, screenshots, pruning and backing up context/, changesets (version/changelog) and the push rule.
---

# Git Flow

This is the **mandatory** git flow of every kit project. No agent commits on its own or
starts writing code on whatever branch happens to be checked out.

**Language:** commit descriptions, PR titles and bodies, and everything you tell César are
in Spanish. Projects created before kit 3.8.0 keep their `context/` files in Spanish: use
them as they are.

The skill activates at two moments: **when opening** a unit of work and **when closing**
it. Between those two moments git is not touched at all.

**In a cloud session** (`CLAUDE_CODE_REMOTE=true`) the branch and the closing follow the
`cloud-session` skill: the container is deleted when the session ends, so each unit ends
merged into `main` by the agent (PR + green CI). The gates of §2.1 do not change.

---

## 0. Branch state: `context/GIT_STATE.md`

Before creating any branch, read `context/GIT_STATE.md`. It states the **mode** (`pr` or
`local`) and which is the **base branch** of the unit you are about to open.

- **`pr` mode** (repo with a remote and protected `main`): the base is always an updated
  `main`; closing is section **2A**. No pause before the commit: César's review is the PR.
- **`local` mode**: optional parent branch, approval pause, local merge; closing is
  section **2B**.

If the file does not exist, ask César for the mode once and create it from the kit
template (`context-templates/GIT_STATE.md`). Minimal form in `local` mode:

```markdown
# Git State

## Active parent branch
`{{branch or "none — units branch straight off main"}}`

## Base branch of the next unit
`{{main | parent-branch-name}}`

## Open working branches
| Branch | Base | Unit | Status |
|---|---|---|---|
```

This file is the source of truth for "where do I merge when I'm done?". Never infer it from
`git branch --show-current`: if something went wrong earlier, that branch may be the wrong one.

---

## 1. When OPENING a unit of work

### 1.1 Decide whether a parent branch is needed (`local` mode only)

In `pr` mode there are no parent branches: each unit leaves `main` and comes back through
its PR. A big block is split into several small PRs (and, if many at once, the
`orchestrate` skill distributes them).

In `local` mode, ask César **once per block of work**, not per component:

- **Small project / loose work** (a landing page, a fix, two or three components): working
  branches leave `main` directly. No parent branch.
- **Big block** (integrating the whole design, the full authentication module, a whole
  checkout): a **parent branch** is created from `main`, and each piece leaves as a
  **sub-branch** of it.

Big block example:

```
main
 └── design/integration            ← parent branch (base of all the ones below)
      ├── design/hero              ← sub-branch, base = design/integration
      ├── design/navbar
      └── design/pricing
```

When you create a parent branch, update `GIT_STATE.md` so that every following unit leaves
from it without asking again.

### 1.2 Create the branch

```bash
git checkout <base-branch>
git pull --ff-only origin <base-branch>   # only if the base already exists on the remote
git checkout -b <type>/<kebab-case-description>
```

In a **worktree pool slot** (a unit delegated by `orchestrate`), the branch already exists:
`wt take` created it from `origin/main`. Do not create another one or switch branches.

**Uncommitted work before opening** (`git status --short` is not empty and it is not from
this unit): a worktree or a new branch from `origin/main` does not carry it, so the unit
would start without that code. Do not stash, discard or carry it along silently. Show César
the list (`git status --short`, grouped) and propose, in this order: (1) it is finished work
→ commit it on its own branch and PR first, then open this unit from there or from `main`
once merged; (2) it is work in progress the unit depends on → open the unit on top of that
branch, in place, and say so in the PR; (3) it is unrelated → leave it in the main folder
and do the unit in a pool slot. Why: in InspecChile a whole migration was uncommitted, the
clean worktree from HEAD had no plugin, and the kit's adoption had to be done in the dirty
tree (2026-11-07).

**Valid types:** `feat`, `fix`, `refactor`, `style`, `docs`, `chore`, `perf`, `test`,
`design`, `a11y`, `seo`.

Name rules: lowercase, no accents, no spaces, at most ~5 words after the type.

| Good | Bad |
|---|---|
| `feat/auth-magic-link` | `feature/Autenticación con magic link` |
| `design/hero` | `hero` |
| `fix/footer-broken-links` | `fix/several-things` |

In `local` mode, record the new branch in the `GIT_STATE.md` table with its base and the
status `open` (in `pr` mode the status is `gh pr list`; there is no table to keep).

### 1.3 Confirm and start

Tell César in one line: branch created, its base, and what will be done in it. From here,
git is not touched again until the unit is finished.

---

## 2. When CLOSING a unit of work

### 2.1 Gates (non-negotiable)

Before even mentioning a commit:

1. **If the unit touched UI:** the `a11y` skill must already have run and be green, or
   with its open findings explicitly accepted by César. Without that, it does not close.
2. **If the unit closed a section with content, a page, or initialized the repo:** the
   `seo` skill must already have run.
3. **The build runs in CI, not here.** The PR is not merged until CI's `build` job is green;
   locally, only if the unit touches `next.config`, the dependencies or the build setup, or
   CI's build failed. With a deploy preview (Vercel), open its URL once: a route answers
   200. Why: the local build took 109–309 s per unit on an HDD against 44 s in CI, and it
   did not catch the production 500 (`require(esm)`) that only the real startup showed
   (KREA; César, 2026-11-05). A project without CI keeps the local build.
4. `bunx tsc --noEmit` and the linter pass, if the project has them configured.
5. **Tests:** during the work `bun run test:related` was enough; here goes the full suite
   (`bun run test`, with `--dots`). CI runs it again on the PR.
5b. **Closing QA — only for risk**, outside a wave of `orchestrate` (which has its own
   `wave-qa`): if the unit **completes a risk flow** (sign-up/login/session, a form that
   saves data, a CRUD, payments, checkout) → launch `functional-qa` on that flow, with
   `model`/`effort` from `TOKEN-ECONOMY.md` §12. A page, a section or the status screens do
   **not** get `design-qa` here: the visual audit runs once, at the version QA (phase 09 /
   `phases-templates/09-QA-FINAL.md`); until then the `a11y` gate and the project's
   versioned class scripts (`tests/e2e/`, `scripts/qa/`) cover it. If `functional-qa`
   cannot run now (no server, no local backend, a cloud session without accounts), one line
   in "Blocked" of `CURRENT_PHASE.md`: `QA pendiente: functional-qa — <flujo> — PR #N`, and
   the same in the PR body. Never silent. Why: six PRs made in cloud sessions were merged
   without QA, and the debt surfaced weeks later as three High data-loss findings
   (inversiones-js #19) — that is what is kept per unit; a `design-qa` per page re-audited
   320-3840 px for every change and was the most expensive QA in tokens (César, 2026-10-23).
6. **Changeset**, if the project is versioned (it has `.changeset/`; if its `CLAUDE.md`
   says "no versioning", never: it is a decision, not something left to migrate): if
   whoever uses the site notices the change, add `.changeset/<desc>.md` (see 2.1.3). Do not
   touch `version` or `CHANGELOG.md`: the version PR generates them. Docs, tests, CI and
   refactors: no changeset.
7. **Screenshots**, if something visible changed (see 2.1.1).
8. **Prune and back up `context/`** (see 2.1.2).
9. **Kit feedback**: go over the unit. Did César correct something you did following the
   kit, ask you for the same thing a second time, do by hand a step the kit could do, or
   did the kit not say what to do? A row in `context/KIT_FEEDBACK.md` (or add 1 to "Times"
   if it exists). If there was nothing, nothing is written. A worker puts it in its report.

If any fails, it is not time to commit: fix it or report it.

#### 2.1.1 Screenshots for the review

If the unit changed something visible and the site is running:

1. **Rewrite** `.pr-shots.json` (gitignored) with the states that changed: mobile (375) and
   desktop (1280), light and dark (`"scheme": "both"`), and "before" only if it helps see
   the change. To reach a state use `steps` (clicks, waits) or `storage`. The server URL
   goes in `base` (not `baseUrl`). Never reuse the one that is there: in a pool slot it
   belongs to the previous unit, and other units' screenshots got published because of it.
2. `bun run shots` (node + Playwright; not with bun: it hangs on Windows).
3. `pr` mode: `bun run shots:publish` in the background (on Windows it takes minutes). The
   markdown is left in `.pr-shots/README.md`: paste it into the PR's "Screenshots" section.
   `local` mode: give the PNG paths in the approval pause.

If the project has no `shots` / `shots:publish` in `package.json` (created before 3.0.0 or
without `new-project.ps1`), do not improvise another folder: say so in the PR ("Capturas:
el proyecto no tiene los scripts") and log it in `KIT_FEEDBACK.md`; `/kit-update` installs
them.

**Do not open the images** to review them: you already verified by measuring the DOM, and
each image you look at costs a lot of tokens. If a screenshot fails, it does not block: say
so in the PR ("Capturas: no disponibles — <motivo>").

#### 2.1.2 Prune and back up `context/` before closing

```bash
wc -c CLAUDE.md context/CURRENT_PHASE.md                  # cap ~8000 / ~4000
grep -rh "^# D" context/decisions/ | awk 'length > 200'   # headers that are paragraphs
```

- The unit's narrative (what, verified, not verified, findings) → `PHASE_LOG/<branch>.md`.
- `CURRENT_PHASE.md` keeps the unit's row with its status and link; anything closed from
  earlier units that is still there moves out.
- Decisions: one file `decisions/D0NN-<topic>.md` per decision, with its one-line header.
  There is no shared index to edit: two PRs that decide things do not collide.

Then, **in the main folder** (not in a pool slot, which has no local `context/`):

```bash
bun run context:backup     # local context/ → orphan branch context-state
```

The local files of `context/` (`CURRENT_PHASE`, `CONTENT_CHECKLIST`, `PHASE_LOG/`,
`plans/`, `KIT_FEEDBACK`) are not in git on purpose — parallel workers would collide on
them — but they are the only record of where the project stands. The backup goes to the
`context-state` branch (never to `main`, never in the PR), and only commits if something
changed. After losing the folder: clone and `bun run context:restore`. On a public repo the
script refuses (the checklist may hold client data): say so to César. If the project does
not have the script yet, say so; `/kit-update` adds it.

#### 2.1.3 Changesets: version and CHANGELOG without conflicts

`bunx changeset` asks questions and is useless for an agent: the file is written by hand.
Kebab-case name, descriptive and unique (`.changeset/repeat-combination.md`):

```md
---
"<name from package.json>": minor
---

Ahora puedes repetir una combinación desde el historial.
```

Bump: **major** breaks stored data or removes something · **minor** new feature ·
**patch** fix. The text is user-facing, in the site's language. Two PRs in parallel do not
collide: each brings its own file.

When it reaches `main`, the `release.yml` Action opens (or updates) the
`chore(release): version` PR, which gathers the changesets, bumps `version` and writes
`CHANGELOG.md`. **The Action opens it and César merges it** when he wants to publish; no
agent edits or merges it. **Before he merges it, the version QA** (`design-qa` +
`functional-qa` over what changed since the last one, `phases-templates/09-QA-FINAL.md`):
when the PR appears, remind him in one line if it has not run. In `local` mode there is no Action: when César asks to publish,
`bunx --bun changeset version` on the base, and the `chore(release): version` commit goes
through the approval pause like any other.

#### Migrating an existing project to Changesets

In a PR of its own, `chore/changesets`, not mixed with anything else:

1. `bun add -d @changesets/cli`.
2. Copy the kit's `changeset-templates/` as `.changeset/` and
   `github-templates/workflows/release.yml` to `.github/workflows/`.
3. `CHANGELOG.md` and `version` stay as they are: the Action continues from there (the new
   version goes above the last entry).
4. Add `workflow_dispatch:` to the `on:` of `.github/workflows/ci.yml`: `release.yml` uses it
   to run CI on the version PR (opened by `GITHUB_TOKEN`, which does not trigger
   `pull_request`), so that PR gets the `ci` check without bypassing protection.
5. Manual action for César in GitHub: *Settings › Actions › General › Allow GitHub Actions
   to create and approve pull requests*.

PRs that were already open with their own version bump get adjusted when they sync with
`main`: they drop their `version`/`CHANGELOG.md` change and add their changeset.

---

## 2A. Closing in `pr` mode

On your branch you may commit and push **without asking**: César's approval is his review
of the PR.

```bash
git add <the unit's specific files>                  # never -A blindly
git diff --cached --stat                             # only the unit's files? (a staged `git rm` slipped in: KREA)
git commit -m "<type>(<scope>): <descripción>"       # one or several, Conventional Commits
git push -u origin <branch>
gh pr create --base main --title "<type>(<scope>): <descripción>" --body-file <file>
```

If more commits are still coming after opening it (QA in progress on the open PR), open it
as a draft (`gh pr create --draft …`) and `gh pr ready <n>` when they are pushed: César
merged a PR while its QA commit was being pushed, and the commit was left out
(world-flags #95 → #100). Same for a PR already open that goes back to QA: `gh pr ready <n>
--undo` until it ends.

The body follows `.github/pull_request_template.md`: what changes, why, how to test it,
**screenshots**, how it was verified and what was not, decisions taken with their
alternative, and **manual actions** (SQL, dashboards, deploy order). A command César will
run is written for PowerShell, his terminal: `bash scripts/x.sh` there runs WSL's bash, not
Git's (`execvpe(/bin/bash) failed`: kit-deploy) — give `& "C:\Program Files\Git\bin\bash.exe"
scripts/x.sh`, or say "in Git Bash".

Afterwards:

- **Do not stop at the open PR when the plan has more.** Take the next pending unit that
  does not depend on a PR still open — its branch from an updated `main` — and keep the
  questions for César in one list at the end. If everything left depends on an unmerged PR,
  stop and say which PR unblocks what. The agent stopped to ask after every PR and César
  had to say "no te quedes quieto" (InversionesJL22).
- **A PR whose base is another PR's branch** (a chain) is the exception, never the way to
  keep going: only when César asks for it. Then its body says, at the top, the merge order
  — from the first to the last, each one after `gh pr edit <n> --base main` once the one
  below is merged — and before reporting the work as done you check it reached `main`:
  `git fetch origin && git branch -r --merged origin/main | grep <branch>`. Ten chained PRs
  were merged each into its own base: only the first reached `main` and units 2–11 needed
  an integration PR (InversionesJL22).
- **Never** `gh pr merge`, never auto-merge, never push to `main`. The merge (squash) is César's.
- Changes requested on the PR? New commits on the same branch + push. No amend or force-push
  over what was pushed.
- `main` moved and there is a conflict? `git fetch origin && git merge origin/main` (merge,
  not rebase), resolve and run the verification again. Typical conflict with parallel PRs:
  the indexes in `context/` (keep both sides' rows).
- The `chore(release): version` PR is opened by the Action and merged by César; no agent
  edits or merges it.
- After the merge: `git switch main && git pull`. Careful: if the PR stopped tracking files,
  the pull deletes them from disk — copy them out first if you need them.

## 2B. Closing in `local` mode

### 2.2 Approval pause — MANDATORY

**Never commit without César's explicit approval.** Present this to him (in Spanish) and
**stop**:

```
## Listo para revisión — <unidad>

**Rama:** <rama-de-trabajo>  ·  **Base:** <rama-base>

### Qué se hizo
- <2-5 bullets concretos>

### Archivos tocados
- <ruta> — <qué cambió en una línea>

### Verificaciones
- a11y: <✅ sin hallazgos / ⚠️ N hallazgos abiertos, cuáles>
- seo: <✅ / N/A>
- build / typecheck / lint: <✅ / ❌>

### Cómo revisarlo
<ruta o URL local exacta donde mirarlo — ej. `bun dev` → http://localhost:3000/#pricing>

### Commit propuesto
`<tipo>(<alcance>): <descripción>`

¿Lo apruebo y sigo con el merge, o hay algo que ajustar?
```

Wait for the answer. "Se ve bien", "dale", "aprobado" count as approval. Silence does not.
If César asks for changes, apply them and present this same block again from scratch.

### 2.3 Commit

Conventional Commits: `<type>(<scope>): <description>`

- Description in Spanish, imperative mood: "agrega", not "agregado" or "agregando".
- First line < 72 characters, no final period.
- Optional body after a blank line, for the "why" if it is not obvious.
- `git add` **only this unit's files**. Never `git add -A` blindly: if there are stray files
  from something else, they stay out and you mention them.

```bash
git add <specific files>
git commit -m "<type>(<scope>): <descripción>"
```

**If the diff mixes unrelated topics** (an accessibility fix in an old component + a new
payments feature), split it into two commits before merging, and say so. Do not force
everything into one commit for convenience.

### 2.4 Merge into the base branch

```bash
git checkout <base-branch>
git merge --no-ff <working-branch>
```

`--no-ff` always: it keeps visible in the history that there was a separate unit of work.

If there is a conflict: **stop and tell César**. Do not resolve conflicts on your own
without showing him which side keeps what. A badly resolved merge is the quietest way to
lose his work.

### 2.5 Push — the key rule

```
Is the base branch main (or master)?
├── NO  → git push origin <base-branch>        ← automatic push, done
└── YES → DO NOT PUSH. Tell César.
```

- **Base ≠ main** (a parent branch such as `design/integration`): commit → merge → **push**.
  Pushing a parent branch is safe and keeps the work backed up on the remote.
- **Base = main**: commit → merge → **and stop there**. Report:

  ```
  ✅ Mergeado a main localmente. No hice push — main lo empujas tú cuando quieras.
     Cuando estés listo: git push origin main
  ```

This also applies when a whole **parent branch** is closed against `main`: it is merged,
not pushed.

### 2.6 Wrap-up

- Update the branch's row in `GIT_STATE.md` to `merged`.
- **Do not delete the working branch.** Deleting branches is destructive and César's call.
  If many pile up, offer him the list of merged ones so he decides.
- Report in one line: what was committed, where it was merged, and whether it was pushed.

---

## 3. Absolute prohibitions

Never run, even if it looks like the fastest way out of a problem:

- `git reset --hard`
- `git push --force` / `--force-with-lease`
- `git checkout .` / `git restore .` / `git clean -f`
- `git branch -D` / `git branch -d`
- `git rebase` on branches already pushed
- `git commit --amend` on a commit already pushed
- `git stash drop` / `git stash clear`

Only exception: `wt free` (`orchestrate` skill) deletes a slot's already-merged branch with
`git branch -d`; never with `-D`.

If you think one of these is the solution, **describe it to César with exactly what would
be lost** and let him run it. When something gets tangled, the safe way out is almost
always a new branch, not rewriting history.

---

## 4. Full example

Big block: integrating a landing page's design.

```bash
# ── Open the block ─────────────────────────────────
git checkout main
git checkout -b design/integration          # parent branch
# GIT_STATE.md: active parent branch = design/integration

# ── Unit 1: the hero ───────────────────────────────
git checkout -b design/hero                 # base = design/integration
# ...implement, run a11y, run build...
# → PAUSE: present it to César. He approves.
git add components/sections/Hero.tsx components/ui/Button.tsx
git commit -m "feat(hero): implementa sección hero con CTA principal"
git checkout design/integration
git merge --no-ff design/hero
git push origin design/integration          # base ≠ main → push ✅

# ── Unit 2: pricing ────────────────────────────────
git checkout -b design/pricing
# ...same cycle...

# ── Close the block against main ───────────────────
git checkout main
git merge --no-ff design/integration
# base = main → NO push. Tell César.
```
