import { describe, expect, test } from "bun:test";
import {
  composeTime24,
  formatTime12,
  MINUTE_STEPS,
  parseTime24,
} from "@/lib/timeOfDay";

describe("timeOfDay", () => {
  test("medianoche y mediodía", () => {
    expect(parseTime24("00:00")).toEqual({
      hour12: 12,
      minute: 0,
      period: "am",
    });
    expect(parseTime24("12:00")).toEqual({
      hour12: 12,
      minute: 0,
      period: "pm",
    });
    expect(formatTime12("00:00")).toBe("12:00\u00a0a.\u00a0m.");
    expect(formatTime12("12:00")).toBe("12:00\u00a0p.\u00a0m.");
  });

  test("no redondea minutos fuera de la grilla", () => {
    expect(formatTime12("19:07")).toBe("7:07\u00a0p.\u00a0m.");
    expect(parseTime24("19:07")?.minute).toBe(7);
    expect(MINUTE_STEPS.includes(7)).toBe(false);
  });

  test("composición inversa para las 24 horas", () => {
    for (let h = 0; h < 24; h++) {
      const value = `${String(h).padStart(2, "0")}:35`;
      const parts = parseTime24(value);
      expect(parts).not.toBeNull();
      if (parts) expect(composeTime24(parts)).toBe(value);
    }
  });

  test("valores inválidos", () => {
    expect(parseTime24("")).toBeNull();
    expect(parseTime24("24:00")).toBeNull();
    expect(parseTime24("7:30")).toBeNull();
    expect(formatTime12("x")).toBe("");
  });

  test("grilla de 5 en 5", () => {
    expect(MINUTE_STEPS).toHaveLength(12);
    expect(MINUTE_STEPS[11]).toBe(55);
  });
});
