## {{W#}} — `{{branch}}`

You are worker **{{W#}}**. Branch: `{{branch}}`. Slot and port: the ones in the message that
launches you (`wt take`). Decisions: range **{{D0NN–D0NN}}**, one file
`context/decisions/D0NN-<topic>.md` for each. CONTENT_CHECKLIST rows: **{{NN}}**.
Model · effort: **{{sonnet · medium}}** (TOKEN-ECONOMY §12). Docker: **{{yes | no}}**. Local build: **{{yes | no}}**.
Test services (emulators…): **{{yes | no}}**.

First read the shared brief: `{{path}}/context/plans/orchestration-{{date}}.md`.
Earlier decisions that constrain you: {{D0NN (what it says in 5 words), D0NN (…)}} —
`cat context/decisions/D0NN-*.md` for each; do not read the whole folder.

### What César asks
> "{{literal quote of the request}}"

{{Interpretation, if the quote is ambiguous: "I read it as X because Y".}}

### Where it is
- `{{src/.../File.tsx:NN}}` — {{what is there today}}
- `{{src/.../other.ts:NN-NN}}` — {{…}}

{{If the unit builds or changes a screen: its headings as the canvas reads, e.g. "h1 Panel ·
h2 Tareas (groups the cards) · h3 each card". A prompt asked for h3 cards without saying
which h2 groups them, and the worker invented an `sr-only` h2 (KREA ×2).}}

### Approach decided
{{What the orchestrator or César already decided, so the worker does not re-decide it. If
some options are left to its judgment, say so explicitly.}}

### Known traps
- {{e.g. "the merge keeps the lower one: if you don't mark the version, the old data comes back"}}
- {{e.g. "there is a test watching X's imports: run that test"}}
- {{e.g. "another unit changes the constants at the top of Y.tsx: don't touch them"}}

### How to verify
- {{what to measure, at which widths/themes, which states, with which data}}
- {{new tests expected}}
- {{If it is a measurable fix: the same measuring script on `main` (before) and on your
  branch (after), with both results in the PR. That proves the bug existed and is gone.}}
- {{QA fix: the finding's script `context/plans/qa-wave-0N-N/<n>-<slug>.mjs` — FAIL on
  `main`, PASS on your branch, both in the PR. That closes it: there is no second QA.}}
- {{QA class: "every component with this anatomy", with the `grep` pattern
  `<…>` over `src/` — not one folder. Leave the measuring script versioned
  (`tests/e2e/` or `scripts/qa/`) and run it on every page it can reach.}}

### Closing
Changeset: {{patch | minor | major | none}} — {{user-facing text, in Spanish}}.
In the PR, "Decision taken / alternative" for: {{…}}. Manual actions: {{…}}.
Final report as the brief says.

---
