import "server-only";
import { revalidatePath } from "next/cache";
import { firstCapture, type PaypalOrder } from "./paypal";
import {
  getPaymentByOrderId,
  type PaymentRow,
  transitionPayment,
} from "./repository";

/**
 * Aplica a nuestra base el resultado de una orden de PayPal ya capturada.
 * Lo usan la ruta de retorno y el webhook — los dos pueden llegar, en
 * cualquier orden: `transitionPayment` solo mueve pagos `pending`, así que el
 * segundo en llegar no hace nada (idempotente).
 *
 * Antes de confirmar se verifica que la captura sea realmente de ESTE pago y
 * por el monto que se registró en el servidor: nunca se confía en el monto
 * que viene del navegador ni en que la orden sea la que decimos.
 */

export type SettleResult =
  | { status: "confirmed"; payment: PaymentRow }
  | { status: "pending"; payment: PaymentRow }
  | { status: "failed"; payment: PaymentRow | null }
  | { status: "not_found" };

function revalidate(payment: PaymentRow) {
  revalidatePath("/dashboard/pagos");
  if (payment.project_slug) {
    revalidatePath(`/proyectos/${payment.project_slug}`);
    revalidatePath("/proyectos");
    revalidatePath("/");
  }
}

export async function settlePaypalOrder(
  order: PaypalOrder,
): Promise<SettleResult> {
  const found = await getPaymentByOrderId(order.id);
  if (!found.ok) return { status: "not_found" };
  const payment = found.data;

  if (payment.status === "confirmed") return { status: "confirmed", payment };
  if (payment.status !== "pending") return { status: "failed", payment };

  const { capture, customId } = firstCapture(order);
  if (!capture) return { status: "pending", payment };

  const matches =
    customId === payment.id &&
    capture.amount.currency_code === "USD" &&
    Math.abs(Number(capture.amount.value) - payment.amount_usd) < 0.005;

  if (!matches) {
    console.error("[paypal] captura no coincide con el pago", {
      paymentId: payment.id,
      orderId: order.id,
      customId,
      amount: capture.amount,
    });
    const rejected = await transitionPayment(payment.id, "rejected", {
      notes: "La captura de PayPal no coincide con el pago registrado.",
      provider_capture_id: capture.id,
    });
    if (rejected.ok) revalidate(rejected.data);
    return { status: "failed", payment };
  }

  if (capture.status === "COMPLETED") {
    const confirmed = await transitionPayment(payment.id, "confirmed", {
      confirmed_by: "paypal",
      provider_capture_id: capture.id,
      amount_paid: Number(capture.amount.value),
    });
    if (confirmed.ok) {
      revalidate(confirmed.data);
      return { status: "confirmed", payment: confirmed.data };
    }
    // Otro proceso lo movió entre la lectura y el update: releer.
    const again = await getPaymentByOrderId(order.id);
    return again.ok && again.data.status === "confirmed"
      ? { status: "confirmed", payment: again.data }
      : { status: "failed", payment };
  }

  // PENDING: PayPal retiene el cobro (revisión, eCheck). Llega por webhook.
  if (capture.status === "PENDING") return { status: "pending", payment };

  // DECLINED / FAILED
  const rejected = await transitionPayment(payment.id, "rejected", {
    confirmed_by: "paypal",
    notes: `PayPal: captura ${capture.status}`,
    provider_capture_id: capture.id,
  });
  if (rejected.ok) revalidate(rejected.data);
  return { status: "failed", payment };
}
