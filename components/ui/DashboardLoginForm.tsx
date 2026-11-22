"use client";

import NextLink from "next/link";
import { useActionState, useState } from "react";
import { type SignInError, type SignInState, signIn } from "@/app/actions/auth";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Link } from "@/components/ui/link";
import { FORGOT_PATH } from "@/lib/auth/constants";
import { isValidEmail } from "@/lib/validation";
import { authFormClass, DashboardAuthShell } from "./DashboardAuthShell";
import { PasswordField } from "./PasswordField";

const ERROR_TEXT: Record<SignInError, string> = {
  invalid_input: "Ingresa un correo válido y tu contraseña.",
  no_access: "Este correo no tiene acceso al panel.",
  unknown_email: "No existe una cuenta con ese correo.",
  wrong_password: "La contraseña no es correcta.",
  email_not_confirmed:
    "La cuenta existe pero su correo no está verificado. Pide al encargado del panel que lo verifique.",
  too_many_attempts:
    "Demasiados intentos de inicio de sesión. Espera unos minutos y vuelve a intentarlo.",
  server_error: "No pudimos iniciar sesión. Prueba de nuevo en unos minutos.",
};

/** Qué campo marcar en rojo según el error (el resto de errores no son de un campo). */
function erroredField(
  error: SignInError | null,
  email: string,
): "email" | "password" | null {
  switch (error) {
    case "no_access":
    case "unknown_email":
    case "email_not_confirmed":
      return "email";
    case "wrong_password":
      return "password";
    case "invalid_input":
      return isValidEmail(email) ? "password" : "email";
    default:
      return null;
  }
}

/**
 * Login del dashboard. Envía con un Server Action (`useActionState`). Correo
 * y contraseña son controlados: React 19 resetea los campos no controlados de
 * un `<form action>` tras cada envío, y con un error había que escribir todo
 * de nuevo. Solo se marca en rojo el campo que causó el error.
 *
 * `passwordReset`: se llega aquí desde "restablecer" con la contraseña nueva
 * ya guardada.
 */
export function DashboardLoginForm({
  passwordReset = false,
}: {
  passwordReset?: boolean;
}) {
  const [state, formAction, pending] = useActionState<SignInState, FormData>(
    signIn,
    null,
  );
  const error = state && !state.ok ? state.error : null;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const field = erroredField(error, email);

  return (
    <DashboardAuthShell
      title="Bienvenido de nuevo"
      subtitle="Ingresa para gestionar proyectos y verificar pagos."
    >
      <form action={formAction} noValidate className={authFormClass}>
        {passwordReset && !error && (
          <Alert severity="success" role="status" className="text-13">
            Tu contraseña se cambió. Ingresa con la nueva.
          </Alert>
        )}
        <Field label="Correo electrónico" required error={field === "email"}>
          <Input
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            aria-describedby={field === "email" ? "login-error" : undefined}
          />
        </Field>
        <PasswordField
          name="password"
          label="Contraseña"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          error={field === "password"}
          aria-describedby={field === "password" ? "login-error" : undefined}
        />

        {error && (
          <Alert
            id="login-error"
            severity="error"
            role="alert"
            className="text-13"
          >
            {ERROR_TEXT[error]}
          </Alert>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4">
          <Button
            type="submit"
            color="secondary"
            disabled={pending}
            size="large"
            className="px-5"
          >
            {pending ? "Ingresando…" : "Ingresar"}
          </Button>
          <Link
            asChild
            tone="muted"
            underline="always"
            className="relative text-14 max-md:tap-target"
          >
            <NextLink href={FORGOT_PATH}>¿Olvidaste tu contraseña?</NextLink>
          </Link>
        </div>
      </form>
    </DashboardAuthShell>
  );
}
