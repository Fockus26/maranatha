"use client";

import NextLink from "next/link";
import { useActionState, useState } from "react";
import {
  type ForgotError,
  type ForgotState,
  requestPasswordReset,
} from "@/app/actions/auth";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Link } from "@/components/ui/link";
import { authFormClass, DashboardAuthShell } from "./DashboardAuthShell";

const ERROR_TEXT: Record<ForgotError, string> = {
  invalid_input: "Ingresa un correo válido.",
  too_many_attempts:
    "Demasiadas solicitudes. Espera unos minutos y vuelve a intentarlo.",
  server_error: "No pudimos enviar el correo. Prueba de nuevo en unos minutos.",
};

/**
 * Pide el enlace para elegir una contraseña nueva. La respuesta es la misma
 * tenga o no cuenta el correo: no se revela quién tiene acceso al panel.
 */
export function DashboardForgotForm() {
  const [state, formAction, pending] = useActionState<ForgotState, FormData>(
    requestPasswordReset,
    null,
  );
  const error = state && !state.ok ? state.error : null;
  const sent = state?.ok === true;
  const [email, setEmail] = useState("");

  return (
    <DashboardAuthShell
      title="Recupera tu acceso"
      subtitle="Te enviaremos un enlace para elegir una contraseña nueva."
    >
      <form action={formAction} noValidate className={authFormClass}>
        <Field
          label="Correo electrónico"
          required
          error={error === "invalid_input"}
        >
          <Input
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            aria-describedby={error ? "forgot-error" : undefined}
          />
        </Field>

        {sent && (
          <Alert severity="success" role="status" className="text-13">
            Si ese correo tiene acceso al panel, te llegará un enlace en unos
            minutos. Revisa también la carpeta de spam. El enlace vence en una
            hora.
          </Alert>
        )}
        {error && (
          <Alert
            id="forgot-error"
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
            {pending ? "Enviando…" : "Enviar enlace"}
          </Button>
          <Link asChild tone="muted" underline="always" className="text-14">
            <NextLink href="/dashboard/login">Volver a ingresar</NextLink>
          </Link>
        </div>
      </form>
    </DashboardAuthShell>
  );
}
