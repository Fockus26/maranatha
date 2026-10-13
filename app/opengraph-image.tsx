import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/og";
import { SITE_NAME, SITE_URL } from "@/lib/siteConfig";

// Imagen para compartir por defecto del sitio (D078).
export const alt = SITE_NAME;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function OpengraphImage() {
  return renderOgImage({
    title: SITE_NAME,
    subtitle: "Reuniones, prédicas, proyectos y aportes en línea",
    footer: new URL(SITE_URL).host,
    footerRight: "Reuniones · Prédicas · Aportes",
  });
}
