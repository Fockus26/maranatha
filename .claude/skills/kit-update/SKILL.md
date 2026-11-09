---
name: kit-update
description: Brings a project up to date with the latest web-agent-kit version (also from a cloud session, cloning the kit). Use it when César asks "update the kit", "is the kit up to date?" ("actualiza el kit", "¿está al día el kit?"), "/kit-update", or when a project carries a kit version older than main's. Compares the project's version (.kit-version), the installed skills' version and the kit's origin/main (local clone + git fetch); if they match it says so and checks for missing pieces, if the skills are old it reinstalls them and asks for a new session, and if the project is behind it computes the path in UPDATES.md and applies it on a branch and a PR, one commit per version.
---

# Update the kit in a project

Runs in a session opened **in the project's folder**. It reads the kit from its local
clone, always as it is on `origin/main` (what is published), never from a half-done branch.
It does not touch the project's `main`: everything goes on a branch and a PR.

**In a cloud session** (`CLAUDE_CODE_REMOTE=true`) it works too, with the differences of
"Cloud session" below: read that section first.

## Cloud session

The container has no kit clone, no `~/.claude/` and no PowerShell. Why this path exists:
César ran out of local sessions and needed to update a project that was behind from the
cloud.

- **`<clone>`**: add `Fockus26/web-agent-kit` to the session (`add_repo`) and clone it in the
  scratchpad: `git clone https://github.com/Fockus26/web-agent-kit.git "<scratchpad>/web-agent-kit"`.
  Its `origin/main` is the published version, as always.
- **Installed skills** = the project's copy in `.claude/skills/` (there is no global install
  and no `web-agent-kit.json`). Step 2b does not apply: there is nothing to reinstall
  globally, and every version's "global pieces / install-kit" step is skipped. If the
  `kit-update` loaded in this session is older than `<kit>`'s (or the project had none and
  César pointed you to `<kit>/.claude/skills/kit-update/SKILL.md`), follow `<kit>`'s.
- **PowerShell** for the steps that run `new-project.ps1`: download it to the scratchpad
  (the tarball goes through the proxy; tested 2026-10-20):
  ```bash
  mkdir -p "<scratchpad>/pwsh" && curl -sSL https://github.com/PowerShell/PowerShell/releases/download/v7.4.6/powershell-7.4.6-linux-x64.tar.gz | tar xz -C "<scratchpad>/pwsh" && chmod +x "<scratchpad>/pwsh/pwsh"
  ```
  and run `"<scratchpad>/pwsh/pwsh" -NoProfile -File "<kit>/new-project.ps1" …`. If the
  download fails, stop at the first version that needs it and say so.
- **What cannot be done from the cloud** goes to the PR's "Acciones manuales", never
  improvised: Vercel commands without a login (`vercel env ls`), Docker, and anything that
  reads `.env.local`. There are no project memories in the cloud: skip that part of step 5.
- **`gh`** not authenticated → the GitHub MCP tools (`cloud-session` skill, table).
- **Closing** per the `cloud-session` skill (PR, green CI, merged by you), not §9's "César
  merges". Then: "Abre una sesión nueva: las skills nuevas cargan al arrancar."

**Language:** everything you tell César, the commits and the PR are in Spanish. Projects
created before kit 3.8.0 keep their `context/` in Spanish (same files, Spanish headings,
plan names such as `pendientes.md`): migration steps written for English headings apply to
their Spanish equivalents; do not translate or rename the project's files.

## 0. Where the kit is

`~/.claude/web-agent-kit.json` is written by `install-kit` when installing:

```json
{ "path": "C:\\...\\web-agent-kit", "version": "3.8.0", "installed": "2026-10-16" }
```

- `path` = the kit's clone (I call it `<clone>`). `version` = the installed skills'.
  Installations before 3.8.0 wrote `ruta` / `instalado`: read them the same way.
- If the file does not exist (installed before 3.6.0 or by hand): look for the clone in
  `~/Desktop/agents/web-agent-kit` and, if it is not there, ask César for the path. The
  installed skills count as an unknown (= old) version.
- If `<clone>` is not a git repo with an `origin` remote: stop and say so. Without a clone
  there is nothing to compare against (on another machine: `git clone
  https://github.com/Fockus26/web-agent-kit.git` and `install-kit`).

## 1. The three versions

```bash
git -C "<clone>" fetch origin --quiet
git -C "<clone>" show origin/main:VERSION          # published (target)
git -C "<clone>" status --porcelain --branch       # current branch and uncommitted changes
```

