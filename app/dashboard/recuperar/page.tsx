import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DashboardForgotForm } from "@/components/ui/DashboardForgotForm";
import { getAdmin } from "@/lib/auth/admin";

export const metadata: Metadata = {
  title: "Recuperar acceso",
  robots: { index: false, follow: false },
};

/** Pide el correo de recuperación (D082). Fuera de `(panel)`, como el login. */
export default async function DashboardForgotPage() {
  if (await getAdmin()) redirect("/dashboard");
  return <DashboardForgotForm />;
}
