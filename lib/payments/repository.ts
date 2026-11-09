import "server-only";
import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  inArray,
  isNotNull,
  isNull,
  ne,
  type SQL,
  sql,
} from "drizzle-orm";
import { db, isDbConfigured, pgErrorCode, UNIQUE_VIOLATION } from "@/lib/db";
import { payments, projectRaised, settings } from "@/lib/db/schema";
import type {
  PaymentCurrency,
  PaymentFrequency,
  PaymentMethodId,
  PaymentPurpose,
  PaymentStatus,
  Result,
} from "./schema";

/**
 * Acceso a la tabla `payments` (`lib/db/schema.ts`, Postgres del VPS).
 * Solo servidor. Toda función devuelve un `Result` — los errores esperados
 * (duplicado, no encontrado) se modelan; lo inesperado se registra en el
 * servidor y sale como `db_error` sin detalles internos.
 *
 * La forma de `PaymentRow` (snake_case, fechas ISO, montos number) es la que
 * tenía con Supabase: el resto del código no cambió con la migración (D082).
 */

export interface PaymentRow {
  id: string;
  created_at: string;
  updated_at: string;
  purpose: PaymentPurpose;
  project_slug: string | null;
  frequency: PaymentFrequency;
  amount_usd: number;
  amount_paid: number | null;
  currency: PaymentCurrency;
  exchange_rate: number | null;
  method: PaymentMethodId;
  status: PaymentStatus;
  donor_name: string;
  donor_email: string;
  reference: string | null;
  paid_at: string | null;
  receipt_path: string | null;
  provider_order_id: string | null;
  provider_capture_id: string | null;
  provider_subscription_id: string | null;
  confirmed_at: string | null;
  confirmed_by: string | null;
  notes: string | null;
}

export interface NewPayment {
  purpose: PaymentPurpose;
  project_slug?: string | null;
  frequency: PaymentFrequency;
  amount_usd: number;
  amount_paid?: number | null;
  currency: PaymentCurrency;
  exchange_rate?: number | null;
  method: PaymentMethodId;
  donor_name: string;
  donor_email: string;
  reference?: string | null;
  paid_at?: string | null;
  receipt_path?: string | null;
  provider_order_id?: string | null;
  provider_capture_id?: string | null;
  provider_subscription_id?: string | null;
  /** Solo para cobros recurrentes que ya llegan confirmados por PayPal. */
  status?: PaymentStatus;
  confirmed_at?: string | null;
  confirmed_by?: string | null;
  notes?: string | null;
}

export type RepoError =
  | "not_configured"
  | "duplicate_reference"
  | "not_found"
  | "invalid_state"
  | "db_error";

type PaymentSelect = typeof payments.$inferSelect;
type PaymentInsert = typeof payments.$inferInsert;
type PaymentPatch = Partial<
  Omit<PaymentRow, "id" | "created_at" | "updated_at">
>;

function logDbError(where: string, error: unknown) {
  console.error(`[payments] ${where}:`, error);
}

function fail<T>(where: string, error: unknown): Result<T, RepoError> {
  if (pgErrorCode(error) === UNIQUE_VIOLATION)
    return { ok: false, error: "duplicate_reference" };
  logDbError(where, error);
  return { ok: false, error: "db_error" };
}

const iso = (d: Date | null) => (d ? d.toISOString() : null);
const num = (v: string | null) => (v === null ? null : Number(v));

/** Fila de Drizzle → la forma de siempre (numeric llega como string). */
export function toPaymentRow(r: PaymentSelect): PaymentRow {
  return {
    id: r.id,
    created_at: r.createdAt.toISOString(),
    updated_at: r.updatedAt.toISOString(),
    purpose: r.purpose as PaymentPurpose,
    project_slug: r.projectSlug,
    frequency: r.frequency as PaymentFrequency,
    amount_usd: Number(r.amountUsd),
    amount_paid: num(r.amountPaid),
    currency: r.currency as PaymentCurrency,
    exchange_rate: num(r.exchangeRate),
    method: r.method as PaymentMethodId,
    status: r.status as PaymentStatus,
    donor_name: r.donorName,
    donor_email: r.donorEmail,
    reference: r.reference,
    paid_at: r.paidAt,
    receipt_path: r.receiptPath,
    provider_order_id: r.providerOrderId,
    provider_capture_id: r.providerCaptureId,
    provider_subscription_id: r.providerSubscriptionId,
    confirmed_at: iso(r.confirmedAt),
    confirmed_by: r.confirmedBy,
    notes: r.notes,
  };
}

