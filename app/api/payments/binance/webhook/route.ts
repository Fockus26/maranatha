import { type NextRequest, NextResponse } from "next/server";
import { isBinancePayConfigured, verifyWebhook } from "@/lib/payments/binance";
import { outcomeFromWebhook, parseWebhook } from "@/lib/payments/binanceCore";
import { settleBinanceOrder } from "@/lib/payments/binanceSettle";

/**
 * Webhook de Binance Pay (notificación de orden, `bizType: "PAY"`).
 *
 * - La URL se manda en cada orden (`webhookUrl`), y además conviene
 *   configurarla en el Merchant Admin Portal como respaldo.
 * - `PAY_SUCCESS` confirma el pago; `PAY_CLOSED` (expiró o se canceló sin
 *   cobro) lo cancela. El resto se descarta antes de verificar la firma.
 * - La firma (RSA-SHA256 con el certificado público de Binance) se verifica
 *   antes de actuar; los datos de la orden salen del cuerpo firmado.
 * - Idempotente: Binance reintenta hasta 6 veces mientras no reciba
 *   `{"returnCode":"SUCCESS"}`; los estados solo avanzan desde pending/cancelled.
 * - `FAIL` + 500 ante errores propios (base caída, credenciales faltantes)
 *   para que Binance reintente.
 */

function reply(ok: boolean, status = 200, message: string | null = null) {
  return NextResponse.json(
    { returnCode: ok ? "SUCCESS" : "FAIL", returnMessage: message },
    { status },
  );
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const parsed = parseWebhook(rawBody);
  if (!parsed) return reply(false, 400, "invalid_body");

  const { event, order } = parsed;
  const outcome = outcomeFromWebhook(event.bizType, event.bizStatus);
  // Eventos que no manejamos: se acusan para que Binance no reintente.
  if (outcome === "ignored") return reply(true);
  if (!order) return reply(false, 400, "invalid_data");

  if (!isBinancePayConfigured()) {
    console.error(
      "[binance] webhook: faltan BINANCE_PAY_API_KEY / BINANCE_PAY_SECRET_KEY — no se puede verificar",
    );
    return reply(false, 500, "not_configured");
  }

  let verified = false;
  try {
    verified = await verifyWebhook(req.headers, rawBody);
  } catch (error) {
    console.error("[binance] webhook: verificación falló", error);
    return reply(false, 500, "verification_unavailable");
  }
  if (!verified) return reply(false, 400, "invalid_signature");

  try {
    const settled = await settleBinanceOrder({
      merchantTradeNo: order.merchantTradeNo,
      outcome,
      amount: order.totalFee,
      currency: order.currency,
      transactionId: order.transactionId ?? null,
    });
    if (settled.status === "not_found") {
      // Orden que no es nuestra (u otro sistema en la misma cuenta): se
      // acusa igual, reintentar no la va a encontrar.
      console.warn(
        "[binance] webhook: orden desconocida",
        order.merchantTradeNo,
      );
    }
    return reply(true);
  } catch (error) {
    console.error(
      `[binance] webhook ${event.bizIdStr ?? ""} (${event.bizStatus}):`,
      error,
    );
    return reply(false, 500, "processing_failed");
  }
}
