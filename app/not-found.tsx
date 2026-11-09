import { StatusScreen } from "@/components/status/StatusScreen";
import { getAdmin } from "@/lib/auth/admin";

/**
 * 404 (D079). Con sesión de admin ofrece volver al panel; si no, al inicio
 * y a las reuniones. Sin base configurada (build local sin `.env`) se
 * trata como visitante.
 */
export default async function NotFound() {
  const admin = await getAdmin().catch(() => null);
  const adminHost = process.env.ADMIN_HOST;

  return admin ? (
    <StatusScreen
      variant="404-admin"
      panelHref={adminHost ? `https://${adminHost}/` : "/dashboard"}
    />
  ) : (
    <StatusScreen variant="404" />
  );
}
