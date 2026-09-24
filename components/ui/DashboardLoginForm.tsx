"use client";

import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { useTheme } from "@mui/material/styles";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useActionState, useState } from "react";
import { type SignInError, type SignInState, signIn } from "@/app/actions/auth";
import { radius, typography } from "@/theme/tokens";

const ERROR_TEXT: Record<SignInError, string> = {
  invalid_input: "Ingresa un correo válido y tu contraseña.",
  invalid_credentials: "Correo o contraseña incorrectos.",
  too_many_attempts:
    "Demasiados intentos de inicio de sesión. Espera unos minutos y vuelve a intentarlo.",
  server_error: "No pudimos iniciar sesión. Prueba de nuevo en unos minutos.",
};

/**
 * Formulario de acceso al dashboard. Envía con un Server Action
 * (`useActionState`), así que también funciona antes de hidratar.
 */
export function DashboardLoginForm() {
  const theme = useTheme();
  const [state, formAction, pending] = useActionState<SignInState, FormData>(
    signIn,
    null,
  );
  const error = state && !state.ok ? state.error : null;
  // Controlado: React 19 resetea los campos no controlados de un <form
  // action> después de cada envío, y con un error el correo se borraba.
  const [email, setEmail] = useState("");

  return (
    <Box
      component="form"
      action={formAction}
      sx={{
        width: "100%",
        maxWidth: 380,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: `${radius.lg}px`,
        backgroundColor: theme.palette.background.paper,
        p: { xs: 4, sm: 5.5 },
        display: "flex",
        flexDirection: "column",
        gap: 3,
      }}
    >
      <Box sx={{ textAlign: "center", mb: 1 }}>
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 44,
            height: 44,
            borderRadius: "12px",
            backgroundColor: theme.palette.action.hover,
            color: "secondary.main",
            mb: 2,
          }}
        >
          <LockOutlinedIcon fontSize="small" />
        </Box>
        <Typography
          component="h1"
          sx={{
            fontFamily: typography.fontFamily.heading,
            fontWeight: 700,
            fontSize: "22px",
          }}
        >
          Panel de la iglesia
        </Typography>
        <Typography sx={{ fontSize: "13px", color: "text.secondary", mt: 0.5 }}>
          Acceso solo para administradores
        </Typography>
      </Box>

      <TextField
        name="email"
        type="email"
        label="Correo electrónico"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        fullWidth
        size="small"
        error={Boolean(error)}
        slotProps={{
          htmlInput: { "aria-describedby": error ? "login-error" : undefined },
        }}
      />
      <TextField
        name="password"
        type="password"
        label="Contraseña"
        autoComplete="current-password"
        required
        fullWidth
        size="small"
        error={Boolean(error)}
        slotProps={{
          htmlInput: { "aria-describedby": error ? "login-error" : undefined },
        }}
      />

      {error && (
        <Alert
          id="login-error"
          severity="error"
          role="alert"
          sx={{ fontSize: "13px" }}
        >
          {ERROR_TEXT[error]}
        </Alert>
      )}

      <Button
        type="submit"
        variant="contained"
        color="secondary"
        fullWidth
        disabled={pending}
      >
        {pending ? "Ingresando…" : "Ingresar"}
      </Button>
    </Box>
  );
}
