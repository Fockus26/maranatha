import "server-only";
import { revalidatePath } from "next/cache";
import {
  createMonthlyPlan,
  createProduct,
  type PaypalSale,
  type PaypalSubscription,
  paypalEnv,
} from "./paypal";
import {
  attachFirstSale,
  getPaymentByCaptureId,
  getSetting,
  getSubscriptionSignup,
  insertPayment,
  type PaymentRow,
  setSetting,
  transitionPayment,
} from "./repository";

/**
 * Aportes mensuales con PayPal Subscriptions.
 *
 * Modelo en la base:
 * - Al iniciar el checkout se crea UNA fila (`frequency: monthly`, pending)
 *   con el id de la suscripción: representa el alta y su primer cobro.
 * - Cada cobro (`PAYMENT.SALE.COMPLETED`) se identifica por el id de la venta
 *   (`provider_capture_id`, único). El primero se asocia a la fila del alta;
 *   los siguientes crean una fila `confirmed` nueva por mes, así cada cobro
 *   suma a lo recaudado una sola vez.
 */

function revalidate(payment: PaymentRow) {
  revalidatePath("/dashboard/pagos");
  if (payment.project_slug) {
    revalidatePath(`/proyectos/${payment.project_slug}`);
    revalidatePath("/proyectos");
    revalidatePath("/");
  }
}

/**
 * Plan base mensual del entorno actual (sandbox/live), creado la primera vez
 * y guardado en `settings`. Los ids de sandbox no sirven en live, por eso la
 * clave incluye el entorno.
 */
export async function ensureMonthlyPlan(): Promise<string> {
  const key = `paypal_monthly_plan:${paypalEnv()}`;
  const saved = await getSetting<{ planId: string }>(key);
  if (saved?.planId) return saved.planId;

  const productId = await createProduct();
  const planId = await createMonthlyPlan(productId);
  const stored = await setSetting(key, { planId, productId });
  if (!stored.ok) throw new Error(`No se pudo guardar el plan ${planId}`);
  return planId;
}

export type SubscriptionSettle =
  | { status: "active"; payment: PaymentRow }
  | { status: "pending"; payment: PaymentRow }
  | { status: "failed"; payment: PaymentRow | null };

/**
 * Retorno tras aprobar la suscripción. Si PayPal ya reporta el primer cobro
 * (`billing_info.last_payment`) por el monto correcto, la fila del alta se
 * confirma; si no, queda pending y la confirma el webhook del cobro.
 */
export async function settleSubscriptionReturn(
  subscription: PaypalSubscription,
): Promise<SubscriptionSettle> {
  const signup = await getSubscriptionSignup(subscription.id);
  if (!signup.ok) return { status: "failed", payment: null };
  const payment = signup.data;

  if (subscription.custom_id !== payment.id) {
    console.error("[paypal] suscripción no coincide con el pago", {
      subscriptionId: subscription.id,
      customId: subscription.custom_id,
      paymentId: payment.id,
    });
    return { status: "failed", payment };
  }

  if (!["ACTIVE", "APPROVED"].includes(subscription.status)) {
    return { status: "failed", payment };
  }
  if (payment.status === "confirmed") return { status: "active", payment };

  const last = subscription.billing_info?.last_payment?.amount;
  const firstChargeDone =
    last?.currency_code === "USD" &&
    Math.abs(Number(last.value) - payment.amount_usd) < 0.005;

  if (subscription.status === "ACTIVE" && firstChargeDone) {
    // Incluye `cancelled`: pudo cancelar y luego aprobar volviendo atrás.
    const confirmed = await transitionPayment(
      payment.id,
      "confirmed",
      { confirmed_by: "paypal", amount_paid: Number(last.value) },
      ["pending", "cancelled"],
    );
    if (confirmed.ok) {
      revalidate(confirmed.data);
      return { status: "active", payment: confirmed.data };
    }
  }
  // Suscripción aprobada pero el primer cobro todavía no se procesó.
  return { status: "pending", payment };
}

/**
 * Un cobro de la suscripción (webhook `PAYMENT.SALE.COMPLETED`, con la venta
 * ya re-consultada a PayPal). Idempotente por el id de la venta.
 */
export async function settleSubscriptionSale(
  sale: PaypalSale,
): Promise<"recorded" | "duplicate" | "ignored"> {
  if (sale.state !== "completed" || !sale.billing_agreement_id)
    return "ignored";
  if (sale.amount.currency !== "USD") return "ignored";

  const existing = await getPaymentByCaptureId(sale.id);
  if (existing.ok) return "duplicate";

  const signup = await getSubscriptionSignup(sale.billing_agreement_id);
  if (!signup.ok) {
    if (signup.error === "not_found") return "ignored";
    throw new Error(`getSubscriptionSignup: ${signup.error}`);
  }
  const amount = Number(sale.amount.total);

  // Primer cobro → a la fila del alta (si todavía no tiene venta asociada).
  const attached = await attachFirstSale(signup.data.id, sale.id, amount);
  if (attached.ok) {
    revalidate(attached.data);
    return "recorded";
  }
  if (attached.error === "duplicate_reference") return "duplicate";
  if (attached.error !== "invalid_state")
    throw new Error(`attachFirstSale: ${attached.error}`);

  // Cobros siguientes → una fila confirmada nueva por mes.
  const now = new Date().toISOString();
  const inserted = await insertPayment({
    purpose: signup.data.purpose,
    project_slug: signup.data.project_slug,
    frequency: "monthly",
    amount_usd: amount,
    amount_paid: amount,
    currency: "USD",
    method: "paypal",
    donor_name: signup.data.donor_name,
    donor_email: signup.data.donor_email,
    provider_subscription_id: sale.billing_agreement_id,
    provider_capture_id: sale.id,
    status: "confirmed",
    confirmed_at: now,
    confirmed_by: "paypal",
    notes: "Cobro mensual de la suscripción",
  });
  if (!inserted.ok) {
    if (inserted.error === "duplicate_reference") return "duplicate";
    throw new Error(`insertPayment: ${inserted.error}`);
  }
  revalidate(inserted.data);
  return "recorded";
}
