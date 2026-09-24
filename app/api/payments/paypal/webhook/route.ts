import { revalidatePath } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import {
  getOrder,
  getSale,
  verifyWebhookSignature,
} from "@/lib/payments/paypal";
import { settlePaypalOrder } from "@/lib/payments/paypalSettle";
import { settleSubscriptionSale } from "@/lib/payments/paypalSubscriptions";
import {
  getPaymentByCaptureId,
  updatePayment,
} from "@/lib/payments/repository";

/**
 * Webhook de PayPal (developer.paypal.com → tu app → Webhooks).
 *
 * - Aportes únicos: respaldo del retorno — si el donante cierra la pestaña
 *   después de pagar, el pago igual se confirma acá.
 * - Aportes mensuales: ÚNICA vía por la que llegan los cobros de cada mes
 *   (`PAYMENT.SALE.COMPLETED`). Sin webhook configurado, los meses siguientes
 *   al primero no se registran.
 *
 * - La firma se verifica con PayPal antes de mirar el contenido.
 * - No se confía en el cuerpo del evento: la orden o la venta se vuelve a
 *   pedir a PayPal y se concilia contra nuestro registro.
 * - Idempotente: PayPal reintenta hasta recibir 2xx; los ids de captura/venta
 *   son únicos en la base y los estados solo avanzan desde `pending`.
 * - 500 ante errores propios (base caída) para que PayPal reintente; 200 para
 *   eventos que no nos interesan.
 */

interface WebhookEvent {
  id: string;
  event_type: string;
  resource?: {
    id?: string;
    sale_id?: string;
    supplementary_data?: { related_ids?: { order_id?: string } };
    links?: { href: string; rel: string }[];
  };
}

const CAPTURE_EVENTS = new Set([
  "PAYMENT.CAPTURE.COMPLETED",
  "PAYMENT.CAPTURE.DENIED",
  "PAYMENT.CAPTURE.DECLINED",
  "PAYMENT.CAPTURE.PENDING",
]);

/** Pasa a `cancelled` un pago confirmado que PayPal reembolsó o revirtió. */
async function cancelRefunded(captureOrSaleId: string, note: string) {
  const payment = await getPaymentByCaptureId(captureOrSaleId);
  if (!payment.ok) return payment.error;
  if (payment.data.status !== "confirmed") return "not_confirmed";

  const updated = await updatePayment(payment.data.id, {
    status: "cancelled",
    notes: `PayPal: ${note}`,
  });
  if (!updated.ok)
    throw new Error(`update ${payment.data.id}: ${updated.error}`);
  revalidatePath("/dashboard/pagos");
  if (payment.data.project_slug)
    revalidatePath(`/proyectos/${payment.data.project_slug}`);
  return "cancelled";
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  let verified = false;
  try {
    verified = await verifyWebhookSignature(req.headers, rawBody);
  } catch (error) {
    console.error("[paypal] webhook: verificación falló", error);
    return NextResponse.json(
      { error: "verification_unavailable" },
      { status: 500 },
    );
  }
  if (!verified)
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });

  let event: WebhookEvent;
  try {
    event = JSON.parse(rawBody) as WebhookEvent;
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  try {
    const resource = event.resource;

    // Aporte único (Orders v2)
    if (CAPTURE_EVENTS.has(event.event_type)) {
      const orderId = resource?.supplementary_data?.related_ids?.order_id;
      if (!orderId) return NextResponse.json({ ignored: "no_order_id" });
      const settled = await settlePaypalOrder(await getOrder(orderId));
      return NextResponse.json({ status: settled.status });
    }

    // Cobro mensual de una suscripción
    if (event.event_type === "PAYMENT.SALE.COMPLETED") {
      if (!resource?.id) return NextResponse.json({ ignored: "no_sale_id" });
      const result = await settleSubscriptionSale(await getSale(resource.id));
      return NextResponse.json({ status: result });
    }

    // Reembolsos y disputas
    if (
      event.event_type === "PAYMENT.CAPTURE.REFUNDED" ||
      event.event_type === "PAYMENT.CAPTURE.REVERSED"
    ) {
      // El recurso es el reembolso; su link "up" apunta a la captura original.
      const up = resource?.links?.find((l) => l.rel === "up")?.href;
      const captureId = up?.split("/captures/")[1]?.split(/[/?]/)[0];
      if (!captureId) return NextResponse.json({ ignored: "no_capture_id" });
      const status = await cancelRefunded(
        captureId,
        event.event_type === "PAYMENT.CAPTURE.REFUNDED"
          ? "reembolsado"
          : "revertido (disputa)",
      );
      return NextResponse.json({ status });
    }
    if (event.event_type === "PAYMENT.SALE.REFUNDED") {
      if (!resource?.sale_id)
        return NextResponse.json({ ignored: "no_sale_id" });
      const status = await cancelRefunded(resource.sale_id, "reembolsado");
      return NextResponse.json({ status });
    }
    if (event.event_type === "PAYMENT.SALE.REVERSED") {
      if (!resource?.id) return NextResponse.json({ ignored: "no_sale_id" });
      const status = await cancelRefunded(resource.id, "revertido (disputa)");
      return NextResponse.json({ status });
    }

    return NextResponse.json({ ignored: event.event_type });
  } catch (error) {
    console.error(`[paypal] webhook ${event.id} (${event.event_type}):`, error);
    return NextResponse.json({ error: "processing_failed" }, { status: 500 });
  }
}
