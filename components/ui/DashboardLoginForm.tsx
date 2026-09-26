"use client";

import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { alpha, useTheme } from "@mui/material/styles";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { useActionState, useState } from "react";
import { type SignInError, type SignInState, signIn } from "@/app/actions/auth";
import { isValidEmail } from "@/lib/validation";
import { patternLayerSx } from "@/theme/patterns";
import { radius, typography } from "@/theme/tokens";

const ERROR_TEXT: Record<SignInError, string> = {
  invalid_input: "Ingresa un correo válido y tu contraseña.",
  no_access: "Este correo no tiene acceso al panel.",
  unknown_email: "No existe una cuenta con ese correo.",
  wrong_password: "La contraseña no es correcta.",
  email_not_confirmed:
    "La cuenta existe pero su correo no está confirmado. Pide que la confirmen en Supabase.",
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
 * Login del dashboard — opción C ("minimal editorial") del comparativo de
 * /design: sin tarjeta, alineado a la izquierda, con acceso para volver al
 * sitio. En desktop se amplía (título grande, campos de tamaño normal,
 * centrado en vertical) y la mitad derecha lleva el patrón diagonal del sitio
 * desvaneciéndose hacia el formulario, para que la pantalla no quede vacía.
 *
 * Envía con un Server Action (`useActionState`). Correo y contraseña son
 * controlados: React 19 resetea los campos no controlados de un `<form
 * action>` tras cada envío, y con un error había que escribir todo de nuevo.
 * Solo se marca en rojo el campo que causó el error.
 */
export function DashboardLoginForm() {
  const theme = useTheme();
  const [state, formAction, pending] = useActionState<SignInState, FormData>(
    signIn,
    null,
  );
  const error = state && !state.ok ? state.error : null;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const field = erroredField(error, email);

  return (
    <Box
      sx={{
        position: "relative",
        overflow: "hidden",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.default",
        px: { xs: 3, md: 8 },
        py: { xs: 4, md: 6 },
      }}
    >
      <Box
        aria-hidden="true"
        sx={{
          ...patternLayerSx(alpha(theme.palette.text.primary, 0.07)),
          display: { xs: "none", md: "block" },
          left: "45%",
          maskImage: "linear-gradient(to right, transparent, black 45%)",
        }}
      />
      <Box
        component="header"
        sx={{
          position: "relative",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 2,
          mb: { xs: 8, md: 0 },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
          <Box
            sx={{
              width: 18,
              height: 18,
              borderRadius: `${radius.xs}px`,
              bgcolor: "secondary.main",
            }}
          />
          <Typography
            sx={{
              fontFamily: typography.fontFamily.heading,
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            Iglesia Maranatha
          </Typography>
        </Box>
        <Button
          component={Link}
          href="/"
          size="small"
          color="inherit"
          startIcon={<ArrowBackRoundedIcon fontSize="small" />}
          sx={{ textTransform: "none", fontSize: 12 }}
        >
          Volver al sitio
        </Button>
      </Box>

      <Box
        component="main"
        id="main-content"
        sx={{
          position: "relative",
          flex: { md: 1 },
          display: "flex",
          alignItems: "center",
          width: "100%",
          maxWidth: { xs: 360, md: 440 },
          py: { md: 6 },
        }}
      >
        <Box
          component="form"
          action={formAction}
          noValidate
          sx={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: { xs: 2.5, md: 3 },
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              color: "secondary.main",
            }}
          >
            <ShieldOutlinedIcon sx={{ fontSize: 16 }} aria-hidden="true" />
            <Typography
              sx={{
                fontSize: 11,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                fontWeight: 600,
              }}
            >
              Área privada
            </Typography>
          </Box>
          <Typography
            component="h1"
            sx={{
              fontFamily: typography.fontFamily.heading,
              fontWeight: 800,
              fontSize: {
                xs: typography.size.h2.mobile,
                md: typography.size.h1.desktop,
              },
              lineHeight: typography.lineHeight.h1,
            }}
          >
            Bienvenido de nuevo
          </Typography>
          <Typography
            sx={{
              fontSize: {
                xs: typography.size.small,
                md: typography.size.bodyLarge,
              },
              color: theme.palette.text.secondary,
              mt: { xs: -1, md: -1.5 },
            }}
          >
            Ingresa para gestionar proyectos y verificar pagos.
          </Typography>

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
                "aria-describedby":
                  field === "email" ? "login-error" : undefined,
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
              sx={{ fontSize: "13px" }}
            >
              {ERROR_TEXT[error]}
            </Alert>
          )}

          <Button
            type="submit"
            variant="contained"
            color="secondary"
            disabled={pending}
            size="large"
            sx={{ alignSelf: "flex-start", px: 5 }}
          >
            {pending ? "Ingresando…" : "Ingresar"}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