| Version | From |
|---|---|
| **Published** | the clone's `origin/main:VERSION` |
| **Installed skills** | `version` in `~/.claude/web-agent-kit.json` |
| **Project** | the project's `.kit-version`. If it does not exist, deduce it with the table "How to tell a project's version without `.kit-version`" in `UPDATES.md` and show the signals; if they contradict each other, ask |

Show them in one line: `proyecto 3.4.0 · skills 3.5.0 · publicada 3.8.0`.

## 2. What to do

**a) Project = published:** "El proyecto está al día con el kit <versión>." If the installed
skills are also older, say it is worth reinstalling them (step b). Run the "Piece check"
(below), read-only: if everything is there, finish; if something is missing, show it in a
table and ask whether to add it (branch `chore/kit-pieces`, step 3 for `<kit>` and the
closing of step 9).

**b) Installed skills < published:** new skills only load when a session opens, and the
migrations use them. Before migrating anything:

- If the clone is on `main` with no changes (`## main...origin/main` and nothing else in
  the `status`): install from there, which does the `git pull --ff-only` first:
  `powershell -ExecutionPolicy Bypass -File "<clone>\install-kit.ps1" -Pull`
  (macOS/Linux: `bash "<clone>/install-kit.sh" --pull`).
- If the clone is on another branch **already merged** and with no changes (`git -C
  "<clone>" merge-base --is-ancestor HEAD origin/main` succeeds and the `status` shows
  nothing else): it is a finished branch, not work in progress. `git -C "<clone>" switch
  main` and install as above, saying so in one line. Why: world-flags' clone was left on a
  merged feature branch and the skill stopped as if César were editing the kit (2026-11-06).
- If the clone is on a branch not in `origin/main`, or has changes (César is editing the
  kit): do not touch it. Tell him to go back to `main` in the kit or to run the installer
  when he is done.

Then stop: "Abre una sesión nueva en este proyecto y escribe `/kit-update` otra vez." Do
not go on with the old skills loaded.

**c) Project > published:** something is off (it was updated from an unmerged kit branch).
Say so and ask; touch nothing.

**d) Project < published and skills up to date:** go on with step 3.

**e) No kit in the project at all** (no `.kit-version`, no `context/`) **and it is a WordPress**
(`wp-content/`, `wp-config.php`, `.wp-env.json` or a compose with a `wordpress` image): it is
not an update, it is an adoption. Say so, and with César's yes follow "WordPress projects"
below. Why: in InspecChile `/kit-update` found nothing and there was no path (2026-11-07).

## WordPress projects

A project whose `CLAUDE.md` names `wordpress` in `Tech refs`, or case e). The Next/bun pieces
do not apply: never run `new-project.ps1` without `-Stack wordpress` on it (`-OnlyPieces`
installed `@types/bun`, `test:related` and `qa:local`, which cannot run there).

- **Adoption** (case e): branch `chore/kit-adopt`, `pwsh -File "<kit>/new-project.ps1" -Path .
  -Stack wordpress -Client <slug>` (the slug of the site plugin if there is one, else ask), one
  commit `chore(kit): adopta el kit <published>`, then the order of
  `<kit>/reference/tech/wordpress-adopt.md` from step 1, one unit at a time (each its own
  branch and PR per `git-flow`). The PR says which access and secrets César has to provide.
- **Piece check** for WordPress, instead of the table's first two rows: the scripts `shots`,
  `shots:publish`, `context:backup`, `context:restore`, `lint:php`, `site:pull`, `local:up`,
  `local:down`, `local:wp` and their files; devDependencies `@playwright/test` and
  `@axe-core/playwright`; `.gitignore` with `.site-pull/` and `*.sql`; `.env.example`; the
  plugin's `acf-json/` if the site uses ACF; `.github/workflows/ci.yml` running `php-lint.sh`; a
  deploy workflow. What is missing: `new-project.ps1 -Path . -Stack wordpress -OnlyPieces`.
- Versions' steps that touch Next.js, Biome, Changesets, `qa:local` or `test:related` are
  skipped in a WordPress project: they are not pending.

## 3. Read copy of the kit

The migration steps read and copy files from `<kit>`. `<kit>` is:

- `<clone>`, if it is on `main` with no changes and up to date with `origin/main` (step 2b
  already did the pull);
- otherwise, a copy of `origin/main` in the scratchpad, without touching the clone:
  `mkdir -p "<scratchpad>/kit" && git -C "<clone>" archive origin/main | tar -x -C "<scratchpad>/kit"`.

From the kit you only read and copy: no commits, pulls or changes in it.

