import "server-only";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

/**
 * Conexión a Postgres (VPS, a través de PgBouncer en modo transacción; en QA,
 * el contenedor de `qa:local`). Solo servidor: no hay cliente público ni RLS,
 * así que toda la autorización vive en las Server Actions y rutas que llaman
 * a `lib/payments/repository.ts`, `lib/agenda/repository.ts` y
 * `lib/auth/admin.ts`.
 *
 * Reglas del pooler (kit `tech/vps-postgres.md`): nada de estado de sesión
 * entre consultas (`SET`, advisory locks fuera de una transacción, `LISTEN`).
 * `hit_rate_limit()` toma su lock dentro de su propia transacción: sirve.
 */

export type Db = NodePgDatabase<typeof schema>;

// En dev, el hot reload re-evalúa el módulo: el pool se guarda en globalThis
// para no abrir uno nuevo en cada cambio.
const globalForDb = globalThis as unknown as { __maranathaDb?: Db };

export function isDbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export function db(): Db {
  if (globalForDb.__maranathaDb) return globalForDb.__maranathaDb;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("Falta DATABASE_URL");

  const pool = new Pool({
    connectionString,
    max: Number(process.env.DATABASE_POOL_MAX ?? 5),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });
  // Sin esto, una conexión ociosa que el servidor corta mata el proceso.
  pool.on("error", (error) => {
    console.error("[db] pool:", error.message);
  });

  globalForDb.__maranathaDb = drizzle(pool, { schema });
  return globalForDb.__maranathaDb;
}

/** Código de Postgres de una violación de unicidad. */
export const UNIQUE_VIOLATION = "23505";

/** El código SQLSTATE de un error de `pg` (también envuelto por Drizzle). */
export function pgErrorCode(error: unknown): string | undefined {
  let current: unknown = error;
  for (let i = 0; i < 3 && current && typeof current === "object"; i++) {
    const code = (current as { code?: unknown }).code;
    if (typeof code === "string") return code;
    current = (current as { cause?: unknown }).cause;
  }
  return undefined;
}
