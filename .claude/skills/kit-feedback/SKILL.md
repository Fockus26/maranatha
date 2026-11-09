---
name: kit-feedback
description: Sends the feedback accumulated in the project's context/KIT_FEEDBACK.md to the web-agent-kit as a Pull Request on the kit's repo (without cloning it or touching the local copy). Use it when César asks "send the feedback to the kit", "the report for the kit" ("envía el feedback al kit", "el informe para el kit"), "/kit-feedback", or when closing phase 09. Builds the report grouped by kit piece (most repeated first), uploads it as feedback/<date>-<project>.md on a feedback/… branch with gh api, opens the PR with the kit-feedback label and marks the rows sent.
---

# Send feedback to the kit

Runs in a session opened **in the project's folder**. The result is a PR on the kit's repo
with one new file; reports from every project pile up there until César opens a session in
the kit and asks to review them (the kit's `CLAUDE.md` says how).

Why a PR and not a block to paste: pasted reports got lost in the chat or arrived one at a
time. As PRs they are seen together, reviewed at once, and what repeats across projects
stands out.

Why without cloning: the local copy of the kit may be halfway through one of César's
branches. The PR is created entirely with `gh api` against GitHub.

**Language:** the report and the PR are written in Spanish (César reads them). Projects
created before kit 3.8.0 have `KIT_FEEDBACK.md` in Spanish (columns "Veces", "Propuesta";
types Hueco/Fricción/Corrección/Repetición): read it as it is.

## 1. What there is to send

Read `context/KIT_FEEDBACK.md`. The log rows whose "Proposal" ("Propuesta") does **not** end
in `→ informe <date>` or `→ PR <…>` (already sent) are sent. If none is left: say so and stop.

If César did not ask to send it (you suggest it when closing phase 09), show him the
summary from step 2 and wait for his yes.

## 2. The report

Group the rows by kit piece and order by **Times** (most repeated first; within a piece,
the same).

```markdown
# Informe de feedback — proyecto <nombre> — kit <.kit-version> — <AAAA-MM-DD>

Stack: <framework · base/auth · gestor de paquetes · SO> (una línea; ayuda a separar lo
general de lo propio de un stack)

## <pieza del kit> (skill / plantilla / script / prompt, con sección)
- [<Tipo> ×<Veces>] <qué pasó> → propuesta: <qué cambiar en el kit>. Si solo aplica con una
  tecnología, lo dice: `[Tech: astro]` (va a `reference/tech/`, no a una pieza general)
  Evidencia: <owner/repo#PR, rama o archivo, si sirve>

## Lo que funcionó bien y no hay que tocar
- <1-3 líneas>
```

- **Name:** the `#` of `CLAUDE.md` or the `name` in `package.json`. In the file path, in
  kebab-case.
- **Evidence:** PRs as `owner/repo#N` (a bare `#N` would point to a kit PR).
- **Nothing sensitive:** others can see the kit's repo. No secrets, no URLs of private
  environments, no client or user data; the client's name only if it is already the
  project's name.

Write it in the scratchpad as `<YYYY-MM-DD>-<project>.md`.

## 3. The PR on the kit

Kit repo: the `origin` of the clone named in `~/.claude/web-agent-kit.json` (`path`, or
`ruta` in installations before 3.8.0; `git -C "<path>" remote get-url origin` →
`owner/repo`). If there is no file or clone: `Fockus26/web-agent-kit`.

`gh auth status` first; without a session, stop and say so.

```bash
repo="Fockus26/web-agent-kit"          # the one found above
branch="feedback/<project>-<YYYY-MM-DD>"
file="feedback/<YYYY-MM-DD>-<project>.md"
local="<scratchpad>/<YYYY-MM-DD>-<project>.md"

# free branch name: if it exists, add -2, -3…
gh api "repos/$repo/git/ref/heads/$branch" --silent 2>/dev/null && echo "taken"

sha=$(gh api "repos/$repo/git/ref/heads/main" --jq .object.sha)
gh api -X POST "repos/$repo/git/refs" -f ref="refs/heads/$branch" -f sha="$sha" --silent
gh api -X PUT "repos/$repo/contents/$file" --silent \
  -f message="docs(feedback): <proyecto> — kit <versión>" \
  -f branch="$branch" \
  -f content="$(base64 < "$local" | tr -d '\n')"

gh label create kit-feedback --repo "$repo" --color C5DEF5 \
  --description "Feedback report from a project" --force >/dev/null
gh pr create --repo "$repo" --base main --head "$branch" --label kit-feedback \
  --title "docs(feedback): <proyecto> — kit <versión>" --body-file "<scratchpad>/body.md"
```

PR body (short; the detail is in the file):

```markdown
Informe de feedback de **<proyecto>** (kit <versión>, <fecha>).

- <N> puntos: <n> Hueco · <n> Fricción · <n> Corrección · <n> Repetición
- Lo más repetido: <pieza> (×<n>), <pieza> (×<n>)

Se procesa en una sesión abierta en el kit: "revisa el feedback".
```

## 4. Mark what was sent

In `context/KIT_FEEDBACK.md`, append `→ PR <owner/repo#N>` to the end of the "Proposal" of
each row sent. Do not delete them: if the problem happens again, add 1 to that row's
"Times" and remove the mark, so the next send carries it with the new count.

## Final report

In Spanish: PR URL, how many points were sent and the 3 most repeated pieces.
