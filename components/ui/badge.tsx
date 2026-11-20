import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import type * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Badge (D112): píldora de estado con el radio del `MuiChip` del tema
 * (`radius.xs`). Todas las variantes con texto de 13 px llevan fondo y texto
 * con contraste AA y dicen el estado con su texto, no solo con el color.
 * Rellenas: `default` (primario), `secondary`, `success` (`success-filled`),
 * `destructive` (`error-on-light` / `error-on-dark`); `outline` solo borde.
 */
const badgeVariants = cva(
  [
    "inline-flex h-6 w-fit shrink-0 items-center justify-center gap-1 whitespace-nowrap",
    "rounded-xs border border-transparent px-2 font-body font-medium text-13",
    "[&>svg]:pointer-events-none [&>svg]:size-3.5",
  ],
  {
    variants: {
      variant: {
        default:
          "bg-primary-700 text-white dark:bg-primary-600 [a]:hover:bg-primary-600 dark:[a]:hover:bg-primary-700",
        secondary: "bg-secondary-700 text-white [a]:hover:bg-secondary-800",
        success: "bg-success-filled text-white",
        destructive:
          "bg-error-on-light text-white dark:bg-error-on-dark dark:text-gray-900",
        outline: "border-border text-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span";
  return (
    <Comp
      data-slot="badge"
      data-variant={variant ?? "default"}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
