import { DashboardShell } from "@/components/layout/DashboardShell";
import { AgendaSkeleton } from "@/components/ui/skeletons/AgendaSkeleton";

/** Esqueleto con el layout de /dashboard/agenda (D102). */
export default function DashboardAgendaLoading() {
  return (
    <DashboardShell>
      <AgendaSkeleton />
    </DashboardShell>
  );
}
