import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente de Supabase con la clave SECRETA — salta RLS, así que solo existe
 * en el servidor (`server-only` rompe el build si algún componente cliente lo
 * importa). Las tablas de pagos tienen RLS sin políticas: este cliente es la
 * única puerta de entrada a ellas.
 *
 * Es un cliente aparte del de sesión (`lib/supabase/session.ts`) a propósito:
 * si compartieran instancia, la sesión del admin reemplazaría la clave secreta
 * en el header `Authorization` y las consultas empezarían a fallar por RLS.
 */
let adminClient: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SECRET_KEY,
  );
}

export function supabaseAdmin(): SupabaseClient {
  if (adminClient) return adminClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SECRET_KEY");
  }

  adminClient = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
  return adminClient;
}
