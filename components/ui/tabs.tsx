"use client";

import { Tabs as TabsPrimitive } from "radix-ui";
import type * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Pestañas (D119): `shadcn add tabs` con el aspecto de los `Tabs` de MUI del
 * sitio (filtro de `/proyectos`): línea inferior, texto sin mayúsculas 14 px,
 * 44 px de alto táctil, pestaña activa en naranja AA por modo
 * (`secondary-dark` en claro, `secondary-light` en oscuro) con indicador de
 * 2 px. Radix da `tablist`/`tab`/`tabpanel`, flechas y Home/End. Foco D085.
 * Para una variante compacta (el `ImageUploadField`): `className` del trigger.
 *
 *   <Tabs value={tab} onValueChange={setTab}>
 *     <TabsList aria-label="Filtrar por estado">
 *       <TabsTrigger value="all">Todos (3)</TabsTrigger>
 *       <TabsTrigger value="active">Activos (2)</TabsTrigger>
 *     </TabsList>
 *     <TabsContent value="all">…</TabsContent>
 *   </Tabs>
 */
function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col", className)}
      {...props}
    />
  );
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn("flex items-center border-b border-border", className)}
      {...props}
    />
  );
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "relative inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 whitespace-nowrap px-4 py-3",
        "font-body text-14 font-medium leading-button text-muted-foreground",
        "transition-colors duration-150 hover:text-foreground",
        "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
        "disabled:pointer-events-none disabled:opacity-50",
        "data-[state=active]:font-semibold data-[state=active]:text-secondary-dark dark:data-[state=active]:text-secondary-light",
        // Indicador de 2 px sobre la línea de la lista.
        "after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:bg-secondary after:opacity-0 data-[state=active]:after:opacity-100",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0",
        className,
      )}
      {...props}
    />
  );
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  );
}

export { Tabs, TabsContent, TabsList, TabsTrigger };
