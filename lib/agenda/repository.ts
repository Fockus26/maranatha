import "server-only";
import { count, eq, gte, or, sql } from "drizzle-orm";
import { db, isDbConfigured } from "@/lib/db";
import { agendaEvents } from "@/lib/db/schema";
import type { PanelVersion } from "@/lib/panelFreshness";
import type { Result } from "@/lib/payments/schema";
import {
  type AgendaEvent,
  type AgendaEventInput,
  FALLBACK_AGENDA_EVENTS,
} from "./schema";

/**
 * Acceso a la tabla `agenda_events`. Solo servidor; la autorización (solo
 * admins escriben) está en `app/actions/adminAgenda.ts`. Mismo contrato que
 * `lib/payments/repository.ts`: errores esperados modelados, lo inesperado
 * se registra y sale `db_error`.
 */

export type AgendaRepoError = "not_configured" | "not_found" | "db_error";

type AgendaSelect = typeof agendaEvents.$inferSelect;

const COLUMNS = {
  id: agendaEvents.id,
  kind: agendaEvents.kind,
  weekday: agendaEvents.weekday,
  eventDate: agendaEvents.eventDate,
  startTime: agendaEvents.startTime,
  title: agendaEvents.title,
  location: agendaEvents.location,
};

function logDbError(where: string, error: unknown) {
  console.error(`[agenda] ${where}:`, error);
}

// `time` de Postgres llega como "HH:MM:SS".
function toEvent(row: Pick<AgendaSelect, keyof typeof COLUMNS>): AgendaEvent {
  return {
    id: row.id,
    kind: row.kind as AgendaEvent["kind"],
    weekday: row.weekday,
    eventDate: row.eventDate,
    startTime: row.startTime.slice(0, 5),
    title: row.title,
    location: row.location,
  };
}

function toRow(input: AgendaEventInput) {
  return {
    kind: input.kind,
    weekday: input.kind === "recurring" ? input.weekday : null,
    eventDate: input.kind === "one_time" ? input.eventDate : null,
    startTime: input.startTime,
    title: input.title,
    location: input.location,
  };
}

function sortEvents(events: AgendaEvent[]): AgendaEvent[] {
  return [...events].sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === "recurring" ? -1 : 1;
    const day =
      a.kind === "recurring"
        ? (a.weekday ?? 0) - (b.weekday ?? 0)
        : (a.eventDate ?? "").localeCompare(b.eventDate ?? "");
    return day || a.startTime.localeCompare(b.startTime);
  });
}

/** Todos los eventos, para el dashboard. */
export async function listAgendaEvents(): Promise<
  Result<AgendaEvent[], AgendaRepoError>
> {
  if (!isDbConfigured()) return { ok: false, error: "not_configured" };
  try {
    const rows = await db().select(COLUMNS).from(agendaEvents);
    return { ok: true, data: sortEvents(rows.map(toEvent)) };
  } catch (error) {
    logDbError("listAgendaEvents", error);
    return { ok: false, error: "db_error" };
  }
}

/**
 * Versión de la agenda para el chequeo de frescura del panel (D104): cuántos
 * eventos hay y su último `updated_at` (trigger `agenda_events_set_updated_at`).
 */
export async function getAgendaVersion(): Promise<
  Result<PanelVersion, AgendaRepoError>
> {
  if (!isDbConfigured()) return { ok: false, error: "not_configured" };
  try {
    const [row] = await db()
      .select({
        total: count(),
        last: sql<string | null>`max(${agendaEvents.updatedAt})::text`,
      })
      .from(agendaEvents);
    if (!row) return { ok: false, error: "db_error" };
    return {
      ok: true,
      data: { token: `${row.total}|${row.last ?? ""}`, at: Date.now() },
    };
  } catch (error) {
    logDbError("getAgendaVersion", error);
    return { ok: false, error: "db_error" };
  }
}

/**
 * Lo que necesita el home: los recurrentes y los puntuales desde el primer
 * día del mes en curso (los anteriores no se muestran nunca). Si la base
 * falla, cae en las reuniones semanales de respaldo.
 */
export async function getPublicAgendaEvents(): Promise<AgendaEvent[]> {
  if (!isDbConfigured()) return FALLBACK_AGENDA_EVENTS;

  // Un día de margen: el servidor corre en UTC y Venezuela va 4 h detrás,
  // así que la última noche del mes el servidor ya "está" en el siguiente.
  // Lo que sobre lo descarta `buildMonthlyAgenda` en el cliente.
  const now = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  try {
    const rows = await db()
      .select(COLUMNS)
      .from(agendaEvents)
      .where(
        or(
          eq(agendaEvents.kind, "recurring"),
          gte(agendaEvents.eventDate, monthStart),
        ),
      );
    return sortEvents(rows.map(toEvent));
  } catch (error) {
    logDbError("getPublicAgendaEvents", error);
    return FALLBACK_AGENDA_EVENTS;
  }
}

export async function insertAgendaEvent(
  input: AgendaEventInput,
): Promise<Result<AgendaEvent, AgendaRepoError>> {
  if (!isDbConfigured()) return { ok: false, error: "not_configured" };
  try {
    const [row] = await db()
      .insert(agendaEvents)
      .values(toRow(input))
      .returning(COLUMNS);
    return { ok: true, data: toEvent(row) };
  } catch (error) {
    logDbError("insertAgendaEvent", error);
    return { ok: false, error: "db_error" };
  }
}

export async function updateAgendaEvent(
  id: string,
  input: AgendaEventInput,
): Promise<Result<AgendaEvent, AgendaRepoError>> {
  if (!isDbConfigured()) return { ok: false, error: "not_configured" };
  try {
    const [row] = await db()
      .update(agendaEvents)
      .set(toRow(input))
      .where(eq(agendaEvents.id, id))
      .returning(COLUMNS);
    if (!row) return { ok: false, error: "not_found" };
    return { ok: true, data: toEvent(row) };
  } catch (error) {
    logDbError("updateAgendaEvent", error);
    return { ok: false, error: "db_error" };
  }
}

export async function deleteAgendaEvent(
  id: string,
): Promise<Result<null, AgendaRepoError>> {
  if (!isDbConfigured()) return { ok: false, error: "not_configured" };
  try {
    const rows = await db()
      .delete(agendaEvents)
      .where(eq(agendaEvents.id, id))
      .returning({ id: agendaEvents.id });
    if (!rows.length) return { ok: false, error: "not_found" };
    return { ok: true, data: null };
  } catch (error) {
    logDbError("deleteAgendaEvent", error);
    return { ok: false, error: "db_error" };
  }
}
