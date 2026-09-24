"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { isAdminEmail, LOGIN_PATH } from "@/lib/auth/admin";
import type { Result } from "@/lib/payments/schema";
import { supabaseSession } from "@/lib/supabase/session";
import { EMAIL_RE } from "@/lib/validation";

/**
 * Login del dashboard con correo + contraseña de Supabase Auth.
 *
 * - Mensaje de error único ("credenciales inválidas") tanto si el correo no
 *   existe, si la contraseña es incorrecta o si la cuenta no es admin: no se
 *   revela qué correos tienen cuenta.
 * - El rate limit de intentos lo aplica Supabase Auth por IP (Authentication
 *   → Rate Limits en su panel).
 * - Una cuenta válida que no está en `ADMIN_EMAILS` se desloguea de inmediato
 *   para no dejar una sesión inútil en la cookie.
 */

const signInSchema = z.object({
  email: z.string().trim().toLowerCase().max(254).regex(EMAIL_RE),
  password: z.string().min(1).max(256),
});

export type SignInError =
  | "invalid_input"
  | "invalid_credentials"
  | "server_error";
export type SignInState = Result<null, SignInError> | null;

export async function signIn(
  _prev: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { ok: false, error: "invalid_input" };

  let supabase: Awaited<ReturnType<typeof supabaseSession>>;
  try {
    supabase = await supabaseSession();
  } catch (error) {
    console.error("[auth] signIn:", error);
    return { ok: false, error: "server_error" };
  }

  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    // 400 = credenciales inválidas / correo sin confirmar; el resto es infraestructura.
    if (error.status && error.status >= 500) {
      console.error("[auth] signIn:", error);
      return { ok: false, error: "server_error" };
    }
    return { ok: false, error: "invalid_credentials" };
  }

  if (!isAdminEmail(data.user?.email)) {
    await supabase.auth.signOut();
    return { ok: false, error: "invalid_credentials" };
  }

  redirect("/dashboard");
}

export async function signOut(): Promise<void> {
  const supabase = await supabaseSession();
  await supabase.auth.signOut();
  redirect(LOGIN_PATH);
}
