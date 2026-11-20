import type { Metadata } from "next";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { DashboardAgenda } from "@/components/ui/DashboardAgenda";
import { getAgendaVersion, listAgendaEvents } from "@/lib/agenda/repository";
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
  // Versión antes que los datos (D104, mismo criterio que `/dashboard/pagos`).
  const version = await getAgendaVersion();
  const result = await listAgendaEvents();

  return (
    <DashboardShell>
      <DashboardAgenda
        events={result.ok ? result.data : []}
        loadError={!result.ok}
        version={version.ok ? version.data : null}
      />
    </DashboardShell>
  );
}
