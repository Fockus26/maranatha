"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import MuiLink from "@mui/material/Link";
import TextField from "@mui/material/TextField";
import Link from "next/link";
import { useActionState, useState } from "react";
import {
  type ResetError,
  type ResetState,
  resetPassword,
} from "@/app/actions/auth";
import { FORGOT_PATH, PASSWORD_MAX, PASSWORD_MIN } from "@/lib/auth/constants";
import { fontScale } from "@/theme/tokens";
import { authFormSx, DashboardAuthShell } from "./DashboardAuthShell";

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
  const describedBy = error ? "reset-error" : "reset-hint";

  return (
    <DashboardAuthShell
      title="Elige una contraseña nueva"
      subtitle="Al guardarla se cierran las sesiones abiertas en otros dispositivos."
    >
      {error === "invalid_token" ? (
        <Box sx={authFormSx}>
          <Alert
            id="reset-error"
            severity="error"
            role="alert"
            sx={{ fontSize: fontScale[13] }}
          >
            {ERROR_TEXT.invalid_token}
          </Alert>
          <Button
            component={Link}
            href={FORGOT_PATH}
            variant="contained"
            color="secondary"
            size="large"
            sx={{ alignSelf: "flex-start", px: 5 }}
          >
            Pedir otro enlace
          </Button>
        </Box>
      ) : (
        <Box component="form" action={formAction} noValidate sx={authFormSx}>
          <input type="hidden" name="token" value={token ?? ""} />
          <TextField
            name="password"
            type="password"
            label="Contraseña nueva"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            fullWidth
            error={error === "too_short"}
            helperText={
              <span id="reset-hint">
                Entre {PASSWORD_MIN} y {PASSWORD_MAX} caracteres.
              </span>
            }
            slotProps={{
              htmlInput: {
                minLength: PASSWORD_MIN,
                maxLength: PASSWORD_MAX,
                "aria-describedby": describedBy,
              },
            }}
          />
          <TextField
            name="confirm"
            type="password"
            label="Repite la contraseña"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            fullWidth
            error={error === "mismatch"}
            slotProps={{
              htmlInput: {
                "aria-describedby":
                  error === "mismatch" ? "reset-error" : undefined,
              },
            }}
          />

          {error && (
            <Alert
              id="reset-error"
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
              {pending ? "Guardando…" : "Guardar contraseña"}
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
      )}
    </DashboardAuthShell>
  );
}
