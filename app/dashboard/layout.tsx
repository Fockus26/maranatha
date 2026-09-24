import type { Metadata } from "next";

/**
 * El dashboard es privado (fase QA — SEO): no debe indexarse ni seguirse.
 * `robots.ts` además lo bloquea a nivel de crawl; esto cubre el caso de una
 * URL de dashboard que llegue por otro camino.
 *
 * Los providers del panel (proyectos y modal, D045/D059) viven en
 * `(panel)/layout.tsx`, detrás del chequeo de admin: así el login no carga
 * ni consulta nada del panel.
 */
export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

export default function DashboardLayout({
  children,
}: LayoutProps<"/dashboard">) {
  return children;
}
