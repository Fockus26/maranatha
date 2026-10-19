import { type NextRequest, NextResponse } from "next/server";
import { reconcileBinancePayment } from "@/lib/payments/binanceSettle";
import { resultUrl } from "@/lib/payments/returnPaths";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Binance Pay devuelve acá cuando el pago no se completa (`?pago=<id>`).
 * No se cancela a ciegas: la orden puede seguir abierta (el donante puede
 * pagarla desde la app) y es Binance quien avisa con `PAY_CLOSED` cuando
 * expira. Se consulta la orden y se concilia lo que diga.
 */
export async function GET(req: NextRequest) {
  const paymentId = req.nextUrl.searchParams.get("pago") ?? "";
  if (!UUID_RE.test(paymentId)) {
    return NextResponse.redirect(
      resultUrl(req.url, "cancelado", null, "binance"),
      303,
    );
  }

  const settled = await reconcileBinancePayment(paymentId);
  const payment = "payment" in settled ? settled.payment : null;
  return NextResponse.redirect(
    resultUrl(
      req.url,
      settled.status === "confirmed" ? "confirmado" : "cancelado",
      payment,
      "binance",
    ),
    303,
  );
}
