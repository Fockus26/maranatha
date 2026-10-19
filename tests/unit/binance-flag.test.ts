import { afterEach, describe, expect, mock, test } from "bun:test";

// `methods.ts` es server-only; en los tests no hay frontera cliente/servidor.
mock.module("server-only", () => ({}));
const { getEnabledMethod } = await import("@/lib/payments/methods");

const KEYS = [
  "PAY_BINANCE_PAY_ID",
  "BINANCE_PAY_API_KEY",
  "BINANCE_PAY_SECRET_KEY",
] as const;
const saved = Object.fromEntries(KEYS.map((k) => [k, process.env[k]]));

afterEach(() => {
  for (const k of KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
});

describe("Binance · feature flag por entorno", () => {
  test("sin credenciales de comercio: método manual con su Pay ID", () => {
    process.env.PAY_BINANCE_PAY_ID = "123456789";
    delete process.env.BINANCE_PAY_API_KEY;
    delete process.env.BINANCE_PAY_SECRET_KEY;
    const method = getEnabledMethod("binance");
    expect(method?.kind).toBe("manual");
    expect(method?.details[0]?.value).toBe("123456789");
  });

  test("con una sola credencial sigue manual", () => {
    process.env.PAY_BINANCE_PAY_ID = "123456789";
    process.env.BINANCE_PAY_API_KEY = "key";
    delete process.env.BINANCE_PAY_SECRET_KEY;
    expect(getEnabledMethod("binance")?.kind).toBe("manual");
  });

  test("con API key + secret: pasarela, sin exponer credenciales", () => {
    delete process.env.PAY_BINANCE_PAY_ID;
    process.env.BINANCE_PAY_API_KEY = "key";
    process.env.BINANCE_PAY_SECRET_KEY = "secret";
    const method = getEnabledMethod("binance");
    expect(method?.kind).toBe("gateway");
    expect(method?.details).toEqual([]);
    expect(method?.referenceHint).toBe("");
    expect(JSON.stringify(method)).not.toContain("secret");
  });

  test("sin nada configurado: no se ofrece", () => {
    for (const k of KEYS) delete process.env[k];
    expect(getEnabledMethod("binance")).toBeNull();
  });
});
