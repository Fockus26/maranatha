import { describe, expect, test } from "bun:test";
import { buildMonthlyAgenda } from "@/lib/agenda/monthly";
import {
  type AgendaEvent,
  agendaEventInputSchema,
  formatStartTime,
} from "@/lib/agenda/schema";

const sunday: AgendaEvent = {
  id: "a",
  kind: "recurring",
  weekday: 0,
  eventDate: null,
  startTime: "10:00",
  title: "Servicio Dominical",
  location: "Templo principal",
};

const special = (eventDate: string, startTime = "18:30"): AgendaEvent => ({
  id: `s-${eventDate}`,
  kind: "one_time",
  weekday: null,
  eventDate,
  startTime,
  title: "Bautismos",
  location: "Templo principal",
});

describe("formatStartTime", () => {
  test("formatea en 12 h con a.m./p.m.", () => {
    expect(formatStartTime("10:00")).toBe("10:00 a.m.");
    expect(formatStartTime("19:05")).toBe("7:05 p.m.");
    expect(formatStartTime("00:30")).toBe("12:30 a.m.");
    expect(formatStartTime("12:00")).toBe("12:00 p.m.");
  });
});

describe("buildMonthlyAgenda", () => {
  // Lunes 19 de octubre de 2026.
  const today = new Date(2026, 9, 19);

  test("expande los recurrentes al resto del mes", () => {
    const entries = buildMonthlyAgenda([sunday], today);
    expect(entries.map((e) => e.date.getDate())).toEqual([25]);
    expect(entries[0].schedule).toBe("10:00 a.m.");
  });

  test("incluye puntuales de hoy a fin de mes y descarta el resto", () => {
    const entries = buildMonthlyAgenda(
      [
        special("2026-10-18"),
        special("2026-10-19"),
        special("2026-10-31"),
        special("2026-11-01"),
      ],
      today,
    );
    expect(entries.map((e) => e.date.getDate())).toEqual([19, 31]);
    expect(entries.every((e) => e.kind === "oneTime")).toBe(true);
  });

  test("ordena por fecha y por hora dentro del mismo día", () => {
    const entries = buildMonthlyAgenda(
      [sunday, special("2026-10-25", "08:00")],
      today,
    );
    expect(entries.map((e) => e.schedule)).toEqual(["8:00 a.m.", "10:00 a.m."]);
  });
});

describe("agendaEventInputSchema", () => {
  test("acepta un recurrente válido y recorta espacios", () => {
    const parsed = agendaEventInputSchema.parse({
      kind: "recurring",
      weekday: 3,
      startTime: "19:00",
      title: "  Oración ",
      location: "Salón",
    });
    expect(parsed.title).toBe("Oración");
  });

  test("rechaza hora, día o fecha inválidos", () => {
    const base = { startTime: "19:00", title: "X", location: "Y" };
    expect(
      agendaEventInputSchema.safeParse({
        kind: "recurring",
        weekday: 7,
        ...base,
      }).success,
    ).toBe(false);
    expect(
      agendaEventInputSchema.safeParse({
        kind: "one_time",
        eventDate: "2026-13-40",
        ...base,
      }).success,
    ).toBe(false);
    expect(
      agendaEventInputSchema.safeParse({
        kind: "recurring",
        weekday: 1,
        ...base,
        startTime: "25:00",
      }).success,
    ).toBe(false);
  });

  test("rechaza un título vacío", () => {
    expect(
      agendaEventInputSchema.safeParse({
        kind: "one_time",
        eventDate: "2026-10-30",
        startTime: "19:00",
        title: "   ",
        location: "Y",
      }).success,
    ).toBe(false);
  });
});
