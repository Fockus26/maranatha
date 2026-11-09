/**
 * Capa de datos contra un Postgres real (D082). Opt-in: solo corre con
 * TEST_DATABASE_URL apuntando a una base de QA local, nunca al VPS.
 *
 *   node scripts/qa-local.ts --port 4371 --db-only     # imprime la URL
 *   TEST_DATABASE_URL=postgresql://qa_app:qa_app@127.0.0.1:<p>/qa_4371 bun run test:db
 *
 * Escribe filas con correos @db-test.example y las borra al final.
 */
import { afterAll, beforeAll, describe, expect, mock, test } from "bun:test";

const url = process.env.TEST_DATABASE_URL ?? "";
const local = /@(127\.0\.0\.1|localhost):\d+\//.test(url);

mock.module("server-only", () => ({}));
mock.module("next/headers", () => ({
  headers: async () => new Headers({ "x-forwarded-for": "203.0.113.7" }),
}));

describe.skipIf(!local)("D082 · capa de datos sobre Postgres", async () => {
  process.env.DATABASE_URL = url;
  process.env.BETTER_AUTH_SECRET = "db-test-secret";
  const repo = await import("@/lib/payments/repository");
  const receipts = await import("@/lib/payments/receipts");
  const rate = await import("@/lib/payments/rateLimit");
  const agenda = await import("@/lib/agenda/repository");
  const { db } = await import("@/lib/db");
  const { sql } = await import("drizzle-orm");

  const EMAIL = "donante@db-test.example";
  const cleanup = async () => {
    await db().execute(
      sql`delete from public.payments where donor_email = ${EMAIL}`,
    );
    await db().execute(
      sql`delete from public.rate_limit_hits where key like 'dbtest%' or key like 'login-fail:%'`,
    );
    await db().execute(
      sql`delete from public.agenda_events where title like 'DB test%'`,
    );
  };
  beforeAll(cleanup);
  afterAll(cleanup);

  const manual = {
    purpose: "diezmo" as const,
    frequency: "once" as const,
    amount_usd: 12.5,
    amount_paid: 4500.25,
    currency: "VES" as const,
    exchange_rate: 360.02,
    method: "pagomovil" as const,
    donor_name: "Donante de prueba",
    donor_email: EMAIL,
    reference: "0102-99 88",
    paid_at: "2026-11-08",
  };

  test("insertar, leer y la referencia duplicada (normalizada) se rechaza", async () => {
    const created = await repo.insertPayment(manual);
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect(created.data.amount_usd).toBe(12.5);
    expect(created.data.status).toBe("pending");

    const dup = await repo.insertPayment({ ...manual, reference: "010299.88" });
    expect(dup).toEqual({ ok: false, error: "duplicate_reference" });

    const read = await repo.getPayment(created.data.id);
    expect(read.ok && read.data.reference).toBe("0102-99 88");
    expect(await repo.countRecentPendingByEmail(EMAIL)).toBe(1);
  });

  test("transición atómica: la segunda confirmación no pisa la primera", async () => {
    const created = await repo.insertPayment({
      ...manual,
      reference: "T-0001",
    });
    if (!created.ok) throw new Error("insert");
    const first = await repo.transitionPayment(created.data.id, "confirmed", {
      confirmed_by: "admin@db-test.example",
    });
    expect(first.ok && first.data.confirmed_at).toBeTruthy();
    // El trigger movió updated_at.
    expect(first.ok && first.data.updated_at !== created.data.updated_at).toBe(
      true,
    );
    const second = await repo.transitionPayment(created.data.id, "rejected");
    expect(second).toEqual({ ok: false, error: "invalid_state" });
  });

  test("listado paginado con total, y página fuera de rango vacía", async () => {
    const page = await repo.listPayments({ status: "pending", pageSize: 1 });
    expect(page.ok && page.data.rows.length).toBe(1);
    expect(page.ok && page.data.total).toBeGreaterThanOrEqual(1);
    const far = await repo.listPayments({ page: 9999 });
    expect(far.ok && far.data.rows).toEqual([]);
  });

  test("KPIs del mes y recaudado por proyecto", async () => {
    const stats = await repo.getPaymentStats();
    expect(stats.ok).toBe(true);
    const raised = await repo.getRaisedBySlug();
    expect(raised instanceof Map).toBe(true);
  });

  test("ajustes: upsert de jsonb", async () => {
    const before = await repo.getSetting("dbtest_rates");
    expect(before).toBeNull();
    await repo.setSetting("dbtest_rates", { VES: 360.5, lista: [1, 2] });
    await repo.setSetting("dbtest_rates", { VES: 361 });
    expect(await repo.getSetting<{ VES: number }>("dbtest_rates")).toEqual({
      VES: 361,
    });
    await db().execute(
      sql`delete from public.settings where key = 'dbtest_rates'`,
    );
  });

  test("comprobante: se guarda, se lee igual y se borra", async () => {
    const png = new Uint8Array([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3,
    ]);
    const up = await receipts.uploadReceipt(new File([png], "x.png"));
    expect(up.ok).toBe(true);
    if (!up.ok) return;
    const got = await receipts.getReceipt(up.path);
    expect(got?.mime).toBe("image/png");
    expect([...(got?.bytes ?? [])]).toEqual([...png]);
    await receipts.deleteReceipt(up.path);
    expect(await receipts.getReceipt(up.path)).toBeNull();
    const svg = await receipts.uploadReceipt(new File(["<svg/>"], "x.png"));
    expect(svg).toEqual({ ok: false, error: "invalid_receipt" });
  });

  test("rate limit por IP: corta en el máximo", async () => {
    const results: boolean[] = [];
    for (let i = 0; i < 4; i++)
      results.push(await rate.hitRateLimit("dbtest", 3, 60));
    expect(results).toEqual([true, true, true, false]);
  });

  test("fallos de login por cuenta: bloquea al quinto y un acierto limpia", async () => {
    const email = "Admin@db-test.example";
    for (let i = 0; i < rate.LOGIN_FAILURES_MAX - 1; i++)
      await rate.recordLoginFailure(email);
    expect(await rate.isAccountLocked(email)).toBe(false);
    await rate.recordLoginFailure("admin@db-test.example");
    expect(await rate.isAccountLocked(email)).toBe(true);
    await rate.clearLoginFailures(email);
    expect(await rate.isAccountLocked(email)).toBe(false);
  });

  test("agenda: crear, editar, borrar; un evento pasado no sale en el home", async () => {
    const created = await agenda.insertAgendaEvent({
      kind: "one_time",
      eventDate: "2020-01-05",
      startTime: "18:30",
      title: "DB test viejo",
      location: "Templo",
    });
    expect(created.ok && created.data.startTime).toBe("18:30");
    if (!created.ok) return;
    const updated = await agenda.updateAgendaEvent(created.data.id, {
      kind: "recurring",
      weekday: 2,
      startTime: "07:00",
      title: "DB test semanal",
      location: "Templo",
    });
    expect(updated.ok && updated.data.eventDate).toBeNull();
    const home = await agenda.getPublicAgendaEvents();
    expect(home.some((e) => e.title === "DB test semanal")).toBe(true);
    expect(await agenda.deleteAgendaEvent(created.data.id)).toEqual({
      ok: true,
      data: null,
    });
    expect(await agenda.deleteAgendaEvent(created.data.id)).toEqual({
      ok: false,
      error: "not_found",
    });
  });
});
