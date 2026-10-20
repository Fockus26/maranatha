import { createHmac, createVerify, randomInt } from "node:crypto";

/**
 * Piezas puras de Binance Pay Merchant (sin red ni base): firma de las
 * peticiones, verificación de la firma de los webhooks y traducción de los
 * estados de Binance a lo que hacemos con el pago. Separadas de `binance.ts`
 * (server-only) para poder probarlas con `bun test`.
 *
 * Referencia: developers.binance.com/docs/binance-pay — "API Common Rules"
 * (firma HMAC-SHA512) y "Webhook Common Rules" (firma RSA-SHA256).
 */

// ─── Firma de peticiones ─────────────────────────────────────────────────

const NONCE_CHARS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

/** 32 letras ASCII al azar, como pide `BinancePay-Nonce`. */
export function makeNonce(): string {
  let nonce = "";
  for (let i = 0; i < 32; i++)
    nonce += NONCE_CHARS[randomInt(NONCE_CHARS.length)];
  return nonce;
}

/** `timestamp \n nonce \n body \n` — mismo formato para peticiones y webhooks. */
export function signaturePayload(
  timestamp: string,
  nonce: string,
  body: string,
): string {
  return `${timestamp}\n${nonce}\n${body}\n`;
}

/** Firma de una petición: HMAC-SHA512 con la secret key, en hex mayúsculas. */
export function signRequest(
  secretKey: string,
  timestamp: string,
  nonce: string,
  body: string,
): string {
  return createHmac("sha512", secretKey)
    .update(signaturePayload(timestamp, nonce, body), "utf8")
    .digest("hex")
    .toUpperCase();
}

/** Headers firmados para una llamada a la API (`body` = JSON exacto que se envía). */
export function signedHeaders(
  apiKey: string,
  secretKey: string,
  body: string,
  now: number = Date.now(),
  nonce: string = makeNonce(),
): Record<string, string> {
  const timestamp = String(now);
  return {
    "Content-Type": "application/json",
    "BinancePay-Timestamp": timestamp,
    "BinancePay-Nonce": nonce,
    "BinancePay-Certificate-SN": apiKey,
    "BinancePay-Signature": signRequest(secretKey, timestamp, nonce, body),
  };
}

// ─── Webhooks ────────────────────────────────────────────────────────────

/**
 * `certPublic` llega como PEM o como base64 pelado según la versión de la
 * API: se normaliza a PEM para `crypto`.
 */
export function toPem(certPublic: string): string {
  const trimmed = certPublic.trim();
  if (trimmed.startsWith("-----BEGIN")) return trimmed;
  const body =
    trimmed
      .replace(/\s+/g, "")
      .match(/.{1,64}/g)
      ?.join("\n") ?? "";
  return `-----BEGIN PUBLIC KEY-----\n${body}\n-----END PUBLIC KEY-----`;
}

/**
 * Verifica la firma de un webhook: RSA con SHA-256 sobre
 * `timestamp \n nonce \n body \n`, con la firma en base64. El cuerpo va tal
 * cual llegó (`rawBody`): re-serializarlo cambia los bytes y la firma falla.
 */
export function verifyWebhookSignature(input: {
  publicKey: string;
  timestamp: string;
  nonce: string;
  signature: string;
  rawBody: string;
}): boolean {
  if (!input.timestamp || !input.nonce || !input.signature) return false;
  try {
    return createVerify("RSA-SHA256")
      .update(
        signaturePayload(input.timestamp, input.nonce, input.rawBody),
        "utf8",
      )
      .verify(toPem(input.publicKey), input.signature, "base64");
  } catch {
    return false;
  }
}

/** Notificación de orden (`bizType: "PAY"`). `data` llega como JSON en string. */
export interface BinanceWebhookEvent {
  bizType: string;
  bizId?: number | string;
  bizIdStr?: string;
  bizStatus: string;
  data: string;
}

export interface BinanceWebhookOrder {
  merchantTradeNo: string;
  totalFee: number | string;
  currency: string;
  transactionId?: string;
}

/** Cuerpo del webhook → evento + datos de la orden, o `null` si no tiene forma. */
export function parseWebhook(
  rawBody: string,
): { event: BinanceWebhookEvent; order: BinanceWebhookOrder | null } | null {
  let event: BinanceWebhookEvent;
  try {
    event = JSON.parse(rawBody) as BinanceWebhookEvent;
  } catch {
    return null;
  }
  if (!event || typeof event.bizType !== "string") return null;
  let order: BinanceWebhookOrder | null = null;
  try {
    const data =
      typeof event.data === "string" ? JSON.parse(event.data) : event.data;
    if (data && typeof data.merchantTradeNo === "string") order = data;
  } catch {
    order = null;
  }
  return { event, order };
}

// ─── Estados ─────────────────────────────────────────────────────────────

/**
 * Lo que hacemos con nuestro pago según lo que dice Binance:
 * - `paid`: se cobró → confirmar (si el monto coincide).
 * - `closed`: la orden se cerró sin cobro (expiró o se canceló) → cancelar.
 * - `pending`: todavía puede pagarse → nada.
 * - `ignored`: no aplica a un aporte único (reembolsos, débito directo).
 */
export type BinanceOutcome = "paid" | "closed" | "pending" | "ignored";

/** `bizStatus` del webhook. En órdenes normales solo llegan PAY_SUCCESS y PAY_CLOSED. */
export function outcomeFromWebhook(
  bizType: string,
  bizStatus: string,
): BinanceOutcome {
  if (bizType !== "PAY") return "ignored";
  if (bizStatus === "PAY_SUCCESS") return "paid";
  if (bizStatus === "PAY_CLOSED") return "closed";
  return "ignored";
}

/** `data.status` de la consulta de orden (v2/order/query). */
export function outcomeFromOrderStatus(status: string): BinanceOutcome {
  switch (status) {
    case "PAID":
      return "paid";
    case "INITIAL":
    case "PENDING":
      return "pending";
    case "CANCELED":
    case "EXPIRED":
    case "ERROR":
      return "closed";
    default:
      // REFUNDING / REFUNDED / FULL_REFUNDED: se resuelven a mano en Binance.
      return "ignored";
  }
}

// ─── Identificadores y textos ────────────────────────────────────────────

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * `merchantTradeNo` admite solo letras y dígitos, máx. 32: el id del pago
 * (UUID) sin guiones mide justo 32.
 */
export function tradeNoFromPaymentId(paymentId: string): string {
  if (!UUID_RE.test(paymentId)) throw new Error("id de pago inválido");
  return paymentId.replace(/-/g, "").toLowerCase();
}

/** Inverso de `tradeNoFromPaymentId`; `null` si no es uno nuestro. */
export function paymentIdFromTradeNo(tradeNo: string): string | null {
  if (!/^[0-9a-f]{32}$/i.test(tradeNo)) return null;
  const t = tradeNo.toLowerCase();
  return `${t.slice(0, 8)}-${t.slice(8, 12)}-${t.slice(12, 16)}-${t.slice(16, 20)}-${t.slice(20)}`;
}

/**
 * `goodsName` y `description` no admiten caracteres especiales ni emoji:
 * se quitan tildes y todo lo que no sea letra, dígito o puntuación simple.
 */
export function binanceSafeText(text: string, max: number): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9 .,()-]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

/** ¿El monto cobrado es el esperado? (centavo de tolerancia por redondeo). */
export function amountMatches(
  paid: number | string,
  expected: number,
): boolean {
  const value = Number(paid);
  return Number.isFinite(value) && Math.abs(value - expected) < 0.005;
}
