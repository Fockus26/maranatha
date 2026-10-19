import { type NextRequest, NextResponse } from "next/server";
import { reconcileBinancePayment } from "@/lib/payments/binanceSettle";
import { resultUrl } from "@/lib/payments/returnPaths";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retorno desde Binance Pay tras pagar (`?pago=<id del pago>`; Binance
 * admite un solo parámetro). Consulta la orden y la concilia; si el pago
 * aún no se acreditó, muestra "en revisión" y el webhook
 * (`/api/payments/binance/webhook`) lo confirma después.
 */
export async function GET(req: NextRequest) {
  const paymentId = req.nextUrl.searchParams.get("pago") ?? "";
  if (!UUID_RE.test(paymentId)) {
    return NextResponse.redirect(
      resultUrl(req.url, "error", null, "binance"),
      303,
    );
  }

  const settled = await reconcileBinancePayment(paymentId);
  const payment = "payment" in settled ? settled.payment : null;
  const outcome =
    settled.status === "confirmed"
      ? "confirmado"
      : settled.status === "pending"
        ? "pendiente"
        : settled.status === "cancelled"
          ? "cancelado"
          : "error";
  return NextResponse.redirect(
    resultUrl(req.url, outcome, payment, "binance"),
    303,
  );
}
