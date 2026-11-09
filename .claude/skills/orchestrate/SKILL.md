---
name: orchestrate
description: Batch and phase orchestrator. Use it when César arrives with a list of several things at once, when a phase starts and is to be done in waves, or when he asks for "wave N" / "start the batch" ("la ola N", "inicia la tanda"). Maps each request to the code, groups by the files touched, orders into waves (one per session), reserves numbers, takes a pool slot per unit, asks the blocking questions once, launches feature-worker agents in the background, consolidates their PRs, launches wave-qa with the test accounts after the merge, and closes the wave stating the phase, the wave and what comes next.
---

# Orchestrate a batch

You plan; the workers execute. Your expensive work (reading code, deciding groupings,
writing precise prompts) happens **once**; each worker starts cold and reads only what its
prompt points to. That is why you run at high effort and they at medium (see
`reference/TOKEN-ECONOMY.md` §11-12). The kit's `reference/` is installed next to the skills:
`~/.claude/kit-reference/` (or `.claude/kit-reference/` in the project). Open the §12 table
there before assigning models; never assign them by eye (melao: a unit with an RLS migration
ended on `sonnet` because the file was not found).

**Language:** everything you say to César — questions, the closing summary, PR bodies,
commit messages — is in Spanish. Projects created before kit 3.8.0 keep their `context/` in
Spanish (same files; Spanish headings and plan names such as `pendientes.md`,
`fase-0N-*.md`, `orquestacion-*.md`): use what exists, do not rename it.

Requirement: the `feature-worker` and `wave-qa` agents installed (`~/.claude/agents/` or
`.claude/agents/`) **before the session opens**. Agents load at startup: one created
mid-session gives "Agent type not found" until a new session is opened.

Workers run in the **worktree pool** managed by `scripts/wt.ps1` (in this folder;
PowerShell 7). In this skill, `wt` means:

```bash
pwsh -NoProfile -File "$USERPROFILE/.claude/skills/orchestrate/scripts/wt.ps1" <command>
```

(With the kit installed inside the project, the path is `.claude/skills/orchestrate/scripts/wt.ps1`.)

**In a cloud session** (`CLAUDE_CODE_REMOTE=true`) there is no PowerShell and no pool: the
wave's units go one after another in this session, each opened and closed (PR, green CI,
merge) with the `cloud-session` skill before the next. The rest of this skill (mapping,
waves, single round of questions, `wave-qa`) does not change.

**One wave per session.** César uses "wave" (ola) and "batch" (tanda) for the same thing: a
group of units that run in parallel, get merged and go through QA together. Each wave lives
in its own session: the one that launches it piles up mapping, prompts and reports, and
dragging that into the next wave costs tokens on every message for nothing
(`reference/TOKEN-ECONOMY.md`). What the next wave needs goes to disk (§9).

| César says | What you do |
|---|---|
| a list of requests | §1-§7 on the list. If it comes out as more than one wave, the wave plan goes to `context/plans/batch-<date>.md` (same template as a phase) |
| "phase 0N" / "start phase 04" | §0, then wave 1 |
| "wave N of phase 0N" (the start prompt) | read **only** the plan and `CURRENT_PHASE.md`, and §1-§7 for that wave's units |

---

## Before §0: the environment

On a new machine (or after a long pause) a wave failed halfway because what this skill takes
for granted was missing (world-flags, kit 3.9.0). Before mapping anything, one line each:

```bash
bun --version; gh auth status; pwsh -v                      # tools (pwsh: not in the cloud)
ls ~/.claude/agents/feature-worker.md .claude/agents/feature-worker.md 2>/dev/null   # agents
ls context/CURRENT_PHASE.md                                  # local state
```

Missing `CURRENT_PHASE.md` → `bun run context:restore` before anything else. Missing a tool
or the agents → tell César what and how to install it (`install-kit`, then a new session),
and do not launch the wave.

## 0. Split a phase into waves

With the project's `phases/0N-*.md`, the relevant inventory and that phase's part of the
handoff (in pieces, not whole): list the units, group them into waves with the rules of §3
and write `context/plans/phase-0N-<name>.md` (template: `phase-plan-template.md` in this
folder). One line per unit: branch, what, main files. The detailed prompts do **not** go
here: each wave's session writes them, on the `main` the previous wave left.

