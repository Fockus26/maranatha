import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProjectBySlug, PROJECTS } from "@/lib/projectsData";
import { getRaisedRecord, withRaised } from "@/lib/projectsRaised";
import { SITE_URL } from "@/lib/siteConfig";
import { ProjectDetailClient } from "./ProjectDetailClient";

/**
 * Página "Proyecto — detalle" (`/proyectos/[slug]`, fase 07, D044).
 *
 * Server component: resuelve el proyecto por `slug` desde `lib/projectsData.ts`
 * y llama a `notFound()` si no existe (comportamiento estándar de Next, no es
 * un "estado de error" propio de la fase — la fase pide no diseñar estados de
 * error/loading todavía, y un 404 genérico no requiere diseño adicional).
 * El resto de la página (interactivo — modal de aporte) vive en
 * `ProjectDetailClient.tsx`.
 */

export function generateStaticParams() {
  return PROJECTS.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: PageProps<"/proyectos/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  if (!project) {
    // El slug no existe → la página llama a `notFound()`; que no se indexe.
    return { title: "Proyecto no encontrado", robots: { index: false, follow: false } };
  }

  const path = `/proyectos/${project.slug}`;
  return {
    title: project.title,
    description: project.description,
    alternates: { canonical: path },
    openGraph: {
      type: "article",
      title: `${project.title} | Iglesia Maranatha`,
      description: project.description,
      url: `${SITE_URL}${path}`,
      images: [{ url: project.imageUrl, width: 1200, height: 800, alt: project.title }],
    },
  };
}

export default async function ProyectoDetallePage({ params }: PageProps<"/proyectos/[slug]">) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  // Recaudado = base + pagos confirmados (se revalida al confirmar un pago).
  return <ProjectDetailClient project={withRaised(project, await getRaisedRecord())} />;
}
