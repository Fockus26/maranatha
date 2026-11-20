// Hallazgo 2: las navegaciones programáticas (router.push) no muestran la barra de
// carga: "Ver proyecto" en /proyectos (components/sections/Projects.tsx tiene el mismo patrón, hoy fuera de la home).
// Clase: grep -rnE "router\.(push|replace)\(" components app
// Uso: node .qa/repro/2-barra-router-push.mjs http://localhost:4301
import { chromium } from "@playwright/test";

const BASE = (process.argv[2] || "http://localhost:4301").replace(/\/$/, "");
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
const fails = [];
async function sawBar(click) {
  const watcher = page.evaluate(() => new Promise((res) => {
    const t0 = performance.now();
    const id = setInterval(() => {
      if (document.querySelector('[role=progressbar][aria-label="Cargando página"]')) { clearInterval(id); res(true); }
      else if (performance.now() - t0 > 3000) { clearInterval(id); res(false); }
    }, 10);
  })).catch(() => "nav");
  await click();
  return watcher;
}
for (const [route, label] of [["/proyectos", "Ver proyecto (/proyectos)"]]) {
  await page.goto(`${BASE}${route}`, { waitUntil: "load", timeout: 300000 });
  await page.waitForTimeout(3000);
  const btn = page.getByRole("button", { name: /Ver proyecto/i }).first();
  if (!(await btn.count())) { fails.push(`${label}: no se encontró el botón`); continue; }
  await btn.scrollIntoViewIfNeeded();
  const before = page.url();
  const saw = await sawBar(() => btn.click());
  await page.waitForURL((u) => u.href !== before, { timeout: 120000 }).catch(() => {});
  if (saw !== true) fails.push(`${label}: sin barra (${saw}) al navegar a ${new URL(page.url()).pathname}`);
}
await browser.close();
console.log(fails.length ? `FAIL ${fails.join("; ")}` : "PASS");
