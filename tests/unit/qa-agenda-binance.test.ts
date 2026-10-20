import { describe, expect, test } from "bun:test";
import { agendaEventInputSchema, isRealDate } from "@/lib/agenda/schema";
import {
  isFreshTimestamp,
  WEBHOOK_MAX_SKEW_MS,
} from "@/lib/payments/binanceCore";
import { isGatewayPayment } from "@/lib/payments/schema";

describe("QA 19-10-2026: agenda", () => {
  test("fechas imposibles o fuera de rango se rechazan", () => {
    for (const d of [
      "2026-02-31",
      "2026-13-01",
      "0000-01-01",
      "1800-01-01",
      "3000-01-01",
    ])
      expect(isRealDate(d)).toBe(false);
    for (const d of ["2026-10-20", "2028-02-29", "2000-01-01", "2100-12-31"])
      expect(isRealDate(d)).toBe(true);
    expect(isRealDate("2027-02-29")).toBe(false);
  });

  test("el esquema da invalid_input (no server_error) con 31 de febrero", () => {
    const base = {
      kind: "one_time",
      startTime: "10:00",
      title: "Vigilia",
      location: "Templo",
    };
    expect(
      agendaEventInputSchema.safeParse({ ...base, eventDate: "2026-02-31" })
        .success,
    ).toBe(false);
    expect(
      agendaEventInputSchema.safeParse({ ...base, eventDate: "2026-02-28" })
        .success,
    ).toBe(true);
  });
});

describe("QA 19-10-2026: pagos", () => {
  test("PayPal y Binance de pasarela no se confirman a mano", () => {
    expect(isGatewayPayment({ method: "paypal", reference: null })).toBe(true);
    expect(isGatewayPayment({ method: "binance", reference: null })).toBe(true);
    expect(isGatewayPayment({ method: "binance", reference: "123456" })).toBe(
      false,
    );
    expect(isGatewayPayment({ method: "zelle", reference: "AB-1" })).toBe(
      false,
    );
  });

  test("webhook de Binance: timestamp fuera de la ventana o mal formado", () => {
    const now = 1_790_000_000_000;
    expect(isFreshTimestamp(String(now - 60_000), now)).toBe(true);
    expect(isFreshTimestamp(String(now - WEBHOOK_MAX_SKEW_MS - 1), now)).toBe(
      false,
    );
    expect(isFreshTimestamp(String(now + WEBHOOK_MAX_SKEW_MS + 1), now)).toBe(
      false,
    );
    expect(isFreshTimestamp("1577836800000", now)).toBe(false); // 2020
    for (const t of ["", "abc", "1e12", "-1"])
      expect(isFreshTimestamp(t, now)).toBe(false);
  });
});
