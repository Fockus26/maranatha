// Orden: `NEXT_PUBLIC_SITE_URL` (setealo con el dominio final) →
// dominio de producción de Vercel (auto, solo server-side) → localhost.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000")
).replace(/\/$/, "");

// Vercel es el entorno de pruebas (rama `vercel`) y producción corre en el VPS
// (rama `vps`). En Vercel el sitio no se deja indexar, para que Google no
// publique el staging ni lo trate como copia del dominio real.
export const SITE_INDEXABLE = process.env.VERCEL !== "1";

export const SITE_NAME = "Iglesia Maranatha";

export const SITE_TITLE_DEFAULT = "Iglesia Maranatha — comunidad de fe y propósito";

export const SITE_DESCRIPTION =
  "Conoce a la Iglesia Maranatha: nuestras áreas de servicio, el liderazgo, las prédicas, la agenda de reuniones, los proyectos de la comunidad y nuestra historia.";

export const SITE_LOCALE = "es_VE";

export const YOUTUBE_CHANNEL_ID = "UCT2A5hFBhTJ5T0CykeCKX7w";
export const YOUTUBE_CHANNEL_URL = `https://www.youtube.com/channel/${YOUTUBE_CHANNEL_ID}`;

export const SITE_CONTACT_EMAIL = "contacto@iglesia.org";
export const SITE_SOCIAL_LINKS = [
  "https://www.instagram.com/maranathasancristobal/",
  "https://www.instagram.com/eectachira.sc/",
  "https://www.instagram.com/generacionjef/",
  YOUTUBE_CHANNEL_URL,
];
