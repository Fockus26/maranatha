// Hallazgo 5: con el panel lateral de Agenda abierto, el aviso de error (Snackbar) queda
// dentro de un ancestro aria-hidden="true" (MUI oculta todo lo de fuera del modal): el
// lector de pantalla no anuncia por qué no se guardó (WCAG 4.1.3).
// Se provoca un error quitando las cookies de sesión antes de guardar.
// Uso: node --env-file=.env.test.local .qa/repro/5-aviso-oculto-con-panel.mjs http://localhost:4301
import { chromium } from "@playwright/test";

const BASE = (process.argv[2] || "http://localhost:4301").replace(/\/$/, "");
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const p = await ctx.newPage();
await p.goto(`${BASE}/dashboard/login`, { waitUntil: "load", timeout: 300000 });
await p.getByLabel("Correo electrónico").waitFor({ timeout: 120000 });
await p.waitForTimeout(1500);
await p.getByLabel("Correo electrónico").fill(process.env.ADMIN_EMAIL_TEST ?? "");
await p.locator("input[type=password]").fill(process.env.ADMIN_PASSWORD_TEST ?? "");
await p.locator('button[type="submit"]').click();
await p.waitForURL((u) => !u.pathname.startsWith("/dashboard/login"), { timeout: 120000 });
await p.goto(`${BASE}/dashboard/agenda`, { waitUntil: "load" });
await p.getByRole("button", { name: "Nuevo evento" }).waitFor({ timeout: 120000 });
await p.waitForTimeout(1500);
await p.getByRole("button", { name: "Nuevo evento" }).click();
const d = p.getByRole("dialog", { name: "Nuevo evento" });
await d.waitFor();
await p.waitForTimeout(600);
await d.getByLabel("Nombre").fill("QA repro aviso");
await d.getByLabel("Lugar").fill("Templo");
await ctx.clearCookies();
await d.getByRole("button", { name: "Crear evento" }).click();
await p.waitForTimeout(4000);
const r = await p.evaluate(() => {
  const s = document.querySelector(".MuiSnackbar-root");
  if (!s) return { text: null };
  let hidden = false;
  for (let e = s; e; e = e.parentElement) if (e.getAttribute?.("aria-hidden") === "true" || e.hasAttribute?.("inert")) hidden = true;
  return { text: s.innerText.trim(), hidden, drawerOpen: !!document.querySelector(".MuiDrawer-paper") };
});
await browser.close();
if (!r.text) console.log("FAIL no apareció ningún aviso tras el error");
else if (r.drawerOpen && r.hidden) console.log(`FAIL aviso "${r.text}" dentro de aria-hidden con el panel abierto`);
else console.log("PASS");
