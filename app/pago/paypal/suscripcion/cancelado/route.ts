import { type NextRequest, NextResponse } from "next/server";
import {
  getSubscriptionSignup,
  transitionPayment,
} from "@/lib/payments/repository";
import { resultUrl } from "@/lib/payments/returnPaths";

/**
 * El donante no aprobó la suscripción. PayPal vuelve con `?subscription_id=`
 * (o solo con `token` en algunos flujos); si no se puede identificar, solo
 * se muestra el resultado — la fila queda pending y no suma nada.
 */
export async function GET(req: NextRequest) {
  const subscriptionId = req.nextUrl.searchParams.get("subscription_id");
  if (!subscriptionId || !/^I-[A-Z0-9]{5,40}$/.test(subscriptionId)) {
    return NextResponse.redirect(resultUrl(req.url, "cancelado"), 303);
  }

  const signup = await getSubscriptionSignup(subscriptionId);
  if (signup.ok && signup.data.status === "pending") {
    await transitionPayment(signup.data.id, "cancelled", {
      notes: "Suscripción no aprobada por el donante en PayPal.",
    });
  }
  return NextResponse.redirect(
    resultUrl(req.url, "cancelado", signup.ok ? signup.data : null),
    303,
  );
}
