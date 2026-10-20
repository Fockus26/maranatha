import "server-only";
import {
  binanceSafeText,
  signedHeaders,
  tradeNoFromPaymentId,
  verifyWebhookSignature as verifyRsa,
} from "./binanceCore";

/**
 * Cliente mínimo de Binance Pay Merchant (crear y consultar órdenes,
 * certificado de los webhooks), con `fetch` — sin SDK. Solo servidor: firma
 * con la secret key.
 *
 * Feature flag: sin `BINANCE_PAY_API_KEY` + `BINANCE_PAY_SECRET_KEY` el
 * método Binance sigue siendo manual (el donante reporta el ID de la orden y
 * un admin lo aprueba). Las credenciales se generan en el Merchant Admin
 * Portal de Binance Pay, que exige una cuenta de comercio verificada (KYB).
 */

const API_BASE = "https://bpay.binanceapi.com";

export function isBinancePayConfigured(): boolean {
  return Boolean(
    process.env.BINANCE_PAY_API_KEY?.trim() &&
      process.env.BINANCE_PAY_SECRET_KEY?.trim(),
  );
}

export class BinancePayError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
  }
}

interface Envelope<T> {
  status: "SUCCESS" | "FAIL";
  code: string;
  data?: T;
  errorMessage?: string;
}

async function binanceFetch<T>(path: string, payload: object): Promise<T> {
  const apiKey = process.env.BINANCE_PAY_API_KEY?.trim();
  const secretKey = process.env.BINANCE_PAY_SECRET_KEY?.trim();
  if (!apiKey || !secretKey)
    throw new BinancePayError("Binance Pay no configurado", 500);

  // Se firma exactamente el string que se envía.
  const body = JSON.stringify(payload);
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: signedHeaders(apiKey, secretKey, body),
    body,
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  const text = await res.text();
  let json: Envelope<T>;
  try {
    json = JSON.parse(text) as Envelope<T>;
  } catch {
    throw new BinancePayError(
      `Binance Pay ${path} → ${res.status} (respuesta no JSON)`,
      res.status,
    );
  }
  if (!res.ok || json.status !== "SUCCESS" || json.data === undefined) {
    throw new BinancePayError(
      `Binance Pay ${path} → ${res.status} ${json.code ?? ""} ${json.errorMessage ?? ""}`.trim(),
      res.status,
      json.code,
    );
  }
  return json.data;
}

// ─── Órdenes ─────────────────────────────────────────────────────────────

export async function createOrder(input: {
  paymentId: string;
  amountUsdt: number;
  goodsName: string;
  description: string;
  returnUrl: string;
  cancelUrl: string;
  webhookUrl: string;
}): Promise<{ prepayId: string; checkoutUrl: string }> {
  const merchantTradeNo = tradeNoFromPaymentId(input.paymentId);
  const order = await binanceFetch<{
    prepayId: string;
    checkoutUrl: string;
  }>("/binancepay/openapi/v3/order", {
    env: { terminalType: "WEB" },
    merchantTradeNo,
    orderAmount: Number(input.amountUsdt.toFixed(2)),
    currency: "USDT",
    description: binanceSafeText(input.description, 256),
    goodsDetails: [
      {
        goodsType: "02", // virtual
        goodsCategory: "Z000", // otros
        referenceGoodsId: merchantTradeNo,
        goodsName: binanceSafeText(input.goodsName, 256),
      },
    ],
    returnUrl: input.returnUrl,
    cancelUrl: input.cancelUrl,
    // Tiene prioridad sobre la URL configurada en el Merchant Admin Portal.
    webhookUrl: input.webhookUrl,
  });
  if (!order.checkoutUrl) {
    throw new BinancePayError("Binance Pay no devolvió checkoutUrl", 502);
  }
  return { prepayId: String(order.prepayId), checkoutUrl: order.checkoutUrl };
}

export interface BinanceOrder {
  merchantTradeNo: string;
  prepayId: string;
  transactionId?: string;
  status: string;
  currency: string;
  orderAmount: string | number;
}

export function queryOrder(paymentId: string): Promise<BinanceOrder> {
  return binanceFetch<BinanceOrder>("/binancepay/openapi/v2/order/query", {
    merchantTradeNo: tradeNoFromPaymentId(paymentId),
  });
}

// ─── Webhooks ────────────────────────────────────────────────────────────

let cachedCert: { serial: string; publicKey: string } | null = null;

async function fetchCertificate(): Promise<{
  serial: string;
  publicKey: string;
}> {
  const data = await binanceFetch<
    | { certSerial: string; certPublic: string }
    | { certSerial: string; certPublic: string }[]
  >("/binancepay/openapi/certificates", {});
  const cert = Array.isArray(data) ? data[0] : data;
  if (!cert?.certPublic)
    throw new BinancePayError("Binance Pay no devolvió certificado", 502);
  cachedCert = { serial: cert.certSerial, publicKey: cert.certPublic };
  return cachedCert;
}

/**
 * Verifica que el webhook venga de Binance Pay. La clave pública se pide a
 * la API y se cachea; si el header trae otro número de serie (Binance rotó
 * el certificado) se vuelve a pedir una vez.
 */
export async function verifyWebhook(
  headers: Headers,
  rawBody: string,
): Promise<boolean> {
  const serial = headers.get("binancepay-certificate-sn") ?? "";
  const signed = {
    timestamp: headers.get("binancepay-timestamp") ?? "",
    nonce: headers.get("binancepay-nonce") ?? "",
    signature: headers.get("binancepay-signature") ?? "",
    rawBody,
  };
  if (!signed.timestamp || !signed.nonce || !signed.signature) return false;

  let cert = cachedCert;
  if (!cert || (serial && cert.serial !== serial))
    cert = await fetchCertificate();
  return verifyRsa({ ...signed, publicKey: cert.publicKey });
}
