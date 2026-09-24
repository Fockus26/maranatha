"use server";

import { convertFromUsd, getExchangeRates } from "@/lib/payments/exchangeRates";
import { PURPOSE_LABEL } from "@/lib/payments/labels";
import {
  getEnabledMethod,
  getEnabledMethods,
  type PaymentMethodInfo,
} from "@/lib/payments/methods";
import { createOrder, isPaypalConfigured } from "@/lib/payments/paypal";
import { deleteReceipt, uploadReceipt } from "@/lib/payments/receipts";
import {
  countRecentPendingByEmail,
  insertPayment,
  transitionPayment,
  updatePayment,
} from "@/lib/payments/repository";
import {
  type Contribution,
  contributionSchema,
  manualReportSchema,
  type PaymentFrequency,
  type Result,
} from "@/lib/payments/schema";
import { getProjectBySlug } from "@/lib/projectsData";
import { SITE_URL } from "@/lib/siteConfig";
import { isSupabaseConfigured } from "@/lib/supabase/admin";

/**
 * Server Actions del checkout público (sin sesión: cualquiera puede aportar).
 * Todo lo que llega del cliente se vuelve a validar acá con los mismos
 * esquemas Zod del formulario — estas funciones son alcanzables por POST
 * directo, sin pasar por la UI.
 */

// ─── Opciones de pago (paso 2) ─────────────────────────────────────────────

export interface CheckoutMethod extends PaymentMethodInfo {
  /** Monto a pagar en la moneda del método; `null` si no hay tasa disponible. */
  amountDue: number | null;
  exchangeRate: number | null;
}

export type CheckoutOptionsError = "invalid_input" | "not_configured";

export async function getCheckoutOptions(input: {
  amountUsd: number;
  frequency: PaymentFrequency;
}): Promise<Result<CheckoutMethod[], CheckoutOptionsError>> {
  const parsed = contributionSchema.shape.amountUsd.safeParse(input.amountUsd);
  const frequency = input.frequency === "monthly" ? "monthly" : "once";
  if (!parsed.success) return { ok: false, error: "invalid_input" };
  if (!isSupabaseConfigured()) return { ok: false, error: "not_configured" };

  const rates = await getExchangeRates();
  const methods = getEnabledMethods()
    .filter((m) => frequency === "once" || m.supportsMonthly)
    .map((m) => ({
      ...m,
      amountDue: convertFromUsd(parsed.data, m.currency, rates),
      exchangeRate: rates[m.currency],
    }));

  return { ok: true, data: methods };
}

// ─── Reporte de pago manual ────────────────────────────────────────────────

export type ReportPaymentError =
  | "invalid_input"
  | "invalid_project"
  | "method_unavailable"
  | "invalid_receipt"
  | "duplicate_reference"
  | "too_many_requests"
  | "not_configured"
  | "server_error";

/** Máx. de reportes pendientes por correo por hora. */
const MAX_PENDING_PER_HOUR = 5;

function validateProject(contribution: Contribution): boolean {
  if (contribution.purpose !== "proyecto") return true;
  const project = getProjectBySlug(contribution.projectSlug ?? "");
  return Boolean(project && project.status !== "completed");
}

