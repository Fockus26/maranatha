// Ficha del portafolio (skill project-showcase). El tipo vive en el repo del portafolio
// (`content/types.ts`); este archivo se copia allá, por eso queda fuera del typecheck de aquí.
// Los textos son los que el portafolio ya publica; solo cambia el enlace al sitio en vivo.
import type { Project } from "@/content/types";

export const project: Project = {
  slug: "maranatha",
  order: 0, // lo fija el portafolio (hoy: 1)
  name: "Maranatha",
  kind: { es: "Sitio web con pagos", en: "Website with payments" },
  sentence: {
    es: "La iglesia recibe diezmos y aportes en línea.",
    en: "The church receives tithes and donations online.",
  },
  summary: {
    es: "La iglesia recibe aportes de miembros en Venezuela, Colombia y el exterior, cada uno con el medio de pago que ya usa. Los visitantes ven la agenda, las prédicas y los proyectos; el equipo aprueba cada pago en un panel privado.",
    en: "The church receives donations from members in Venezuela, Colombia and abroad, each with the payment method they already use. Visitors see the agenda, sermons and projects; the team approves each payment in a private panel.",
  },
  role: { es: "Desarrollo completo.", en: "Full development." },
  stack: ["Next.js", "TypeScript", "Postgres", "Tailwind", "PayPal"],
  links: [
    { type: "live", url: "https://maranathasancristobal.com" },
    { type: "code", url: "https://github.com/Fockus26/maranatha" },
  ],
  media: {
    format: "desktop",
    video: "/work/maranatha/loop",
    poster: "/work/maranatha/poster.jpg",
  },
  client: { name: "Iglesia Maranatha", named: true },
};
