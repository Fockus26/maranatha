import { type NextRequest, NextResponse } from "next/server";
import { captureOrder, PaypalError } from "@/lib/payments/paypal";
import { settlePaypalOrder } from "@/lib/payments/paypalSettle";
import { getPaymentByOrderId } from "@/lib/payments/repository";
import { resultUrl } from "@/lib/payments/returnPaths";

/**
 * Retorno desde PayPal tras aprobar el pago (`?token=<orderId>&PayerID=…`).
 * Captura la orden en el servidor y la concilia con nuestro registro. Si el
 * donante cierra la pestaña antes de llegar acá, el webhook
 * (`/api/payments/paypal/webhook`) completa el mismo trabajo.
 */
export async function GET(req: NextRequest) {
  const orderId = req.nextUrl.searchParams.get("token");
  if (!orderId || !/^[A-Z0-9]{5,40}$/.test(orderId)) {
    return NextResponse.redirect(resultUrl(req.url, "error"), 303);
  }

  const known = await getPaymentByOrderId(orderId);
  if (!known.ok) return NextResponse.redirect(resultUrl(req.url, "error"), 303);
  if (known.data.status === "confirmed") {
    return NextResponse.redirect(
      resultUrl(req.url, "confirmado", known.data),
      303,
    );
  }

  try {
    const order = await captureOrder(orderId);
    const settled = await settlePaypalOrder(order);
    if (settled.status === "confirmed") {
      return NextResponse.redirect(
        resultUrl(req.url, "confirmado", settled.payment),
        303,
      );
    }
    if (settled.status === "pending") {
      return NextResponse.redirect(
        resultUrl(req.url, "pendiente", settled.payment),
        303,
      );
    }
    return NextResponse.redirect(resultUrl(req.url, "error", known.data), 303);
  } catch (error) {
    // Ej. INSTRUMENT_DECLINED (tarjeta rechazada): el donante puede reintentar.
    console.error(
      "[paypal] retorno:",
      error instanceof PaypalError ? error.message : error,
    );
    return NextResponse.redirect(resultUrl(req.url, "error", known.data), 303);
  }
}
