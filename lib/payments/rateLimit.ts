import "server-only";
import { createHmac } from "node:crypto";
import { and, count, eq, gte, lt, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { db, isDbConfigured } from "@/lib/db";
import { rateLimitHits } from "@/lib/db/schema";

/**
 * Rate limit para las acciones públicas (función SQL `hit_rate_limit`,
 * atómica: aguanta envíos concurrentes; su advisory lock vive dentro de su
 * propia transacción, así que funciona detrás de PgBouncer).
 *
 * Ni la IP ni el correo se guardan en claro: se usa un HMAC con un secreto
 * del servidor, así la tabla no sirve para identificar a nadie.
 *
 * La IP sale de `x-forwarded-for` (primer valor) — correcto detrás de Vercel
 * o de Caddy, que lo reescriben. Si el sitio se expone directo sin proxy,
 * ese header lo controla el cliente y el límite se puede esquivar; en ese
 * caso el freno por correo sigue activo.
 *
 * Si la base falla, se deja pasar (fail-open): no se bloquea a un donante
 * real por un problema de infraestructura.
 */

function hashKey(value: string): string {
  return createHmac("sha256", process.env.BETTER_AUTH_SECRET ?? "")
    .update(value)
    .digest("hex")
    .slice(0, 32);
}

async function clientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

export async function hitRateLimit(
  action: string,
  max: number,
  windowSeconds: number,
): Promise<boolean> {
  if (!isDbConfigured()) return true;
  const key = `${action}:${hashKey(await clientIp())}`;
  try {
    const result = await db().execute<{ allowed: boolean }>(
      sql`select public.hit_rate_limit(${key}, ${max}, ${windowSeconds}) as allowed`,
    );
    return result.rows[0]?.allowed === true;
  } catch (error) {
    console.error("[rate-limit]", error);
    return true;
  }
}

// ─── Fallos de login por cuenta ─────────────────────────────────────────
// El límite por IP no frena a quien prueba contraseñas de un admin desde
// muchas IPs, y uno estricto por IP bloquearía a todo un templo detrás de
// un mismo NAT. Este cuenta solo los fallos de cada correo (kit
// `tech/vps-postgres.md` › Rate limit by account).

export const LOGIN_FAILURES_MAX = 5;
export const LOGIN_FAILURES_WINDOW_SECONDS = 15 * 60;

const failureKey = (email: string) =>
  `login-fail:${hashKey(email.trim().toLowerCase())}`;

/** ¿La cuenta llegó al máximo de fallos en la ventana? Fail-open. */
export async function isAccountLocked(email: string): Promise<boolean> {
  if (!isDbConfigured()) return false;
  const since = new Date(Date.now() - LOGIN_FAILURES_WINDOW_SECONDS * 1000);
  try {
    const [{ n }] = await db()
      .select({ n: count() })
      .from(rateLimitHits)
      .where(
        and(
          eq(rateLimitHits.key, failureKey(email)),
          gte(rateLimitHits.createdAt, since),
        ),
      );
    return n >= LOGIN_FAILURES_MAX;
  } catch (error) {
    console.error("[rate-limit] isAccountLocked:", error);
    return false;
  }
}

export async function recordLoginFailure(email: string): Promise<void> {
  if (!isDbConfigured()) return;
  const key = failureKey(email);
  const since = new Date(Date.now() - LOGIN_FAILURES_WINDOW_SECONDS * 1000);
  try {
    // Lo vencido de esta cuenta sale aquí, para que la tabla no crezca.
    await db()
      .delete(rateLimitHits)
      .where(
        and(eq(rateLimitHits.key, key), lt(rateLimitHits.createdAt, since)),
      );
    await db().insert(rateLimitHits).values({ key });
  } catch (error) {
    console.error("[rate-limit] recordLoginFailure:", error);
  }
}

/** Un login correcto (o una contraseña nueva) reinicia el contador. */
export async function clearLoginFailures(email: string): Promise<void> {
  if (!isDbConfigured()) return;
  try {
    await db()
      .delete(rateLimitHits)
      .where(eq(rateLimitHits.key, failureKey(email)));
  } catch (error) {
    console.error("[rate-limit] clearLoginFailures:", error);
  }
}
