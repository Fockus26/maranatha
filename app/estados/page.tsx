import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SITE_INDEXABLE } from "@/lib/siteConfig";
import { StatusGallery } from "./StatusGallery";

/**
 * Galería de pantallas de estado para QA (design-qa fase 09): permite revisar
 * 500, sin conexión y mantenimiento sin forzar el entorno. Solo existe en
 * desarrollo y en Vercel (pruebas); en producción responde 404.
 *
 * `/estados?screen=404 | 404-admin | 500 | 500-code | offline |
 * offline-draft | maintenance | maintenance-hour`
 */
export const metadata: Metadata = {
  title: "Pantallas de estado",
  robots: { index: false, follow: false },
};

export default async function EstadosPage({
  searchParams,
}: {
  searchParams: Promise<{ screen?: string }>;
}) {
  if (SITE_INDEXABLE && process.env.NODE_ENV === "production") notFound();
  const { screen } = await searchParams;
  // Calculada en el servidor para que la hora no cambie al hidratar.
  const returnAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
  return <StatusGallery screen={screen ?? "404"} returnAt={returnAt} />;
}
