"use client";

import { Slot } from "radix-ui";
import {
  type ComponentProps,
  createContext,
  type ReactElement,
  type ReactNode,
  useContext,
  useId,
} from "react";
import { cn } from "@/lib/utils";
import { Label } from "./label";

/**
 * Campo del proyecto (D114): etiqueta fija encima + control + ayuda + error,
 * el equivalente de `TextField` (`label`, `helperText`, `error`, `required`).
 * Los ids salen de `useId` (D099: el formulario de diezmo se monta dos veces);
 * el control recibe `id`, `aria-describedby` (ayuda y error) y `aria-invalid`.
 * El error lleva texto, no solo el color del borde.
 *
 * ```tsx
 * <Field label="Correo" required description="Te enviamos el recibo." error={emailError}>
 *   <Input type="email" name="email" required value={email} onChange={…} />
 * </Field>
 * ```
 *
 * Un control que no recibe esas props tal cual (un `<button>` que muestra el
 * valor, varios elementos) usa la función hija: `{(p) => <button {...p}>…}`.
 */

export interface FieldControlProps {
  id: string;
  "aria-describedby"?: string;
  "aria-invalid"?: true;
  "data-field-control": "";
}

interface FieldContextValue {
  controlId: string;
  labelId: string;
  invalid: boolean;
  control: FieldControlProps;
}

const FieldContext = createContext<FieldContextValue | null>(null);

/** Ids y props del campo que envuelve al componente (o `null` fuera de uno). */
export function useField() {
  return useContext(FieldContext);
}

export interface FieldProps {
  label: ReactNode;
  /** Ayuda bajo el campo, siempre visible (el `helperText` sin error). */
  description?: ReactNode;
  /**
   * Error: con texto, se muestra bajo el campo en lugar de la ayuda y marca
   * el control con `aria-invalid`; `true` marca el control sin mensaje.
   */
  error?: ReactNode;
  /** Añade el asterisco a la etiqueta (el control lleva su `required` nativo). */
  required?: boolean;
  disabled?: boolean;
  /** Id del control; si falta, `useId`. */
  id?: string;
  className?: string;
  children:
    | ReactElement
    | ((control: FieldControlProps, field: { labelId: string }) => ReactNode);
}

function Field({
  label,
  description,
  error,
  required,
  disabled,
  id,
  className,
  children,
}: FieldProps) {
  const autoId = useId();
  const controlId = id ?? autoId;
  const labelId = `${controlId}-label`;
  const descriptionId = `${controlId}-description`;
  const errorId = `${controlId}-error`;
  const invalid = Boolean(error);
  const errorText = error === true ? null : error;
  const showDescription = Boolean(description) && !errorText;

  const describedBy =
    [showDescription && descriptionId, errorText && errorId]
      .filter(Boolean)
      .join(" ") || undefined;

  const control: FieldControlProps = {
    id: controlId,
    "aria-describedby": describedBy,
    "aria-invalid": invalid || undefined,
    "data-field-control": "",
  };

  return (
    <FieldContext.Provider value={{ controlId, labelId, invalid, control }}>
      <div
        data-slot="field"
        data-invalid={invalid}
        data-disabled={disabled}
        className={cn("group/field flex min-w-0 flex-col", className)}
      >
        <Label id={labelId} htmlFor={controlId} className="mb-0.75">
          {label}
          {required && <span aria-hidden="true"> *</span>}
        </Label>
        {typeof children === "function" ? (
          children(control, { labelId })
        ) : (
          <Slot.Root {...control}>{children}</Slot.Root>
        )}
        {showDescription && (
          <FieldDescription id={descriptionId}>{description}</FieldDescription>
        )}
        {errorText && <FieldError id={errorId}>{errorText}</FieldError>}
      </div>
    </FieldContext.Provider>
  );
}

/** Texto bajo el campo: el `FormHelperText` de MUI (12 px, sangrado 14 px). */
const helperClasses = "mx-3.5 mt-0.75 mb-0 font-body text-12";

function FieldDescription({ className, ...props }: ComponentProps<"p">) {
  return (
    <p
      data-slot="field-description"
      className={cn(helperClasses, "text-muted-foreground", className)}
      {...props}
    />
  );
}

/** Mensaje de error: `role="alert"` para que se anuncie al aparecer. */
function FieldError({ className, ...props }: ComponentProps<"p">) {
  return (
    <p
      data-slot="field-error"
      role="alert"
      className={cn(helperClasses, "text-destructive", className)}
      {...props}
    />
  );
}

export { Field, FieldDescription, FieldError };
