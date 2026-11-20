import { DashboardShell } from "@/components/layout/DashboardShell";
import { ProyectosSkeleton } from "@/components/ui/skeletons/ProyectosSkeleton";

/** Esqueleto con el layout de /dashboard/proyectos (D102). */
export default function DashboardProyectosLoading() {
  return (
    <DashboardShell>
      <ProyectosSkeleton />
    </DashboardShell>
  );
}
