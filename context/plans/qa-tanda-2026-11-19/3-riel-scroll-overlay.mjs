// Hallazgo 3 (clase): con un overlay de MUI abierto (body overflow:hidden) el
// `scrollbar-gutter: stable` de <html> (theme/globalStyles.ts) deja una franja vacía
// de 12 px a la derecha: el panel lateral no llega al borde y el backdrop del modal
// de ofrenda tampoco la cubre.
// Clase: cualquier Modal/Drawer/Dialog/Menu de MUI — grep -rnE "<(Drawer|Dialog|Modal|Popover|Menu)\b" components app
// Uso: node --env-file=.env.test.local .qa/repro/3-riel-scroll-overlay.mjs http://localhost:4301
import { chromium } from "@playwright/test";

const BASE = (process.argv[2] || "http://localhost:4301").replace(/\/$/, "");
const browser = await chromium.launch();
const fails = [];
const gap = (p, sel) => p.evaluate((s) => {
  const el = document.querySelector(s);
  return el ? innerWidth - el.getBoundingClientRect().right : null;
}, sel);

// Público: modal de ofrenda en / y /proyectos
const pub = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
for (const route of ["/", "/proyectos"]) {
  await pub.goto(BASE + route, { waitUntil: "load", timeout: 300000 });
  await pub.waitForTimeout(3000);
  await pub.getByRole("button", { name: "Ofrendar", exact: true }).first().click();
  await pub.getByRole("dialog").waitFor();
  await pub.waitForTimeout(800);
  const g = await gap(pub, ".MuiModal-root .MuiBackdrop-root");
  if (g !== 0) fails.push(`backdrop modal ofrenda ${route}: franja ${g}px`);
  await pub.keyboard.press("Escape");
  await pub.waitForTimeout(500);
}

// Panel: drawers de agenda y proyectos (con sesión admin)
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const p = await ctx.newPage();
await p.goto(`${BASE}/dashboard/login`, { waitUntil: "load", timeout: 300000 });
await p.getByLabel("Correo electrónico").waitFor({ timeout: 120000 });
await p.waitForTimeout(1500);
await p.getByLabel("Correo electrónico").fill(process.env.ADMIN_EMAIL_TEST ?? "");
await p.locator("input[type=password]").fill(process.env.ADMIN_PASSWORD_TEST ?? "");
await p.locator('button[type="submit"]').click();
await p.waitForURL((u) => !u.pathname.startsWith("/dashboard/login"), { timeout: 120000 });
for (const [route, btn] of [["/dashboard/agenda", "Nuevo evento"], ["/dashboard/proyectos", "Nuevo proyecto"]]) {
  await p.goto(BASE + route, { waitUntil: "load", timeout: 300000 });
  await p.getByRole("button", { name: btn }).waitFor({ timeout: 120000 });
  await p.waitForTimeout(1500);
  await p.getByRole("button", { name: btn }).click();
  await p.locator(".MuiDrawer-paper").waitFor();
  await p.waitForTimeout(800);
  const g = await gap(p, ".MuiDrawer-paper");
  if (g !== 0) fails.push(`drawer ${route}: franja ${g}px`);
  await p.keyboard.press("Escape");
  await p.waitForTimeout(500);
}
await browser.close();
console.log(fails.length ? `FAIL ${fails.join("; ")}` : "PASS");
