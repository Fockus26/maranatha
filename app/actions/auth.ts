"use server";

import { APIError } from "better-auth/api";
import { sql } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { isAdminEmail, LOGIN_PATH } from "@/lib/auth/admin";
import { PASSWORD_MAX, PASSWORD_MIN, RESET_PATH } from "@/lib/auth/constants";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import {
  clearLoginFailures,
  hitRateLimit,
  isAccountLocked,
  recordLoginFailure,
} from "@/lib/payments/rateLimit";
import type { Result } from "@/lib/payments/schema";
import { EMAIL_RE } from "@/lib/validation";

/**
 * Login del dashboard con correo + contraseña (Better Auth, D082).
 *
 * Mensajes de error específicos (D075): "sin acceso", "no existe una cuenta"
 * o "contraseña incorrecta". Para no convertir el formulario en un oráculo
 * de cuentas:
 * - A un correo fuera de `ADMIN_EMAILS` solo se le dice "sin acceso", sin
 *   consultar si tiene cuenta.
 * - La distinción cuenta/contraseña solo existe para correos de la lista.
 * - Límite por IP (10 intentos / 15 min) y por cuenta (5 fallos / 15 min):
 *   el de IP no frena a quien prueba desde muchas IPs, y uno estricto por IP
 *   bloquearía a todos los que comparten la red del templo.
 */

const emailField = z.string().trim().toLowerCase().max(254).regex(EMAIL_RE);

const signInSchema = z.object({
  email: emailField,
  password: z.string().min(1).max(256),
});

export type SignInError =
  | "invalid_input"
  | "no_access"
  | "unknown_email"
  | "wrong_password"
  | "email_not_confirmed"
  | "too_many_attempts"
  | "server_error";
export type SignInState = Result<null, SignInError> | null;

/** Intentos de login por IP cada 15 minutos. */
const MAX_LOGIN_ATTEMPTS = 10;
const WINDOW = 15 * 60;

async function accountExists(email: string): Promise<boolean | null> {
  try {
    const rows = await db()
      .select({ id: user.id })
      .from(user)
      .where(sql`lower(${user.email}) = ${email}`)
      .limit(1);
    return rows.length > 0;
  } catch (error) {
    console.error("[auth] accountExists:", error);
    return null;
  }
}

export async function signIn(
  _prev: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { ok: false, error: "invalid_input" };
  const { email, password } = parsed.data;

  if (!(await hitRateLimit("login", MAX_LOGIN_ATTEMPTS, WINDOW))) {
    return { ok: false, error: "too_many_attempts" };
  }

  // Fuera de la lista: no se intenta ni se revela nada más.
  if (!isAdminEmail(email)) return { ok: false, error: "no_access" };

  if (await isAccountLocked(email))
    return { ok: false, error: "too_many_attempts" };

  try {
    await auth().api.signInEmail({
      body: { email, password },
      headers: await headers(),
    });
  } catch (error) {
    if (!(error instanceof APIError)) {
      console.error("[auth] signIn:", error);
      return { ok: false, error: "server_error" };
    }
    if (error.statusCode === 429)
      return { ok: false, error: "too_many_attempts" };
    if (error.statusCode === 403)
      return { ok: false, error: "email_not_confirmed" };
    if (error.statusCode !== 401) {
      console.error("[auth] signIn:", error);
      return { ok: false, error: "server_error" };
    }
    // Better Auth no dice cuál falló: se consulta si la cuenta existe (solo
    // para correos de la lista).
    await recordLoginFailure(email);
    const exists = await accountExists(email);
    if (exists === false) return { ok: false, error: "unknown_email" };
    return { ok: false, error: "wrong_password" };
  }

  await clearLoginFailures(email);
  redirect("/dashboard");
}

export async function signOut(): Promise<void> {
  try {
    await auth().api.signOut({ headers: await headers() });
  } catch (error) {
    // Sin sesión que cerrar: igual se vuelve al login.
    console.error("[auth] signOut:", error);
  }
  redirect(LOGIN_PATH);
}

// ─── Recuperación de contraseña ─────────────────────────────────────────

export type ForgotError =
  | "invalid_input"
  | "too_many_attempts"
  | "server_error";
export type ForgotState = Result<null, ForgotError> | null;

/**
 * Pide el correo de recuperación. La respuesta es la misma exista o no la
 * cuenta ("si el correo tiene acceso, te llegará un enlace"); solo se envía
 * a correos de `ADMIN_EMAILS`.
 */
export async function requestPasswordReset(
  _prev: ForgotState,
  formData: FormData,
): Promise<ForgotState> {
  const parsed = emailField.safeParse(formData.get("email"));
  if (!parsed.success) return { ok: false, error: "invalid_input" };

  if (!(await hitRateLimit("password-reset", 5, WINDOW)))
    return { ok: false, error: "too_many_attempts" };

  if (!isAdminEmail(parsed.data)) return { ok: true, data: null };

  try {
    await auth().api.requestPasswordReset({
      body: { email: parsed.data, redirectTo: RESET_PATH },
      headers: await headers(),
    });
  } catch (error) {
    console.error("[auth] requestPasswordReset:", error);
    return { ok: false, error: "server_error" };
  }
  return { ok: true, data: null };
}

const resetSchema = z
  .object({
    token: z.string().min(1).max(256),
    password: z.string().min(PASSWORD_MIN).max(PASSWORD_MAX),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { path: ["confirm"] });

export type ResetError =
  | "too_short"
  | "mismatch"
  | "invalid_token"
  | "too_many_attempts"
  | "server_error";
export type ResetState = Result<null, ResetError> | null;

export async function resetPassword(
  _prev: ResetState,
  formData: FormData,
): Promise<ResetState> {
  const parsed = resetSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) {
    const confirmOnly = parsed.error.issues.every(
      (i) => i.path[0] === "confirm",
    );
    if (!formData.get("token")) return { ok: false, error: "invalid_token" };
    return { ok: false, error: confirmOnly ? "mismatch" : "too_short" };
  }

  if (!(await hitRateLimit("password-reset-confirm", 10, WINDOW)))
    return { ok: false, error: "too_many_attempts" };

  try {
    await auth().api.resetPassword({
      body: { newPassword: parsed.data.password, token: parsed.data.token },
      headers: await headers(),
    });
  } catch (error) {
    if (error instanceof APIError && error.statusCode === 400)
      return { ok: false, error: "invalid_token" };
    console.error("[auth] resetPassword:", error);
    return { ok: false, error: "server_error" };
  }
  redirect(`${LOGIN_PATH}?restablecida=1`);
}
