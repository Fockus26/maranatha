"use client";

import VisibilityOffRounded from "@mui/icons-material/VisibilityOffRounded";
import VisibilityRounded from "@mui/icons-material/VisibilityRounded";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import TextField, { type TextFieldProps } from "@mui/material/TextField";
import { useState } from "react";

export type PasswordFieldProps = Omit<TextFieldProps, "type">;

/**
 * `TextField` de contraseña con un ojo para mostrarla u ocultarla (D106).
 * Mismas props que `TextField` (menos `type`); el botón va como adorno de
 * fin y conserva lo que se pase en `slotProps.input`.
 *
 * El nombre accesible del botón dice la acción ("Mostrar"/"Ocultar"), sin
 * `aria-pressed` además: decir las dos cosas confunde al lector de pantalla.
 * `onMouseDown` con `preventDefault` evita que el clic le quite el foco al
 * campo; con teclado, Tab llega al botón y Enter/Espacio lo activan.
 */
export function PasswordField({ slotProps, ...props }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const inputSlot =
    slotProps?.input && typeof slotProps.input === "object"
      ? slotProps.input
      : {};

  return (
    <TextField
      {...props}
      type={visible ? "text" : "password"}
      slotProps={{
        ...slotProps,
        input: {
          ...inputSlot,
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                type="button"
                edge="end"
                aria-label={
                  visible ? "Ocultar contraseña" : "Mostrar contraseña"
                }
                onClick={() => setVisible((v) => !v)}
                onMouseDown={(e) => e.preventDefault()}
                sx={{ width: 44, height: 44 }}
              >
                {visible ? <VisibilityOffRounded /> : <VisibilityRounded />}
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
    />
  );
}
