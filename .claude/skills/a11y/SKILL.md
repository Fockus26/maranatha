---
name: a11y
description: Mandatory WCAG 2.1 AA accessibility gate before closing any frontend unit of work. Use it whenever you finish a component, a section, a page or a UI phase, BEFORE asking César for review and BEFORE any commit. Covers semantics, keyboard, focus, ARIA, contrast, non-visual states and motion, with automatic verification through axe-core when there is an environment.
---

# Accessibility (WCAG 2.1 AA)

This skill is a **gate**, not a suggestion. No frontend unit reaches César's review without
passing through here. The order is always:

```
implement → [a11y] → (seo if it applies) → ask for review → [git-flow] commit
```

Never the other way round. Fixing accessibility after the commit means a second commit for
something that should have been right the first time.

**Language:** the report you give César (section 5) is in Spanish.

---

## 1. Automatic verification first

If the project has a runnable environment, run axe before reading anything by hand — it is
faster and catches the mechanical issues.

```bash
bun add -d @axe-core/playwright   # if missing (kit projects have it since 3.7.0)
```

In a pool slot (an `orchestrate` worker) dependencies are not added: if it is missing,
inject `axe-core` into the page as a last resort, say so in the PR and log it in
`KIT_FEEDBACK.md` (`/kit-update` installs it).

```ts
// .qa/a11y-check.ts
import { chromium } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const URLS = ['/', '/pricing']            // adjust to what you just touched
const BASE = process.env.BASE_URL ?? 'http://localhost:3000'

const browser = await chromium.launch()
let failed = false

for (const path of URLS) {
  const page = await browser.newPage()
  await page.goto(BASE + path, { waitUntil: 'load' })

  const { violations } = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()

  for (const v of violations) {
    failed = true
    console.log(`\n[${v.impact}] ${v.id} — ${v.help}`)
    console.log(`  ${v.helpUrl}`)
    for (const node of v.nodes) console.log(`  → ${node.target.join(' ')}`)
  }
  await page.close()
}

await browser.close()
process.exit(failed ? 1 : 0)
```

```bash
# César starts the server, not you. Ask him and wait for confirmation:
#   "Necesito el server corriendo para pasar axe. Levanta `bun dev` y avísame."
node .qa/a11y-check.ts   # with node, not bun: on Windows, Playwright under Bun hangs launching Chromium
```

The script lives in `.qa/` (ignored by git): inside the project, so it resolves Playwright
from `node_modules`. (`waitUntil: 'load'`: in dev, `networkidle` may never arrive.)

If César does not want to start it now, **do not insist or start it yourself**: do the
manual review, and flag in the output that axe did not run.

**Plan B without a server** (a cloud session, a worker without one): after `bun run build`,
axe over the build's prerendered HTML, served by Playwright itself (KREA improvised it in
the cloud). Only routes Next prerendered (`.next/server/app/<route>.html`); no live data, so
say "axe over the static HTML" in the output.

```ts
// in .qa/a11y-check.ts, instead of BASE_URL: serve .next from page.route
import { join } from 'node:path'
await page.route('http://kit.local/**', async (route) => {
  const { pathname } = new URL(route.request().url())
  const file = pathname.startsWith('/_next/static/')
    ? join('.next', pathname.slice('/_next'.length))                       // → .next/static/…
    : join('.next/server/app', `${pathname === '/' ? '/index' : pathname}.html`)
  await route.fulfill({ path: file }).catch(() => route.fulfill({ status: 404 }))
})
await page.goto('http://kit.local/')
```

axe covers roughly 40% of the WCAG criteria. **The rest is the manual review below — do not
skip it because axe came out green.**

### Lighthouse (on top of axe, not instead of it)

axe is more precise for accessibility; Lighthouse adds the **Best Practices** category
(console errors, images without dimensions, libraries with known vulnerabilities) and gives
a number you can compare over time. Run the production build, not `dev`.

```bash
bun add -d lighthouse chrome-launcher   # if missing — not in a pool worker (below)
```

A worker in a pool slot does not add dependencies: if `lighthouse` is not in
`package.json`, skip this subsection and write "Lighthouse: not run, not installed" in the
report (melao). `/kit-update` or César adds it.

