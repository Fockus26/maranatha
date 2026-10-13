import {
  fetchImageDataUri,
  OG_CONTENT_TYPE,
  OG_SIZE,
  renderOgImage,
} from "@/lib/og";
import { getProjectBySlug } from "@/lib/projectsData";
import { SITE_NAME, SITE_URL } from "@/lib/siteConfig";

// Imagen para compartir de un proyecto (D078): etiqueta "PROYECTO", título y
// foto de portada a la derecha. Sin el progreso de recaudación: las redes
// cachean la imagen días y el número quedaría viejo.
export const alt = `Proyecto · ${SITE_NAME}`;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function ProjectOpengraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  const host = new URL(SITE_URL).host;

  return renderOgImage({
    title: project?.title ?? SITE_NAME,
    eyebrow: "PROYECTO",
    footer: `Aporta en línea · ${host}/proyectos`,
    photo: project ? await fetchImageDataUri(project.imageUrl) : null,
  });
}