## 4. Path

Every entry of `<kit>/UPDATES.md` after the project's version, from oldest to newest. Show
it as a list (version · what changes in one line) before touching anything.

## 5. The project's context

Read `CLAUDE.md`, `context/GIT_STATE.md`, `.gitignore`, `package.json` and
`git log --oneline -10`. And the project's memories
(`~/.claude/projects/<this project>/memory/`), in case one describes a flow the path changes.

## 6. Diagnosis of the whole path, changing nothing

For each version, what its diagnosis step asks for: one table per version. Gather into **a
single round** of questions (AskUserQuestion) everything the versions ask to ask; do not
ask version by version.

If a step edits a file the project does not have (e.g. `context/COLORS.md` in a project
that started short), create it with only the sections that step asks for and say so in the
diagnosis.

If the project is **without versioning** (its `CLAUDE.md` says so, or it has no
`.changeset/` and César confirms), the Changesets steps of any version are skipped: they are
not a pending migration, and it is not asked again.

Add the **piece check** (below) to the diagnosis.

## Piece check

A project can be on the right version and still lack pieces the skills take for granted (it
happened: a project on 3.5.0 without `test:related` or `shots`, because it started before
`new-project.ps1` added them; the workers improvised four times). Changing nothing, check:

| Piece | How |
|---|---|
| `package.json` scripts: `test`, `test:related`, `shots`, `shots:publish`, `qa:local`, `context:backup`, `context:restore`, and their files in `scripts/` (plus `scripts/qa-roles.ts`, the project's part of `qa:local`: added if missing, **never replaced**) | `package.json` and `ls scripts/` |
| devDependencies: `@types/bun`, `@playwright/test`, `@axe-core/playwright` (and `@changesets/cli` if versioned) | `package.json` |
| `.gitignore` with `.pr-shots/` **and** `.pr-shots.json`, `.env*.local` (or `.env*`) and `.claude/worktrees/` | `git check-ignore -q <path>` (each one: before 3.20.0, `.pr-shots.json` alone hid the missing folder) |
| **`.gitignore` does NOT ignore** `supabase/` (except `.temp/`, `.branches/`) or the fixed documents of `context/` (`PROJECT_CONTEXT`, `DESIGN_RULES`, `COLORS`, `DESIGN_TOKENS`, `TYPOGRAPHY`, `decisions/`) | `git check-ignore -v supabase/migrations context/PROJECT_CONTEXT.md context/decisions` |
| `biome.json` (if any) excludes `.claude/worktrees` and `.claude/kit-reference`; `tsconfig.json` (if any) has both in `exclude` | `files.includes` / `files.ignore`; `exclude` |
| `.gitattributes` with a global rule that forces LF (`* text=auto eol=lf`), and no file in CRLF in the working copy | `grep -E '^\*\s.*eol=lf' .gitattributes`; `git ls-files --eol \| grep -c "w/crlf"` = 0 |
| `CLAUDE.md` ≤ 8 KB (the template is ≤ 7 KB; the rest is the project's) | `wc -c CLAUDE.md` |
| The kit's `reference/` next to the skills: `.claude/kit-reference/` in the project copy (and `~/.claude/kit-reference/` on the machine) | `ls .claude/kit-reference/TOKEN-ECONOMY.md` |
| Kit copy for cloud sessions: `.claude/skills/<each kit skill>` and `.claude/agents/<each kit agent>`, equal to `<kit>`'s, not gitignored | `diff -rq "<kit>/.claude/skills/<name>" .claude/skills/<name>` per kit skill (and agents); `git check-ignore -q .claude/skills` |
| `.claude/settings.json` with the `SessionStart` hook to `scripts/cloud-setup.sh`, and the script | `grep cloud-setup .claude/settings.json`; `ls scripts/cloud-setup.sh` |
| Backup of the local `context/` on the remote | `git ls-remote --heads origin context-state` |
| **Nested subprojects** (a `package.json` below the root: `bot/`, `functions/`) are installed and checked in CI | `git ls-files '*/package.json' \| grep -v node_modules`; for each: does `<dir>/node_modules` exist, does its typecheck pass, and does `.github/workflows/ci.yml` run its install + typecheck + tests (the commented job in `<kit>/github-templates/workflows/ci.yml`) |
| Firebase project: `firebase.json` with `emulators`, an `emulators` script with `--project demo-*`, Java available | `grep -q emulators firebase.json`; `java -version` |

A kit script replaced by a version's step (`scripts/qa-local.ts`, `pr-screenshots.ts`…) is
copied, then converted to LF and formatted with the project's Biome (`bunx biome check
--write <files>`), in the same commit: copied as is, it arrived in CRLF and with the kit's
style, Biome failed and `git status` showed it modified with no diff (melao).

What is missing is added with the kit's own script, which only adds what does not exist and
overwrites nothing: `pwsh -File "<kit>/new-project.ps1" -Path . -OnlyPieces` (plus
`-NoVersion` if the project is without versioning). `-OnlyPieces` does not copy `phases/`,
`design/`, `.github/`, `context/` or `CLAUDE.md`, and rewrites `package.json` only if it
adds a script. It goes in the same PR, in its own commit (`chore(kit): piezas que
faltaban`). If the stack is not Next.js (Astro, Vite), it does not add `typecheck` and says
so: tell César which pieces are left for him or for you by hand.

A nested subproject `-OnlyPieces` does not touch: `bun install` in its folder and its
typecheck, and if it fails, that goes in the PR as a finding, not hidden. Its CI job is
added in the same commit. Why: inversiones-js had a `bot/` never installed, whose typecheck
was red on `main` for weeks, because CI only ran the root.

If `supabase/` or the fixed documents of `context/` are gitignored, it is a question for the
single round, not something you change silently: César may have done it on purpose. The
recommendation, with its reason: they go in git (without them, losing the folder loses the
schema and the decisions; the pool and `wave-qa` do not see the migrations); if the reason
was privacy, the repo is made private. With his yes: remove them from `.gitignore`, `git
add` them (check first that there are no secrets in them) and commit them in this PR. And
if there is no `context-state` yet, the first `bun run context:backup` (private repo) after
the merge, as a manual action in the PR.

## 7. Branch

Per `context/GIT_STATE.md`: `pr` mode → `chore/kit-<published>` from an updated
`origin/main`; `local` mode → from the base.

## 8. Apply each version, in order

Follow its "Steps" in `<kit>/UPDATES.md` (and the prompts they cite, only the steps
indicated). The "global pieces / install-kit" step is already done (step 2). When each
version is done:

- write its number in `.kit-version` (one line, nothing else);
- commit only that version's files:
  `chore(kit): actualiza a <versión> — <qué cambia en pocas palabras>`.

If a version fails halfway, stop there: what was done stays in commits and `.kit-version`
says how far it got.

With every version applied, **refresh the project's copy of the skills and agents** (cloud
sessions load only that one): `powershell -ExecutionPolicy Bypass -File "<kit>\install-kit.ps1" -Project .`
(macOS/Linux: `bash "<kit>/install-kit.sh" --project .`). It replaces only the kit's skills
and agents; the project's own stay. Its own commit:
`chore(kit): copia de skills y agentes <versión>`. If `.claude/settings.json` existed
without the cloud hook, merge the kit's `reference/claude/settings.json` `SessionStart`
into it (keep what it had).

The project's `CLAUDE.md` stays at 8 KB or less, measured with LF (`git show HEAD:CLAUDE.md |
wc -c` after committing; on Windows `wc -c` of the working copy counts the CRs). If a step
pushes it over, replace the old paragraph that the step supersedes instead of adding, and if it
still does not fit, ask which project-specific part moves to `context/`.

**A step that replaces a line the project does not have** (it is older than the line, or
trimmed it) and does not say what to do: add the new line if what it says is not in the file
in other words, and skip it if it is. If adding it goes over 8 KB, propose in the single round
which project line to shorten, never cut one silently. Say what you did in the PR. Why:
3.15.0 step 5 and 3.16.0 step 2 gave no answer for that case; world-flags skipped one and cut
its own rules for the other (2026-11-06).

## 9. Verification and closing

- Typecheck, lint, tests and build green.
- Close per `git-flow`: push and PR with the template, title
  `chore(kit): actualiza de <origen> a <destino>`. No changeset (it is tooling). In the
  body: the path, a summary per version, and in "Acciones manuales" what each version asks.
  In `local` mode: approval pause and merge as always.
- If a version left design or implementation work pending (e.g. 3.3.0's status screens), do
  not do it here: it goes to `context/plans/backlog.md` (`pendientes.md` in older projects),
  and give César the text for Claude Design if there is one.

## Final report

In Spanish: PR URL, path applied, what changed (one line per file), memories touched, open
questions, backlog items created and what could not be verified.

And log in `context/KIT_FEEDBACK.md` any migration step that was confusing or wrong (type
Gap or Friction, piece "UPDATES.md <version>"). It reaches the kit with `/kit-feedback`.