In `CURRENT_PHASE.md`, "Now" becomes: phase, current wave out of how many, and the plan path.

## 1. Map each request to the code

For each item, find where it lives (grep, line ranges, not whole files): which files it
touches, which earlier decisions constrain it (`grep -rhi "^# D.*<topic>" context/decisions/`),
which known traps there are. Write down path:line — it goes into the prompt.

Against what is on `origin/main`, not your copy: `git fetch` before mapping. And before
turning a request into a prompt, check that it is still needed and can be done the way you
are about to ask:

- **Already done?** A pending migration may already be in
  `git ls-tree --name-only origin/main supabase/migrations/` (and applied: the MCP's
  `list_migrations`). An old backlog item is not a live request.
- **Does it contradict an implemented decision?** If the request carries values (bands,
  caps, colors), find the decision on that topic and compare; if they differ, it is a §2
  question, not a prompt. (5 bands were requested when the implemented decision used 4 caps.)
- **Is there a way to verify it?** Before asking for a DOM test, check that the project has
  a DOM test environment (`happy-dom`/`jsdom` in `package.json`); if not, ask for "verify by
  measuring with Playwright". Before calling something a bug, measure it (e.g. two `font-*`
  classes that `cn` already resolves are not a bug). If César suppressed visual QA (no
  server, no `design-qa`) and the unit adds a color, the prompt asks for the contrast pairs
  computed in light **and** dark in the report: a new color that did not show in dark
  reached `main` because nobody saw it (KREA).