const numStr = (v: number | null | undefined) =>
  v === undefined ? undefined : v === null ? null : String(v);
const toDate = (v: string | null | undefined) =>
  v === undefined ? undefined : v === null ? null : new Date(v);

/** La forma de siempre → columnas de Drizzle. Las claves ausentes no se tocan. */
export function toPaymentColumns(p: PaymentPatch): Partial<PaymentInsert> {
  const out: Partial<PaymentInsert> = {
    purpose: p.purpose,
    projectSlug: p.project_slug,
    frequency: p.frequency,
    amountUsd: numStr(p.amount_usd) ?? undefined,
    amountPaid: numStr(p.amount_paid),
    currency: p.currency,
    exchangeRate: numStr(p.exchange_rate),
    method: p.method,
    status: p.status,
    donorName: p.donor_name,
    donorEmail: p.donor_email,
    reference: p.reference,
    paidAt: p.paid_at,
    receiptPath: p.receipt_path,
    providerOrderId: p.provider_order_id,
    providerCaptureId: p.provider_capture_id,
    providerSubscriptionId: p.provider_subscription_id,
    confirmedAt: toDate(p.confirmed_at),
    confirmedBy: p.confirmed_by,
    notes: p.notes,
  };
  for (const k of Object.keys(out) as (keyof PaymentInsert)[])
    if (out[k] === undefined) delete out[k];
  return out;
}

export async function insertPayment(
  payment: NewPayment,
): Promise<Result<PaymentRow, RepoError>> {
  if (!isDbConfigured()) return { ok: false, error: "not_configured" };
  try {
    const [row] = await db()
      .insert(payments)
      .values(toPaymentColumns(payment) as PaymentInsert)
      .returning();
    return { ok: true, data: toPaymentRow(row) };
  } catch (error) {
    return fail("insertPayment", error);
  }
}

async function getOneBy(
  where: SQL | undefined,
  label: string,
): Promise<Result<PaymentRow, RepoError>> {
  if (!isDbConfigured()) return { ok: false, error: "not_configured" };
  try {
    const [row] = await db().select().from(payments).where(where).limit(1);
    if (!row) return { ok: false, error: "not_found" };
    return { ok: true, data: toPaymentRow(row) };
  } catch (error) {
    return fail(label, error);
  }
}

export async function getPayment(
  id: string,
): Promise<Result<PaymentRow, RepoError>> {
  return getOneBy(eq(payments.id, id), "getPayment");
}

export async function getPaymentByOrderId(
  orderId: string,
): Promise<Result<PaymentRow, RepoError>> {
  return getOneBy(eq(payments.providerOrderId, orderId), "getPaymentByOrderId");
}

export async function getPaymentByCaptureId(
  captureId: string,
): Promise<Result<PaymentRow, RepoError>> {
  return getOneBy(
    eq(payments.providerCaptureId, captureId),
    "getPaymentByCaptureId",
  );
}

export async function updatePayment(
  id: string,
  patch: PaymentPatch,
): Promise<Result<PaymentRow, RepoError>> {
  if (!isDbConfigured()) return { ok: false, error: "not_configured" };
  try {
    const [row] = await db()
      .update(payments)
      .set(toPaymentColumns(patch))
      .where(eq(payments.id, id))
      .returning();
    if (!row) return { ok: false, error: "not_found" };
    return { ok: true, data: toPaymentRow(row) };
  } catch (error) {
    return fail("updatePayment", error);
  }
}

/**
 * Borra un checkout que nunca llegó a la pasarela: pendiente y sin orden ni
 * suscripción enlazada. Si la pasarela rechazó crear la orden (credenciales
 * malas, caída, bloqueo geográfico), dejarlo como `cancelled` llenaba
 * "Cancelados" con una fila por intento. Devuelve false si no borró nada.
 */
export async function deleteUnsentPayment(id: string): Promise<boolean> {
  if (!isDbConfigured()) return false;
  try {
    const rows = await db()
      .delete(payments)
      .where(
        and(
          eq(payments.id, id),
          eq(payments.status, "pending"),
          isNull(payments.providerOrderId),
          isNull(payments.providerSubscriptionId),
        ),
      )
      .returning({ id: payments.id });
    return rows.length > 0;
  } catch (error) {
    logDbError("deleteUnsentPayment", error);
    return false;
  }
}

