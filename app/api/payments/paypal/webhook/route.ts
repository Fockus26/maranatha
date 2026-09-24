import { revalidatePath } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import {
  captureOrder,
  getCapture,
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
 * - Aportes únicos: respaldo del retorno. Si el donante aprueba y cierra la
 *   pestaña antes de volver, `CHECKOUT.ORDER.APPROVED` captura la orden acá;
 *   `PAYMENT.CAPTURE.*` concilia el resultado.
 * - Aportes mensuales: ÚNICA vía por la que llegan los cobros de cada mes
 *   (`PAYMENT.SALE.COMPLETED`). Sin webhook configurado, los meses siguientes
 *   al primero no se registran.
 *
 * - Eventos que no manejamos se descartan antes de verificar (no se gasta
 *   una llamada a PayPal por cada POST arbitrario).
 * - La firma se verifica con PayPal antes de actuar.
 * - No se confía en el cuerpo del evento: la orden, captura o venta se
 *   vuelve a pedir a PayPal y se concilia contra nuestro registro.
 * - Idempotente: PayPal reintenta hasta recibir 2xx; los ids de captura/venta
 *   son únicos en la base y los estados solo avanzan desde pending/cancelled.
 * - 500 ante errores propios (base caída, webhook sin configurar) para que
 *   PayPal reintente; 200 para eventos ignorados.
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
const HANDLED_EVENTS = new Set([
  ...CAPTURE_EVENTS,
  "CHECKOUT.ORDER.APPROVED",
  "PAYMENT.CAPTURE.REFUNDED",
  "PAYMENT.CAPTURE.REVERSED",
  "PAYMENT.SALE.COMPLETED",
  "PAYMENT.SALE.REFUNDED",
  "PAYMENT.SALE.REVERSED",
]);

/**
 * Reembolso o disputa sobre un pago confirmado. Se consulta el estado real
 * de la captura/venta: si fue total, el pago deja de sumar (`cancelled`); si
 * fue parcial, solo se anota — descontar el monto completo por un reembolso
 * de $5 sobre $100 sería peor que no descontar nada.
 */
async function applyRefund(
  captureOrSaleId: string,
  fullyRefunded: boolean,
  label: string,
) {
  const payment = await getPaymentByCaptureId(captureOrSaleId);
  if (!payment.ok) return payment.error;
  if (payment.data.status !== "confirmed") return "not_confirmed";

  const updated = await updatePayment(
    payment.data.id,
    fullyRefunded
      ? { status: "cancelled", notes: `PayPal: ${label}` }
      : {
          notes: `${payment.data.notes ? `${payment.data.notes} · ` : ""}PayPal: ${label} parcial`,
        },
  );
  if (!updated.ok)
    throw new Error(`update ${payment.data.id}: ${updated.error}`);
  revalidatePath("/dashboard/pagos");
  if (payment.data.project_slug)
    revalidatePath(`/proyectos/${payment.data.project_slug}`);
  return fullyRefunded ? "cancelled" : "partial_noted";
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  let event: WebhookEvent;
  try {
    event = JSON.parse(rawBody) as WebhookEvent;
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  if (!HANDLED_EVENTS.has(event.event_type)) {
    return NextResponse.json({ ignored: event.event_type ?? "unknown" });
  }

  if (!process.env.PAYPAL_WEBHOOK_ID) {
    // Sin esto no se puede verificar la firma: se responde 500 para que PayPal
    // reintente cuando la variable esté configurada, y queda en los logs.
    console.error(
      "[paypal] webhook: falta PAYPAL_WEBHOOK_ID — no se pueden procesar eventos",
    );
    return NextResponse.json(
      { error: "webhook_not_configured" },
      { status: 500 },
    );
  }

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

  try {
    const resource = event.resource;

    // Orden aprobada sin retorno (pestaña cerrada): se captura acá.
    if (event.event_type === "CHECKOUT.ORDER.APPROVED") {
      if (!resource?.id) return NextResponse.json({ ignored: "no_order_id" });
      const settled = await settlePaypalOrder(await captureOrder(resource.id));
      return NextResponse.json({ status: settled.status });
    }

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

    // Reembolsos y disputas de aportes únicos
    if (
      event.event_type === "PAYMENT.CAPTURE.REFUNDED" ||
      event.event_type === "PAYMENT.CAPTURE.REVERSED"
    ) {
      // Si el recurso es un reembolso, su link "up" apunta a la captura
      // original; si no lo tiene, el recurso es la captura misma.
      const up = resource?.links?.find((l) => l.rel === "up")?.href;
      const captureId =
        up?.split("/captures/")[1]?.split(/[/?]/)[0] ?? resource?.id;
      if (!captureId) return NextResponse.json({ ignored: "no_capture_id" });
      const capture = await getCapture(captureId);
      const status = await applyRefund(
        captureId,
        capture.status !== "PARTIALLY_REFUNDED",
        event.event_type === "PAYMENT.CAPTURE.REFUNDED"
          ? "reembolsado"
          : "revertido (disputa)",
      );
      return NextResponse.json({ status });
    }

    // Reembolsos y disputas de cobros mensuales
    if (
      event.event_type === "PAYMENT.SALE.REFUNDED" ||
      event.event_type === "PAYMENT.SALE.REVERSED"
    ) {
      const saleId =
        event.event_type === "PAYMENT.SALE.REFUNDED"
          ? resource?.sale_id
          : resource?.id;
      if (!saleId) return NextResponse.json({ ignored: "no_sale_id" });
      const sale = await getSale(saleId);
      const status = await applyRefund(
        saleId,
        sale.state !== "partially_refunded",
        event.event_type === "PAYMENT.SALE.REFUNDED"
          ? "reembolsado"
          : "revertido (disputa)",
      );
      return NextResponse.json({ status });
    }

    return NextResponse.json({ ignored: event.event_type });
  } catch (error) {
    console.error(`[paypal] webhook ${event.id} (${event.event_type}):`, error);
    return NextResponse.json({ error: "processing_failed" }, { status: 500 });
  }
}
