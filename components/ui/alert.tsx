import { cva, type VariantProps } from "class-variance-authority";
import {
  CircleAlertIcon,
  CircleCheckIcon,
  InfoIcon,
  TriangleAlertIcon,
} from "lucide-react";
import type * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Alert del proyecto (D118): reemplaza el `Alert` de MUI. `severity` =
 * success | info | warning | error (el mismo vocabulario) y `appearance` =
 * standard (def.: tinte suave del color, como el `standard` de MUI) | filled
 * (relleno sólido; el `filled` de los avisos de éxito). El estado se dice por
 * el ícono y el rol, no solo por el color. Colores AA ya resueltos por modo en
 * `theme/roles.ts` (`destructive`, `success`…); el éxito relleno usa
 * `success-filled` (blanco 5.3:1).
 */
const alertVariants = cva(
  "relative grid w-full grid-cols-[auto_1fr] items-start gap-x-3 rounded-sm px-4 py-2 font-body text-14 leading-body [&_a]:underline [&>svg]:mt-0.5 [&>svg]:size-5",
  {
    variants: {
      severity: { success: "", info: "", warning: "", error: "" },
      appearance: { standard: "", filled: "" },
    },
    compoundVariants: [
      {
        severity: "success",
        appearance: "standard",
        className:
          "bg-[color-mix(in_srgb,var(--success)_10%,var(--card))] text-[color-mix(in_srgb,var(--success)_40%,var(--foreground))]",
      },
      {
        severity: "info",
        appearance: "standard",
        className:
          "bg-[color-mix(in_srgb,var(--info)_10%,var(--card))] text-[color-mix(in_srgb,var(--info)_40%,var(--foreground))]",
      },
      {
        severity: "warning",
        appearance: "standard",
        className:
          "bg-[color-mix(in_srgb,var(--warning)_10%,var(--card))] text-[color-mix(in_srgb,var(--warning)_40%,var(--foreground))]",
      },
      {
        severity: "error",
        appearance: "standard",
        className:
          "bg-[color-mix(in_srgb,var(--destructive)_10%,var(--card))] text-[color-mix(in_srgb,var(--destructive)_40%,var(--foreground))]",
      },
      {
        severity: "success",
        appearance: "filled",
        className: "bg-success-filled text-white",
      },
      {
        severity: "info",
        appearance: "filled",
        className: "bg-info text-info-foreground",
      },
      {
        severity: "warning",
        appearance: "filled",
        className: "bg-warning text-warning-foreground",
      },
      {
        severity: "error",
        appearance: "filled",
        className: "bg-destructive text-destructive-foreground",
      },
    ],
    defaultVariants: { severity: "info", appearance: "standard" },
  },
);

export const alertIcons = {
  success: CircleCheckIcon,
  info: InfoIcon,
  warning: TriangleAlertIcon,
  error: CircleAlertIcon,
} as const;

type AlertProps = React.ComponentProps<"div"> &
  VariantProps<typeof alertVariants> & {
    /** Sin ícono (p. ej. si el contenido ya trae el suyo). */
    hideIcon?: boolean;
  };

function Alert({
  className,
  severity = "info",
  appearance,
  hideIcon = false,
  children,
  ...props
}: AlertProps) {
  const Icon = alertIcons[severity ?? "info"];
  return (
    <div
      data-slot="alert"
      data-severity={severity}
      role="alert"
      className={cn(alertVariants({ severity, appearance }), className)}
      {...props}
    >
      {hideIcon ? null : <Icon aria-hidden="true" />}
      <div className={cn("min-w-0", hideIcon && "col-span-2")}>{children}</div>
    </div>
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn("font-semibold", className)}
      {...props}
    />
  );
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div data-slot="alert-description" className={cn(className)} {...props} />
  );
}

export { Alert, AlertTitle, AlertDescription, alertVariants };
