/**
 * Design QA — automated sweep
 *
 * Usage:
 *   bun add -d @playwright/test @axe-core/playwright
 *   bunx playwright install chromium
 *   (the server running, see TOKEN-ECONOMY.md §1)
 *   copy this file to .qa/design-qa.ts in the project, then: node .qa/design-qa.ts
 *
 * With node, not bun: on Windows, Playwright launched from a Bun script hangs starting
 * Chromium (checked). Node ≥ 23.6 runs the .ts directly. Inside the project (.qa/, ignored
 * by git) it resolves Playwright from node_modules; from a temp folder it does not.
 *
 * Writes screenshots and a report (report.md) to .qa/design-qa/.
 * This script does NOT decide whether something is right: it collects evidence. The
 * design-qa agent interprets it.
 */

import { type Browser, type BrowserContext, chromium, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// ── Configuration ────────────────────────────────────────────────────────────
const BASE = process.env.BASE_URL ?? 'http://localhost:3000'
const ROUTES = ['/']                       // adjust to the project's routes
const OUT = '.qa/design-qa'

const WIDTHS = [320, 360, 390, 430, 768, 1024, 1280, 1440, 1920, 2560, 3840]

const CVD_FILTERS: Record<string, string> = {
  protanopia:    '0.567 0.433 0 0 0  0.558 0.442 0 0 0  0 0.242 0.758 0 0  0 0 0 1 0',
  deuteranopia:  '0.625 0.375 0 0 0  0.700 0.300 0 0 0  0 0.300 0.700 0 0  0 0 0 1 0',
  tritanopia:    '0.950 0.050 0 0 0  0 0.433 0.567 0 0  0 0.475 0.525 0 0  0 0 0 1 0',
  achromatopsia: '0.299 0.587 0.114 0 0  0.299 0.587 0.114 0 0  0.299 0.587 0.114 0 0  0 0 0 1 0',
}

type Finding = { route: string; kind: string; detail: string }
const findings: Finding[] = []
const slug = (s: string) => s.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'root'

// ── Checks ──────────────────────────────────────────────────────────────────

/** Horizontal scroll: failure #1 at small widths (WCAG 1.4.10). */
async function checkOverflow(page: Page, route: string, width: number) {
  const r = await page.evaluate(() => {
    const d = document.documentElement
    if (d.scrollWidth <= d.clientWidth) return null
    const guilty: string[] = []
    for (const el of document.querySelectorAll<HTMLElement>('*')) {
      const box = el.getBoundingClientRect()
      if (box.right > d.clientWidth + 1 || box.left < -1) {
        guilty.push(`${el.tagName.toLowerCase()}${el.className ? '.' + String(el.className).split(' ')[0] : ''}`)
      }
      if (guilty.length >= 5) break
    }
    return { scrollWidth: d.scrollWidth, clientWidth: d.clientWidth, guilty }
  })
  if (r) {
    findings.push({
      route, kind: `overflow@${width}`,
      detail: `scrollWidth ${r.scrollWidth} > viewport ${r.clientWidth}. Candidates: ${r.guilty.join(', ')}`,
    })
  }
}

/** Touch targets below 44x44 at mobile widths. */
async function checkTapTargets(page: Page, route: string, width: number) {
  if (width > 768) return
  const small = await page.evaluate(() => {
    const out: string[] = []
    const sel = 'a, button, input, select, textarea, [role="button"], [role="link"]'
    for (const el of document.querySelectorAll<HTMLElement>(sel)) {
      const b = el.getBoundingClientRect()
      if (b.width === 0 || b.height === 0) continue
      if (b.width < 44 || b.height < 44) {
        out.push(`${el.tagName.toLowerCase()} "${(el.textContent ?? '').trim().slice(0, 24)}" ${Math.round(b.width)}x${Math.round(b.height)}`)
      }
    }
    return out.slice(0, 10)
  })
  if (small.length) {
    findings.push({ route, kind: `tap-target@${width}`, detail: small.join(' · ') })
  }
}

/** Overly long text lines on large screens. */
async function checkLineLength(page: Page, route: string, width: number) {
  if (width < 1920) return
  const long = await page.evaluate(() => {
    const out: string[] = []
    for (const el of document.querySelectorAll<HTMLElement>('p, li')) {
      const text = (el.textContent ?? '').trim()
      if (text.length < 100) continue
      const fontSize = parseFloat(getComputedStyle(el).fontSize)
      const chars = el.getBoundingClientRect().width / (fontSize * 0.5)
      if (chars > 75) out.push(`~${Math.round(chars)} characters per line: "${text.slice(0, 40)}…"`)
    }
    return out.slice(0, 5)
  })
  if (long.length) findings.push({ route, kind: `line-length@${width}`, detail: long.join(' · ') })
}

/** Focus walk: detects invisible or off-viewport stops. */
async function checkFocusOrder(page: Page, route: string) {
  const stops: string[] = []
  for (let i = 0; i < 60; i++) {
    await page.keyboard.press('Tab')
    const s = await page.evaluate(() => {
      const a = document.activeElement as HTMLElement | null
      if (!a || a === document.body) return null
      const b = a.getBoundingClientRect()
      const cs = getComputedStyle(a)
      return {
        tag: a.tagName.toLowerCase(),
        name: (a.getAttribute('aria-label') ?? a.textContent ?? '').trim().slice(0, 30),
        visible: b.width > 0 && b.height > 0,
        inViewport: b.top >= -1 && b.bottom <= window.innerHeight + 1,
        hasRing: cs.outlineStyle !== 'none' || cs.boxShadow !== 'none',
      }
    })
    if (!s) break
    const key = `${s.tag}:${s.name}`
    if (stops.includes(key) && stops.length > 3) break        // wrapped around
    stops.push(key)
    if (!s.visible) findings.push({ route, kind: 'focus-invisible', detail: `${key} — focusable element without dimensions` })
    else if (!s.inViewport) findings.push({ route, kind: 'focus-offscreen', detail: `${key} — focus outside the viewport` })
    else if (!s.hasRing) findings.push({ route, kind: 'focus-no-ring', detail: `${key} — no visible focus indicator` })
  }
}

/** Colors outside the palette are not detected here — that is grep on the code. */

/**
 * A browser whose default font size is `px` (the user's "font size" setting, 16 → 24 is
 * 150 %): it tests rem-based layouts the way a low-vision user sets them, which zoom does
 * not. `chromium.launch()` (headless shell) ignores the preference; a persistent context
 * with the full Chromium (`channel: 'chromium'`) and the preference written to its profile
 * does apply it (melao). Close it with `await context.close()`.
 */
async function browserWithFont(px: number, width = 1280) {
  const dir = await mkdtemp(join(tmpdir(), 'kit-font-'))
  await mkdir(join(dir, 'Default'), { recursive: true })
  await writeFile(join(dir, 'Default', 'Preferences'), JSON.stringify({ webkit: { webprefs: { default_font_size: px } } }))
  return chromium.launchPersistentContext(dir, { channel: 'chromium', viewport: { width, height: 900 } })
}

/** The same setting through CDP, on a normal context; the profile above if CDP fails. */
async function fontContext(browser: Browser, px: number, width: number): Promise<BrowserContext> {
  const ctx = await browser.newContext({ viewport: { width, height: 900 } })
  try {
    const page = await ctx.newPage()
    const cdp = await ctx.newCDPSession(page)
    await cdp.send('Page.setFontSizes', { fontSizes: { standard: px, fixed: Math.round(px * 0.8125) } })
    return ctx
  } catch {
    await ctx.close()
    return browserWithFont(px, width)
  }
}

// ── Sweep ────────────────────────────────────────────────────────────────────
async function run() {
  await mkdir(OUT, { recursive: true })
  const browser = await chromium.launch()

  for (const route of ROUTES) {
    const rs = slug(route)

    // 1. Width sweep
    for (const width of WIDTHS) {
      const ctx = await browser.newContext({ viewport: { width, height: 900 } })
      const page = await ctx.newPage()
      await page.goto(BASE + route, { waitUntil: 'load' })
      await page.screenshot({ path: `${OUT}/${rs}-w${width}.png`, fullPage: true })
      await checkOverflow(page, route, width)
      await checkTapTargets(page, route, width)
      await checkLineLength(page, route, width)
      await ctx.close()
    }

    // 1b. Browser font at 150 % (24 px) at 1280, and 200 % (32 px) at 390: KREA's 200 % at
    // 390 px scrolled every route sideways. CDP's Page.setFontSizes first (it works in the
    // headless shell); the persistent profile only as a fallback — it failed on Windows with
    // `spawn UNKNOWN` (KREA). If neither can start, the report says this check did not run.
    for (const [px, width, label] of [[24, 1280, 'font150'], [32, 390, 'font200']] as const) {
      try {
        const big = await fontContext(browser, px, width)
        const bigPage = big.pages()[0] ?? (await big.newPage())
        await bigPage.goto(BASE + route, { waitUntil: 'load' })
        await bigPage.screenshot({ path: `${OUT}/${rs}-${label}.png`, fullPage: true })
        await checkOverflow(bigPage, route, width)
        await big.close()
      } catch (e) {
        findings.push({ route, kind: `${label}-not-run`, detail: (e as Error).message.split('\n')[0] })
      }
    }

    // 2. Color blindness (at 1440)
    for (const [name, matrix] of Object.entries(CVD_FILTERS)) {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
      const page = await ctx.newPage()
      await page.goto(BASE + route, { waitUntil: 'load' })
      await page.addStyleTag({
        content: `html{filter:url(#cvd)}`,
      })
      await page.evaluate((m) => {
        const ns = 'http://www.w3.org/2000/svg'
        const svg = document.createElementNS(ns, 'svg')
        svg.setAttribute('style', 'position:absolute;width:0;height:0')
        svg.innerHTML = `<filter id="cvd"><feColorMatrix type="matrix" values="${m}"/></filter>`
        document.body.appendChild(svg)
      }, matrix)
      await page.screenshot({ path: `${OUT}/${rs}-cvd-${name}.png`, fullPage: true })
      await ctx.close()
    }

    // 3. System preferences
    for (const [name, opts] of Object.entries({
      dark:           { colorScheme: 'dark' as const },
      'reduced-motion': { reducedMotion: 'reduce' as const },
      'forced-colors':  { forcedColors: 'active' as const },
    })) {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
      const page = await ctx.newPage()
      await page.emulateMedia(opts)
      await page.goto(BASE + route, { waitUntil: 'load' })
      await page.screenshot({ path: `${OUT}/${rs}-${name}.png`, fullPage: true })
      await ctx.close()
    }

    // 4. Zoom 400% (reflow, WCAG 1.4.10)
    {
      const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } })
      const page = await ctx.newPage()
      await page.goto(BASE + route, { waitUntil: 'load' })
      await page.evaluate(() => { document.body.style.zoom = '400%' })
      await page.waitForTimeout(300)
      await checkOverflow(page, route, 1280)
      await page.screenshot({ path: `${OUT}/${rs}-zoom400.png`, fullPage: true })
      await ctx.close()
    }

    // 5. Focus and keyboard
    {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
      const page = await ctx.newPage()
      await page.goto(BASE + route, { waitUntil: 'load' })
      await checkFocusOrder(page, route)
      await ctx.close()
    }

    // 6. axe-core, light and dark
    for (const scheme of ['light', 'dark'] as const) {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
      const page = await ctx.newPage()
      await page.emulateMedia({ colorScheme: scheme })
      await page.goto(BASE + route, { waitUntil: 'load' })
      const { violations } = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze()
      for (const v of violations) {
        findings.push({
          route, kind: `axe-${scheme}:${v.impact}`,
          detail: `${v.id} — ${v.help} — ${v.nodes.slice(0, 3).map(n => n.target.join(' ')).join(' | ')} — ${v.helpUrl}`,
        })
      }
      await ctx.close()
    }
  }

  await browser.close()

  // ── Report ─────────────────────────────────────────────────────────────────
  const byRoute = new Map<string, Finding[]>()
  for (const f of findings) {
    if (!byRoute.has(f.route)) byRoute.set(f.route, [])
    byRoute.get(f.route)?.push(f)
  }

  let md = `# Design QA — automated evidence\n\n`
  md += `**Base:** ${BASE}  ·  **Routes:** ${ROUTES.join(', ')}  ·  **Findings:** ${findings.length}\n\n`
  md += `> This is collected evidence, not a judgment. The \`design-qa\` agent interprets it,\n`
  md += `> reviews the screenshots in \`${OUT}/\` and produces the final report with severities.\n\n`

  for (const [route, fs] of byRoute) {
    md += `## ${route}\n\n| Type | Detail |\n|---|---|\n`
    for (const f of fs) md += `| \`${f.kind}\` | ${f.detail.replace(/\|/g, '\\|')} |\n`
    md += `\n`
  }
  if (!findings.length) md += `No automatic findings. **Still review the screenshots by hand** — a script does not catch what is visual.\n`

  await writeFile(`${OUT}/report.md`, md)
  console.log(`\n${findings.length} findings. Report: ${OUT}/report.md · Screenshots: ${OUT}/\n`)
}

run()
