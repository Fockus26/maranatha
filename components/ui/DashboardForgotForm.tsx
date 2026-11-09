"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import MuiLink from "@mui/material/Link";
import TextField from "@mui/material/TextField";
import Link from "next/link";
import { useActionState, useState } from "react";
import {
  type ForgotError,
  type ForgotState,
  requestPasswordReset,
} from "@/app/actions/auth";
import { fontScale } from "@/theme/tokens";
import { authFormSx, DashboardAuthShell } from "./DashboardAuthShell";

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
      <Box component="form" action={formAction} noValidate sx={authFormSx}>
        <TextField
          name="email"
          type="email"
          label="Correo electrónico"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          fullWidth
          error={error === "invalid_input"}
          slotProps={{
            htmlInput: {
              "aria-describedby": error ? "forgot-error" : undefined,
            },
          }}
        />

        {sent && (
          <Alert
            severity="success"
            role="status"
            sx={{ fontSize: fontScale[13] }}
          >
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
            sx={{ fontSize: fontScale[13] }}
          >
            {ERROR_TEXT[error]}
          </Alert>
        )}

        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 2,
            justifyContent: "space-between",
          }}
        >
          <Button
            type="submit"
            variant="contained"
            color="secondary"
            disabled={pending}
            size="large"
            sx={{ px: 5 }}
          >
            {pending ? "Enviando…" : "Enviar enlace"}
          </Button>
          <MuiLink
            component={Link}
            href="/dashboard/login"
            color="text.secondary"
            underline="always"
            sx={{ fontSize: fontScale[14] }}
          >
            Volver a ingresar
          </MuiLink>
        </Box>
      </Box>
    </DashboardAuthShell>
  );
}
