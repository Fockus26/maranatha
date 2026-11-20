import { DashboardShell } from "@/components/layout/DashboardShell";
import { ResumenSkeleton } from "@/components/ui/skeletons/ResumenSkeleton";

/**
 * Cada página del panel monta su propio `DashboardShell`, así que el esqueleto
 * lo repite: la barra superior queda quieta y solo el contenido es gris (D095).
 * Este `loading` es el del Resumen; Pagos, Agenda y Proyectos traen el suyo (D102).
 */
export default function DashboardLoading() {
  return (
    <DashboardShell>
      <ResumenSkeleton />
    </DashboardShell>
  );
}
