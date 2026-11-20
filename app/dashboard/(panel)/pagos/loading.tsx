import { DashboardShell } from "@/components/layout/DashboardShell";
import { PagosSkeleton } from "@/components/ui/skeletons/PagosSkeleton";

/** Esqueleto con el layout de /dashboard/pagos (D102). */
export default function DashboardPagosLoading() {
  return (
    <DashboardShell>
      <PagosSkeleton />
    </DashboardShell>
  );
}
