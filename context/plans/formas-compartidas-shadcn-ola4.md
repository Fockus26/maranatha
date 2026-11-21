# Formas compartidas de la ola 4 (#67 faltantes, #68 panel de datos) — copiar al brief de la ola 5

Se suman a `formas-compartidas-shadcn.md`, `-ola2.md` y `-ola3.md`.

## Primitivas completadas (#67, D139)
```tsx
<Button color="error" | "inherit" variant="contained|outlined|text" />   // inherit: sin contained
<Button size="icon-sm" | "icon-xs" variant="plain" aria-label="…"><Icono /></Button>  // 30 / 28 px, ícono size-5
<Button variant="link">Texto</Button>                                     // text-primary dark:text-primary-300
<Progress color="primary" | "secondary" | "success" value aria-label />
<Alert severity="error" action={<Button variant="text" color="inherit" size="small">Reintentar</Button>}>…</Alert>
<Field label hideLabel error><Input /></Field>
```
- Sobre navy: `color="error"`, `primary`, `secondary` y `link` no llegan a AA → `color="inherit"`.
- Sin tamaño de ícono de 32 px con borde: `size="icon"` + `size-8 p-1.25` (filas de `DashboardTable`).

## Tokens nuevos (#67, D137; regla de literales D138)
- Texto `text-12.5 text-13.5 text-36 text-38 text-44 text-52 text-58` (sin interlineado propio).
- Interlineado `leading-tight` 1.15 · `snug` 1.3 · `normal` 1.4 · `relaxed` 1.65.
- Tracking `tighter` −0.02em · `tight` −0.01 · `wide` 0.02 · `wider` 0.03 · `wide-4` · `wide-5` · `wide-6` · `caps` 0.08 · `eyebrow` 0.14 · `eyebrow-lg` 0.18. `--tracking-*` reseteado: no existe `tracking-normal`.
- Anchos `max-w-agenda` (1000), `max-w-panel` (1400), **`max-w-reading`** (70ch; `max-w-prose` de Tailwind gana y mide 65ch: no usarlo).
- D138: tokens de escala siempre token; geometría de un solo componente (`grid-cols-[…]`, `auto-rows`, parallax, alturas en `em`, `%`) queda literal con comentario `valor único:`.

## Compuestos del panel (#68, D134–D136)
- `DashboardFormDrawer` (API sin cambios: `open`, `title`, `formId`, `dirty`, `saving?`, `submitLabel?`, `onClose`, `children`) = `Sheet side="right"`. Foco inicial a `[data-autofocus]` o al primer input. **Nunca `autoFocus` en los campos** (con Radix rompe `onOpenAutoFocus` y el retorno del foco).
- `DrawerSection`: `title`, `action?`, `first?`, `className?`.
- `DashboardTable`: API sin cambios; por dentro `GridTable`/`GridRow`/`GridColumnHeader`/`GridCell` con roles de tabla, orden con `aria-sort` en la cabecera.
- `ConfirmDialog`: sin `findMuiModalPaper` ni `container`; destructivo con `color="error"`.
- `useOpenerFocus` (local en `DashboardPayments`): guarda/devuelve el foco en diálogos sin `DialogTrigger`.
- `ProyectosSkeleton` es `"use client"` (pasaba `noop` a la tabla desde un Server Component).
- `SkeletonFrame.module.css` borrado.

## Trampas de la ola 4
- `next typegen` (typecheck) con el dev vivo dejó `/dashboard/proyectos` en 404 hasta reiniciar.
- Medir "toast por encima del overlay" con `elementFromPoint` da falso negativo (`body` con `pointer-events: none` bajo un modal Radix): medir z-index y visibilidad.
- Recorridos que confirman/rechazan pagos cambian los datos: capturas "después" antes de recorrer, o resembrar.
- `div` con `role="row"/"cell"` disparan `useSemanticElements`/`useFocusableInteractive` de Biome (con `Box` no saltaba): `biome-ignore` por pieza.
- `status.test.ts` da timeout falso con la máquina cargada (primer `Intl`); solo pasa.

## Qué queda con MUI en `origin/main` @ 416dcad (para la ola 5)
`components/ui/EmptyState.tsx` y `brand-icons.tsx` (solo comentarios/tipos de convivencia), `outlinedActionSx.ts`,
`theme/{ThemeRegistry.tsx,globalStyles.ts,patterns.ts,theme.ts}`, más `theme/fieldStyles.ts` y las reglas `.Mui*` de `app/globals.css`, y `package.json`.