- **Is what you will state as exact true?** A shared shape, a type change ("widening it to
  `string` compiles the same") or a trap of a library: check it before writing it — a quick
  `typecheck` with the change in a free slot, the version in `node_modules`. The worker
  takes the brief as fact: that claim failed in 11 assignments (KREA), and a trap about
  Radix was false for the installed version (KREA). The same for everything the prompt
  cites (KREA ×5):
  - a state, a view or a text it points to **exists** (an "empty state of /secciones/evaluar"
    that did not exist left the worker writing its own copy);
  - counts and texts are **copied from the canvas** (`.dc.html`), not remembered ("4 samples"
    where the canvas paints 5);
  - demo data of earlier waves the unit combines **match** (ids of one list that are not in
    the other);
  - each requirement fits the **API of the components the unit may not edit** — if not, the
    prompt authorizes the API change or says it from the start;
  - an a11y trap (two `nav` with the same name) is real **at the same breakpoint**: two
    elements that never coexist are not one.
  What you already verified is stated once with path:line; do not also ask the worker to
  re-check it (extra reads for something the brief had settled: KREA).
- **Which tests watch these files?** A project test that guards them (`tokens.test.ts` that
  forbids hex in `app/`, even in comments) goes in the prompt's traps: the worker found it
  when it failed (KREA).
- **States: all the combinations.** With two selectors on one view (role × tab), the prompt
  lists the product, not each one apart: two states without a destination were missing
  (KREA).
- **Is there an image involved?** Open it before proposing its `alt` or its text: an alt
  written without seeing it describes nothing.
- **Does it change tokens?** Read the CSS the build generates (`.next/static/css`, `dist/`),
  not the framework's documented default: a prompt said "spacing is already rem" from
  Tailwind's default while the generated CSS emitted `--spacing: 4px` (melao).
- **Does the test you will ask for run on that code?** A PGlite test cannot run a query
  written with the Supabase client. Ask for a test of the equivalent SQL plus a code guard,
  or move the query to an SQL function that PGlite can call (melao).

Signs that a request is bigger than it looks:
- It touches stored data or the database (merge, migrations, columns) → needs tests of the
  pure layer and probably a manual action.
- It changes a rule that affects existing data (e.g. a penalty that makes stored times
  incomparable) → ask what to do with the old data.
- It is cross-cutting (focus styles, hover, tokens) → touches many files: it goes last.
- It belongs to another system (an email template in a dashboard, external config) → not a
  PR: the worker prepares the files and César applies them.

## 2. Ask what blocks — once, at the start

Workers run in the background and **cannot ask**. Everything that changes what they do is
asked now, in a single round (max. 4 questions, with a recommended option):

- May they start their own dev server (each on its own port)?
- May they apply **additive** database changes (new columns) through the MCP, or leave them
  written for César?
- Product decisions the request leaves open that change the unit's design.
- **The scope of a rule when the request does not fix it** ("in this area" or "everywhere"):
  a prompt narrowed a rule to one area by interpretation, it had to apply to all cases, and
  César fixed it after the merge (KREA).

Do not ask about the closing QA: the server and test accounts for `wave-qa` are already
authorized (§8).

Everything else (visual details, copy) the worker decides conservatively and explains in
the PR with its alternative.

## 3. Group and order

- **Group** what touches the same files or revolves around the same piece (ranking: top N
  + avatars + skeleton + the rule that feeds it = one unit).
- **Separate** what is independent: each unit = one branch = one PR, reviewable quickly.
- **Waves:** units that step on each other (same files) go in different waves; cross-cutting
  work (global styles, shared modal headers) goes last, on an updated `main`.
- A unit with no repo code (external template) runs without a pool slot and without a PR.

## 4. Reserve numbers

So that parallel units do not collide, assign each one:

| What | Example |
|---|---|
| Branch | `feat/ranking-top20` |
| Range of decision IDs (one file per ID) | D075–D079 |
| `CONTENT_CHECKLIST` rows — only for a unit that brings new placeholder copy | 26–27 (or none) |
| Changeset bump | `minor` (or `none`) |
| Range of custom error codes, if the project uses them (SQLSTATE of `raise … using errcode`): closed and disjoint per unit, never "F5+" (two units overlapped: melao) | MS010–MS014 |
| Model · effort (`reference/TOKEN-ECONOMY.md` §12) | `sonnet` · medium |
| Docker for this unit (local database, containers) | yes / no |
| Test services on fixed ports for this unit (emulators, a test database the suite starts) | yes / no |

**Two units sharing a shape** (the same table, column, type or event): fix its name and type
in the brief's "Shared shapes" before launching. Otherwise the second one improvises its own
(melao).

**Handoff values without a token** (144/136 px, 140 ms): the prompt says beforehand which it
is — "the nearest existing token" or "new tokens `--x`/`--y`, recorded in a decision". A worker
cannot ask, and "zero magic values" with no token left it stuck (melao).
A token nobody foresaw, when the brief forbids touching the global stylesheet: the worker
uses the nearest one, lists the missing token in its report ("Missing tokens"), and you add
them in one PR when the wave closes (§9). "Do not touch `globals.css`" against "add the token
you need" left values without a token in two units (KREA ×2).

**The last unit of a phase reserves one more decision ID**, for the phase's closing
decision: it had none and the number was improvised (KREA).

**Docker yes/no is decided here**, not left to the worker: "Docker only if the other unit
finished" could not be followed, since a worker cannot know that (world-flags). At most one
unit per wave gets "yes" unless they use separate stacks. Two local Supabase stacks of the
same project collide on ports: a fix whose FAIL → PASS needs the local database runs after
`wave-qa` releases Docker, not while it runs (melao).

**IDs are reserved against `origin/main`**, not against the local folder, which may be
behind (D186 was reserved by looking at `context/decisions/` without a pull and it already
existed on `main`):

```bash
git fetch origin --quiet
git ls-tree --name-only origin/main context/decisions/ | sort | tail -3
```

And above that, the ranges reserved in still-open PRs of another batch, if any.

**`CONTENT_CHECKLIST` rows, the same way: against the file's real last row** (it is local:
in the main folder) plus the ranges of still-open units, never against the plan. A row
reserved as free for a later wave had already been used by another PR (KREA ×2). Reserve
one extra row per unit: within its range the worker distributes them freely (5 copy bands
with 4 rows forced a merge: KREA).

**Test services on fixed ports yes/no is decided here too, like Docker:** at most one unit
per wave runs them. Firebase's emulators with several slots did not start in 60 s, collided
on the fixed ports and contaminated each other's runs (KREA ×8). The others verify through
CI (`gh pr checks`) when it runs those tests; the technology's reference says how (e.g.
`tech/firebase.md` § Emulators in parallel).

The slot and its port are not reserved here: `wt take` assigns them at launch (wt2 → 4302, §6).

