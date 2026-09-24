import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { supabaseSession } from "@/lib/supabase/session";

/**
 * Autorización del dashboard.
 *
 * Tener cuenta en Supabase Auth no alcanza: el correo tiene que estar en
 * `ADMIN_EMAILS` (lista separada por comas). Las cuentas se crean a mano en
 * el panel de Supabase (Authentication → Users → Add user); el sitio no
 * tiene registro público.
 *
 * El proxy solo hace un chequeo optimista (redirige si no hay sesión). La
 * autorización real se hace acá, cerca de los datos: en cada página del
 * panel y en cada Server Action de admin.
 */

export const LOGIN_PATH = "/dashboard/login";

export interface Admin {
  id: string;
  email: string;
}

function adminEmails(): Set<string> {
  return new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isAdminEmail(email: string | null | undefined): boolean {
  return Boolean(email) && adminEmails().has(String(email).toLowerCase());
}

/**
 * Admin de la request actual, o `null`. `getClaims()` verifica la firma y la
 * expiración del JWT (suficiente para autorizar lecturas). Memoizado por
 * request con `cache()` para que layout + página no verifiquen dos veces.
 */
export const getAdmin = cache(async (): Promise<Admin | null> => {
  const supabase = await supabaseSession();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub || !isAdminEmail(claims.email as string | undefined))
    return null;
  return { id: claims.sub, email: String(claims.email).toLowerCase() };
});

/** Para páginas: sin admin → al login. */
export async function requireAdmin(): Promise<Admin> {
  const admin = await getAdmin();
  if (!admin) redirect(LOGIN_PATH);
  return admin;
}

/**
 * Para mutaciones (aprobar/rechazar pagos, cambiar ajustes): consulta al
 * servidor de Auth con `getUser()`, que sí detecta una sesión revocada
 * (cierre de sesión en otro dispositivo, usuario eliminado) aunque el JWT
 * todavía no haya expirado.
 */
export async function getAdminStrict(): Promise<Admin | null> {
  const supabase = await supabaseSession();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user?.email || !isAdminEmail(data.user.email)) return null;
  return { id: data.user.id, email: data.user.email.toLowerCase() };
}
