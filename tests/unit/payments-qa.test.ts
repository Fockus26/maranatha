import { describe, expect, test } from "bun:test";
import {
  contributionSchema,
  donorNameSchema,
  fallbackRatesSchema,
  MAX_DONOR_NAME,
  manualReportSchema,
} from "@/lib/payments/schema";

const report = {
  method: "zelle",
  reference: "AB-1234",
  paidAt: "2026-10-01",
  amountPaid: "26.00",
};

describe("QA de pagos: reporte manual", () => {
  test("referencias sin letras ni números se rechazan", () => {
    for (const reference of ["...", "---", "@@@", "- _"])
      expect(
        manualReportSchema.safeParse({ ...report, reference }).success,
      ).toBe(false);
    expect(manualReportSchema.safeParse(report).success).toBe(true);
  });

  test("el monto en USD llega con 2 decimales y pasa en string y en número", () => {
    const base = {
      purpose: "diezmo",
      frequency: "once",
      name: "Ana",
      email: "a@x.com",
    };
    // Lo que envía PaymentStep: `amountUsd.toFixed(2)`.
    expect(
      contributionSchema.safeParse({ ...base, amountUsd: (25.999).toFixed(2) })
        .success,
    ).toBe(true);
    expect(
      contributionSchema.safeParse({ ...base, amountUsd: "25.999" }).success,
    ).toBe(false);
    expect(
      contributionSchema.safeParse({ ...base, amountUsd: "1e3" }).success,
    ).toBe(false);
  });
});

// QA de versión 09: el paso 1 valida el nombre con el mismo esquema que el
// servidor, para no culpar después a la referencia, la fecha o el monto.
describe("QA de pagos: nombre del donante", () => {
  test("rechaza lo que el servidor rechaza", () => {
    for (const name of [
      "",
      "   ",
      "!!!",
      "Ana 👨‍👩‍👧",
      "A".repeat(MAX_DONOR_NAME + 1),
    ])
      expect(donorNameSchema.safeParse(name).success).toBe(false);
  });

  test("acepta nombres reales, con tildes y emojis simples", () => {
    for (const name of ["Ana", "José Pérez-Núñez", "María 🙏", "A".repeat(120)])
      expect(donorNameSchema.safeParse(name).success).toBe(true);
  });
});

describe("QA de pagos: tasas de respaldo", () => {
  test("valores absurdos o con formato raro se rechazan", () => {
    for (const VES of ["0.00001", "0x10", "1e3", "12,5", "2000000"])
      expect(fallbackRatesSchema.safeParse({ VES }).success).toBe(false);
    expect(fallbackRatesSchema.safeParse({ COP: "16" }).success).toBe(false);
  });

  test("tasas plausibles se aceptan", () => {
    expect(
      fallbackRatesSchema.safeParse({ VES: "900.5", COP: "4100" }).data,
    ).toEqual({
      VES: 900.5,
      COP: 4100,
    });
    expect(fallbackRatesSchema.safeParse({}).success).toBe(true);
  });
});
