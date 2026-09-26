/**
 * Builders de JSON-LD (schema.org). Solo se describe contenido visible en la
 * página. El email de contacto sigue siendo placeholder (ver
 * CONTENT_CHECKLIST.md); las redes ya son las reales.
 */
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_SOCIAL_LINKS,
  SITE_URL,
} from "./siteConfig";
import type { SermonVideo } from "./youtube";

/** Organización — se usa en Home. `@type: Church` es subtipo de PlaceOfWorship. */
export function organizationJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Church",
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: `${SITE_URL}/`,
    description: SITE_DESCRIPTION,
    logo: `${SITE_URL}/icon`,
    image: `${SITE_URL}/opengraph-image`,
    sameAs: SITE_SOCIAL_LINKS,
  };
}

/** Sitio web — se usa en Home. Sin `SearchAction`: no hay buscador global. */
export function webSiteJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: `${SITE_URL}/`,
    inLanguage: "es",
    publisher: { "@id": `${SITE_URL}/#organization` },
  };
}

/** Lista de videos de la sección Prédicas (visible en Home). */
export function sermonsJsonLd(
  videos: SermonVideo[],
): Record<string, unknown> | null {
  const real = videos.filter(
    (v) => !v.videoId.startsWith("sermon-placeholder"),
  );
  if (real.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Últimas prédicas de ${SITE_NAME}`,
    itemListElement: real.map((v, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "VideoObject",
        name: v.title,
        uploadDate: v.publishedIso,
        thumbnailUrl: `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`,
        embedUrl: `https://www.youtube-nocookie.com/embed/${v.videoId}`,
        url: `https://www.youtube.com/watch?v=${v.videoId}`,
      },
    })),
  };
}

/** Migas de pan. `items`: [{ name, path }] en orden, empezando por Inicio. */
export function breadcrumbJsonLd(
  items: { name: string; path: string }[],
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}
