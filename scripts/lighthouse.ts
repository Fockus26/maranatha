/**
 * Lighthouse sobre las rutas principales — accesibilidad, SEO, best
 * practices y performance. Imprime el puntaje de cada categoría y, debajo,
 * las auditorías que fallan (las "correcciones" que pide Lighthouse) con su
 * descripción. Guarda el reporte HTML/JSON completo en `.lighthouse/`.
 *
 * Uso:
 *   1. En otra terminal:  bun run build && bun run start
 *   2. Acá:               node scripts/lighthouse.ts
 *      Flags/env:
 *        --mobile              emula un móvil (por defecto: desktop)
 *        BASE_URL=http://...   otro host
 *        ROUTES=/,/proyectos   subconjunto de rutas (coma-separado)
 *                              (en git-bash: MSYS_NO_PATHCONV=1 ROUTES=...)
 *
 * Se corre con `node` (no `bun`): Lighthouse lanza Chrome vía chrome-launcher
 * y necesita Node.
 *
 * Sale con código 1 si accesibilidad o SEO no llegan a 100.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { launch } from "chrome-launcher";
import lighthouse from "lighthouse";
// El config por defecto de Lighthouse ya emula un móvil; para desktop se usa
// el preset que trae la librería.
import desktopConfig from "lighthouse/core/config/desktop-config.js";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const MOBILE = process.argv.includes("--mobile");
const ROUTES = (
  process.env.ROUTES ??
  "/,/proyectos,/proyectos/techo-para-el-salon-multiusos,/dashboard,/dashboard/proyectos"
).split(",");
const CATEGORIES = [
  "performance",
  "accessibility",
  "best-practices",
  "seo",
] as const;
const OUT_DIR = ".lighthouse";

mkdirSync(OUT_DIR, { recursive: true });

const chrome = await launch({
  chromeFlags: ["--headless=new", "--no-sandbox"],
});
let failed = false;

console.log(`\nLighthouse (${MOBILE ? "mobile" : "desktop"}) — ${BASE}\n`);

for (const route of ROUTES) {
  const url = BASE + route.trim();
  const runner = await lighthouse(
    url,
    { port: chrome.port, output: ["html", "json"], logLevel: "error" },
    MOBILE ? undefined : desktopConfig,
  );
  if (!runner) {
    console.log(`⚠️  ${route} — Lighthouse no devolvió resultado`);
    continue;
  }
  const { lhr, report } = runner;
  const slug = route.trim().replace(/[^\w]+/g, "_") || "root";
  writeFileSync(
    `${OUT_DIR}/${slug}.html`,
    Array.isArray(report) ? report[0] : report,
  );
  writeFileSync(
    `${OUT_DIR}/${slug}.json`,
    Array.isArray(report) ? report[1] : JSON.stringify(lhr, null, 2),
  );

  const scores = CATEGORIES.map((c) => {
    const s = lhr.categories[c]?.score;
    return `${c} ${s == null ? "—" : Math.round(s * 100)}`;
  }).join("  ·  ");
  console.log(`\n━━ ${route.trim()}  →  ${scores}`);

  for (const cat of CATEGORIES) {
    const category = lhr.categories[cat];
    if (!category) continue;
    const problems = category.auditRefs
      .map((ref) => lhr.audits[ref.id])
      .filter(
        (a) =>
          a &&
          a.score !== null &&
          a.score < 1 &&
          a.scoreDisplayMode !== "informative" &&
          a.scoreDisplayMode !== "manual" &&
          a.scoreDisplayMode !== "notApplicable",
      );

    if (problems.length === 0) continue;
    // El dashboard es `noindex` a propósito: su score de SEO no cuenta.
    const isPrivate = route.trim().startsWith("/dashboard");
    if (
      (cat === "accessibility" || (cat === "seo" && !isPrivate)) &&
      (category.score ?? 0) < 1
    )
      failed = true;

    console.log(`  ${cat}:`);
    for (const a of problems) {
      const items =
        a.details && "items" in a.details
          ? (a.details.items as unknown[]).length
          : 0;
      console.log(`    • ${a.title}${items ? ` (${items})` : ""}`);
      const desc = a.description
        .replace(/\s*\[.*?\]\(.*?\)/g, "")
        .replace(/\n/g, " ")
        .trim();
      if (desc) console.log(`      ${desc}`);
    }
  }
}

try {
  await chrome.kill();
} catch {
  // chrome-launcher a veces no puede borrar su carpeta temporal en Windows.
}
console.log(`\nReportes HTML en ./${OUT_DIR}/\n`);
process.exit(failed ? 1 : 0);