Versions: there are no version numbers to reserve and no merge order by version. No PR
touches `version` or `CHANGELOG.md`: each unit with a visible change adds its
`.changeset/<desc>.md` with its bump, and the project's Action gathers them in the version
PR (see `git-flow` §2.1). Two changesets in parallel do not collide: they are different
files. You decide each unit's bump and it goes in its prompt. A project **without
versioning** (its `CLAUDE.md` says so) has no changesets at all.

## 5. Write the brief and the prompts — to disk

Two files in `context/plans/` (local):

- `orchestration-<date>.md` — **shared brief** (template: `brief-template.md` in this
  folder): units table, waves, reserved numbers and the batch rules.
- `orchestration-<date>-prompts.md` — **one prompt per unit** (template:
  `unit-prompt-template.md`): what César asked (literal quote), where the code is
  (path:line), constraining decisions, known traps, the approach already decided, how to
  verify, closing.

On disk and not only in the message: they survive a session restart and the worker only
needs "your prompt is section W3 of that file" — you write it once, not twice.

Also save a project memory pointing to those two files and to the phase or batch plan, and
saying which wave it is on.

## 6. Launch

No `isolation: "worktree"`: it would create and delete a worktree (and its `node_modules`)
per unit. Each unit with code takes a pool slot, from the main folder and **one after
another** (in parallel they would pick the same slot):

```bash
wt take feat/ranking-top20
# slot=wt2 · branch=feat/ranking-top20 · path=C:\…\<repo>-wt\wt2 · port=4302
```

`wt take` creates the branch from `origin/main` (or resumes it if it exists), installs only
if `bun.lock` changed, refreshes the `.env*` files and stops anything still listening on the
slot's port. If there are no free slots, the leftover units wait for the next wave, or the
pool grows with `wt init -Count <N>`.

```
Agent(
  subagent_type: "feature-worker",
  run_in_background: true,
  model: "sonnet", effort: "medium",      # the unit's row of §4
  description: "W3 modals",
  prompt: "Work ONLY in `C:\…\<repo>-wt\wt2` (branch feat/…, already created); your port is 4302.
           Your full prompt is section '## W3 — …' of <path>/orchestration-<date>-prompts.md.
           Read all of it and follow it. Summary to orient you: …(3-4 lines)"
)
```

A unit with no repo code takes no slot. All units of a wave in the **same message** (they
run in parallel). Do not poll: you are notified when they finish.

## 7. Consolidate

When each report arrives:

- Copy its `PHASE_LOG` and the local files it left (SQL, templates) to the main folder if
  the worker could not write there (a sandboxed worktree usually cannot).
- Update `CURRENT_PHASE.md` (one row per PR, short board) and `CONTENT_CHECKLIST.md`.
- Move its "Kit feedback" to `context/KIT_FEEDBACK.md` (if a row for the same problem
  exists, add to "Times"). If several workers tripped on the same thing, it is a strong
  signal: say so in the summary to César.
- To César: table of PRs (number, bump patch/minor/major or none, what changes, slot),
  merge order only if a unit depends on another, open decisions and manual actions.
  Nothing else.
- Requests that come up later → `context/plans/backlog.md`, not the running batch.

When César asks for changes on a PR or `main` moved: continue the worker with `SendMessage`
(it keeps its context) instead of launching a new one. The slot stays its own until merge.

**One extra round per PR, at most.** The worker fixes everything of its class or zone in the
first pass (its prompt says so). What it reports "in passing" after that, if Medium or Low,
goes to `backlog.md`, not to another `SendMessage`: chaining "a bug in passing → another
round" cost 2-3 rounds per PR (world-flags). A Low never opens a wave by itself.

After each PR is merged: `wt free <slot>`. It goes back to `origin/main` detached and deletes
the local branch if merged; `node_modules` stays. If `free` aborts because of uncommitted
changes, ask the worker what they are before touching anything.

The `chore(release): version` PR is opened by the Action and merged by César when he wants
to publish: it is not part of the batch; neither you nor the workers edit or merge it.

A wave does not close with open PRs. When César says they are merged (check it:
`gh pr view <n> --json state`), free their slots and go on with §8.

## 8. Wave QA

When **all** the wave's PRs are merged. One QA per wave, not per PR: what nobody has tested
yet is the units together, on `main`, logged in.

