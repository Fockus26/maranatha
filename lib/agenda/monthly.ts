import { type AgendaEvent, formatStartTime, parseLocalDate } from "./schema";

export interface AgendaEntry {
  key: string;
  date: Date;
  title: string;
  schedule: string;
  location: string;
  kind: "recurring" | "oneTime";
  weekday: number;
}

/**
 * Expande los eventos al resto del mes de `today`: cada recurrente a todas
 * sus ocurrencias desde hoy, y cada puntual si cae entre hoy y fin de mes.
 * Orden cronológico (y por hora dentro del mismo día).
 */
export function buildMonthlyAgenda(
  events: AgendaEvent[],
  today: Date = new Date(),
): AgendaEntry[] {
  const year = today.getFullYear();
  const month = today.getMonth();
  const firstDay = new Date(year, month, today.getDate());
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const entries: { entry: AgendaEntry; time: string }[] = [];

  const push = (event: AgendaEvent, date: Date, kind: AgendaEntry["kind"]) =>
    entries.push({
      time: event.startTime,
      entry: {
        key: `${event.id}-${date.toISOString()}`,
        date,
        title: event.title,
        schedule: formatStartTime(event.startTime),
        location: event.location,
        kind,
        weekday: date.getDay(),
      },
    });

  for (let day = today.getDate(); day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    for (const event of events) {
      if (event.kind === "recurring" && event.weekday === date.getDay()) {
        push(event, date, "recurring");
      }
    }
  }

  for (const event of events) {
    if (event.kind !== "one_time" || !event.eventDate) continue;
    const date = parseLocalDate(event.eventDate);
    if (
      date >= firstDay &&
      date.getMonth() === month &&
      date.getFullYear() === year
    ) {
      push(event, date, "oneTime");
    }
  }

  entries.sort(
    (a, b) =>
      a.entry.date.getTime() - b.entry.date.getTime() ||
      a.time.localeCompare(b.time),
  );
  return entries.map((e) => e.entry);
}
