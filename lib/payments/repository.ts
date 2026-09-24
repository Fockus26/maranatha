import "server-only";
import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase/admin";
import type {
  PaymentCurrency,
  PaymentFrequency,
  PaymentMethodId,
  PaymentPurpose,
  PaymentStatus,
  Result,
} from "./schema";

/**
 * Acceso a la tabla `payments` (supabase/migrations/0001_payments.sql).
 * Solo servidor. Toda función devuelve un `Result` — los errores esperados
 * (duplicado, no encontrado) se modelan; lo inesperado se registra en el
 * servidor y sale como `db_error` sin detalles internos.
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

const UNIQUE_VIOLATION = "23505";

function logDbError(where: string, error: unknown) {
  console.error(`[payments] ${where}:`, error);
}

// Numeric de Postgres llega como string en PostgREST — se normaliza a number.
function normalize(row: Record<string, unknown>): PaymentRow {
  const toNum = (v: unknown) =>
    v === null || v === undefined ? null : Number(v);
  return {
    ...(row as unknown as PaymentRow),
    amount_usd: Number(row.amount_usd),
    amount_paid: toNum(row.amount_paid),
    exchange_rate: toNum(row.exchange_rate),
  };
}

export async function insertPayment(
  payment: NewPayment,
): Promise<Result<PaymentRow, RepoError>> {
  if (!isSupabaseConfigured()) return { ok: false, error: "not_configured" };

  const { data, error } = await supabaseAdmin()
    .from("payments")
    .insert(payment)
    .select()
    .single();
  if (error) {
    if (error.code === UNIQUE_VIOLATION)
      return { ok: false, error: "duplicate_reference" };
    logDbError("insertPayment", error);
    return { ok: false, error: "db_error" };
  }
  return { ok: true, data: normalize(data) };
}

export async function getPayment(
  id: string,
): Promise<Result<PaymentRow, RepoError>> {
  if (!isSupabaseConfigured()) return { ok: false, error: "not_configured" };

  const { data, error } = await supabaseAdmin()
    .from("payments")
    .select()
    .eq("id", id)
    .maybeSingle();
  if (error) {
    logDbError("getPayment", error);
    return { ok: false, error: "db_error" };
  }
  if (!data) return { ok: false, error: "not_found" };
  return { ok: true, data: normalize(data) };
}

export async function getPaymentByOrderId(
  orderId: string,
): Promise<Result<PaymentRow, RepoError>> {
  if (!isSupabaseConfigured()) return { ok: false, error: "not_configured" };

  const { data, error } = await supabaseAdmin()
    .from("payments")
    .select()
    .eq("provider_order_id", orderId)
    .maybeSingle();
  if (error) {
    logDbError("getPaymentByOrderId", error);
    return { ok: false, error: "db_error" };
  }
  if (!data) return { ok: false, error: "not_found" };
  return { ok: true, data: normalize(data) };
}

export async function updatePayment(
  id: string,
  patch: Partial<Omit<PaymentRow, "id" | "created_at" | "updated_at">>,
): Promise<Result<PaymentRow, RepoError>> {
  if (!isSupabaseConfigured()) return { ok: false, error: "not_configured" };

  const { data, error } = await supabaseAdmin()
    .from("payments")
    .update(patch)
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) {
    if (error.code === UNIQUE_VIOLATION)
      return { ok: false, error: "duplicate_reference" };
    logDbError("updatePayment", error);
    return { ok: false, error: "db_error" };
  }
  if (!data) return { ok: false, error: "not_found" };
  return { ok: true, data: normalize(data) };
}

/**
 * Cambia el estado solo si el pago sigue `pending` — condición en el propio
 * UPDATE, así dos confirmaciones simultáneas (webhook + retorno, o dos admins)
 * no se pisan: la segunda no encuentra fila y recibe `invalid_state`.
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
): Promise<Result<PaymentRow, RepoError>> {
  if (!isSupabaseConfigured()) return { ok: false, error: "not_configured" };

  const patch: Record<string, unknown> = { status: to, ...extra };
  if (to === "confirmed") patch.confirmed_at = new Date().toISOString();

  const { data, error } = await supabaseAdmin()
    .from("payments")
    .update(patch)
    .eq("id", id)
    .eq("status", "pending")
    .select()
    .maybeSingle();
  if (error) {
    if (error.code === UNIQUE_VIOLATION)
      return { ok: false, error: "duplicate_reference" };
    logDbError("transitionPayment", error);
    return { ok: false, error: "db_error" };
  }
  if (!data) return { ok: false, error: "invalid_state" };
  return { ok: true, data: normalize(data) };
}

export interface ListPaymentsFilter {
  status?: PaymentStatus;
  method?: PaymentMethodId;
  /** Excluye un método (ej. checkouts de PayPal sin completar en "pendientes"). */
  excludeMethod?: PaymentMethodId;
  limit?: number;
}

