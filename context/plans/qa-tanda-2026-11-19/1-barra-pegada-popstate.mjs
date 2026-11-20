// Hallazgo 1: la barra de navegación (NavigationProgress) queda en "loading" ~10 s
// cuando hay un popstate sin cambio de ruta que lo cierre: anclas (#agenda, salto
// "Saltar al contenido") y atrás/adelante del navegador.
// Uso: node .qa/repro/1-barra-pegada-popstate.mjs http://localhost:4301
import { chromium } from "@playwright/test";

const BASE = (process.argv[2] || "http://localhost:4301").replace(/\/$/, "");
const LIMIT = 2000; // ms: la barra debe haberse ido (o completado) antes de esto
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
const phase = () => page.evaluate(() => document.querySelector('[role=progressbar][aria-label="Cargando página"]')?.getAttribute("data-phase") ?? "none");
const fails = [];
async function check(label) {
  await page.waitForTimeout(LIMIT);
  const p = await phase();
  if (p === "loading") fails.push(`${label}: barra en loading a ${LIMIT} ms`);
  await page.waitForTimeout(10500); // dejar que el timeout de 10 s la limpie antes del próximo caso
}

await page.goto(`${BASE}/`, { waitUntil: "load", timeout: 300000 });
await page.locator("section#ofrendar").waitFor({ timeout: 120000 });
await page.waitForTimeout(3000);
await page.locator('a[href="#agenda"]').first().click();
await check("ancla #agenda del navbar");
await page.getByRole("link", { name: /Saltar al contenido/ }).focus();
await page.keyboard.press("Enter");
await check("enlace 'Saltar al contenido'");
await page.locator('a[href="/proyectos"]').first().click();
await page.waitForURL(/\/proyectos$/, { timeout: 120000 });
await page.waitForTimeout(3000);
await page.goBack();
await check("atrás /proyectos → /");
await page.goForward();
await check("adelante / → /proyectos");
await browser.close();
console.log(fails.length ? `FAIL ${fails.join("; ")}` : "PASS");
