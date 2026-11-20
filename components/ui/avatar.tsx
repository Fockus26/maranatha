"use client";

import { Avatar as AvatarPrimitive } from "radix-ui";
import type * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Avatar (D112): `shadcn add avatar` reducido a lo que usa el sitio —
 * `Avatar` (círculo de 24/32/40 px), `AvatarImage` y `AvatarFallback`.
 * El fallback replica el círculo de iniciales del panel (D107): `primary-600`
 * con texto blanco en `font-heading`; las iniciales salen de `initialsOf`
 * (`lib/auth/initials.ts`). Si la imagen no carga, Radix muestra el fallback.
 */
function Avatar({
  className,
  size = "default",
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root> & {
  size?: "default" | "sm" | "lg";
}) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      data-size={size}
      className={cn(
        "group/avatar relative flex size-8 shrink-0 select-none overflow-hidden rounded-pill",
        "data-[size=lg]:size-10 data-[size=sm]:size-6",
        className,
      )}
      {...props}
    />
  );
}

function AvatarImage({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn("aspect-square size-full object-cover", className)}
      {...props}
    />
  );
}

function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        "flex size-full items-center justify-center bg-primary-600 font-bold font-heading text-12 text-white",
        "group-data-[size=sm]/avatar:text-11 group-data-[size=lg]/avatar:text-14",
        className,
      )}
      {...props}
    />
  );
}

export { Avatar, AvatarFallback, AvatarImage };