export async function listPayments(
  filter: ListPaymentsFilter = {},
): Promise<Result<PaymentRow[], RepoError>> {
  if (!isSupabaseConfigured()) return { ok: false, error: "not_configured" };

  let query = supabaseAdmin()
    .from("payments")
    .select()
    .order("created_at", { ascending: false })
    .limit(filter.limit ?? 200);
  if (filter.status) query = query.eq("status", filter.status);
  if (filter.method) query = query.eq("method", filter.method);
  if (filter.excludeMethod) query = query.neq("method", filter.excludeMethod);

  const { data, error } = await query;
  if (error) {
    logDbError("listPayments", error);
    return { ok: false, error: "db_error" };
  }
  return { ok: true, data: data.map(normalize) };
}

/**
 * Pagos pendientes (manuales, o checkouts de PayPal sin completar) de un
 * mismo correo en la última hora — freno básico contra spam del formulario público (no hay Redis para un rate limit
 * por IP). Si falla la consulta se devuelve 0: no se bloquea a un donante
 * real por un error de infraestructura.
 */
export async function countRecentPendingByEmail(
  email: string,
  kind: "manual" | "paypal" = "manual",
): Promise<number> {
  if (!isSupabaseConfigured()) return 0;
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const base = supabaseAdmin()
    .from("payments")
    .select("id", { count: "exact", head: true })
    .eq("donor_email", email.toLowerCase())
    .eq("status", "pending")
    .gte("created_at", since);
  const { count, error } = await (kind === "manual"
    ? base.neq("method", "paypal")
    : base.eq("method", "paypal"));
  if (error) {
    logDbError("countRecentPendingByEmail", error);
    return 0;
  }
  return count ?? 0;
}

/** Recaudado confirmado por proyecto, en USD. Sin Supabase → mapa vacío. */
export async function getRaisedBySlug(): Promise<Map<string, number>> {
  const raised = new Map<string, number>();
  if (!isSupabaseConfigured()) return raised;

  const { data, error } = await supabaseAdmin()
    .from("project_raised")
    .select("project_slug, raised_usd");
  if (error) {
    logDbError("getRaisedBySlug", error);
    return raised;
  }
  for (const row of data)
    raised.set(row.project_slug as string, Number(row.raised_usd));
  return raised;
}

export async function getSetting<T>(key: string): Promise<T | null> {
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await supabaseAdmin()
    .from("settings")
    .select("value")
    .eq("key", key)
    .maybeSingle();
  if (error) {
    logDbError("getSetting", error);
    return null;
  }
  return (data?.value as T) ?? null;
}

export async function setSetting(
  key: string,
  value: unknown,
): Promise<Result<null, RepoError>> {
  if (!isSupabaseConfigured()) return { ok: false, error: "not_configured" };
  const { error } = await supabaseAdmin()
    .from("settings")
    .upsert({ key, value, updated_at: new Date().toISOString() });
  if (error) {
    logDbError("setSetting", error);
    return { ok: false, error: "db_error" };
  }
  return { ok: true, data: null };
}

