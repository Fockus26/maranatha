import { describe, expect, test } from "bun:test";
import { createHmac, createSign, generateKeyPairSync } from "node:crypto";
import {
  amountMatches,
  binanceSafeText,
  makeNonce,
  outcomeFromOrderStatus,
  outcomeFromWebhook,
  parseWebhook,
  paymentIdFromTradeNo,
  signaturePayload,
  signedHeaders,
  signRequest,
  toPem,
  tradeNoFromPaymentId,
  verifyWebhookSignature,
} from "@/lib/payments/binanceCore";

describe("Binance Pay · firma de peticiones (HMAC-SHA512)", () => {
  test("payload: timestamp, nonce y body, cada uno seguido de LF", () => {
    expect(signaturePayload("1", "abc", "{}")).toBe("1\nabc\n{}\n");
  });

  test("firma = HMAC-SHA512 del payload, en hex mayúsculas", () => {
    const body = '{"merchantTradeNo":"abc"}';
    const expected = createHmac("sha512", "secreto")
      .update(`1700000000000\nNONCE\n${body}\n`)
      .digest("hex")
      .toUpperCase();
    const sig = signRequest("secreto", "1700000000000", "NONCE", body);
    expect(sig).toBe(expected);
    expect(sig).toMatch(/^[0-9A-F]{128}$/);
  });

  test("headers firmados con la API key como Certificate-SN", () => {
    const headers = signedHeaders("KEY", "secreto", "{}", 1700000000000, "N");
    expect(headers["BinancePay-Timestamp"]).toBe("1700000000000");
    expect(headers["BinancePay-Nonce"]).toBe("N");
    expect(headers["BinancePay-Certificate-SN"]).toBe("KEY");
    expect(headers["BinancePay-Signature"]).toBe(
      signRequest("secreto", "1700000000000", "N", "{}"),
    );
  });

  test("nonce: 32 letras ASCII", () => {
    expect(makeNonce()).toMatch(/^[A-Za-z]{32}$/);
    expect(makeNonce()).not.toBe(makeNonce());
  });
});

describe("Binance Pay · firma de webhooks (RSA-SHA256)", () => {
  const { publicKey, privateKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
  });
  const pem = publicKey.export({ type: "spki", format: "pem" }).toString();
  const rawBody =
    '{"bizType":"PAY","bizIdStr":"29383937493038367292","bizStatus":"PAY_SUCCESS","data":"{}"}';
  const timestamp = "1700000000000";
  const nonce = "abcdefghijklmnopqrstuvwxyzABCDEF";
  const signature = createSign("RSA-SHA256")
    .update(signaturePayload(timestamp, nonce, rawBody))
    .sign(privateKey, "base64");

  test("acepta la firma correcta (PEM y base64 pelado)", () => {
    const input = { publicKey: pem, timestamp, nonce, signature, rawBody };
    expect(verifyWebhookSignature(input)).toBe(true);
    const bare = pem.replace(/-----[^-]+-----|\s/g, "");
    expect(verifyWebhookSignature({ ...input, publicKey: bare })).toBe(true);
  });

  test("rechaza cuerpo, nonce o timestamp alterados", () => {
    const base = { publicKey: pem, timestamp, nonce, signature, rawBody };
    expect(
      verifyWebhookSignature({
        ...base,
        rawBody: rawBody.replace("PAY_SUCCESS", "PAY_CLOSED"),
      }),
    ).toBe(false);
    expect(
      verifyWebhookSignature({ ...base, nonce: `${nonce.slice(1)}x` }),
    ).toBe(false);
    expect(
      verifyWebhookSignature({ ...base, timestamp: "1700000000001" }),
    ).toBe(false);
  });

  test("rechaza firma vacía, basura o clave inválida sin lanzar", () => {
    const base = { publicKey: pem, timestamp, nonce, signature, rawBody };
    expect(verifyWebhookSignature({ ...base, signature: "" })).toBe(false);
    expect(verifyWebhookSignature({ ...base, signature: "no-es-base64" })).toBe(
      false,
    );
    expect(verifyWebhookSignature({ ...base, publicKey: "basura" })).toBe(
      false,
    );
  });

  test("toPem envuelve una clave sin cabeceras", () => {
    expect(toPem("QUJD")).toBe(
      "-----BEGIN PUBLIC KEY-----\nQUJD\n-----END PUBLIC KEY-----",
    );
    expect(toPem(` ${pem} `)).toBe(pem.trim());
  });
});