```ts
// .qa/lighthouse.ts — run with `node`, not `bun` (Lighthouse launches real Chrome)
import { launch } from 'chrome-launcher'
import lighthouse from 'lighthouse'
import desktopConfig from 'lighthouse/core/config/desktop-config.js'

const BASE = process.env.BASE_URL ?? 'http://localhost:3000'
const ROUTES = ['/', '/pricing']         // adjust
const CATS = ['performance', 'accessibility', 'best-practices', 'seo'] as const

const chrome = await launch({ chromeFlags: ['--headless=new', '--no-sandbox'] })
let failed = false

for (const route of ROUTES) {
  const { lhr } = (await lighthouse(BASE + route, { port: chrome.port, logLevel: 'error' }, desktopConfig))!
  const scores = CATS.map((c) => `${c} ${Math.round((lhr.categories[c]?.score ?? 0) * 100)}`).join('  ·  ')
  console.log(`\n━━ ${route}  →  ${scores}`)
  for (const cat of CATS) {
    const problems = (lhr.categories[cat]?.auditRefs ?? [])
      .map((r) => lhr.audits[r.id])
      .filter((a) => a && a.score !== null && a.score < 1 && !['informative', 'manual', 'notApplicable'].includes(a.scoreDisplayMode))
    if (!problems.length) continue
    // the private dashboard/panel is `noindex` on purpose: do not fail its SEO
    if ((cat === 'accessibility' || (cat === 'seo' && !route.startsWith('/dashboard'))) && (lhr.categories[cat].score ?? 0) < 1) failed = true
    console.log(`  ${cat}:`)
    for (const a of problems) console.log(`    • ${a.title}\n      ${a.description.replace(/\s*\[.*?\]\(.*?\)/g, '').replace(/\n/g, ' ').trim()}`)
  }
}
await chrome.kill().catch(() => {})   // EPERM deleting the temp dir on Windows, harmless
process.exit(failed ? 1 : 0)
```

```bash
# pass `undefined` as config for mobile (Lighthouse's default emulates mobile)
bun run build && bun run start   # another terminal
node .qa/lighthouse.ts
```

Targets: **accessibility and best-practices = 100**, **SEO = 100** on public routes.
Performance ≥ 90 (the rest is covered by the `seo` skill). The SEO score of an intentionally
`noindex` page does not count.

The accessibility items Lighthouse flags were almost always caught by axe already; the
Best Practices ones are new and need attention: an `errors-in-console` is usually a broken
`fetch` or a third-party script that does not exist in that environment (e.g.
`@vercel/analytics` outside Vercel — gate it on `process.env.VERCEL`).

---

## 2. Manual review — base checklist

Applies to everything you touched.

### Semantics
- [ ] A single `<h1>` per page; hierarchy `h1 → h2 → h3` without skipping levels.
- [ ] Landmarks present: `<header>`, `<nav>`, `<main>`, `<footer>`, `<aside>`. A single
      `<main>`. If there are two `<nav>`, each with a different `aria-label`.
- [ ] Real lists (`<ul>/<li>`) for what is a list, not stacked `<div>`s.
- [ ] Zero `<div onClick>` without a role: if it is clickable, it is a `<button>` or an
      `<a>`. An `<a>` without `href` is not focusable.
- [ ] `<a>` navigates, `<button>` acts. Do not swap them because one looked better.

### Keyboard
- [ ] Everything interactive is reachable with `Tab` and activated with `Enter` (and
      `Space` on buttons).
- [ ] Tab order follows visual order. Zero positive `tabindex`.
- [ ] Focus ring **always visible** with contrast ≥ 3:1 against the background. If you
      removed the outline by design, you must have put something in its place:
      `focus-visible:ring-2 focus-visible:ring-offset-2`.
- [ ] Zero focus traps: you can leave everything with `Tab` or `Escape`.
- [ ] Modals/drawers: focus goes in on open, stays trapped inside while open, `Escape`
      closes, and on close focus **returns to the element that opened it**.
- [ ] Focus moved by code when the view or step changes: the condition compares with the
      **state being shown** (`step !== previousStep`), not with a "mounted already"
      `useRef`. With StrictMode in development the effect runs twice, the ref is already
      `true` on the second run and focus jumps to the `h1` on mount, with no visible error.
