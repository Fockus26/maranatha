import { revalidatePath } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { getOrder, verifyWebhookSignature } from "@/lib/payments/paypal";
import { settlePaypalOrder } from "@/lib/payments/paypalSettle";
import {
  getPaymentByCaptureId,
  updatePayment,
} from "@/lib/payments/repository";

/**
 * Webhook de PayPal (developer.paypal.com → tu app → Webhooks). Respaldo del
 * retorno: si el donante cierra la pestaña después de pagar, el pago igual se
 * confirma acá.
 *
 * - La firma se verifica con PayPal antes de mirar el contenido.
 * - No se confía en el cuerpo del evento: con el id de orden se vuelve a
 *   pedir la orden a PayPal y se concilia igual que en el retorno.
 * - Idempotente: PayPal reintenta hasta recibir 2xx, y `settlePaypalOrder`
 *   solo mueve pagos `pending`.
 * - 500 ante errores propios (base caída) para que PayPal reintente; 200 para
 *   eventos que no nos interesan.
 */

interface WebhookEvent {
  id: string;
  event_type: string;
  resource?: {
    id?: string;
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
const REFUND_EVENTS = new Set([
  "PAYMENT.CAPTURE.REFUNDED",
  "PAYMENT.CAPTURE.REVERSED",
]);

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
    if (CAPTURE_EVENTS.has(event.event_type)) {
      const orderId = event.resource?.supplementary_data?.related_ids?.order_id;
      if (!orderId) return NextResponse.json({ ignored: "no_order_id" });
      const settled = await settlePaypalOrder(await getOrder(orderId));
      return NextResponse.json({ status: settled.status });
    }

    if (REFUND_EVENTS.has(event.event_type)) {
      // El recurso es el reembolso; su link "up" apunta a la captura original.
      const up = event.resource?.links?.find((l) => l.rel === "up")?.href;
      const captureId = up?.split("/captures/")[1]?.split(/[/?]/)[0];
      if (!captureId) return NextResponse.json({ ignored: "no_capture_id" });
      const payment = await getPaymentByCaptureId(captureId);
      if (!payment.ok) return NextResponse.json({ ignored: payment.error });
      if (payment.data.status === "confirmed") {
        const updated = await updatePayment(payment.data.id, {
          status: "cancelled",
          notes: `PayPal: ${event.event_type === "PAYMENT.CAPTURE.REFUNDED" ? "reembolsado" : "revertido (disputa)"}`,
        });
        if (!updated.ok)
          throw new Error(`update ${payment.data.id}: ${updated.error}`);
        revalidatePath("/dashboard/pagos");
        if (payment.data.project_slug)
          revalidatePath(`/proyectos/${payment.data.project_slug}`);
      }
      return NextResponse.json({ status: "refunded" });
    }

    return NextResponse.json({ ignored: event.event_type });
  } catch (error) {
    console.error(`[paypal] webhook ${event.id} (${event.event_type}):`, error);
    return NextResponse.json({ error: "processing_failed" }, { status: 500 });
  }
}
