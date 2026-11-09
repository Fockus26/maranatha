# Token economy

Mandatory rules for every agent and skill in the kit. The goal is for each task to cost what
it has to cost: **just the context to do it well, not one file more.**

> What spent the most tokens in the first real project (World Flags) was not the code: it
> was **reading context that was not needed** on every start. `CURRENT_PHASE.md` reached
> 38 KB (it should fit on one screen) and `DECISIONS_INDEX.md` 31 KB, and the rule "read
> these 5 files before starting" made every session pay ~20,000 tokens before touching a
> line. Rules 1–3 exist because of that.

---

## 1. Reading by levels — not "read everything before starting"

| Level | What | When |
|---|---|---|
| **Always** | `CLAUDE.md` (loads by itself) + `context/CURRENT_PHASE.md` | Every session |
| **Per task** | What the "What to read per task" table in `CLAUDE.md` says | Only if the task is of that kind |
| **Search, don't read** | `decisions/`, `CONTENT_CHECKLIST.md`, inventories, `PHASE_LOG/` | `grep` for the word or ID; open only the file/range that comes up |

Examples:

```bash
grep -rhi "^# D.*ranking" context/decisions/                 # anything decided about this?
cat context/decisions/D042-*.md                              # the detail of a cited decision
grep -n "Modal" context/COMPONENTS_INVENTORY.md              # does a component already exist?
```

If an orchestrator prepares a unit, the prompt already brings the relevant paths, lines and
decision IDs: **read that and nothing else** (see the `orchestrate` skill).

## 2. Size budget of `context/`

A file that is always read has to be short; the ones consulted with `grep` may grow, but
each row has to be one line.

| File | Cap | What to do when it is exceeded |
|---|---|---|
| `CLAUDE.md` | ~8 KB | What is neither rule nor map goes to `context/` or `docs/` |
| `CURRENT_PHASE.md` | **~60 lines / 4 KB** | What is closed moves to `PHASE_LOG/<branch>.md`; one line with the link stays here |
| `decisions/D0NN-*.md` | One file per decision, **header = 1 line ≤ 160 characters** | The detail goes in the body, never the header |
| `CONTENT_CHECKLIST.md` | No cap, short rows | Resolved ones get marked `Resolved`; paragraphs are not rewritten |
| Any other "always" file | 4 KB | Split it |

Quick check (`git-flow` runs it when closing each unit):

```bash
wc -c CLAUDE.md context/CURRENT_PHASE.md    # >8000 / >4000 → prune before the PR
grep -rh "^# D" context/decisions/ | awk 'length > 200'   # headers that are paragraphs
```

## 3. `CURRENT_PHASE.md` is a board, not a diary

