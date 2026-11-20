// Hallazgo 4: si la sesión se cerró en otra pestaña (cookie borrada), guardar desde el
// panel lateral de Agenda (o confirmar un pago) muestra "No hubo respuesta del servidor.
// Revisa tu conexión…" en vez de "Tu sesión expiró": el proxy redirige el POST de la
// Server Action al login y callAction lo toma como fallo de red.
// Uso: node --env-file=.env.test.local .qa/repro/4-sesion-cerrada-mensaje.mjs http://localhost:4301
import { chromium } from "@playwright/test";

const BASE = (process.argv[2] || "http://localhost:4301").replace(/\/$/, "");
const browser = await chromium.launch();
const fails = [];
async function freshAdmin() {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await ctx.newPage();
  await p.goto(`${BASE}/dashboard/login`, { waitUntil: "load", timeout: 300000 });
  await p.getByLabel("Correo electrónico").waitFor({ timeout: 120000 });
  await p.waitForTimeout(1500);
  await p.getByLabel("Correo electrónico").fill(process.env.ADMIN_EMAIL_TEST ?? "");
  await p.locator("input[type=password]").fill(process.env.ADMIN_PASSWORD_TEST ?? "");
  await p.locator('button[type="submit"]').click();
  await p.waitForURL((u) => !u.pathname.startsWith("/dashboard/login"), { timeout: 120000 });
  return { ctx, p };
}
const snackText = (p) => p.evaluate(() => document.querySelector(".MuiSnackbar-root")?.innerText ?? "");

// Agenda: crear evento con la sesión cerrada en otra pestaña
{
  const { ctx, p } = await freshAdmin();
  await p.goto(`${BASE}/dashboard/agenda`, { waitUntil: "load" });
  await p.getByRole("button", { name: "Nuevo evento" }).waitFor({ timeout: 120000 });
  await p.waitForTimeout(1500);
  await p.getByRole("button", { name: "Nuevo evento" }).click();
  const d = p.getByRole("dialog", { name: "Nuevo evento" });
  await d.waitFor();
  await p.waitForTimeout(600);
  await d.getByLabel("Nombre").fill("QA repro sesión");
  await d.getByLabel("Lugar").fill("Templo");
  const other = await ctx.newPage();
  await other.goto(`${BASE}/dashboard`, { waitUntil: "load" });
  await other.getByRole("button", { name: "Cerrar sesión" }).click();
  await other.waitForURL(/login/, { timeout: 60000 });
  await p.bringToFront();
  await d.getByRole("button", { name: "Crear evento" }).click();
  await p.waitForTimeout(4000);
  const t = await snackText(p);
  if (!/sesi[oó]n/i.test(t)) fails.push(`agenda: mensaje "${t.trim()}"`);
  await ctx.close();
}
await browser.close();
console.log(fails.length ? `FAIL ${fails.join("; ")}` : "PASS");
