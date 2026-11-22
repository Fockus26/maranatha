"use client";

import NextLink from "next/link";
import { useActionState, useState } from "react";
import {
  type ResetError,
  type ResetState,
  resetPassword,
} from "@/app/actions/auth";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Link } from "@/components/ui/link";
import { FORGOT_PATH, PASSWORD_MAX, PASSWORD_MIN } from "@/lib/auth/constants";
import { authFormClass, DashboardAuthShell } from "./DashboardAuthShell";
import { PasswordField } from "./PasswordField";

const ERROR_TEXT: Record<ResetError, string> = {
  too_short: `La contraseña debe tener entre ${PASSWORD_MIN} y ${PASSWORD_MAX} caracteres.`,
  mismatch: "Las dos contraseñas no coinciden.",
  invalid_token:
    "El enlace venció o ya se usó. Pide uno nuevo para cambiar la contraseña.",
  too_many_attempts:
    "Demasiados intentos. Espera unos minutos y vuelve a intentarlo.",
  server_error:
    "No pudimos guardar la contraseña. Prueba de nuevo en unos minutos.",
};

/**
 * Contraseña nueva con el token del correo (Better Auth lo valida al abrir el
 * enlace y lo vuelve a validar al guardar). `linkError`: el enlace ya llegó
 * vencido o usado (`?error=INVALID_TOKEN`), o sin token.
 */
export function DashboardResetForm({
  token,
  linkError,
}: {
  token: string | null;
  linkError: boolean;
}) {
  const [state, formAction, pending] = useActionState<ResetState, FormData>(
    resetPassword,
    null,
  );
  const error: ResetError | null =
    linkError || !token
      ? "invalid_token"
      : state && !state.ok
        ? state.error
        : null;
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  return (
    <DashboardAuthShell
      title="Elige una contraseña nueva"
      subtitle="Al guardarla se cierran las sesiones abiertas en otros dispositivos."
    >
      {error === "invalid_token" ? (
        <div className={authFormClass}>
          <Alert
            id="reset-error"
            severity="error"
            role="alert"
            className="text-13"
          >
            {ERROR_TEXT.invalid_token}
          </Alert>
          <Button
            asChild
            color="secondary"
            size="large"
            className="self-start px-5"
          >
            <NextLink href={FORGOT_PATH}>Pedir otro enlace</NextLink>
          </Button>
        </div>
      ) : (
        <form action={formAction} noValidate className={authFormClass}>
          <input type="hidden" name="token" value={token ?? ""} />
          <PasswordField
            name="password"
            label="Contraseña nueva"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            error={error === "too_short"}
            description={
              <>
                Entre {PASSWORD_MIN} y {PASSWORD_MAX} caracteres.
              </>
            }
            minLength={PASSWORD_MIN}
            maxLength={PASSWORD_MAX}
            aria-describedby={error ? "reset-error" : undefined}
          />
          <PasswordField
            name="confirm"
            label="Repite la contraseña"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            error={error === "mismatch"}
            aria-describedby={error === "mismatch" ? "reset-error" : undefined}
          />

          {error && (
            <Alert
              id="reset-error"
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
              {pending ? "Guardando…" : "Guardar contraseña"}
            </Button>
            <Link
              asChild
              tone="muted"
              underline="always"
              className="relative text-14 max-md:tap-target"
            >
              <NextLink href="/dashboard/login">Volver a ingresar</NextLink>
            </Link>
          </div>
        </form>
      )}
    </DashboardAuthShell>
  );
}
