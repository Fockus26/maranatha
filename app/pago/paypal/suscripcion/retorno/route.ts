import { type NextRequest, NextResponse } from "next/server";
import { getSubscription, PaypalError } from "@/lib/payments/paypal";
import { settleSubscriptionReturn } from "@/lib/payments/paypalSubscriptions";
import { getSubscriptionSignup } from "@/lib/payments/repository";
import { resultUrl } from "@/lib/payments/returnPaths";

/**
 * Retorno tras aprobar una suscripción mensual
 * (`?subscription_id=I-…&ba_token=…&token=…`). Se re-consulta la suscripción
 * a PayPal; los cobros de cada mes llegan por webhook.
 */
export async function GET(req: NextRequest) {
  const subscriptionId = req.nextUrl.searchParams.get("subscription_id");
  if (!subscriptionId || !/^I-[A-Z0-9]{5,40}$/.test(subscriptionId)) {
    return NextResponse.redirect(resultUrl(req.url, "error"), 303);
  }

  const known = await getSubscriptionSignup(subscriptionId);
  if (!known.ok) return NextResponse.redirect(resultUrl(req.url, "error"), 303);

  try {
    const settled = await settleSubscriptionReturn(
      await getSubscription(subscriptionId),
    );
    // Aprobada = el aporte mensual quedó activo, aunque el primer cobro
    // todavía se esté procesando (lo confirma el webhook).
    const outcome = settled.status === "failed" ? "error" : "suscrito";
    return NextResponse.redirect(resultUrl(req.url, outcome, known.data), 303);
  } catch (error) {
    console.error(
      "[paypal] retorno suscripción:",
      error instanceof PaypalError ? error.message : error,
    );
    return NextResponse.redirect(resultUrl(req.url, "error", known.data), 303);
  }
}
