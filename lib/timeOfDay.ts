export type Period = "am" | "pm";

export interface TimeParts {
  /** 1–12 */
  hour12: number;
  /** 0–59 (puede quedar fuera de la grilla de 5 en 5 si el valor guardado lo está) */
  minute: number;
  period: Period;
}

export const HOURS_12 = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const;
export const MINUTE_STEPS = Array.from({ length: 12 }, (_, i) => i * 5);
// Con espacios de no separación: "7:00 p. m." no se parte entre líneas.
export const PERIOD_LABEL: Record<Period, string> = {
  am: "a.\u00a0m.",
  pm: "p.\u00a0m.",
};

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** "HH:MM" 24 h → partes de 12 h; `null` si el valor no es una hora válida. */
export function parseTime24(value: string): TimeParts | null {
  const match = TIME_RE.exec(value);
  if (!match) return null;
  const hour = Number(match[1]);
  return {
    hour12: hour % 12 || 12,
    minute: Number(match[2]),
    period: hour < 12 ? "am" : "pm",
  };
}

/** Partes de 12 h → "HH:MM" 24 h. */
export function composeTime24({ hour12, minute, period }: TimeParts): string {
  const hour = (hour12 % 12) + (period === "pm" ? 12 : 0);
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

/** "19:07" → "7:07 p. m." (sin redondear los minutos). */
export function formatTime12(value: string): string {
  const parts = parseTime24(value);
  if (!parts) return "";
  return `${parts.hour12}:${String(parts.minute).padStart(2, "0")}\u00a0${PERIOD_LABEL[parts.period]}`;
}