/**
 * Cambia el estado solo si el pago está en uno de los estados de origen
 * permitidos (por defecto, solo `pending`) — condición en el propio UPDATE,
 * así dos confirmaciones simultáneas (webhook + retorno, o dos admins) no se
 * pisan: la segunda no encuentra fila y recibe `invalid_state`.
 */
export async function transitionPayment(
  id: string,
  to: Exclude<PaymentStatus, "pending">,
  extra: Partial<
    Pick<
      PaymentRow,
      "confirmed_by" | "notes" | "provider_capture_id" | "amount_paid"
    >
  > = {},
  from: PaymentStatus[] = ["pending"],
): Promise<Result<PaymentRow, RepoError>> {
  if (!isDbConfigured()) return { ok: false, error: "not_configured" };

  const patch: PaymentPatch = { status: to, ...extra };
  if (to === "confirmed") patch.confirmed_at = new Date().toISOString();

  try {
    const [row] = await db()
      .update(payments)
      .set(toPaymentColumns(patch))
      .where(and(eq(payments.id, id), inArray(payments.status, from)))
      .returning();
    if (!row) return { ok: false, error: "invalid_state" };
    return { ok: true, data: toPaymentRow(row) };
  } catch (error) {
    return fail("transitionPayment", error);
  }
}

export interface ListPaymentsFilter {
  status?: PaymentStatus;
  method?: PaymentMethodId;
  /** Excluye un método (ej. checkouts de PayPal sin completar en "pendientes"). */
  excludeMethod?: PaymentMethodId;
  /** Página (desde 0) de `pageSize` filas. */
  page?: number;
  pageSize?: number;
}

export const PAYMENTS_PAGE_SIZE = 50;

export interface PaymentsPage {
  rows: PaymentRow[];
  /** Total de filas del filtro, no solo las de esta página. */
  total: number;
}

function filterWhere(filter: ListPaymentsFilter): SQL | undefined {
  return and(
    filter.status ? eq(payments.status, filter.status) : undefined,
    filter.method ? eq(payments.method, filter.method) : undefined,
    filter.excludeMethod
      ? ne(payments.method, filter.excludeMethod)
      : undefined,
  );
}

export async function listPayments(
  filter: ListPaymentsFilter = {},
): Promise<Result<PaymentsPage, RepoError>> {
  if (!isDbConfigured()) return { ok: false, error: "not_configured" };

  const pageSize = filter.pageSize ?? PAYMENTS_PAGE_SIZE;
  const offset = Math.max(0, filter.page ?? 0) * pageSize;
  const where = filterWhere(filter);
  // El total deja al panel decir "51–100 de 232". Una página después de la
  // última (ej. se confirmó el único pendiente) sale vacía con su total.
  try {
    const [rows, [{ total }]] = await Promise.all([
      db()
        .select()
        .from(payments)
        .where(where)
        .orderBy(desc(payments.createdAt), desc(payments.id))
        .limit(pageSize)
        .offset(offset),
      db().select({ total: count() }).from(payments).where(where),
    ]);
    return { ok: true, data: { rows: rows.map(toPaymentRow), total } };
  } catch (error) {
    return fail("listPayments", error);
  }
}

/**
 * Pagos pendientes (manuales, o checkouts de una pasarela sin completar) de un
 * mismo correo en la última hora — freno básico contra spam del formulario
 * público, además del rate limit por IP. Si falla la consulta se devuelve 0:
 * no se bloquea a un donante real por un error de infraestructura.
 */
export async function countRecentPendingByEmail(
  email: string,
  kind: "manual" | "paypal" | "binance" = "manual",
): Promise<number> {
  if (!isDbConfigured()) return 0;
  const since = new Date(Date.now() - 60 * 60 * 1000);
  // Manual = con referencia reportada; pasarela = sin ella (PayPal siempre,
  // Binance cuando va por Binance Pay Merchant).
  const byKind =
    kind === "manual"
      ? isNotNull(payments.reference)
      : and(eq(payments.method, kind), isNull(payments.reference));
  try {
    const [{ n }] = await db()
      .select({ n: count() })
      .from(payments)
      .where(
        and(
          eq(payments.donorEmail, email.toLowerCase()),
          eq(payments.status, "pending"),
          gte(payments.createdAt, since),
          byKind,
        ),
      );
    return n;
  } catch (error) {
    logDbError("countRecentPendingByEmail", error);
    return 0;
  }
}

