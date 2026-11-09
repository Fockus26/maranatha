import { z } from "zod";

/**
 * Tipos y validación de la agenda (tabla `agenda_events`,
 * `lib/db/schema.ts`). Sin `server-only`:
 * el formulario del dashboard valida con el mismo esquema que la Server
 * Action, que vuelve a validar todo lo que llega del cliente.
 */

export type AgendaEventKind = "recurring" | "one_time";

export interface AgendaEvent {
  id: string;
  kind: AgendaEventKind;
  /** 0 = domingo … 6 = sábado. Solo en `recurring`. */
  weekday: number | null;
  /** "YYYY-MM-DD". Solo en `one_time`. */
  eventDate: string | null;
  /** "HH:MM", 24 h. */
  startTime: string;
  title: string;
  location: string;
}

/** Años aceptados para un evento único: descarta 1800 o 3000 por tipeo. */
export const AGENDA_MIN_YEAR = 2000;
export const AGENDA_MAX_YEAR = 2100;

/**
 * "YYYY-MM-DD" que existe en el calendario y cae en un rango razonable.
 * `Date.parse` normaliza "2026-02-31" a marzo; aquí se exige ida y vuelta.
 */
export function isRealDate(value: string): boolean {
  const [y, m, d] = value.split("-").map(Number);
  if (y < AGENDA_MIN_YEAR || y > AGENDA_MAX_YEAR) return false;
  const date = new Date(Date.UTC(y, m - 1, d));
  return (
    date.getUTCFullYear() === y &&
    date.getUTCMonth() === m - 1 &&
    date.getUTCDate() === d
  );
}

export const WEEKDAY_NAMES = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
] as const;

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const agendaEventInputSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("recurring"),
    weekday: z.number().int().min(0).max(6),
    startTime: z.string().regex(TIME_RE),
    title: z.string().trim().min(1).max(120),
    location: z.string().trim().min(1).max(120),
  }),
  z.object({
    kind: z.literal("one_time"),
    eventDate: z
      .string()
      .regex(DATE_RE)
      .refine(isRealDate, { message: "invalid_date" }),
    startTime: z.string().regex(TIME_RE),
    title: z.string().trim().min(1).max(120),
    location: z.string().trim().min(1).max(120),
  }),
]);

export type AgendaEventInput = z.infer<typeof agendaEventInputSchema>;

/** "19:00" → "7:00 p.m." (el formato que ya usaba la sección Agenda). */
export function formatStartTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const suffix = h < 12 ? "a.m." : "p.m.";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${suffix}`;
}

/** "YYYY-MM-DD" → `Date` local (sin el corrimiento de zona de `new Date(iso)`). */
export function parseLocalDate(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Respaldo si la base no está configurada o no responde: las mismas
 * reuniones semanales que siembra la migración, para que el home nunca
 * muestre la agenda vacía por un fallo de la base.
 */
export const FALLBACK_AGENDA_EVENTS: AgendaEvent[] = [
  {
    id: "fallback-domingo",
    kind: "recurring",
    weekday: 0,
    eventDate: null,
    startTime: "10:00",
    title: "Servicio Dominical",
    location: "Templo principal",
  },
  {
    id: "fallback-oracion",
    kind: "recurring",
    weekday: 3,
    eventDate: null,
    startTime: "19:00",
    title: "Reunión de oración",
    location: "Salón de oración",
  },
  {
    id: "fallback-jovenes",
    kind: "recurring",
    weekday: 5,
    eventDate: null,
    startTime: "19:00",
    title: "Reunión de jóvenes",
    location: "Salón de jóvenes",
  },
];
