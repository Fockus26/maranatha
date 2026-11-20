import { DashboardProjectModal } from "@/components/ui/DashboardProjectModal";
import { requireAdmin } from "@/lib/auth/admin";
import { DashboardAdminProvider } from "@/lib/dashboardAdminStore";
import { DashboardProjectModalProvider } from "@/lib/dashboardProjectModalStore";
import { DashboardProjectsProvider } from "@/lib/dashboardProjectsStore";
import { getRaisedRecord } from "@/lib/projectsRaised";

/**
 * Grupo de rutas del panel privado (no cambia las URLs: `/dashboard`,
 * `/dashboard/proyectos`, `/dashboard/pagos`). Todo lo que cuelga de acá
 * exige un admin con sesión; el login (`/dashboard/login`) queda afuera.
 *
 * Ojo: un layout no se vuelve a ejecutar en cada navegación del cliente, así
 * que este chequeo no alcanza solo — las páginas que leen datos privados y
 * todas las Server Actions de admin vuelven a verificar (`requireAdmin` /
 * `getAdminStrict`). El proxy agrega un tercer filtro optimista por request.
 *
 * Provee además el estado compartido de proyectos
 * (`DashboardProjectsProvider`, sembrado con lo recaudado real) y el del
 * modal de crear/editar proyecto (`DashboardProjectModalProvider`, D059),
 * montado una sola vez para que "Nuevo proyecto" de Resumen lo abra sin
 * navegar a Proyectos. Y el nombre y correo del admin
 * (`DashboardAdminProvider`) para las iniciales de la barra (D107).
 */
export default async function DashboardPanelLayout({
  children,
}: LayoutProps<"/dashboard">) {
  const admin = await requireAdmin();
  const raisedBySlug = await getRaisedRecord();
  return (
    <DashboardAdminProvider admin={{ name: admin.name, email: admin.email }}>
      <DashboardProjectsProvider raisedBySlug={raisedBySlug}>
        <DashboardProjectModalProvider>
          {children}
          <DashboardProjectModal />
        </DashboardProjectModalProvider>
      </DashboardProjectsProvider>
    </DashboardAdminProvider>
  );
}
