import type { Metadata } from "next";
import { DashboardResetForm } from "@/components/ui/DashboardResetForm";

export const metadata: Metadata = {
  title: "Contraseña nueva",
  robots: { index: false, follow: false },
  // El token va en la URL: que no salga en el Referer de ningún enlace.
  referrer: "no-referrer",
};

/**
 * Destino del enlace del correo: Better Auth valida el token en
 * `/api/auth/reset-password/<token>` y redirige aquí con `?token=` o con
 * `?error=INVALID_TOKEN` (D082). Fuera de `(panel)`, como el login.
 */
export default async function DashboardResetPage({
  searchParams,
}: PageProps<"/dashboard/restablecer">) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : null;
  return (
    <DashboardResetForm token={token} linkError={params.error !== undefined} />
  );
}
