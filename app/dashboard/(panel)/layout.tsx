import { requireAdmin } from "@/lib/auth/admin";

/**
 * Grupo de rutas del panel privado (no cambia las URLs: `/dashboard`,
 * `/dashboard/proyectos`, `/dashboard/pagos`). Todo lo que cuelga de acá
 * exige un admin con sesión; el login (`/dashboard/login`) queda afuera.
 *
 * Ojo: un layout no se vuelve a ejecutar en cada navegación del cliente, así
 * que este chequeo no alcanza solo — las páginas que leen datos privados y
 * todas las Server Actions de admin vuelven a verificar (`requireAdmin` /
 * `getAdminStrict`). El proxy agrega un tercer filtro optimista por request.
 */
export default async function DashboardPanelLayout({
  children,
}: LayoutProps<"/dashboard">) {
  await requireAdmin();
  return children;
}
