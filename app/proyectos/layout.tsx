import type { Metadata } from "next";
import { SITE_URL } from "@/lib/siteConfig";

/**
 * Layout del segmento `/proyectos` (fase QA — SEO). Existe solo para poder
 * exportar `metadata` del listado: `app/proyectos/page.tsx` es un Client
 * Component (tabs con estado) y no puede exportarla. El detalle
 * (`/proyectos/[slug]`) anida bajo este layout pero define su propia
 * `generateMetadata`, que tiene prioridad.
 */
export const metadata: Metadata = {
  title: "Proyectos",
  description:
    "Los proyectos de la Iglesia Maranatha: necesidades reales de la comunidad, su avance de recaudación y cómo aportar a cada uno.",
  alternates: { canonical: "/proyectos" },
  openGraph: {
    title: "Proyectos | Iglesia Maranatha",
    description:
      "Necesidades reales de la comunidad, su avance de recaudación y cómo aportar a cada una.",
    url: `${SITE_URL}/proyectos`,
  },
};

export default function ProyectosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