**Only if the wave touched a risk flow** (login/session, data that is saved, payments, roles)
or two units share a page or a table. A wave of sections, copy or styles gets no `wave-qa`:
the workers' gates (`a11y`, the versioned class scripts) cover it, and its visual review is
the version QA's `design-qa` (phase 09). `wave-qa` is never a visual audit either. Why: the
full audit per wave and per page was most of the QA tokens, and its visual findings were
classes one end-of-version sweep fixes at once (César, 2026-10-23).
**A project with `QA: al final` in its `CLAUDE.md`** gets no `wave-qa` at all, and its
workers no server (verify by code and tests): it is asked once, not in every wave. César
asked KREA for no QA until the end of the project and had to repeat it. Note it in the closing
(§9): "QA: no aplica — ola sin flujos de riesgo".

```bash
wt take qa/p0N-wave-N        # branch with no commits on origin/main: reserves the slot
```

```
Agent(
  subagent_type: "wave-qa",
  run_in_background: true,
  description: "QA wave N phase 0N",
  prompt: "Slot `C:\…\<repo>-wt\wt1` (main @ <sha>), port 4301. Main folder: `…`.
           Phase 0N, wave N. PRs: #12 (W1 hero: <its 'How to test' in 2 lines>), #13 (…).
           Flows with login or data: <which, and which role uses them>.
           Seams: <#12 and #13 touch the same page X>.
           Scope: files changed since the last QA (<sha>): <list>. Never verified: <flows>."
)
```

**The scope is computed, not "everything".** The last QA's sha is in the header of the
previous `qa-wave-*.md` ("main @ <sha>"); `git diff --name-only <sha>..origin/main` gives
the files, and the flows that touch them are what gets walked, plus whatever was never
verified and a smoke pass. Why: each closing QA in world-flags re-walked sign-up, login, two
tabs and axe on every screen with no file of theirs changed (×3). With no previous QA, the
whole wave.

No need to repeat what the agent already knows: it starts its server with `bun run
qa:local` against the local backend (Supabase or Postgres in Docker, or the Firebase emulators
with Java; never the real one); it logs in with `EMAIL_TEST`/`PASSWORD_TEST`,
`ADMIN_EMAIL_TEST`/`ADMIN_PASSWORD_TEST` and `<ROLE>_EMAIL_TEST`/`<ROLE>_PASSWORD_TEST` from
`.env.test.local` without seeing the values. If Docker (or Java) is missing, it will report
it as an action for César: do not start it yourself.

**No local database possible** (Supabase or Postgres without Docker on the machine, Firebase
without Java, or the project has no `supabase/config.toml`, `drizzle.config.*` or `firebase.json`
emulators yet): the wave does not stay blocked. Launch it anyway,
with "no local database: `qa:local -- --offline`" in the prompt; it tests as a guest with the
database variables pointing nowhere. In the closing (§9), "QA: guest only — <reason>", and
that wave's logged-in QA goes to "Blocked" until there is a local database.

With the report:
- Save it to `context/plans/qa-wave-0N-N.md`, copy the slot's `.qa/repro/` to
  `context/plans/qa-wave-0N-N/`, and `wt free` the QA slot.
- **Critical or High** → a fix unit **in this same wave** (same slots, no new wave or
  session), with the finding's reproduction script in its prompt: the worker runs it on
  `main` (FAIL) and on its branch (PASS) and attaches both to the PR. That closes the
  finding: **no second QA of the fixes**. The wave closes when those PRs are merged. The FAIL
  half runs with `bash scripts/run-on-main.sh -- node .qa/repro/<n>.mjs <url>` (a temporary
  worktree of `origin/main`): proving it by patching the logic back in the slot risked the
  patch reaching the PR (melao). Why: in
  world-flags each QA opened a wave and each fix got a QA that found more, a loop with no
  end; the owner fixed this rule on 2026-10-22.
- **A finding that is a class** (several instances of the same defect) → the fix unit
  sweeps the **whole class**: the `grep` pattern from the report over `src/`, every instance
  fixed, and the measuring script left versioned in the repo (`tests/e2e/` or
  `scripts/qa/`) so later workers run it before their PR. **The measured guard decides, the
  `grep` is only a hint:** a reflow prompt named the class by grep (`min-w-0`) while the real
  cause was a grid without `grid-cols-1` and the `min-content` of a button and a fieldset
  (melao); the worker runs the guard per route and fixes what it measures. Its prompt says "every component
  with this anatomy", never one folder. Why: four QAs in a row found more of the same
  reflow-at-200 % class, because each fix covered only the listed instances (world-flags ×4).
