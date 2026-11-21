# D133 · Componentes · Esqueletos del panel sobre `Skeleton`, con la línea de texto de MUI replicada · Implementado

**Decisión:**
- `components/ui/skeletons/*` y `DashboardStatBand` usan el `Skeleton` de shadcn. `skeletonContentSx` → `SkeletonContent` (recibe la clase de tope: `max-w-[1000px]` Agenda, `max-w-[1400px]` el resto); `SkeletonButton` recibe una clase de ancho (`w-40`); nuevo `SkeletonLine` = el `Skeleton variant="text"` de MUI: un `div` con el tamaño de letra y `leading-body` que contiene la barra con `&nbsp;` y `scale-y-60`, así la línea ocupa el alto de una línea de texto (sin salto al cargar, D102) y se ve al 60 %.
- `SkeletonFrame`: `visuallyHidden` → `sr-only` en un `<output>` (anuncia "Cargando …", `aria-busy`). La regla de "reducir movimiento" para los `Skeleton` de MUI que aún trae `DashboardTable` vive en `SkeletonFrame.module.css` (`[class*="MuiSkeleton-root"]`) y se borra en la ola 4; los de shadcn se quedan quietos solos.
- `DashboardStatBand`: props sin cambios (`stats`, `loading`), `PatternLayer` en lugar de `patternLayerSx`, esqueleto de la cifra al 12 % de blanco.
- Resumen (`app/dashboard/(panel)/page.tsx`): `LinearProgress` → `Progress` con `aria-label` (el indicador en `secondary` por `**:data-[slot=progress-indicator]:bg-secondary`), "Nuevo proyecto" y "Ver todos los proyectos" como `Button` (el segundo `asChild` + `next/link`).

**Por qué:** la ola 4 reutiliza `SkeletonFrame`/`skeletonParts`; esta forma es la que copian. Medidas antes/después de las alturas de página de los esqueletos y de la banda en el PR.
**Alternativa descartada:** altura fija por línea (`h-*`): se rompe cuando cambia el tamaño de letra; la técnica del `&nbsp;` lo sigue sola.
