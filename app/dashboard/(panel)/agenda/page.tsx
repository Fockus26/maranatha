import type { Metadata } from "next";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { DashboardAgenda } from "@/components/ui/DashboardAgenda";
import { listAgendaEvents } from "@/lib/agenda/repository";
import { requireAdmin } from "@/lib/auth/admin";

export const metadata: Metadata = {
  title: "Agenda",
  robots: { index: false, follow: false },
};

/**
 * Panel de la agenda (`/dashboard/agenda`). Server Component: lee con la
 * clave secreta solo después de `requireAdmin()` (mismo criterio que
 * `/dashboard/pagos`).
 */
export default async function DashboardAgendaPage() {
  await requireAdmin();
  const result = await listAgendaEvents();

  return (
    <DashboardShell>
      <DashboardAgenda
        events={result.ok ? result.data : []}
        loadError={!result.ok}
      />
    </DashboardShell>
  );
}
