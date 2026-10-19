import "server-only";
import { revalidatePath } from "next/cache";
import { queryOrder } from "./binance";
import {
  amountMatches,
  type BinanceOutcome,
  outcomeFromOrderStatus,
  paymentIdFromTradeNo,
} from "./binanceCore";
import { getPayment, type PaymentRow, transitionPayment } from "./repository";
import type { PaymentStatus } from "./schema";

/**
 * Aplica a nuestra base el resultado de una orden de Binance Pay. Lo usan el
 * webhook (datos firmados por Binance) y las rutas de retorno (datos de la
 * consulta de orden). Pueden llegar los dos, en cualquier orden:
 * `transitionPayment` solo mueve pagos desde los estados permitidos, así que
 * el segundo no hace nada (idempotente).
 *
 * Antes de confirmar se verifica que la orden sea de ESTE pago (Binance por
 * pasarela: método `binance` sin referencia manual) y por el monto en USDT
 * que se fijó en el servidor al crearla.
 */

export interface BinanceSettlement {
  merchantTradeNo: string;
  outcome: BinanceOutcome;
  amount: number | string;
  currency: string;
  transactionId?: string | null;
}

export type BinanceSettleResult =
  | { status: "confirmed"; payment: PaymentRow }
  | { status: "pending"; payment: PaymentRow }
  | { status: "cancelled"; payment: PaymentRow }
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

/** Monto en USDT que se le pidió al donante al crear la orden. */
export function expectedUsdt(payment: PaymentRow): number {
  return (
    Math.round(payment.amount_usd * (payment.exchange_rate ?? 1) * 100) / 100
  );
}

export async function settleBinanceOrder(
  input: BinanceSettlement,
): Promise<BinanceSettleResult> {
  const paymentId = paymentIdFromTradeNo(input.merchantTradeNo);
  if (!paymentId) return { status: "not_found" };
  const found = await getPayment(paymentId);
  if (!found.ok) {
    if (found.error === "not_found") return { status: "not_found" };
    throw new Error(`getPayment ${paymentId}: ${found.error}`);
  }
  const payment = found.data;
  // Un reporte manual de Binance nunca se concilia por acá.
  if (payment.method !== "binance" || payment.reference !== null)
    return { status: "not_found" };

  if (input.outcome === "pending" || input.outcome === "ignored") {
    return payment.status === "confirmed"
      ? { status: "confirmed", payment }
      : { status: "pending", payment };
  }

  if (input.outcome === "closed") {
    if (payment.status !== "pending")
      return payment.status === "confirmed"
        ? { status: "confirmed", payment }
        : { status: "cancelled", payment };
    const cancelled = await transitionPayment(payment.id, "cancelled", {
      confirmed_by: "binance",
      notes: "Binance Pay: la orden se cerró sin pago (expiró o se canceló).",
    });
    if (cancelled.ok) {
      revalidate(cancelled.data);
      return { status: "cancelled", payment: cancelled.data };
    }
    return { status: "cancelled", payment };
  }

  // outcome === "paid"
  if (payment.status === "confirmed") return { status: "confirmed", payment };
  // `cancelled` también se concilia: si Binance cobró, el dinero real manda.
  if (payment.status !== "pending" && payment.status !== "cancelled")
    return { status: "failed", payment };
  const from: PaymentStatus[] = ["pending", "cancelled"];

  const matches =
    input.currency === "USDT" &&
    amountMatches(input.amount, expectedUsdt(payment));
  if (!matches) {
    console.error("[binance] la orden no coincide con el pago", {
      paymentId: payment.id,
      amount: input.amount,
      currency: input.currency,
    });
    const rejected = await transitionPayment(
      payment.id,
      "rejected",
      {
        confirmed_by: "binance",
        notes: `Binance Pay cobró ${input.amount} ${input.currency}; se esperaban ${expectedUsdt(payment).toFixed(2)} USDT. Revisar en el Merchant Admin Portal.`,
      },
      from,
    );
    if (rejected.ok) revalidate(rejected.data);
    return { status: "failed", payment };
  }

  const confirmed = await transitionPayment(
    payment.id,
    "confirmed",
    {
      confirmed_by: "binance",
      amount_paid: Number(input.amount),
      provider_capture_id: input.transactionId || null,
    },
    from,
  );
  if (confirmed.ok) {
    revalidate(confirmed.data);
    return { status: "confirmed", payment: confirmed.data };
  }
  // Otro proceso lo movió entre la lectura y el update: releer.
  const again = await getPayment(payment.id);
  return again.ok && again.data.status === "confirmed"
    ? { status: "confirmed", payment: again.data }
    : { status: "failed", payment };
}

/**
 * Consulta la orden en Binance y la concilia — para las rutas de retorno,
 * que no esperan al webhook. Si Binance no responde se devuelve el estado
 * guardado: el webhook completa el trabajo después.
 */
export async function reconcileBinancePayment(
  paymentId: string,
): Promise<BinanceSettleResult> {
  const found = await getPayment(paymentId);
  if (!found.ok) return { status: "not_found" };
  const payment = found.data;
  if (payment.method !== "binance" || payment.reference !== null)
    return { status: "not_found" };
  if (payment.status === "confirmed") return { status: "confirmed", payment };

  try {
    const order = await queryOrder(payment.id);
    return await settleBinanceOrder({
      merchantTradeNo: order.merchantTradeNo,
      outcome: outcomeFromOrderStatus(order.status),
      amount: order.orderAmount,
      currency: order.currency,
      transactionId: order.transactionId ?? null,
    });
  } catch (error) {
    console.error("[binance] consulta de orden:", error);
    return payment.status === "pending"
      ? { status: "pending", payment }
      : { status: "failed", payment };
  }
}
