import "server-only";

/**
 * Cliente mínimo de la API REST de PayPal (Orders v2 + verificación de
 * webhooks), con `fetch` — sin SDK. Solo servidor: usa el client secret.
 *
 * Entorno por `PAYPAL_ENV` (`sandbox` por defecto, `live` en producción).
 * Las credenciales sandbox y live son distintas: se generan en
 * developer.paypal.com → Apps & Credentials, cada una en su pestaña.
 */

const API_BASE =
  process.env.PAYPAL_ENV === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

export function isPaypalConfigured(): boolean {
  return Boolean(
    process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET,
  );
}

export class PaypalError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly issue?: string,
  ) {
    super(message);
  }
}

let cachedToken: { value: string; expiresAt: number } | null = null;

async function accessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.value;
  }
  const id = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!id || !secret) throw new PaypalError("PayPal no configurado", 500);

  const res = await fetch(`${API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) {
    throw new PaypalError(`OAuth PayPal falló (${res.status})`, res.status);
  }
  const json = (await res.json()) as {
    access_token: string;
    expires_in: number;
  };
  cachedToken = {
    value: json.access_token,
    expiresAt: Date.now() + json.expires_in * 1000,
  };
  return json.access_token;
}

async function paypalFetch<T>(
  path: string,
  init: { method: "GET" | "POST"; body?: string; requestId?: string },
): Promise<T> {
  const token = await accessToken();
  const res = await fetch(`${API_BASE}${path}`, {
    method: init.method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(init.requestId ? { "PayPal-Request-Id": init.requestId } : {}),
    },
    body: init.body,
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  const text = await res.text();
  const json = text ? JSON.parse(text) : {};
  if (!res.ok) {
    const issue = json?.details?.[0]?.issue as string | undefined;
    throw new PaypalError(
      `PayPal ${init.method} ${path} → ${res.status} ${issue ?? json?.name ?? ""}`,
      res.status,
      issue,
    );
  }
  return json as T;
}

// ─── Orders v2 ───────────────────────────────────────────────────────────

interface PaypalLink {
  href: string;
  rel: string;
}

interface PaypalCapture {
  id: string;
  status: string;
  amount: { currency_code: string; value: string };
  custom_id?: string;
}

export interface PaypalOrder {
  id: string;
  status: string;
  links?: PaypalLink[];
  purchase_units?: {
    custom_id?: string;
    amount?: { currency_code: string; value: string };
    payments?: { captures?: PaypalCapture[] };
  }[];
}

export async function createOrder(input: {
  paymentId: string;
  amountUsd: number;
  description: string;
  returnUrl: string;
  cancelUrl: string;
}): Promise<{ orderId: string; approveUrl: string }> {
  const order = await paypalFetch<PaypalOrder>("/v2/checkout/orders", {
    method: "POST",
    // Idempotencia: reintentar con el mismo id de pago no crea otra orden.
    requestId: input.paymentId,
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: input.paymentId,
          custom_id: input.paymentId,
          description: input.description.slice(0, 127),
          amount: { currency_code: "USD", value: input.amountUsd.toFixed(2) },
        },
      ],
      payment_source: {
        paypal: {
          experience_context: {
            brand_name: "Iglesia Maranatha",
            shipping_preference: "NO_SHIPPING",
            user_action: "PAY_NOW",
            landing_page: "NO_PREFERENCE",
            return_url: input.returnUrl,
            cancel_url: input.cancelUrl,
          },
        },
      },
    }),
  });

  const approveUrl = order.links?.find(
    (l) => l.rel === "payer-action" || l.rel === "approve",
  )?.href;
  if (!approveUrl) {
    throw new PaypalError("PayPal no devolvió link de aprobación", 502);
  }
  return { orderId: order.id, approveUrl };
}

export function getOrder(orderId: string): Promise<PaypalOrder> {
  return paypalFetch<PaypalOrder>(
    `/v2/checkout/orders/${encodeURIComponent(orderId)}`,
    { method: "GET" },
  );
}

/**
 * Captura la orden. Si ya estaba capturada (el webhook o un segundo retorno
 * llegó antes) devuelve la orden tal como está, en vez de fallar.
 */
export async function captureOrder(orderId: string): Promise<PaypalOrder> {
  try {
    return await paypalFetch<PaypalOrder>(
      `/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`,
      { method: "POST", body: "{}", requestId: `capture-${orderId}` },
    );
  } catch (error) {
    if (
      error instanceof PaypalError &&
      error.issue === "ORDER_ALREADY_CAPTURED"
    ) {
      return getOrder(orderId);
    }
    throw error;
  }
}

/** Primer capture de la orden (las nuestras tienen una sola unidad). */
export function firstCapture(order: PaypalOrder): {
  capture: PaypalCapture | null;
  customId: string | null;
} {
  const unit = order.purchase_units?.[0];
  return {
    capture: unit?.payments?.captures?.[0] ?? null,
    customId:
      unit?.custom_id ?? unit?.payments?.captures?.[0]?.custom_id ?? null,
  };
}

// ─── Webhooks ────────────────────────────────────────────────────────────

/**
 * Verifica la firma de un webhook reenviándolo a PayPal. El evento se manda
 * tal cual llegó (`rawBody`), sin re-serializar: si se parsea y se vuelve a
 * stringificar, cambia el orden/espaciado y la verificación falla.
 */
export async function verifyWebhookSignature(
  headers: Headers,
  rawBody: string,
): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) return false;

  const field = (name: string) => headers.get(name) ?? "";
  const meta = {
    auth_algo: field("paypal-auth-algo"),
    cert_url: field("paypal-cert-url"),
    transmission_id: field("paypal-transmission-id"),
    transmission_sig: field("paypal-transmission-sig"),
    transmission_time: field("paypal-transmission-time"),
    webhook_id: webhookId,
  };
  if (Object.values(meta).some((v) => !v)) return false;

  const body = `${JSON.stringify(meta).slice(0, -1)},"webhook_event":${rawBody}}`;
  const result = await paypalFetch<{ verification_status: string }>(
    "/v1/notifications/verify-webhook-signature",
    { method: "POST", body },
  );
  return result.verification_status === "SUCCESS";
}

// ─── Suscripciones (aportes mensuales) ──────────────────────────────────

export interface PaypalSubscription {
  id: string;
  status: string;
  plan_id?: string;
  custom_id?: string;
  links?: PaypalLink[];
  billing_info?: {
    last_payment?: {
      amount?: { currency_code: string; value: string };
      time?: string;
    };
  };
}

export interface PaypalSale {
  id: string;
  state: string;
  amount: { total: string; currency: string };
  billing_agreement_id?: string;
  custom?: string;
}

/** Producto de catálogo (una vez por cuenta y entorno). */
export async function createProduct(): Promise<string> {
  const product = await paypalFetch<{ id: string }>("/v1/catalogs/products", {
    method: "POST",
    body: JSON.stringify({
      name: "Aportes mensuales — Iglesia Maranatha",
      type: "SERVICE",
    }),
  });
  return product.id;
}

/**
 * Plan base mensual. El precio real de cada aporte se fija al crear la
 * suscripción (override de `fixed_price`), así que alcanza con un solo plan
 * para cualquier monto. `payment_failure_threshold: 3` suspende la
 * suscripción tras 3 cobros fallidos seguidos.
 */
export async function createMonthlyPlan(productId: string): Promise<string> {
  const plan = await paypalFetch<{ id: string }>("/v1/billing/plans", {
    method: "POST",
    body: JSON.stringify({
      product_id: productId,
      name: "Aporte mensual",
      status: "ACTIVE",
      billing_cycles: [
        {
          frequency: { interval_unit: "MONTH", interval_count: 1 },
          tenure_type: "REGULAR",
          sequence: 1,
          total_cycles: 0,
          pricing_scheme: {
            fixed_price: { value: "1.00", currency_code: "USD" },
          },
        },
      ],
      payment_preferences: {
        auto_bill_outstanding: true,
        payment_failure_threshold: 3,
      },
    }),
  });
  return plan.id;
}

export async function createSubscription(input: {
  paymentId: string;
  planId: string;
  amountUsd: number;
  email: string;
  returnUrl: string;
  cancelUrl: string;
}): Promise<{ subscriptionId: string; approveUrl: string }> {
  const subscription = await paypalFetch<PaypalSubscription>(
    "/v1/billing/subscriptions",
    {
      method: "POST",
      requestId: input.paymentId,
      body: JSON.stringify({
        plan_id: input.planId,
        custom_id: input.paymentId,
        subscriber: { email_address: input.email },
        plan: {
          billing_cycles: [
            {
              sequence: 1,
              pricing_scheme: {
                fixed_price: {
                  value: input.amountUsd.toFixed(2),
                  currency_code: "USD",
                },
              },
            },
          ],
        },
        application_context: {
          brand_name: "Iglesia Maranatha",
          shipping_preference: "NO_SHIPPING",
          user_action: "SUBSCRIBE_NOW",
          return_url: input.returnUrl,
          cancel_url: input.cancelUrl,
        },
      }),
    },
  );
  const approveUrl = subscription.links?.find((l) => l.rel === "approve")?.href;
  if (!approveUrl) {
    throw new PaypalError("PayPal no devolvió link de aprobación", 502);
  }
  return { subscriptionId: subscription.id, approveUrl };
}

export function getSubscription(id: string): Promise<PaypalSubscription> {
  return paypalFetch<PaypalSubscription>(
    `/v1/billing/subscriptions/${encodeURIComponent(id)}`,
    { method: "GET" },
  );
}

export function getSale(id: string): Promise<PaypalSale> {
  return paypalFetch<PaypalSale>(
    `/v1/payments/sale/${encodeURIComponent(id)}`,
    { method: "GET" },
  );
}

export function paypalEnv(): "sandbox" | "live" {
  return process.env.PAYPAL_ENV === "live" ? "live" : "sandbox";
}
