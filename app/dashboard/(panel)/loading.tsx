import { DashboardShell } from "@/components/layout/DashboardShell";
import { DashboardPageSkeleton } from "@/components/ui/DashboardPageSkeleton";

/**
 * Cada página del panel monta su propio `DashboardShell`, así que el esqueleto
 * lo repite: la barra superior queda quieta y solo el contenido es gris (D095).
 */
export default function DashboardLoading() {
  return (
    <DashboardShell>
      <DashboardPageSkeleton />
    </DashboardShell>
  );
}