- [ ] There is a "skip to content" if the nav has more than ~5 links.
- [ ] Measured with real keys: `el.focus()` from a script does not turn on React Aria's
      (or any `:focus-visible` heuristic's) ring, and reads as "no ring" when there is one.
      Press `Tab` (or a key first, then `Tab`). Touch scrolling: `synthesizeScrollGesture`
      does not scroll in headless — drag with CDP `Input.dispatchTouchEvent` or it is a
      false negative. Why: both gave wrong findings in world-flags.

### Accessible name
- [ ] Every control has a name: visible text, `aria-label`, or `aria-labelledby`.
- [ ] Icon-only buttons → `aria-label` describing the **action**, not the icon ("Cerrar
      menú", not "equis").
- [ ] Links whose text means something out of context. "Leer más" ×6 on a page is a real
      failure: use `aria-label` to tell them apart.
- [ ] `<img>` with a real `alt`; decorative ones with `alt=""` (empty, not missing).
- [ ] Informative SVG: `role="img"` + `<title>`. Decorative SVG: `aria-hidden="true"`.

### Forms
- [ ] Every input with a `<label>` linked by `htmlFor`/`id`. A placeholder is **not** a label.
- [ ] Errors linked through `aria-describedby` and announced with `role="alert"` or
      `aria-live="polite"`.
- [ ] Invalid field flagged with `aria-invalid="true"`.
- [ ] The error message says **how to fix it**, not only that it is wrong.
- [ ] Correct `autocomplete` on personal data fields (`email`, `name`, `tel`,
      `street-address`, `cc-number`…).
- [ ] Required fields indicated with text or `aria-required`, not only with a red asterisk.

### Non-visual states
- [ ] No state is conveyed **only by color**. Error, success, selected, active: always
      color **+** icon, text or shape.
- [ ] Loading: `aria-busy="true"` or an `aria-live` that announces the result when done.
- [ ] Progress (an upload, a long task): the live region announces **changes of state**
      (started, done, failed), never the running value; the percentage goes in a
      `<progress>` or `role="progressbar"` with `aria-valuenow`, which is read on demand.
      A prompt asked for `aria-live` on an upload and "do not announce every 1 %" without
      saying how (KREA).
- [ ] Disabled: a real `disabled` (not just `opacity-50` + `pointer-events-none`).
- [ ] Toggles/tabs/accordions with `aria-expanded`, `aria-selected`, `aria-controls` per
      the matching APG pattern.

### Contrast
- [ ] Normal text ≥ 4.5:1 against its real background.
- [ ] Large text (≥24px, or ≥19px bold) ≥ 3:1.
- [ ] Input borders, informative icons and focus rings ≥ 3:1.
- [ ] Text over an image or gradient: check against the **lightest** area of the image,
      not the average. If it does not pass, it needs an overlay or a scrim.
- [ ] Check in light **and** dark mode if the project has both.

### Motion and time
- [ ] `prefers-reduced-motion: reduce` respected: decorative animations turn off or reduce
      to a fade; smooth scroll and widget transitions (accordion, tabs, overlays) behind
      `motion-safe:`.
- [ ] Nothing flashes more than 3 times per second.
- [ ] Carousels and autoplay with a pause control. Nothing moves on its own without a way
      to stop it.
- [ ] No time limits that cannot be extended.

### Media
- [ ] Video with captions (`<track kind="captions">`). Without captions, the video is not done.
- [ ] Audio with a transcript.
- [ ] Nothing autoplaying with sound.

### Zoom and reflow
- [ ] At 200% zoom no content or functionality is lost.
- [ ] At 320px width there is **no horizontal scroll** (WCAG 1.4.10). This is the one that
      fails most: check tables, fixed `min-width`s, and long text without `break-words`.

---

## 3. Implementation finding vs. design decision

This distinction decides whether you fix or escalate.

- **Implementation** — a missing `alt`, a missing `aria-label`, focus not visible, wrong
  tab order, no `<label>`. **Fix it yourself, right away.**

- **Design decision** — the palette's `primary` token does not reach 4.5:1 on the light
  background; the 13px base type is illegible; the active state is told apart only by color
  across the whole system. **Do not patch it in a single component.** Patching the symptom
  in one place leaves the same bug in the other twenty and breaks the system's consistency.

  For these: report it, propose the concrete token change, and escalate it to César. If he
  approves it, the change goes into `context/COLORS.md` or `DESIGN_TOKENS.md` **and** into
  the theme, with its file in `decisions/` — not into the component.

**Never invent content to cover a finding.** If a real `alt`, an error text or a transcript
is missing, put a flagged placeholder and add the row to `context/CONTENT_CHECKLIST.md`.
Writing the final copy yourself and delivering it as final is worse than leaving it pending:
it slips into production without anyone reviewing it.

---

## 4. Severities

| Level | What it is | What to do |
|---|---|---|
| **Critical** | Blocks keyboard or screen reader users; fails AA on commonly used text | Fix before closing. No exceptions. |
| **High** | Degrades a lot but has a workaround (broken heading hierarchy, missing landmark) | Fix before closing, unless César says otherwise. |
| **Medium** | Recommended improvement, not blocking | Fix if cheap; otherwise, record it. |
| **Low** | Good practice | Record it and move on. |

---

## 5. Output

Always close with this block (in Spanish), even if it comes out clean:

```
## a11y — <componente/sección/página>

**axe-core:** <N violaciones / ✅ 0 / ⚠️ no se pudo ejecutar: razón>
**Revisión manual:** <N hallazgos>

### Corregido
- [<nivel>] <qué estaba mal> → <qué se cambió> (<archivo>)

### Escalado a decisión de diseño
- [<nivel>] <qué falla> — token/regla afectada: <cuál>
  Propuesta: <cambio concreto> · Decide: César

### Contenido pendiente
- <qué falta> → fila #<N> en CONTENT_CHECKLIST.md

**Estado de la puerta:** ✅ pasa / ⚠️ pasa con N hallazgos abiertos / ❌ no pasa
```

If the status is ❌, **do not go on to the commit**. If it is ⚠️, César has to explicitly
accept the open findings before `git-flow` continues.

---

## 6. Pattern references

When you implement a composite widget (tabs, combobox, menu, disclosure, dialog, tooltip,
treeview), **do not improvise it**: follow the WAI-ARIA Authoring Practices pattern for that
exact widget. If the project uses shadcn/ui or Radix, those primitives already implement
the correct pattern — use them instead of rewriting the keyboard behavior by hand. It is
the case where "I'll do it quickly" produces more accessibility bugs than any other.
