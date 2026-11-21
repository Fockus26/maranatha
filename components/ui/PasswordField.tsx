"use client";

import { Eye, EyeOff } from "lucide-react";
import { type ComponentProps, type ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export interface PasswordFieldProps
  extends Omit<ComponentProps<"input">, "type" | "children"> {
  label: ReactNode;
  /** Ayuda bajo el campo (el `helperText` de MUI). */
  description?: ReactNode;
  /** Texto de error bajo el campo, o `true` para marcarlo sin mensaje. */
  error?: ReactNode;
  /** Clases del `Field` (el resto va al `<input>`). */
  fieldClassName?: string;
}

/**
 * Campo de contraseña con un ojo para mostrarla u ocultarla (D106): `Field` +
 * `Input` con el botón dentro de la caja. Mismas props que un `<input>` (menos
 * `type`) más `label`, `description` y `error` del `Field`.
 *
 * El nombre accesible del botón dice la acción ("Mostrar"/"Ocultar"), sin
 * `aria-pressed` además: decir las dos cosas confunde al lector de pantalla.
 * `aria-controls` apunta al campo. `onMouseDown` con `preventDefault` evita
 * que el clic le quite el foco al campo; con teclado, Tab llega al botón y
 * Enter/Espacio lo activan.
 */
export function PasswordField({
  label,
  description,
  error,
  fieldClassName,
  required,
  disabled,
  id,
  ...inputProps
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const extraDescribedBy = inputProps["aria-describedby"];

  return (
    <Field
      label={label}
      description={description}
      error={error}
      required={required}
      disabled={disabled}
      id={id}
      className={fieldClassName}
    >
      {(control) => (
        <div className="relative">
          <Input
            {...inputProps}
            {...control}
            aria-describedby={
              [control["aria-describedby"], extraDescribedBy]
                .filter(Boolean)
                .join(" ") || undefined
            }
            type={visible ? "text" : "password"}
            required={required}
            disabled={disabled}
            className="pr-11"
          />
          <Button
            type="button"
            variant="plain"
            size="icon"
            aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
            aria-controls={control.id}
            disabled={disabled}
            onClick={() => setVisible((v) => !v)}
            onMouseDown={(e) => e.preventDefault()}
            className="absolute top-0.5 right-0.5 size-9"
          >
            {visible ? (
              <EyeOff aria-hidden="true" />
            ) : (
              <Eye aria-hidden="true" />
            )}
          </Button>
        </div>
      )}
    </Field>
  );
}
