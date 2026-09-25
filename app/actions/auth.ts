"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { isAdminEmail, LOGIN_PATH } from "@/lib/auth/admin";
import { hitRateLimit } from "@/lib/payments/rateLimit";
import type { Result } from "@/lib/payments/schema";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { supabaseSession } from "@/lib/supabase/session";
import { EMAIL_RE } from "@/lib/validation";

/**
 * Login del dashboard con correo + contraseña de Supabase Auth.
 *
 * Mensajes de error específicos (pedido explícito): "sin acceso", "no existe
 * una cuenta" o "contraseña incorrecta". Para no convertir el formulario en
 * un oráculo de cuentas:
 * - A un correo fuera de `ADMIN_EMAILS` solo se le dice "sin acceso", sin
 *   consultar si tiene cuenta.
 * - La distinción cuenta/contraseña solo existe para correos de la lista.
 * - Rate limit propio por IP (además del de Supabase Auth, que se aplica a
 *   la IP del servidor y no a la del atacante).
 */

const signInSchema = z.object({
  email: z.string().trim().toLowerCase().max(254).regex(EMAIL_RE),
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

async function accountExists(email: string): Promise<boolean | null> {
  const { data, error } = await supabaseAdmin().rpc("auth_email_exists", {
    p_email: email,
  });
  if (error) {
    console.error("[auth] auth_email_exists:", error);
    return null;
  }
  return data === true;
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

  if (!(await hitRateLimit("login", MAX_LOGIN_ATTEMPTS, 15 * 60))) {
    return { ok: false, error: "too_many_attempts" };
  }

  // Fuera de la lista: no se intenta ni se revela nada más.
  if (!isAdminEmail(parsed.data.email)) return { ok: false, error: "no_access" };

  let supabase: Awaited<ReturnType<typeof supabaseSession>>;
  try {
    supabase = await supabaseSession();
  } catch (error) {
    console.error("[auth] signIn:", error);
    return { ok: false, error: "server_error" };
  }

  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    if (error.status === 429) return { ok: false, error: "too_many_attempts" };
    if (error.status && error.status >= 500) {
      console.error("[auth] signIn:", error);
      return { ok: false, error: "server_error" };
    }
    if (error.code === "email_not_confirmed")
      return { ok: false, error: "email_not_confirmed" };
    // "invalid_credentials" de Supabase no dice cuál falló: se consulta si la
    // cuenta existe (solo para correos de la lista).
    const exists = await accountExists(parsed.data.email);
    if (exists === false) return { ok: false, error: "unknown_email" };
    return { ok: false, error: "wrong_password" };
  }

  redirect("/dashboard");
}

export async function signOut(): Promise<void> {
  const supabase = await supabaseSession();
  await supabase.auth.signOut();
  redirect(LOGIN_PATH);
}
