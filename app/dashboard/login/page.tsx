import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DashboardLoginForm } from "@/components/ui/DashboardLoginForm";
import { getAdmin } from "@/lib/auth/admin";

export const metadata: Metadata = {
  title: "Ingresar",
  robots: { index: false, follow: false },
};

/**
 * Login del dashboard. Vive fuera del grupo `(panel)` para no heredar su
 * chequeo de admin (si no, redirigiría a sí mismo en bucle). Si ya hay una
 * sesión de admin válida, va directo al panel.
 */
export default async function DashboardLoginPage() {
  if (await getAdmin()) redirect("/dashboard");

  // El formulario trae su propio layout de página completa (opción C).
  return <DashboardLoginForm />;
}
