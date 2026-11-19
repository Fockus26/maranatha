import { describe, expect, mock, test } from "bun:test";

mock.module("server-only", () => ({}));

const { METHOD_LABEL } = await import("@/lib/payments/labels");
const { getEnabledMethod, getEnabledMethods } = await import(
  "@/lib/payments/methods"
);
const {
  MANUAL_METHOD_IDS,
  PAYMENT_METHOD_IDS,
  RETIRED_METHOD_IDS,
  manualReportSchema,
} = await import("@/lib/payments/schema");

const report = {
  reference: "AB-1234",
  paidAt: "2026-10-01",
  amountPaid: "26.00",
};

describe("D100: Zinli y Wally retirados", () => {
  test("el reporte manual rechaza zinli y wally", () => {
    for (const method of ["zinli", "wally"])
      expect(manualReportSchema.safeParse({ ...report, method }).success).toBe(
        false,
      );
  });

  test("el reporte manual acepta los demás métodos manuales", () => {
    for (const method of ["pagomovil", "zelle", "bancolombia", "binance"])
      expect(manualReportSchema.safeParse({ ...report, method }).success).toBe(
        true,
      );
    expect([...MANUAL_METHOD_IDS].sort()).toEqual(
      ["bancolombia", "binance", "pagomovil", "zelle"].sort(),
    );
  });

  test("no se ofrecen aunque sus variables PAY_* sigan definidas", () => {
    const env = {
      PAY_ZINLI_EMAIL: "zinli@ejemplo.com",
      PAY_WALLY_ACCOUNT: "0414-0000000",
      PAY_ZELLE_EMAIL: "zelle@ejemplo.com",
      PAY_ZELLE_NAME: "Iglesia",
    };
    const saved = Object.fromEntries(
      Object.keys(env).map((k) => [k, process.env[k]]),
    );
    Object.assign(process.env, env);
    try {
      const ids = getEnabledMethods().map((m) => m.id as string);
      expect(ids).toContain("zelle");
      expect(ids).not.toContain("zinli");
      expect(ids).not.toContain("wally");
      // getEnabledMethod ya no admite el id por tipo; en tiempo de ejecución
      // (un id que llegue sin tipar) tampoco lo resuelve.
      const lookup = getEnabledMethod as (id: string) => unknown;
      expect(lookup("zinli")).toBeNull();
      expect(lookup("wally")).toBeNull();
    } finally {
      for (const [k, v] of Object.entries(saved)) {
        if (v === undefined) delete process.env[k];
        else process.env[k] = v;
      }
    }
  });

  test("un pago viejo con zinli o wally sigue teniendo etiqueta", () => {
    expect(PAYMENT_METHOD_IDS).toContain("zinli");
    expect(PAYMENT_METHOD_IDS).toContain("wally");
    expect(METHOD_LABEL.zinli).toBe("Zinli");
    expect(METHOD_LABEL.wally).toBe("Wally");
    for (const id of PAYMENT_METHOD_IDS) expect(METHOD_LABEL[id]).toBeTruthy();
    expect([...RETIRED_METHOD_IDS]).toEqual(["zinli", "wally"]);
  });
});
