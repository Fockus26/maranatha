import Box from "@mui/material/Box";
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

  return (
    <Box
      component="main"
      id="main-content"
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
        py: 6,
        bgcolor: "background.default",
      }}
    >
      <DashboardLoginForm />
    </Box>
  );
}