export async function reportManualPayment(
  formData: FormData,
): Promise<Result<{ id: string }, ReportPaymentError>> {
  // Honeypot: campo oculto que un humano nunca llena. Se responde "ok" para
  // no darle señal al bot, sin guardar nada.
  if (String(formData.get("website") ?? "") !== "")
    return { ok: true, data: { id: "" } };

  const contribution = contributionSchema.safeParse({
    purpose: formData.get("purpose"),
    projectSlug: formData.get("projectSlug") || undefined,
    frequency: formData.get("frequency"),
    amountUsd: formData.get("amountUsd"),
    name: formData.get("name"),
    email: formData.get("email"),
  });
  const report = manualReportSchema.safeParse({
    method: formData.get("method"),
    reference: formData.get("reference"),
    paidAt: formData.get("paidAt"),
    amountPaid: formData.get("amountPaid"),
  });
  if (!contribution.success || !report.success)
    return { ok: false, error: "invalid_input" };
  // Los métodos manuales no admiten recurrencia: "Mensual" solo existe con PayPal.
  if (contribution.data.frequency !== "once")
    return { ok: false, error: "invalid_input" };
  if (!validateProject(contribution.data))
    return { ok: false, error: "invalid_project" };

  // Fecha del pago: no futura (con 1 día de margen por husos horarios) ni de hace más de 60 días.
  const paidAt = new Date(`${report.data.paidAt}T00:00:00Z`).getTime();
  const DAY = 86_400_000;
  if (paidAt > Date.now() + DAY || paidAt < Date.now() - 60 * DAY)
    return { ok: false, error: "invalid_input" };

  if (!isSupabaseConfigured()) return { ok: false, error: "not_configured" };

  const method = getEnabledMethod(report.data.method);
  if (!method || method.kind !== "manual")
    return { ok: false, error: "method_unavailable" };

  if (
    (await countRecentPendingByEmail(contribution.data.email)) >=
    MAX_PENDING_PER_HOUR
  ) {
    return { ok: false, error: "too_many_requests" };
  }

  let receiptPath: string | null = null;
  const receipt = formData.get("receipt");
  if (receipt instanceof File && receipt.size > 0) {
    const upload = await uploadReceipt(receipt);
    if (!upload.ok)
      return {
        ok: false,
        error:
          upload.error === "invalid_receipt"
            ? "invalid_receipt"
            : "server_error",
      };
    receiptPath = upload.path;
  }

  // La tasa se registra tal como estaba al momento del reporte, para que el
  // admin compare lo pagado contra lo esperado.
  const rates = await getExchangeRates();

  const inserted = await insertPayment({
    purpose: contribution.data.purpose,
    project_slug: contribution.data.projectSlug ?? null,
    frequency: "once",
    amount_usd: contribution.data.amountUsd,
    amount_paid: report.data.amountPaid,
    currency: method.currency,
    exchange_rate: rates[method.currency],
    method: method.id,
    donor_name: contribution.data.name,
    donor_email: contribution.data.email,
    reference: report.data.reference,
    paid_at: report.data.paidAt,
    receipt_path: receiptPath,
  });

  if (!inserted.ok) {
    if (receiptPath) await deleteReceipt(receiptPath);
    if (inserted.error === "duplicate_reference")
      return { ok: false, error: "duplicate_reference" };
    return { ok: false, error: "server_error" };
  }
  return { ok: true, data: { id: inserted.data.id } };
}

// ─── PayPal (pasarela) ─────────────────────────────────────────────────────

export type PaypalCheckoutError =
  | "invalid_input"
  | "invalid_project"
  | "method_unavailable"
  | "monthly_unavailable"
  | "too_many_requests"
  | "not_configured"
  | "server_error";

/** Máx. de checkouts de PayPal sin completar por correo por hora. */
const MAX_PAYPAL_PENDING_PER_HOUR = 10;

/**
 * Crea el pago `pending` y la orden de PayPal, y devuelve el link al que el
 * navegador tiene que redirigir. El monto sale de lo validado acá, no de lo
 * que el cliente vaya a mandar después: la ruta de retorno y el webhook
 * comparan la captura contra este registro.
 */
export async function startPaypalCheckout(
  input: unknown,
): Promise<Result<{ approveUrl: string }, PaypalCheckoutError>> {
  const parsed = contributionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid_input" };
  const contribution = parsed.data;
  if (!validateProject(contribution))
    return { ok: false, error: "invalid_project" };
  // Suscripciones mensuales: unidad siguiente (PayPal Subscriptions API).
  if (contribution.frequency === "monthly")
    return { ok: false, error: "monthly_unavailable" };

  if (!isSupabaseConfigured()) return { ok: false, error: "not_configured" };
  if (!isPaypalConfigured() || !getEnabledMethod("paypal"))
    return { ok: false, error: "method_unavailable" };

  if (
    (await countRecentPendingByEmail(contribution.email, "paypal")) >=
    MAX_PAYPAL_PENDING_PER_HOUR
  ) {
    return { ok: false, error: "too_many_requests" };
  }

  const inserted = await insertPayment({
    purpose: contribution.purpose,
    project_slug: contribution.projectSlug ?? null,
    frequency: "once",
    amount_usd: contribution.amountUsd,
    currency: "USD",
    method: "paypal",
    donor_name: contribution.name,
    donor_email: contribution.email,
  });
  if (!inserted.ok) return { ok: false, error: "server_error" };
  const payment = inserted.data;

  const project = contribution.projectSlug
    ? getProjectBySlug(contribution.projectSlug)
    : undefined;
  const description = project
    ? `Aporte a "${project.title}" — Iglesia Maranatha`
    : `${PURPOSE_LABEL[contribution.purpose]} — Iglesia Maranatha`;

  try {
    const { orderId, approveUrl } = await createOrder({
      paymentId: payment.id,
      amountUsd: payment.amount_usd,
      description,
      returnUrl: `${SITE_URL}/pago/paypal/retorno`,
      cancelUrl: `${SITE_URL}/pago/paypal/cancelado`,
    });
    const linked = await updatePayment(payment.id, {
      provider_order_id: orderId,
    });
    if (!linked.ok) throw new Error(`No se pudo guardar la orden ${orderId}`);
    return { ok: true, data: { approveUrl } };
  } catch (error) {
    console.error("[paypal] startPaypalCheckout:", error);
    await transitionPayment(payment.id, "cancelled", {
      notes: "No se pudo crear la orden en PayPal.",
    });
    return { ok: false, error: "server_error" };
  }
}
