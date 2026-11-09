import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { isAdminEmail } from "./emails";
import { auth } from "./server";

/**
 * Autorización del dashboard.
 *
 * Tener cuenta en Better Auth no alcanza: el correo tiene que estar en
 * `ADMIN_EMAILS`. Las cuentas vienen de la importación de Supabase o se crean
 * con `bun scripts/create-admin.ts` (D082); el sitio no tiene registro.
 *
 * El proxy solo hace un chequeo optimista (¿hay cookie de sesión?). La
 * autorización real se hace acá, cerca de los datos: en cada página del
 * panel, en cada Server Action de admin y en la ruta de comprobantes.
 */

export { isAdminEmail };

export const LOGIN_PATH = "/dashboard/login";

export interface Admin {
  id: string;
  email: string;
}

async function readAdmin(): Promise<Admin | null> {
  try {
    const result = await auth().api.getSession({ headers: await headers() });
    const email = result?.user.email;
    if (!result || !isAdminEmail(email)) return null;
    return { id: result.user.id, email: String(email).toLowerCase() };
  } catch (error) {
    // Base caída o sin configurar: nadie entra, y el login lo dice.
    console.error("[auth] getSession:", error);
    return null;
  }
}

/**
 * Admin de la request actual, o `null`. La sesión se busca en la base en
 * cada request (no hay caché en cookie), así que una sesión revocada deja de
 * valer al instante. Memoizado por request con `cache()` para que layout +
 * página no consulten dos veces.
 */
export const getAdmin = cache(readAdmin);

/** Para páginas: sin admin → al login. */
export async function requireAdmin(): Promise<Admin> {
  const admin = await getAdmin();
  if (!admin) redirect(LOGIN_PATH);
  return admin;
}

/**
 * Para mutaciones (aprobar/rechazar pagos, cambiar ajustes). Con Supabase era
 * otra consulta (`getUser()`); con Better Auth la sesión ya sale de la base,
 * así que es la misma verificación sin memoizar.
 */
export async function getAdminStrict(): Promise<Admin | null> {
  return readAdmin();
}
