import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";
import { FORGOT_PATH, RESET_PATH } from "@/lib/auth/constants";
import {
  bypassesMaintenance,
  MAINTENANCE_PATH,
  maintenanceOn,
  retryAfterSeconds,
} from "@/lib/maintenance";

/**
 * Proxy (antes `middleware.ts` — renombrado en Next.js 16).
 *
 * 1. Separa el sitio público del panel privado por dominio:
 *
 *      maranathasancristobal.com               → sitio normal (`/dashboard` da 404)
 *      admin.maranathasancristobal.com         → raíz muestra el dashboard;
 *                                                el resto se navega bajo /dashboard/*
 *
 *    Se activa solo si existe la variable de entorno `ADMIN_HOST`. Sin ella
 *    (local, o el deploy gratis en `*.vercel.app`) el dashboard vive en
 *    `/dashboard` como una ruta más.
 *
 * 2. En el dashboard hace un chequeo OPTIMISTA de la cookie de sesión de
 *    Better Auth: sin cookie → al login. La autorización real (¿es
 *    admin?) la hacen las páginas y Server Actions con `lib/auth/admin.ts`;
 *    el proxy no debe ser la única barrera.
 */
const ADMIN_HOST = process.env.ADMIN_HOST?.toLowerCase();
const LOGIN_PATH = "/dashboard/login";

function isDashboardPath(pathname: string) {
  return pathname === "/dashboard" || pathname.startsWith("/dashboard/");
}

/** Páginas del panel que se ven sin sesión (si no, redirigirían en bucle). */
const PUBLIC_DASHBOARD_PATHS = new Set([LOGIN_PATH, FORGOT_PATH, RESET_PATH]);

function withSession(
  req: NextRequest,
  res: NextResponse,
  pathname: string,
): NextResponse {
  // Solo mira si hay cookie de sesión de Better Auth; no la valida (eso lo
  // hacen las páginas y acciones con `getAdmin`, contra la base).
  const loggedIn = Boolean(getSessionCookie(req));

  // Solo se redirigen las navegaciones (GET/HEAD). Un POST de Server Action
  // seguido de un 307 llega al login, que no tiene la acción, y el cliente
  // solo ve "No hubo respuesta del servidor". Sin redirigir, la acción
  // responde `unauthorized` (lo comprueba `getAdmin`) y la pantalla dice
  // "Tu sesión expiró" (QA de versión 09).
  const isNavigation = req.method === "GET" || req.method === "HEAD";

  let response = res;
  if (!loggedIn && isNavigation && !PUBLIC_DASHBOARD_PATHS.has(pathname)) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = LOGIN_PATH;
    redirectUrl.search = "";
    response = NextResponse.redirect(redirectUrl);
  }

  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

/**
 * 3. Mantenimiento (D079): con `MAINTENANCE_MODE=1` el sitio público se
 *    reescribe a `/mantenimiento` con 503 + `Retry-After`. El panel, la API
 *    (webhooks de pago) y los archivos estáticos siguen funcionando.
 */
function maintenance(req: NextRequest, pathname: string): NextResponse | null {
  if (!maintenanceOn()) {
    // Fuera de mantenimiento, la pantalla no tiene sentido.
    return pathname === MAINTENANCE_PATH
      ? NextResponse.redirect(new URL("/", req.url))
      : null;
  }
  if (bypassesMaintenance(pathname)) return null;
  const res = NextResponse.rewrite(new URL(MAINTENANCE_PATH, req.url), {
    status: 503,
  });
  res.headers.set("Retry-After", String(retryAfterSeconds()));
  res.headers.set("Cache-Control", "no-store");
  return res;
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const host = (req.headers.get("host") ?? "").split(":")[0].toLowerCase();

  if (!ADMIN_HOST || host !== ADMIN_HOST) {
    const res = maintenance(req, pathname);
    if (res) return res;
  }

  if (!ADMIN_HOST) {
    if (isDashboardPath(pathname))
      return withSession(req, NextResponse.next({ request: req }), pathname);
    return NextResponse.next();
  }

  if (host === ADMIN_HOST) {
    // La raíz del subdominio muestra el dashboard sin exponer /dashboard.
    if (pathname === "/") {
      return withSession(
        req,
        NextResponse.rewrite(new URL("/dashboard", req.url), { request: req }),
        "/dashboard",
      );
    }
    if (isDashboardPath(pathname))
      return withSession(req, NextResponse.next({ request: req }), pathname);
    const res = NextResponse.next();
    // Nada del panel privado se indexa.
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
    return res;
  }

  // En el dominio público el dashboard no existe.
  if (isDashboardPath(pathname)) {
    return new NextResponse(null, { status: 404 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Todo menos assets estáticos y los archivos de metadata de Next.
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|icon|apple-icon|opengraph-image|twitter-image|manifest.webmanifest).*)",
  ],
};