/** Recaudado confirmado por proyecto, en USD. Sin base → mapa vacío. */
export async function getRaisedBySlug(): Promise<Map<string, number>> {
  const raised = new Map<string, number>();
  if (!isDbConfigured()) return raised;
  try {
    const rows = await db()
      .select({
        slug: projectRaised.projectSlug,
        usd: projectRaised.raisedUsd,
      })
      .from(projectRaised);
    for (const row of rows) if (row.slug) raised.set(row.slug, Number(row.usd));
  } catch (error) {
    logDbError("getRaisedBySlug", error);
  }
  return raised;
}

export async function getSetting<T>(key: string): Promise<T | null> {
  if (!isDbConfigured()) return null;
  try {
    const [row] = await db()
      .select({ value: settings.value })
      .from(settings)
      .where(eq(settings.key, key))
      .limit(1);
    return (row?.value as T) ?? null;
  } catch (error) {
    logDbError("getSetting", error);
    return null;
  }
}

export async function setSetting(
  key: string,
  value: unknown,
): Promise<Result<null, RepoError>> {
  if (!isDbConfigured()) return { ok: false, error: "not_configured" };
  const updatedAt = new Date();
  try {
    await db()
      .insert(settings)
      .values({ key, value, updatedAt })
      .onConflictDoUpdate({
        target: settings.key,
        set: { value, updatedAt },
      });
    return { ok: true, data: null };
  } catch (error) {
    return fail("setSetting", error);
  }
}

export interface PaymentStats {
  pendingCount: number;
  confirmedThisMonthUsd: number;
  confirmedThisMonthCount: number;
}

/**
 * KPIs del panel de pagos: mes calendario en hora de Venezuela, sumado en la
 * base (función `payment_month_stats`, `drizzle/0001_*`).
 */
export async function getPaymentStats(): Promise<
  Result<PaymentStats, RepoError>
> {
  if (!isDbConfigured()) return { ok: false, error: "not_configured" };
  try {
    const result = await db().execute<{
      pending_count: string;
      confirmed_usd: string;
      confirmed_count: string;
    }>(sql`select * from public.payment_month_stats()`);
    const data = result.rows[0];
    if (!data) return { ok: false, error: "db_error" };
    return {
      ok: true,
      data: {
        pendingCount: Number(data.pending_count),
        confirmedThisMonthUsd: Number(data.confirmed_usd),
        confirmedThisMonthCount: Number(data.confirmed_count),
      },
    };
  } catch (error) {
    return fail("getPaymentStats", error);
  }
}

// ─── Suscripciones ──────────────────────────────────────────────────────

/** Fila original de la suscripción (la que se creó al iniciar el checkout). */
export async function getSubscriptionSignup(
  subscriptionId: string,
): Promise<Result<PaymentRow, RepoError>> {
  if (!isDbConfigured()) return { ok: false, error: "not_configured" };
  try {
    const [row] = await db()
      .select()
      .from(payments)
      .where(eq(payments.providerSubscriptionId, subscriptionId))
      .orderBy(asc(payments.createdAt))
      .limit(1);
    if (!row) return { ok: false, error: "not_found" };
    return { ok: true, data: toPaymentRow(row) };
  } catch (error) {
    return fail("getSubscriptionSignup", error);
  }
}

/**
 * Asocia el primer cobro de una suscripción a su fila original — solo si esa
 * fila todavía no tiene cobro asociado (condición dentro del UPDATE, así el
 * retorno y el webhook no se pisan). La confirma si seguía pendiente, y
 * completa `confirmed_at` en el mismo UPDATE si no lo tenía.
 */
export async function attachFirstSale(
  paymentId: string,
  saleId: string,
  amountPaid: number,
): Promise<Result<PaymentRow, RepoError>> {
  if (!isDbConfigured()) return { ok: false, error: "not_configured" };
  try {
    const [row] = await db()
      .update(payments)
      .set({
        providerCaptureId: saleId,
        amountPaid: String(amountPaid),
        status: "confirmed",
        confirmedBy: "paypal",
        confirmedAt: sql`coalesce(${payments.confirmedAt}, now())`,
      })
      .where(
        and(
          eq(payments.id, paymentId),
          isNull(payments.providerCaptureId),
          inArray(payments.status, ["pending", "confirmed", "cancelled"]),
        ),
      )
      .returning();
    if (!row) return { ok: false, error: "invalid_state" };
    return { ok: true, data: toPaymentRow(row) };
  } catch (error) {
    return fail("attachFirstSale", error);
  }
}