- **Medium or Low** → `context/plans/backlog.md`.
- The next QA exists only when new functionality arrives (the next wave), with §8's scope.
- **Data not deleted** and **actions for César** → "Blocked" in `CURRENT_PHASE.md`.
- Its "Kit feedback" → `context/KIT_FEEDBACK.md`, like the workers'.

If there are login flows and `.env.test.local` has no test accounts: launch it anyway (it
tests what is public and flags it), and in the closing ask César to add them
(`backend-build` §2, Secrets).

## 9. Close the wave and move to the next

1. Phase plan: the wave's status, its "Closings" row, fixes added to the next wave, and the
   **start prompt** of the next one.
2. `CURRENT_PHASE.md`: "Now" with the phase and the next wave; "Blocked" with the QA items.
   If the reports listed "Missing tokens" (§4), one PR adds them and replaces the nearest
   ones the workers used, before the next wave.
3. **Back up the local state:** `bun run context:backup` (copies the local `context/` to the
   `context-state` branch; see `git-flow` §2.1.2). Without it, losing the main folder means
   the next session does not know where the project stood. If the project does not have
   the script yet, say so in the closing (`/kit-update` adds it).
4. To César (in Spanish), and nothing else:

```
**Fase 04 — Secciones · ola 2 de 3 cerrada**
PRs mergeados: #12 hero · #13 servicios
QA: 0 críticos · 1 alto · 2 medios — el alto se arregló en esta ola (#14, script de reproducción en verde)
Bloquea: <datos sin borrar / cuentas que faltan / nada>

**Sigue: ola 3 de 3** — `feat/testimonios` · `feat/precios`
Para lanzarla: "inicia la ola en otra sesión"
```

If it was the last wave, "Sigue" is the next phase of the track (its wave 1 starts with §0).

5. When César says "start the wave/batch in another session" ("inicia la ola en otra
   sesión", or equivalent):
   - First check that everything the next wave needs is on disk (plan, `CURRENT_PHASE.md`,
     `backlog.md`): the new session does not see this conversation.
   - If you have the app's tool to open another session (in the desktop app,
     `start_session`), open it in the main folder with the start prompt as its first
     message and tell César which one it is. This session launches nothing else.
   - If you do not: the start prompt in a block, to paste into a new session opened in the
     project.

## 10. Already learned (do not rediscover it)

- **Shared local files:** workers do not edit `CURRENT_PHASE` or `CONTENT_CHECKLIST` (they
  would overwrite each other); they write their own `PHASE_LOG/<branch>.md` or deliver it in
  the report.
- **First use in a project:** `wt init` (4 slots; `-Count` for more). It costs one
  `bun install` per slot, once. `wt status` says which slot holds which branch.
- **Gitignored files in the pool:** `wt` already copied the `.env*` files from the main
  folder to each slot (and refreshes them on every `take`); they are never committed. Local
  `context/` is not copied: the prompt says where the main folder is. `.qa/` (measurement
  scripts, logs) is ignored in every slot.
- **To make the pool fast** (manual action for César, not the agent; recommend it the first
  time): exclude from Windows Defender the working folder, the pool folder (`..\<repo>-wt`)
  and `%USERPROFILE%\.bun\install\cache`; and enable in GitHub *Settings › General ›
  Automatically delete head branches*.
- **Production `.env`:** `feature-worker`s verify as guests; they do not log in, create
  accounts or write real data. For states that depend on data (rankings, long lists), they
  intercept the response in the browser, for debugging only — with the shared script the
  brief names in "Simulating the backend", never one copied from another slot. Logged-in testing with data
  belongs to `wave-qa`, after the merge (§8), with the test accounts.
- **Shared browser:** each worker creates its own tab and passes its `tabId`.
- **Destructive database operations** (DELETE of old rows): the worker writes them, does
  not run them; and the safety classifier may block them for the orchestrator too → they
  stay as an action for César, with the exact SQL.
- **Cleaning data the client keeps re-uploading** (a ranking the client re-uploads on every
  load) is not fixed by deleting rows: the new client must invalidate the old data and old
  cached clients must write where nobody reads (internal versioned keys).
- **Playwright runs with node**, not bun (on Windows it hangs).
