// Guard de NavigationProgress (D095/D101): la barra aparece al navegar y nunca queda pegada.
// Uso: node scripts/qa/nav-progress.mjs http://localhost:4301   (node, no bun: Playwright)
import { chromium } from "@playwright/test";

const BASE = (process.argv[2] || "http://localhost:4301").replace(/\/$/, "");
const LIMIT = 2500; // ms tras el clic: la barra debe haberse completado/ido
const BAR = '[role=progressbar][aria-label="Cargando página"]';
const browser = await chromium.launch();
const fails = [];

async function newPage(opts = {}) {
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    ...opts,
  });
  return ctx.newPage();
}
const phase = (page) =>
  page.evaluate(
    (s) => document.querySelector(s)?.getAttribute("data-phase") ?? "none",
    BAR,
  );
// Ejecuta `action` y devuelve si la barra apareció y su fase a LIMIT ms.
async function run(page, action) {
  await page.evaluate((s) => {
    window.__sawBar = false;
    const id = setInterval(() => {
      if (document.querySelector(s)) window.__sawBar = true;
    }, 10);
    setTimeout(() => clearInterval(id), 6000);
  }, BAR);
  await action();
  await page.waitForTimeout(LIMIT);
  return {
    saw: await page.evaluate(() => window.__sawBar),
    end: await phase(page),
  };
}
async function load(page, path) {
  await page.goto(`${BASE}${path}`, { waitUntil: "load", timeout: 300000 });
  await page.waitForTimeout(3000);
}
const expectNoStuck = (label, r) =>
  r.end === "loading" && fails.push(`${label}: barra pegada en loading`);
const expectBar = (label, r) => {
  expectNoStuck(label, r);
  !r.saw && fails.push(`${label}: no apareció la barra`);
};
const expectNoBar = (label, r) =>
  r.saw && fails.push(`${label}: la barra apareció sin navegación`);

const page = await newPage();
await load(page, "/");
// Anclas en la misma página: sin barra y sin pegarse.
expectNoBar(
  "ancla #agenda",
  await run(page, () => page.locator('a[href="#agenda"]').first().click()),
);
await page.getByRole("link", { name: /Saltar al contenido/ }).focus();
expectNoBar(
  "saltar al contenido",
  await run(page, () => page.keyboard.press("Enter")),
);
// Enlace interno normal: barra y cierre a tiempo.
expectBar(
  "enlace /proyectos",
  await run(page, () => page.locator('a[href="/proyectos"]').first().click()),
);
await page.waitForURL(/\/proyectos$/, { timeout: 120000 });
// CTA de ProjectCard (antes router.push): barra.
const cta = page.locator('a[href^="/proyectos/"]').first();
expectBar("CTA de proyecto", await run(page, () => cta.click()));
// Atrás / adelante reales (entradas de Next): cierran a tiempo.
expectNoStuck("atrás", await run(page, () => page.goBack()));
expectNoStuck("adelante", await run(page, () => page.goForward()));
// Mismo enlace / externo _blank: sin barra.
await load(page, "/proyectos");
expectNoBar(
  "mismo enlace",
  await run(page, () => page.locator('a[href="/proyectos"]').first().click()),
);
await page.close();

// reduced-motion: barra llena, también se cierra.
const rm = await newPage({ reducedMotion: "reduce" });
await load(rm, "/");
expectBar(
  "reduced-motion /proyectos",
  await run(rm, () => rm.locator('a[href="/proyectos"]').first().click()),
);
await rm.close();

await browser.close();
console.log(fails.length ? `FAIL ${fails.join("; ")}` : "PASS");
process.exit(fails.length ? 1 : 0);
