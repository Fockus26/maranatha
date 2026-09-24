import { type NextRequest, NextResponse } from "next/server";
import {
  getPaymentByOrderId,
  transitionPayment,
} from "@/lib/payments/repository";
import { resultUrl } from "@/lib/payments/returnPaths";

/**
 * El donante canceló en PayPal. El pago pasa a `cancelled` (solo si seguía
 * `pending` — nunca pisa uno confirmado) y vuelve a la página de resultado.
 */
export async function GET(req: NextRequest) {
  const orderId = req.nextUrl.searchParams.get("token");
  if (!orderId || !/^[A-Z0-9]{5,40}$/.test(orderId)) {
    return NextResponse.redirect(resultUrl(req.url, "cancelado"), 303);
  }

  const payment = await getPaymentByOrderId(orderId);
  if (payment.ok && payment.data.status === "pending") {
    await transitionPayment(payment.data.id, "cancelled", {
      notes: "Cancelado por el donante en PayPal.",
    });
  }
  return NextResponse.redirect(
    resultUrl(req.url, "cancelado", payment.ok ? payment.data : null),
    303,
  );
}
