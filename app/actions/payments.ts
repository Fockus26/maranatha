"use server";

import { isDbConfigured } from "@/lib/db";
import {
  createOrder as createBinanceOrder,
  isBinancePayConfigured,
} from "@/lib/payments/binance";
import { convertFromUsd, getExchangeRates } from "@/lib/payments/exchangeRates";
import { PURPOSE_LABEL } from "@/lib/payments/labels";
import {
  getEnabledMethod,
  getEnabledMethods,
  type PaymentMethodInfo,
} from "@/lib/payments/methods";
import {
  createOrder,
  createSubscription,
  isPaypalConfigured,
} from "@/lib/payments/paypal";
import { ensureMonthlyPlan } from "@/lib/payments/paypalSubscriptions";
import { hitRateLimit } from "@/lib/payments/rateLimit";
import { deleteReceipt, uploadReceipt } from "@/lib/payments/receipts";
import {
  countRecentPendingByEmail,
  deleteUnsentPayment,
  getActiveManualReport,
  insertPayment,
  type PaymentRow,
  transitionPayment,
  updatePayment,
} from "@/lib/payments/repository";
import {
  type Contribution,
  contributionSchema,
  MAX_PAID_AT_AGE_DAYS,
  manualReportSchema,
  type PaymentFrequency,
  type Result,
} from "@/lib/payments/schema";
import { getProjectBySlug } from "@/lib/projectsData";
import { SITE_URL } from "@/lib/siteConfig";

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
  if (!isDbConfigured()) return { ok: false, error: "not_configured" };

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
  | "invalid_contribution"
  | "invalid_date"
  | "invalid_project"
  | "method_unavailable"
  | "invalid_receipt"
  | "empty_receipt"
  | "duplicate_reference"
  | "too_many_requests"
  | "not_configured"
  | "server_error";

/** Máx. de reportes pendientes por correo por hora. */
const MAX_PENDING_PER_HOUR = 5;
/** Máx. de reportes por IP por hora (cubre alias de correo y concurrencia). */
const MAX_REPORTS_PER_IP_HOUR = 10;

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
  // Nombre, correo o monto vienen del paso 1: el mensaje manda allá, no a la
  // referencia, la fecha o el monto pagado (QA de versión 09).
  if (!contribution.success)
    return { ok: false, error: "invalid_contribution" };
  if (!report.success) return { ok: false, error: "invalid_input" };
  // Los métodos manuales no admiten recurrencia: "Mensual" solo existe con PayPal.
  if (contribution.data.frequency !== "once")
    return { ok: false, error: "invalid_input" };
  if (!validateProject(contribution.data))
    return { ok: false, error: "invalid_project" };

  // Fecha del pago: no futura (con 1 día de margen por husos horarios) ni de
  // hace más de `MAX_PAID_AT_AGE_DAYS` (el calendario ya las deshabilita).
  const paidAt = new Date(`${report.data.paidAt}T00:00:00Z`).getTime();
  const DAY = 86_400_000;
  if (
    paidAt > Date.now() + DAY ||
    paidAt < Date.now() - (MAX_PAID_AT_AGE_DAYS + 1) * DAY
  )
    return { ok: false, error: "invalid_date" };

  if (!isDbConfigured()) return { ok: false, error: "not_configured" };

  const method = getEnabledMethod(report.data.method);
  if (!method || method.kind !== "manual")
    return { ok: false, error: "method_unavailable" };

  // Dos frenos: por IP (atómico, aguanta concurrencia) y por correo.
  if (
    !(await hitRateLimit("report", MAX_REPORTS_PER_IP_HOUR, 3600)) ||
    (await countRecentPendingByEmail(contribution.data.email)) >=
      MAX_PENDING_PER_HOUR
  ) {
    return { ok: false, error: "too_many_requests" };
  }

  let receiptPath: string | null = null;
  const receipt = formData.get("receipt");
  // Un archivo elegido pero vacío (descarga fallida, archivo de la nube sin
  // bajar) se avisa: guardarlo sin comprobante haría creer al donante que lo
  // adjuntó (QA de versión 09). Sin archivo, el navegador manda uno sin nombre.
  if (receipt instanceof File && receipt.size === 0 && receipt.name !== "")
    return { ok: false, error: "empty_receipt" };
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
    if (inserted.error === "duplicate_reference") {
      // Reintento del mismo reporte (la respuesta del primero se perdió en la
      // red, QA de versión 09): si la fila vigente es igual, el reporte ya
      // está guardado y se responde como si fuera este.
      const existing = await getActiveManualReport(
        method.id,
        report.data.reference,
      );
      if (
        existing.ok &&
        isSameReport(existing.data, {
          ...contribution.data,
          ...report.data,
        })
      )
        return { ok: true, data: { id: existing.data.id } };
      return { ok: false, error: "duplicate_reference" };
    }
    return { ok: false, error: "server_error" };
  }
  return { ok: true, data: { id: inserted.data.id } };
}