export interface PaymentStats {
  pendingCount: number;
  confirmedThisMonthUsd: number;
  confirmedThisMonthCount: number;
}

/** KPIs del panel de pagos. Mes calendario en UTC. */
export async function getPaymentStats(): Promise<
  Result<PaymentStats, RepoError>
> {
  if (!isSupabaseConfigured()) return { ok: false, error: "not_configured" };

  const now = new Date();
  const monthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  ).toISOString();

  const [pending, confirmed] = await Promise.all([
    supabaseAdmin()
      .from("payments")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending")
      // Un PayPal "pending" es un checkout sin completar, no algo a verificar.
      .neq("method", "paypal"),
    supabaseAdmin()
      .from("payments")
      .select("amount_usd")
      .eq("status", "confirmed")
      .gte("confirmed_at", monthStart),
  ]);
  if (pending.error || confirmed.error) {
    logDbError("getPaymentStats", pending.error ?? confirmed.error);
    return { ok: false, error: "db_error" };
  }
  return {
    ok: true,
    data: {
      pendingCount: pending.count ?? 0,
      confirmedThisMonthUsd: confirmed.data.reduce(
        (sum, row) => sum + Number(row.amount_usd),
        0,
      ),
      confirmedThisMonthCount: confirmed.data.length,
    },
  };
}

export async function getPaymentByCaptureId(
  captureId: string,
): Promise<Result<PaymentRow, RepoError>> {
  if (!isSupabaseConfigured()) return { ok: false, error: "not_configured" };

  const { data, error } = await supabaseAdmin()
    .from("payments")
    .select()
    .eq("provider_capture_id", captureId)
    .maybeSingle();
  if (error) {
    logDbError("getPaymentByCaptureId", error);
    return { ok: false, error: "db_error" };
  }
  if (!data) return { ok: false, error: "not_found" };
  return { ok: true, data: normalize(data) };
}

// ─── Suscripciones ──────────────────────────────────────────────────────

/** Fila original de la suscripción (la que se creó al iniciar el checkout). */
export async function getSubscriptionSignup(
  subscriptionId: string,
): Promise<Result<PaymentRow, RepoError>> {
  if (!isSupabaseConfigured()) return { ok: false, error: "not_configured" };

  const { data, error } = await supabaseAdmin()
    .from("payments")
    .select()
    .eq("provider_subscription_id", subscriptionId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) {
    logDbError("getSubscriptionSignup", error);
    return { ok: false, error: "db_error" };
  }
  if (!data) return { ok: false, error: "not_found" };
  return { ok: true, data: normalize(data) };
}

/**
 * Asocia el primer cobro de una suscripción a su fila original — solo si esa
 * fila todavía no tiene cobro asociado (condición dentro del UPDATE, así el
 * retorno y el webhook no se pisan). La confirma si seguía pendiente.
 */
export async function attachFirstSale(
  paymentId: string,
  saleId: string,
  amountPaid: number,
): Promise<Result<PaymentRow, RepoError>> {
  if (!isSupabaseConfigured()) return { ok: false, error: "not_configured" };

  const { data, error } = await supabaseAdmin()
    .from("payments")
    .update({
      provider_capture_id: saleId,
      amount_paid: amountPaid,
      status: "confirmed",
      confirmed_by: "paypal",
    })
    .eq("id", paymentId)
    .is("provider_capture_id", null)
    .in("status", ["pending", "confirmed"])
    .select()
    .maybeSingle();
  if (error) {
    if (error.code === UNIQUE_VIOLATION)
      return { ok: false, error: "duplicate_reference" };
    logDbError("attachFirstSale", error);
    return { ok: false, error: "db_error" };
  }
  if (!data) return { ok: false, error: "invalid_state" };
  const row = normalize(data);
  // El trigger no toca confirmed_at: se completa si recién se confirmó.
  if (!row.confirmed_at) {
    const stamped = await updatePayment(row.id, {
      confirmed_at: new Date().toISOString(),
    });
    if (stamped.ok) return stamped;
  }
  return { ok: true, data: row };
}
