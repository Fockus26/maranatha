import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth/server";

/**
 * Rutas HTTP de Better Auth — solo las que el panel usa (kit
 * `tech/vps-postgres.md`): `toNextJsHandler` expone todas (sign-up,
 * change-password, list-sessions…) aunque la app no las llame. Es una lista
 * de permitidas, no de bloqueadas, para que un endpoint que agregue una
 * actualización de Better Auth quede cerrado.
 *
 * Hoy solo el enlace del correo de recuperación (`GET /reset-password/<token>`,
 * valida el token y redirige a `/dashboard/restablecer`). Login, cierre de
 * sesión y contraseña nueva van por Server Actions (`app/actions/auth.ts`),
 * que llaman a `auth().api.*` sin pasar por aquí.
 */

const ALLOWED: { method: "GET" | "POST"; path: RegExp }[] = [
  { method: "GET", path: /^\/reset-password\/[A-Za-z0-9_-]+$/ },
];

function allowed(req: Request): boolean {
  const path = new URL(req.url).pathname.replace(/^\/api\/auth/, "");
  return ALLOWED.some((r) => r.method === req.method && r.path.test(path));
}

const notFound = () => new Response(null, { status: 404 });

export async function GET(req: Request): Promise<Response> {
  return allowed(req) ? toNextJsHandler(auth()).GET(req) : notFound();
}

export async function POST(req: Request): Promise<Response> {
  return allowed(req) ? toNextJsHandler(auth()).POST(req) : notFound();
}
