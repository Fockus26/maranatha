/**
 * Chequeo automático de accesibilidad con axe-core (skill `a11y`, bloque 1).
 *
 * Cubre ~40% de los criterios WCAG — el resto es revisión manual. Corre
 * axe (tags wcag2a/2aa/21a/21aa) sobre las rutas públicas y de dashboard,
 * en modo claro y oscuro, y sale con código 1 si hay alguna violación.
 *
 * Uso:
 *   1. En otra terminal:  bun dev   (o `bun run start` tras `bun run build`)
 *   2. Acá:               node scripts/a11y-check.ts
 *      (opcional: BASE_URL=http://localhost:3001 node scripts/a11y-check.ts)
 *
 * Nota: se corre con `node` (Node 22+) y no con `bun` — el binario de
 * Playwright no conecta por pipe bajo bun en Windows.
 */

import AxeBuilder from "@axe-core/playwright";
import { chromium } from "playwright";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const ROUTES = [
  "/",
  "/proyectos",
  "/proyectos/techo-para-el-salon-multiusos",
  "/dashboard",
  "/dashboard/proyectos",
];
const MODES = ["light", "dark"] as const;

const browser = await chromium.launch();
let failed = false;

for (const mode of MODES) {
  const url = new URL(BASE);
  const context = await browser.newContext();
  await context.addCookies([
    { name: "color-mode", value: mode, domain: url.hostname, path: "/" },
  ]);
  console.log(`\n===== modo ${mode} =====`);

  for (const path of ROUTES) {
    const page = await context.newPage();
    try {
      await page.goto(BASE + path, {
        waitUntil: "domcontentloaded",
        timeout: 30_000,
      });
      await page.waitForTimeout(2000); // hidratación + store del dashboard
    } catch {
      console.log(
        `\n⚠️  No se pudo cargar ${path} — ¿está corriendo el server en ${BASE}?`,
      );
      await page.close();
      continue;
    }

    const { violations } = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    if (violations.length === 0) {
      console.log(`✅ ${path}`);
    } else {
      failed = true;
      console.log(`❌ ${path} — ${violations.length} tipo(s)`);
      for (const v of violations) {
        console.log(`  [${v.impact}] ${v.id} — ${v.help}`);
        for (const node of v.nodes) {
          console.log(`    → ${node.target.join(" ")}`);
          if (node.failureSummary)
            console.log(
              `      ${node.failureSummary.replace(/\n/g, "\n      ")}`,
            );
        }
      }
    }
    await page.close();
  }
  await context.close();
}

await browser.close();
process.exit(failed ? 1 : 0);