Only three things: **what is open now** (PRs/branches with their status in one line),
**what blocks** (the owner's actions), and **what is next**. The narrative of what was done,
what was verified and what was not, goes to `PHASE_LOG/<branch>.md` when the unit closes. If
when closing a unit you see the file grew, pruning it is part of the closing, not a
separate task. It is local, and backed up to the `context-state` branch
(`bun run context:backup`).

## 4. The dev server

**By default César starts it.** When a step needs the site running, ask and wait; if he
says no, go on without that verification and flag it as not verified.

**Exception authorized per batch** (used by `orchestrate` with parallel workers): if César
authorizes it, each agent starts its own **in the background**, in its pool slot and **on
the slot's port**, does not read its logs unless something fails, and shuts it down when
done — killing its process tree, never with the framework's `stop`. The authorization holds
for that batch, not forever.

Why the rule exists: a foreground server spits compilation logs on every change and every
line goes through the context; an orphaned one keeps holding the port.

## 5. Tests: the affected ones in the loop, all of them in CI

- **While working:** only the tests affected by the change, with minimal output:
  ```bash
  bun run test:related        # scripts/test-related.ts: picks by the import graph, uses --dots
  ```
  It picks by real dependencies, not by name: a change in achievements does not run the
  tutorial's test… unless the tutorial imports something from achievements, which is
  exactly when it should run. If dependencies, `tsconfig` or the bundler config change, it
  runs everything.
- **Before opening the PR:** the full unit suite, with `--dots` (one dot per passing test;
  detail only for the failing ones). Green, it is a couple of lines. Alone and in the
  background with several workers (see `STACK-NEXTJS.md` › bun).
- **CI always runs everything.** Graph selection is a heuristic (it does not see what a test
  reads with `fs` except by name, nor global effects): it speeds up the loop, it does not
  replace the suite. For e2e, the same with `playwright test --only-changed=origin/main`
  first and the full suite afterwards.

## 6. Screenshots: to disk, not to the context

- A screenshot **looked at** by the agent costs far more than measuring the DOM. To verify
  structure, contrast, overflows or focus: DOM measurements (text).
- PR screenshots are **generated to disk and published without opening them**
  (`bun run shots` + `bun run shots:publish`, scripts in `scripts/`). They are for whoever
  reviews.
- The agent only opens an image when the finding is visual and cannot be measured (and
  always before writing its `alt`).

## 7. Do not reread what you already read

The content of a file that is already in the conversation is not read again. After editing,
**do not reread to verify**: if the edit had failed, the tool would have errored. Exception:
a file you changed through the shell (`sed`, `biome --write`) must be read before editing it.

## 8. Read just enough

- A big file: the range you need, not the 2,000 lines.
- Looking for something: `grep` with the pattern, not reading whole files to see if it is
  there — and with scoped paths (`app/`, `lib/`), never at the root (it walks
  `node_modules` and `.next`).
- Exploring: list names first, open only what turns out relevant.

## 9. One unit, once

What spends the most tokens is not a long file: it is implementing a whole section with an
invented value and having to redo it. Hence "if a handoff value is missing, ask" and "3
options before implementing what is ambiguous". A background worker that cannot ask picks
the conservative option and explains it in the PR.

## 10. Concise outputs

- Do not repeat in prose the code you just wrote.
- Do not narrate what you are going to do before doing it.
- Each skill's delivery format is already the summary: do not add another on top.
- Commands with long output: filter (`| tail -20`, `--dots`, `--quiet`) or write to a file
  instead of reading it all.

## 11. Isolate what is noisy in subagents

QA sweeps, wide explorations and whole delegated units run as subagents: their noise
(screenshots, axe outputs, traces, logs) stays in their context and only the report comes
back to the main session. The price: a subagent starts cold, so **the prompt has to bring
the minimal sufficient context** (paths, lines, decisions, known traps) so it does not
rediscover it by reading the whole repo.

## 12. Effort by role

The orchestrator (plans, groups, writes prompts, consolidates) justifies high effort. The
workers that run a well-specified prompt do just as well at medium effort. It is set in the
agent's definition (`effort:` in the frontmatter of `.claude/agents/*.md`).

**Model per task — any task, not only the workers.** The frontmatter is the default;
`orchestrate` overrides it per unit (`model`/`effort` in `Agent(...)`), and the same table
holds for everything else:

- **Every subagent you launch** (`functional-qa`, `design-qa`, `Explore`, a one-off
  `general-purpose`) carries `model` and `effort` from the table in its `Agent(...)`.
- **The main session** cannot change its own model. Before starting a task, one line to
  César: `Modelo recomendado: sonnet · low (mecánica)`. If it differs from the session's,
  he switches with `/model` and `/effort` (or the app's selector) before you go on; if it
  matches, the line is enough. A list of several tasks: one line per task, or the strongest
  one when they go together.

Why: the table only reached `orchestrate`'s workers; the work done by hand in the main
session and the QA launched from `git-flow` 5b kept running on the big model at high effort
whatever the task (César, 2026-10-23).

| Unit | Model · effort | Examples |
|---|---|---|
| Mechanical: the approach is in the prompt, 1-2 files, copy/CSS/data list/docs | `sonnet` · low | extend a data list, a `flex-wrap` on listed rows |
| Normal: UI logic, 3-6 files of one zone, pick between known approaches | `sonnet` · medium | a section, a component with states, notices at 200 % |
| **Risk**: auth, session, concurrency, stored data, migrations with data, security — or the solution has to be designed | `opus` · medium (`high` if it crosses tabs or races) | confirmation polling + expired link, a cross-tab close mark |

**Risk wins:** with any of those risks it is `opus`, however small the unit. QA agents:
`wave-qa` `sonnet` when the scope (§8 of `orchestrate`) has no auth or cross-tab data,
`opus` when it does; `functional-qa` on a risk flow (5b), `opus` · medium; `design-qa`
(version QA only) with a versioned measuring script, `sonnet`.

Why: in world-flags every worker ran on the big model and mechanical units spent 100-280 k
tokens a smaller one would have covered; the one that found a real race was a risk unit.
If a `sonnet` worker fails its gates twice, relaunch the unit with `opus` in the same slot
and branch (`SendMessage` does not change the model).

## 13. Separate sessions per block

A very long session accumulates all its history on every turn. It is cheaper to close and
open a new session between big blocks: the state lives in `context/` and in the project's
memory, not in the conversation.
