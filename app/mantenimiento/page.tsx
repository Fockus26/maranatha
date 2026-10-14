import type { Metadata } from "next";
import { connection } from "next/server";
import { StatusScreen } from "@/components/status/StatusScreen";
import { maintenanceUntil } from "@/lib/maintenance";

/**
 * Mantenimiento (D079). El proxy reescribe aquí todo el sitio público cuando
 * `MAINTENANCE_MODE=1`, con 503 y `Retry-After`. `MAINTENANCE_UNTIL` (ISO
 * 8601, opcional) muestra la hora aproximada de regreso.
 */
export const metadata: Metadata = {
  title: "En mantenimiento",
  robots: { index: false, follow: false },
};

export default async function MantenimientoPage() {
  await connection(); // lee el entorno en cada request, no en el build
  return (
    <StatusScreen
      variant="maintenance"
      returnAt={maintenanceUntil()?.toISOString()}
    />
  );
}
