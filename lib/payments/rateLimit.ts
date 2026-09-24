import "server-only";
import { createHmac } from "node:crypto";
import { headers } from "next/headers";
import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Rate limit por IP para las acciones públicas del checkout (función SQL
 * `hit_rate_limit`, atómica: aguanta envíos concurrentes).
 *
 * La IP no se guarda en claro: se usa un HMAC con la clave secreta del
 * servidor, así la tabla no sirve para identificar a nadie.
 *
 * La IP sale de `x-forwarded-for` (primer valor) — correcto detrás de Vercel
 * o de un proxy que lo reescriba. Si el sitio se expone directo sin proxy,
 * ese header lo controla el cliente y el límite se puede esquivar; en ese
 * caso el freno por correo sigue activo.
 *
 * Si la base falla, se deja pasar (fail-open): no se bloquea a un donante
 * real por un problema de infraestructura.
 */
export async function hitRateLimit(
  action: string,
  max: number,
  windowSeconds: number,
): Promise<boolean> {
  if (!isSupabaseConfigured()) return true;

  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip")?.trim() ||
    "unknown";
  const key = `${action}:${createHmac(
    "sha256",
    process.env.SUPABASE_SECRET_KEY ?? "",
  )
    .update(ip)
    .digest("hex")
    .slice(0, 32)}`;

  const { data, error } = await supabaseAdmin().rpc("hit_rate_limit", {
    p_key: key,
    p_max: max,
    p_window_seconds: windowSeconds,
  });
  if (error) {
    console.error("[rate-limit]", error);
    return true;
  }
  return data === true;
}
