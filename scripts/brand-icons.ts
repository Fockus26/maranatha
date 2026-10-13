/**
 * Genera los iconos rasterizados desde el símbolo del logo (D078).
 *
 * Uso (con node, no con bun: Playwright bajo Bun se cuelga en Windows):
 *   node scripts/brand-icons.ts          (= bun run brand:icons)
 *
 * Fuente única: `public/brand/logo-mark.svg`. Cuando llegue el logo real, se
 * reemplazan los SVG de `public/brand/` y se vuelve a correr este script.
 *
 * Salidas (se versionan; son derivadas, no se editan a mano):
 *   app/favicon.ico                     16 · 32 · 48 (PNG dentro del ICO)
 *   public/brand/apple-touch-icon.png   180×180, fondo navy opaco
 *   public/brand/icon-192.png           192×192
 *   public/brand/icon-512.png           512×512
 *   public/brand/icon-maskable-512.png  512×512, navy a sangre, símbolo en el 80 % central
 */
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium } from "playwright";

const ROOT = process.cwd();
const NAVY = "#101B45"; // primary[700] — el mismo del tile del símbolo

type Render = {
  size: number;
  // Fondo opaco detrás del símbolo; sin él, el PNG es transparente.
  background?: string;
  // Lado del símbolo dentro del lienzo, en px.
  mark: number;
};

function html(svg: string, { size, background, mark }: Render) {
  const dataUri = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
  return `<!doctype html><html><body style="margin:0">
<div style="width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;background:${background ?? "transparent"}">
<img src="${dataUri}" width="${mark}" height="${mark}" alt="">
</div></body></html>`;
}

function ico(pngs: { size: number; data: Buffer }[]) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2); // tipo: icono
  header.writeUInt16LE(pngs.length, 4);
  const entries: Buffer[] = [];
  let offset = 6 + 16 * pngs.length;
  for (const { size, data } of pngs) {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0);
    e.writeUInt8(size >= 256 ? 0 : size, 1);
    e.writeUInt16LE(1, 4); // planos
    e.writeUInt16LE(32, 6); // bits por píxel
    e.writeUInt32LE(data.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += data.length;
    entries.push(e);
  }
  return Buffer.concat([header, ...entries, ...pngs.map((p) => p.data)]);
}

async function main() {
  const svg = await readFile(join(ROOT, "public/brand/logo-mark.svg"), "utf8");
  const browser = await chromium.launch();
  const page = await browser.newPage({ deviceScaleFactor: 1 });

  async function render(r: Render) {
    await page.setViewportSize({ width: r.size, height: r.size });
    await page.setContent(html(svg, r));
    return page.screenshot({
      omitBackground: !r.background,
      clip: { x: 0, y: 0, width: r.size, height: r.size },
    });
  }

  const favicon = await Promise.all(
    [16, 32, 48].map(async (size) => ({
      size,
      data: await render({ size, mark: size }),
    })),
  );
  await writeFile(join(ROOT, "app/favicon.ico"), ico(favicon));

  // El tile del símbolo es del mismo navy que el fondo: queda solo la M y el
  // punto, centrados (iOS redondea las esquinas por su cuenta).
  const outputs: [string, Render][] = [
    ["apple-touch-icon.png", { size: 180, background: NAVY, mark: 154 }],
    ["icon-192.png", { size: 192, mark: 192 }],
    ["icon-512.png", { size: 512, mark: 512 }],
    // Símbolo a escala 5 (mark 320): su punto más lejano queda a
    // ~131 px del centro, dentro del círculo seguro de r 204,8.
    ["icon-maskable-512.png", { size: 512, background: NAVY, mark: 320 }],
  ];
  for (const [name, r] of outputs) {
    await writeFile(join(ROOT, "public/brand", name), await render(r));
  }

  await browser.close();
  console.log("Iconos generados desde public/brand/logo-mark.svg");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
