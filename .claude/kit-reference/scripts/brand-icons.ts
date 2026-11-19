/**
 * Brand icons — derives every raster icon from the one source SVG.
 *
 * Usage (with **node**, not bun: Playwright launched from Bun hangs on Windows):
 *   node scripts/brand-icons.ts                          # app/icon.svg → app/ and public/
 *   node scripts/brand-icons.ts --src public/brand/icon.svg --bg "#0b0b0b"
 *
 *   --src <svg>     the source icon (default app/icon.svg). Square, legible at 16 px.
 *   --bg <color>    background of the opaque ones (default #ffffff): apple-icon and maskable.
 *                   iOS paints transparency black, and a maskable icon is cropped to a shape.
 *   --app <dir>     where favicon.ico, icon.png and apple-icon.png go (default app)
 *   --public <dir>  where the manifest's icons go (default public)
 *
 * What it writes (sizes and rules: the kit's `reference/BRAND-ASSETS.md`):
 *   <app>/favicon.ico                16, 32 and 48 px inside the .ico, transparent
 *   <app>/icon.png                   512, transparent
 *   <app>/apple-icon.png             180, opaque, the symbol at 80 % (10 % margin each side)
 *   <public>/icon-192.png, icon-512.png            for the manifest, transparent
 *   <public>/icon-maskable-512.png   opaque, the symbol within the central 80 % → 60 %
 *
 * Why it exists: BRAND-ASSETS asks for "one source icon, the rest derived" and the kit
 * brought nothing to derive them with; each project wrote its own (workout). No new
 * dependency: the browser of `@playwright/test` rasterizes the SVG, and the .ico is a
 * container of those PNGs (every current browser reads PNG entries).
 *
 * Run it again whenever the source changes; commit what it writes. A provisional icon is
 * derived the same way: when the real one arrives only the source is replaced.
 */

import { type Browser, chromium } from '@playwright/test'
import { mkdir, readFile, writeFile } from 'node:fs/promises'

const args = process.argv.slice(2)
const opt = (name: string, fallback: string) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback
}
const SRC = opt('src', 'app/icon.svg')
const BG = opt('bg', '#ffffff')
const APP = opt('app', 'app')
const PUBLIC = opt('public', 'public')

const svg = await readFile(SRC, 'utf8').catch(() => {
  console.error(`No source icon at ${SRC}. Pass --src <file.svg>.`)
  process.exit(1)
})
const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`

// Same fallback as pr-screenshots.ts: this Playwright's Chromium, or the machine's browser.
async function launchBrowser(): Promise<Browser> {
  const executablePath = process.env.PW_CHROMIUM_PATH
  const channel = process.env.PW_CHANNEL
  if (executablePath || channel) return chromium.launch({ executablePath, channel })
  try {
    return await chromium.launch()
  } catch (error) {
    if (!/Executable doesn't exist/.test((error as Error).message)) throw error
    for (const installed of ['msedge', 'chrome']) {
      try {
        return await chromium.launch({ channel: installed })
      } catch {
        // not installed either: try the next one
      }
    }
    throw new Error("No browser: node node_modules/@playwright/test/cli.js install chromium (or set PW_CHANNEL).")
  }
}

const browser = await launchBrowser()

// One page for every size, one render at a time: a page per size opened in parallel with a
// 16 px viewport crashed the browser ("Target crashed", kit test with Edge).
const context = await browser.newContext({ viewport: { width: 512, height: 512 }, deviceScaleFactor: 1 })
const page = await context.newPage()

/** A PNG of `size` px: the symbol at `scale` of the canvas, on `background` or transparent. */
async function png(size: number, scale = 1, background?: string): Promise<Buffer> {
  const side = Math.round(size * scale)
  await page.setContent(
    `<!doctype html><html><body style="margin:0;width:${size}px;height:${size}px;display:grid;place-items:center;background:${background ?? 'transparent'}">` +
      `<img id="i" src="${dataUrl}" width="${side}" height="${side}" style="display:block"></body></html>`,
  )
  await page.locator('#i').evaluate((img: HTMLImageElement) => img.decode())
  return page.screenshot({ omitBackground: !background, clip: { x: 0, y: 0, width: size, height: size } })
}

/** An .ico whose entries are PNGs (header 6 bytes, 16 per entry, then the images). */
function ico(images: { size: number; data: Buffer }[]): Buffer {
  const header = Buffer.alloc(6 + 16 * images.length)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2) // type: icon
  header.writeUInt16LE(images.length, 4)
  let offset = header.length
  images.forEach(({ size, data }, i) => {
    const at = 6 + 16 * i
    header.writeUInt8(size >= 256 ? 0 : size, at) // width (0 = 256)
    header.writeUInt8(size >= 256 ? 0 : size, at + 1) // height
    header.writeUInt8(0, at + 2) // palette
    header.writeUInt8(0, at + 3) // reserved
    header.writeUInt16LE(1, at + 4) // color planes
    header.writeUInt16LE(32, at + 6) // bits per pixel
    header.writeUInt32LE(data.length, at + 8)
    header.writeUInt32LE(offset, at + 12)
    offset += data.length
  })
  return Buffer.concat([header, ...images.map((i) => i.data)])
}

await mkdir(APP, { recursive: true })
await mkdir(PUBLIC, { recursive: true })

const written: string[] = []
const save = async (path: string, data: Buffer) => {
  await writeFile(path, data)
  written.push(`${path} (${data.length} B)`)
}

const entries: { size: number; data: Buffer }[] = []
for (const size of [16, 32, 48]) entries.push({ size, data: await png(size) })
await save(`${APP}/favicon.ico`, ico(entries))
await save(`${APP}/icon.png`, await png(512))
await save(`${APP}/apple-icon.png`, await png(180, 0.8, BG))
await save(`${PUBLIC}/icon-192.png`, await png(192))
await save(`${PUBLIC}/icon-512.png`, await png(512))
await save(`${PUBLIC}/icon-maskable-512.png`, await png(512, 0.6, BG))

await browser.close()
console.log(`Derived from ${SRC}:\n  ${written.join('\n  ')}`)
