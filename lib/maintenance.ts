/**
 * Modo mantenimiento (D079), por variables de entorno:
 *   MAINTENANCE_MODE=1                       activa la pantalla (503)
 *   MAINTENANCE_UNTIL=2026-10-15T21:00-04:00 hora aproximada de regreso (opcional)
 * El panel (`/dashboard`) sigue accesible para los admin.
 */
export const MAINTENANCE_PATH = "/mantenimiento";

export function maintenanceOn(): boolean {
  return process.env.MAINTENANCE_MODE === "1";
}

export function maintenanceUntil(): Date | null {
  const raw = process.env.MAINTENANCE_UNTIL;
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Segundos para `Retry-After`: hasta la hora de regreso, o 1 h sin hora. */
export function retryAfterSeconds(now = new Date()): number {
  const until = maintenanceUntil();
  const fallback = 60 * 60;
  if (!until) return fallback;
  return Math.max(60, Math.round((until.getTime() - now.getTime()) / 1000));
}

/** Rutas que no pasan a mantenimiento: el panel, la propia pantalla y archivos. */
export function bypassesMaintenance(pathname: string): boolean {
  return (
    pathname === MAINTENANCE_PATH ||
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname.startsWith("/api/") ||
    /\.[a-z0-9]+$/i.test(pathname)
  );
}
