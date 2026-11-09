"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import MuiLink from "@mui/material/Link";
import TextField from "@mui/material/TextField";
import Link from "next/link";
import { useActionState, useState } from "react";
import { type SignInError, type SignInState, signIn } from "@/app/actions/auth";
import { FORGOT_PATH } from "@/lib/auth/constants";
import { isValidEmail } from "@/lib/validation";
import { fontScale } from "@/theme/tokens";
import { authFormSx, DashboardAuthShell } from "./DashboardAuthShell";

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
      <Box component="form" action={formAction} noValidate sx={authFormSx}>
        {passwordReset && !error && (
          <Alert
            severity="success"
            role="status"
            sx={{ fontSize: fontScale[13] }}
          >
            Tu contraseña se cambió. Ingresa con la nueva.
          </Alert>
        )}
        <TextField
          name="email"
          type="email"
          label="Correo electrónico"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          fullWidth
          error={field === "email"}
          slotProps={{
            htmlInput: {
              "aria-describedby": field === "email" ? "login-error" : undefined,
            },
          }}
        />
        <TextField
          name="password"
          type="password"
          label="Contraseña"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          fullWidth
          error={field === "password"}
          slotProps={{
            htmlInput: {
              "aria-describedby":
                field === "password" ? "login-error" : undefined,
            },
          }}
        />

        {error && (
          <Alert
            id="login-error"
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
            {pending ? "Ingresando…" : "Ingresar"}
          </Button>
          <MuiLink
            component={Link}
            href={FORGOT_PATH}
            color="text.secondary"
            underline="always"
            sx={{ fontSize: fontScale[14] }}
          >
            ¿Olvidaste tu contraseña?
          </MuiLink>
        </Box>
      </Box>
    </DashboardAuthShell>
  );
}
