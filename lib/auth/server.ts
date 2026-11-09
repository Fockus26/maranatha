import "server-only";
import bcrypt from "bcryptjs";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { verifyPassword } from "better-auth/crypto";
import { nextCookies } from "better-auth/next-js";
import { after } from "next/server";
import { createElement } from "react";
import { db } from "@/lib/db";
import { account, session, user, verification } from "@/lib/db/schema";
import {
  RESET_PASSWORD_SUBJECT,
  ResetPasswordEmail,
} from "@/lib/email/ResetPasswordEmail";
import { sendEmail } from "@/lib/email/send";
import { clearLoginFailures } from "@/lib/payments/rateLimit";
import { PASSWORD_MAX, PASSWORD_MIN } from "./constants";
import { isAdminEmail } from "./emails";

/**
 * Better Auth (D082): sesiones del dashboard en la propia base, en lugar de
 * Supabase Auth. Sin registro (`disableSignUp`): las cuentas vienen de la
 * importación de Supabase o de `scripts/create-admin.ts`, y además el correo
 * tiene que estar en `ADMIN_EMAILS` (`lib/auth/admin.ts`).
 *
 * La ruta `app/api/auth/[...all]` solo expone lo que el panel usa por HTTP
 * (el enlace del correo de recuperación); el login, el cierre de sesión y el
 * cambio de contraseña van por Server Actions con `auth.api.*`.
 */

/** Hash de Supabase Auth: bcrypt (`$2a$`, `$2b$`, `$2y$`). */
export function isBcryptHash(hash: string): boolean {
  return /^\$2[aby]\$\d{2}\$/.test(hash);
}

/**
 * Los admins importados de Supabase conservan su contraseña: su hash bcrypt
 * se verifica con bcrypt, y el resto con el scrypt de Better Auth. `hash`
 * queda el de Better Auth, así cada uno pasa a scrypt al cambiar contraseña.
 */
export async function verifyAnyPassword({
  hash,
  password,
}: {
  hash: string;
  password: string;
}): Promise<boolean> {
  if (isBcryptHash(hash)) return bcrypt.compare(password, hash);
  return verifyPassword({ hash, password });
}

/**
 * Orígenes desde los que se acepta un login: el del panel, el del sitio y,
 * en Vercel, el de cada despliegue de prueba (su URL cambia en cada uno).
 */
export function trustedOrigins(env: NodeJS.ProcessEnv = process.env): string[] {
  const https = (host?: string) => (host ? `https://${host}` : undefined);
  return [
    env.BETTER_AUTH_URL,
    env.NEXT_PUBLIC_SITE_URL,
    https(env.ADMIN_HOST),
    https(env.VERCEL_URL),
    https(env.VERCEL_BRANCH_URL),
  ]
    .filter((o): o is string => Boolean(o))
    .map((o) => o.replace(/\/$/, ""));
}

function createAuth() {
  return betterAuth({
    appName: "Iglesia Maranatha",
    baseURL: process.env.BETTER_AUTH_URL,
    trustedOrigins: trustedOrigins(),
    secret: process.env.BETTER_AUTH_SECRET,
    database: drizzleAdapter(db(), {
      provider: "pg",
      schema: { user, session, account, verification },
    }),
    advanced: {
      // Ids uuid: los de Supabase se importan tal cual.
      database: { generateId: "uuid" },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 días
      updateAge: 60 * 60 * 24, // se renueva una vez al día de uso
    },
    emailAndPassword: {
      enabled: true,
      disableSignUp: true,
      // Como en Supabase: una cuenta sin correo verificado no entra (403).
      requireEmailVerification: true,
      minPasswordLength: PASSWORD_MIN,
      maxPasswordLength: PASSWORD_MAX,
      resetPasswordTokenExpiresIn: 60 * 60,
      // Una contraseña nueva cierra las demás sesiones (otro dispositivo,
      // o quien la tuviera).
      revokeSessionsOnPasswordReset: true,
      password: { verify: verifyAnyPassword },
      sendResetPassword: async ({ user: target, url }) => {
        // Defensa en profundidad: la Server Action ya filtró por la lista.
        if (!isAdminEmail(target.email)) return;
        // Sin await: un envío esperado haría medible por tiempo si la
        // cuenta existe. `after` deja terminar el envío en Vercel.
        after(() =>
          sendEmail(
            target.email,
            RESET_PASSWORD_SUBJECT,
            createElement(ResetPasswordEmail, { url }),
          ),
        );
      },
      onPasswordReset: async ({ user: target }) => {
        await clearLoginFailures(target.email);
      },
    },
    // Solo aplica a la ruta HTTP (hoy, el enlace de recuperación). El login
    // por Server Action tiene su límite por IP y por cuenta.
    rateLimit: { enabled: true, window: 60, max: 30 },
    // Siempre el último: escribe las cookies desde las Server Actions.
    plugins: [nextCookies()],
  });
}

type Auth = ReturnType<typeof createAuth>;
const globalForAuth = globalThis as unknown as { __maranathaAuth?: Auth };

/** Instancia perezosa: el build no necesita base ni secretos. */
export function auth(): Auth {
  globalForAuth.__maranathaAuth ??= createAuth();
  return globalForAuth.__maranathaAuth;
}