/** El reporte guardado coincide con el que llega (mismo donante y montos). */
function isSameReport(
  row: PaymentRow,
  next: Contribution & { amountPaid: number; paidAt: string },
): boolean {
  return (
    row.status === "pending" &&
    row.donor_email === next.email &&
    row.purpose === next.purpose &&
    (row.project_slug ?? undefined) === next.projectSlug &&
    row.amount_usd === next.amountUsd &&
    row.amount_paid === next.amountPaid &&
    row.paid_at === next.paidAt
  );
}

// ─── PayPal (pasarela) ─────────────────────────────────────────────────────

export type PaypalCheckoutError =
  | "invalid_input"
  | "invalid_project"
  | "method_unavailable"
  | "too_many_requests"
  | "not_configured"
  | "server_error";

/** Máx. de checkouts de PayPal sin completar por correo por hora. */
const MAX_PAYPAL_PENDING_PER_HOUR = 10;
/** Máx. de checkouts de PayPal por IP por hora. */
const MAX_PAYPAL_PER_IP_HOUR = 20;

/**
 * Falla al iniciar un checkout de pasarela. Si la orden nunca se creó en la
 * pasarela, la fila se borra (no hay nada que conciliar); si se creó pero no
 * se pudo enlazar, queda `cancelled` con la nota, para poder rastrearla.
 */
async function discardFailedCheckout(
  paymentId: string,
  orderCreated: boolean,
  notes: string,
): Promise<void> {
  if (!orderCreated && (await deleteUnsentPayment(paymentId))) return;
  await transitionPayment(paymentId, "cancelled", { notes });
}

/**
 * Crea el pago `pending` y la orden de PayPal (o la suscripción, si es
 * mensual), y devuelve el link al que el navegador tiene que redirigir. El monto sale de lo validado acá, no de lo
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
  if (!isDbConfigured()) return { ok: false, error: "not_configured" };
  if (!isPaypalConfigured() || !getEnabledMethod("paypal"))
    return { ok: false, error: "method_unavailable" };

  if (
    !(await hitRateLimit("paypal", MAX_PAYPAL_PER_IP_HOUR, 3600)) ||
    (await countRecentPendingByEmail(contribution.email, "paypal")) >=
      MAX_PAYPAL_PENDING_PER_HOUR
  ) {
    return { ok: false, error: "too_many_requests" };
  }

  const inserted = await insertPayment({
    purpose: contribution.purpose,
    project_slug: contribution.projectSlug ?? null,
    frequency: contribution.frequency,
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

  if (contribution.frequency === "monthly") {
    let orderCreated = false;
    try {
      const planId = await ensureMonthlyPlan();
      const { subscriptionId, approveUrl } = await createSubscription({
        paymentId: payment.id,
        planId,
        amountUsd: payment.amount_usd,
        email: contribution.email,
        returnUrl: `${SITE_URL}/pago/paypal/suscripcion/retorno`,
        cancelUrl: `${SITE_URL}/pago/paypal/suscripcion/cancelado`,
      });
      orderCreated = true;
      const linked = await updatePayment(payment.id, {
        provider_subscription_id: subscriptionId,
      });
      if (!linked.ok)
        throw new Error(`No se pudo guardar la suscripción ${subscriptionId}`);
      return { ok: true, data: { approveUrl } };
    } catch (error) {
      console.error("[paypal] startPaypalCheckout (mensual):", error);
      await discardFailedCheckout(
        payment.id,
        orderCreated,
        "No se pudo crear la suscripción en PayPal.",
      );
      return { ok: false, error: "server_error" };
    }
  }

  let orderCreated = false;
  try {
    const { orderId, approveUrl } = await createOrder({
      paymentId: payment.id,
      amountUsd: payment.amount_usd,
      description,
      returnUrl: `${SITE_URL}/pago/paypal/retorno`,
      cancelUrl: `${SITE_URL}/pago/paypal/cancelado`,
    });
    orderCreated = true;
    const linked = await updatePayment(payment.id, {
      provider_order_id: orderId,
    });
    if (!linked.ok) throw new Error(`No se pudo guardar la orden ${orderId}`);
    return { ok: true, data: { approveUrl } };
  } catch (error) {
    console.error("[paypal] startPaypalCheckout:", error);
    await discardFailedCheckout(
      payment.id,
      orderCreated,
      "No se pudo crear la orden en PayPal.",
    );
    return { ok: false, error: "server_error" };
  }
}

// ─── Binance Pay Merchant (pasarela) ───────────────────────────────────────

export type BinanceCheckoutError = PaypalCheckoutError;

/** Máx. de checkouts de Binance sin completar por correo por hora. */
const MAX_BINANCE_PENDING_PER_HOUR = 10;
/** Máx. de checkouts de Binance por IP por hora. */
const MAX_BINANCE_PER_IP_HOUR = 20;