describe("Binance Pay · mapeo de estados", () => {
  test("webhook: PAY_SUCCESS confirma, PAY_CLOSED cancela, el resto se ignora", () => {
    expect(outcomeFromWebhook("PAY", "PAY_SUCCESS")).toBe("paid");
    expect(outcomeFromWebhook("PAY", "PAY_CLOSED")).toBe("closed");
    expect(outcomeFromWebhook("PAY", "PAY_FAIL")).toBe("ignored");
    expect(outcomeFromWebhook("PAY_REFUND", "PAY_SUCCESS")).toBe("ignored");
  });

  test("consulta de orden", () => {
    expect(outcomeFromOrderStatus("PAID")).toBe("paid");
    expect(outcomeFromOrderStatus("INITIAL")).toBe("pending");
    expect(outcomeFromOrderStatus("PENDING")).toBe("pending");
    expect(outcomeFromOrderStatus("CANCELED")).toBe("closed");
    expect(outcomeFromOrderStatus("EXPIRED")).toBe("closed");
    expect(outcomeFromOrderStatus("ERROR")).toBe("closed");
    expect(outcomeFromOrderStatus("REFUNDED")).toBe("ignored");
    expect(outcomeFromOrderStatus("FULL_REFUNDED")).toBe("ignored");
  });

  test("parseWebhook decodifica `data` (JSON dentro de un string)", () => {
    const raw = JSON.stringify({
      bizType: "PAY",
      bizIdStr: "1",
      bizStatus: "PAY_SUCCESS",
      data: JSON.stringify({
        merchantTradeNo: "a".repeat(32),
        totalFee: 10.5,
        currency: "USDT",
        transactionId: "M_P_1",
      }),
    });
    const parsed = parseWebhook(raw);
    expect(parsed?.order).toMatchObject({ totalFee: 10.5, currency: "USDT" });
    expect(parseWebhook("no json")).toBeNull();
    expect(
      parseWebhook('{"bizType":"PAY","bizStatus":"PAY_SUCCESS","data":"{"}')
        ?.order,
    ).toBeNull();
  });
});

describe("Binance Pay · identificadores y montos", () => {
  const id = "3f2b6c1e-9a4d-4e8f-b0c7-12ab34cd56ef";

  test("merchantTradeNo = UUID sin guiones (32 alfanuméricos) e inverso", () => {
    const tradeNo = tradeNoFromPaymentId(id);
    expect(tradeNo).toMatch(/^[0-9a-f]{32}$/);
    expect(paymentIdFromTradeNo(tradeNo)).toBe(id);
    expect(paymentIdFromTradeNo("ajeno-123")).toBeNull();
    expect(() => tradeNoFromPaymentId("x")).toThrow();
  });

  test("textos sin tildes ni caracteres especiales", () => {
    expect(binanceSafeText('Aporte a "Construcción" 🙏 — Maranatha', 256)).toBe(
      "Aporte a Construccion Maranatha",
    );
    expect(binanceSafeText("Diezmo", 3)).toBe("Die");
  });

  test("monto: tolera menos de medio centavo", () => {
    expect(amountMatches("10.00", 10)).toBe(true);
    expect(amountMatches(10.004, 10)).toBe(true);
    expect(amountMatches(10.01, 10)).toBe(false);
    expect(amountMatches("abc", 10)).toBe(false);
  });
});
