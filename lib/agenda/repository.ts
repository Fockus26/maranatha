import "server-only";
import type { Result } from "@/lib/payments/schema";
import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase/admin";
import {
  type AgendaEvent,
  type AgendaEventInput,
  FALLBACK_AGENDA_EVENTS,
} from "./schema";

/**
 * Acceso a la tabla `agenda_events`. Solo servidor, con la clave secreta
 * (RLS sin políticas). Mismo contrato que `lib/payments/repository.ts`:
 * errores esperados modelados, lo inesperado se registra y sale `db_error`.
 */

export type AgendaRepoError = "not_configured" | "not_found" | "db_error";

interface AgendaEventRow {
  id: string;
  kind: AgendaEvent["kind"];
  weekday: number | null;
  event_date: string | null;
  start_time: string;
  title: string;
  location: string;
}

const COLUMNS = "id, kind, weekday, event_date, start_time, title, location";

function logDbError(where: string, error: unknown) {
  console.error(`[agenda] ${where}:`, error);
}

// `time` de Postgres llega como "HH:MM:SS".
function toEvent(row: AgendaEventRow): AgendaEvent {
  return {
    id: row.id,
    kind: row.kind,
    weekday: row.weekday,
    eventDate: row.event_date,
    startTime: row.start_time.slice(0, 5),
    title: row.title,
    location: row.location,
  };
}

function toRow(input: AgendaEventInput) {
  return {
    kind: input.kind,
    weekday: input.kind === "recurring" ? input.weekday : null,
    event_date: input.kind === "one_time" ? input.eventDate : null,
    start_time: input.startTime,
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
  if (!isSupabaseConfigured()) return { ok: false, error: "not_configured" };

  const { data, error } = await supabaseAdmin()
    .from("agenda_events")
    .select(COLUMNS);
  if (error) {
    logDbError("listAgendaEvents", error);
    return { ok: false, error: "db_error" };
  }
  return { ok: true, data: sortEvents(data.map(toEvent)) };
}

/**
 * Lo que necesita el home: los recurrentes y los puntuales desde el primer
 * día del mes en curso (los anteriores no se muestran nunca). Si la base
 * falla, cae en las reuniones semanales de respaldo.
 */
export async function getPublicAgendaEvents(): Promise<AgendaEvent[]> {
  if (!isSupabaseConfigured()) return FALLBACK_AGENDA_EVENTS;

  // Un día de margen: el servidor corre en UTC y Venezuela va 4 h detrás,
  // así que la última noche del mes el servidor ya "está" en el siguiente.
  // Lo que sobre lo descarta `buildMonthlyAgenda` en el cliente.
  const now = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const { data, error } = await supabaseAdmin()
    .from("agenda_events")
    .select(COLUMNS)
    .or(`kind.eq.recurring,event_date.gte.${monthStart}`);
  if (error) {
    logDbError("getPublicAgendaEvents", error);
    return FALLBACK_AGENDA_EVENTS;
  }
  return sortEvents(data.map(toEvent));
}

export async function insertAgendaEvent(
  input: AgendaEventInput,
): Promise<Result<AgendaEvent, AgendaRepoError>> {
  if (!isSupabaseConfigured()) return { ok: false, error: "not_configured" };

  const { data, error } = await supabaseAdmin()
    .from("agenda_events")
    .insert(toRow(input))
    .select(COLUMNS)
    .single();
  if (error) {
    logDbError("insertAgendaEvent", error);
    return { ok: false, error: "db_error" };
  }
  return { ok: true, data: toEvent(data) };
}

export async function updateAgendaEvent(
  id: string,
  input: AgendaEventInput,
): Promise<Result<AgendaEvent, AgendaRepoError>> {
  if (!isSupabaseConfigured()) return { ok: false, error: "not_configured" };

  const { data, error } = await supabaseAdmin()
    .from("agenda_events")
    .update(toRow(input))
    .eq("id", id)
    .select(COLUMNS)
    .maybeSingle();
  if (error) {
    logDbError("updateAgendaEvent", error);
    return { ok: false, error: "db_error" };
  }
  if (!data) return { ok: false, error: "not_found" };
  return { ok: true, data: toEvent(data) };
}

export async function deleteAgendaEvent(
  id: string,
): Promise<Result<null, AgendaRepoError>> {
  if (!isSupabaseConfigured()) return { ok: false, error: "not_configured" };

  const { data, error } = await supabaseAdmin()
    .from("agenda_events")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();
  if (error) {
    logDbError("deleteAgendaEvent", error);
    return { ok: false, error: "db_error" };
  }
  if (!data) return { ok: false, error: "not_found" };
  return { ok: true, data: null };
}