/**
 * Crea el pago `pending` y la orden de Binance Pay, y devuelve la página de
 * pago de Binance a la que redirige el navegador. Solo existe con las
 * credenciales de comercio (`BINANCE_PAY_*`); sin ellas Binance es manual y
 * esto responde `method_unavailable`. El monto en USDT se fija acá: el
 * webhook compara el cobro contra este registro.
 */
export async function startBinanceCheckout(
  input: unknown,
): Promise<Result<{ approveUrl: string }, BinanceCheckoutError>> {
  const parsed = contributionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid_input" };
  const contribution = parsed.data;
  // Binance Pay no cobra de forma recurrente.
  if (contribution.frequency !== "once")
    return { ok: false, error: "invalid_input" };
  if (!validateProject(contribution))
    return { ok: false, error: "invalid_project" };
  if (!isDbConfigured()) return { ok: false, error: "not_configured" };
  const method = getEnabledMethod("binance");
  if (!isBinancePayConfigured() || method?.kind !== "gateway")
    return { ok: false, error: "method_unavailable" };

  if (
    !(await hitRateLimit("binance", MAX_BINANCE_PER_IP_HOUR, 3600)) ||
    (await countRecentPendingByEmail(contribution.email, "binance")) >=
      MAX_BINANCE_PENDING_PER_HOUR
  ) {
    return { ok: false, error: "too_many_requests" };
  }

  const rates = await getExchangeRates();
  const amountUsdt = convertFromUsd(contribution.amountUsd, "USDT", rates);
  if (amountUsdt === null) return { ok: false, error: "server_error" };

  const inserted = await insertPayment({
    purpose: contribution.purpose,
    project_slug: contribution.projectSlug ?? null,
    frequency: "once",
    amount_usd: contribution.amountUsd,
    currency: "USDT",
    exchange_rate: rates.USDT,
    method: "binance",
    donor_name: contribution.name,
    donor_email: contribution.email,
  });
  if (!inserted.ok) return { ok: false, error: "server_error" };
  const payment = inserted.data;

  const project = contribution.projectSlug
    ? getProjectBySlug(contribution.projectSlug)
    : undefined;
  const goodsName = project
    ? `Aporte a ${project.title}`
    : PURPOSE_LABEL[contribution.purpose];

  // Binance admite un solo parámetro en las URLs de retorno.
  const back = `?pago=${payment.id}`;
  let orderCreated = false;
  try {
    const { prepayId, checkoutUrl } = await createBinanceOrder({
      paymentId: payment.id,
      amountUsdt,
      goodsName,
      description: `${goodsName} - Iglesia Maranatha`,
      returnUrl: `${SITE_URL}/pago/binance/retorno${back}`,
      cancelUrl: `${SITE_URL}/pago/binance/cancelado${back}`,
      webhookUrl: `${SITE_URL}/api/payments/binance/webhook`,
    });
    orderCreated = true;
    const linked = await updatePayment(payment.id, {
      provider_order_id: prepayId,
    });
    if (!linked.ok) throw new Error(`No se pudo guardar la orden ${prepayId}`);
    return { ok: true, data: { approveUrl: checkoutUrl } };
  } catch (error) {
    console.error("[binance] startBinanceCheckout:", error);
    await discardFailedCheckout(
      payment.id,
      orderCreated,
      "No se pudo crear la orden en Binance Pay.",
    );
    return { ok: false, error: "server_error" };
  }
}
