# Phase {{0N}} — {{Name}} · wave plan

> Written by `orchestrate` once, when the phase starts. Each wave runs in **its own
> session**: the session that starts a wave reads this file and nothing else of the plan.
> Updated when each wave closes (status, PRs, QA, what moves to the next one).
> Main folder: `{{ABSOLUTE_PATH}}` · Phase file: `phases/{{0N-NAME}}.md`

## Waves

| Wave | Units (branch · what · main files) | Depends on | Status |
|---|---|---|---|
| 1 | {{`feat/hero` · hero section · `components/sections/Hero.tsx`}} | — | {{pending · in progress · QA · closed}} |
| 2 | {{…}} | wave 1 | pending |

Cut rule: units that touch the same files go in different waves; cross-cutting work, in the
last one. A wave fits in one session: past ~4-5 units, split it.

## Current wave: {{N}}

- Brief and prompts: `context/plans/orchestration-{{date}}.md` / `…-prompts.md`
- PRs: {{#12 W1 hero · #13 W2 services}} — {{open | merged}}
- QA: {{pending | report in context/plans/qa-wave-0N-N.md}}

## Closings

| Wave | PRs | QA (C · H · M · L) | Moves to the next | Data not deleted |
|---|---|---|---|---|
| 1 | {{#12, #13}} | {{0 · 1 · 2 · 0}} | {{QA-1 fix: form double submit}} | {{none}} |

## Start prompt for the next wave

```
/orchestrate wave {{N+1}} of phase {{0N}}. Plan: context/plans/phase-{{0N}}-{{name}}.md
```
