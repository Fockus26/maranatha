import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

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
 * 2. En el dashboard, refresca la sesión de Supabase (cookies) y hace un
 *    chequeo OPTIMISTA: sin sesión → al login. La autorización real (¿es
 *    admin?) la hacen las páginas y Server Actions con `lib/auth/admin.ts`;
 *    el proxy no debe ser la única barrera.
 */
const ADMIN_HOST = process.env.ADMIN_HOST?.toLowerCase();
const LOGIN_PATH = "/dashboard/login";

function isDashboardPath(pathname: string) {
  return pathname === "/dashboard" || pathname.startsWith("/dashboard/");
}

async function withSession(
  req: NextRequest,
  res: NextResponse,
  pathname: string,
): Promise<NextResponse> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return res;

  let response = res;
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet)
          req.cookies.set(name, value);
        // Se conserva la respuesta original (rewrite/next + headers) y solo se
        // le agregan las cookies renovadas.
        for (const { name, value, options } of cookiesToSet)
          response.cookies.set(name, value, options);
      },
    },
  });

  // No quitar: además de verificar, renueva el token vencido. Sin esto las
  // sesiones se cortan al azar en páginas renderizadas en el servidor.
  const { data } = await supabase.auth.getClaims();
  const loggedIn = Boolean(data?.claims?.sub);

  if (!loggedIn && pathname !== LOGIN_PATH) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = LOGIN_PATH;
    redirectUrl.search = "";
    const redirect = NextResponse.redirect(redirectUrl);
    for (const cookie of response.cookies.getAll())
      redirect.cookies.set(cookie);
    response = redirect;
  }

  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!ADMIN_HOST) {
    if (isDashboardPath(pathname))
      return withSession(req, NextResponse.next({ request: req }), pathname);
    return NextResponse.next();
  }

  const host = (req.headers.get("host") ?? "").split(":")[0].toLowerCase();

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
