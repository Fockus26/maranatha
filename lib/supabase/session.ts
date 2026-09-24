import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Cliente de Supabase con la sesión del usuario (cookies), para Server
 * Components, Server Actions y Route Handlers. Usa la clave publishable —
 * nunca la secreta: la identidad sale de la cookie de sesión, y con RLS sin
 * políticas este cliente no puede leer las tablas de pagos (para eso está
 * `lib/supabase/admin.ts`, solo tras verificar que el usuario es admin).
 *
 * `setAll` falla dentro de un Server Component (no pueden escribir cookies);
 * se ignora porque `proxy.ts` ya refresca la sesión en cada request.
 */
export async function supabaseSession() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    );
  }

  const cookieStore = await cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Component: la cookie la renueva el proxy.
        }
      },
    },
  });
}
