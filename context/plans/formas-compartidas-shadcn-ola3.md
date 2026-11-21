# Formas compartidas de la ola 3 (zonas, #63–#66) — copiar al brief de la ola 4

Se suman a `formas-compartidas-shadcn.md` (ola 1) y `formas-compartidas-shadcn-ola2.md` (ola 2),
que también se copian.

## Compuestos con API nueva
- `Logo({ variant, tone, size: number | { xs, sm }, className })` — sin `sx` (D124).
- `ProjectCard`, `StatusScreen`, `ProjectContributionForm`, `PaymentStep`, `TitheForm`, `DashboardStatBand`: props sin cambios. CTA de `ProjectCard` = `Button asChild` + `next/link`.
- `DonationFormCard`: `width?: number` (variable `--donation-card-width`) + `className?` (D130).
- `SocialLinkCard.icon`: `ComponentType<{ className?: string }>`.
- `PasswordField`: props de `<input>` (sin `type`) + `label`, `description`, `error` (texto o `true`), `fieldClassName` (D132).
- `components/layout/DashboardShell`: `DASHBOARD_CONTENT_SX` → **`DASHBOARD_CONTENT_CLASS`** (1400 px centrado + padding). `authFormSx` → `authFormClass` (`DashboardAuthShell`).
- `skeletons/skeletonParts`: `SkeletonContent maxWidthClass`, `SkeletonHeading`, `SkeletonButton widthClass`, `SkeletonLine size className`; `SkeletonFrame` sin cambios. `SkeletonFrame.module.css` existe solo mientras `DashboardTable` use el `Skeleton` de MUI: **la ola 4 lo borra al migrar la tabla**.
- Nuevos: `components/layout/useScrolled.ts`, `NavigationProgress.module.css`, `components/sections/Hero.module.css`.

## Patrones fijados
- **Modal abierto sin `DialogTrigger`** (desde un store o un botón fuera): guardar `document.activeElement` en `onOpenAutoFocus` y devolverle el foco en `onCloseAutoFocus` (D129, D123). Radix solo restaura el foco al `DialogTrigger`.
- **Pantalla completa en móvil** de un `dialog`: por clases `max-md:`, nunca `useMediaQuery` (D126).
- **Menú móvil del panel** = `Sheet` navy con cierre propio de 44 px (D131); el del sitio sigue como overlay propio con `motion` (D122).
- `keyframes` de Emotion → `@keyframes` en un CSS Module del componente.
- `Progress` con color: `className="[&>[data-slot=progress-indicator]]:bg-secondary"` (hasta que la primitiva tenga `color`).
- `TabsList` que puede desbordar a 320 px: `overflow-x-auto`.
- `visuallyHidden` → `sr-only`.

## Faltantes (para `feat/ui-faltantes`, ola 4)
**Primitivas:**
- `button.tsx`: `color="error"` (hoy `bg-destructive text-destructive-foreground`), `color="inherit"` (hoy `variant="text" text-inherit hover:bg-accent`), tamaños 28 y 30 px (hoy `size="icon"` + `size-7 p-1.25` / `size-7.5`), variante de enlace con color por modo.
- `progress.tsx`: prop `color` del indicador.
- `alert.tsx`: ranura de acción ("Reintentar").
- `field.tsx`: uso sin `label` visible (hoy "Otro monto" usa `Input` + `FieldError`).

**Tokens** (todos literales ya en main, quedaron como `[…]`):
- texto 12.5, 13.5, 36, 38, 44, 52, 58 px;
- interlineado 1.15, 1.3, 1.4, 1.65;
- `tracking` −0.02, −0.01, 0.02, 0.03, 0.04, 0.05, 0.06, 0.08, 0.14, 0.18 em;
- `max-w` 70ch, 1000 px (agenda), 1400 px (panel);
- columnas `1.6fr 1fr` del resumen;
- `text-white/55` de la banda.

Al añadirlos, reemplazar cada `[…]` en los archivos de las olas 3 (`git grep -n "\-\[" -- components app`).

## Trampas de la ola 3
- Sin `DATABASE_URL` en el slot el paso 2 de pagos dice `not_configured`: mock de `getCheckoutOptions` interceptado en el navegador (W3 lo dejó en `.qa/w3fake.mjs` de su slot, ya liberado: reescribirlo).
- `next/font/google` sin red: primera compilación muy lenta; capturas con la fuente de respaldo. Si Turbopack entra en pánico, borrar `.next`.
- `getByRole("radiogroup")` encuentra también `SegmentedToggle`: nombra el grupo.
- Login de `qa:local`: rate limit tras muchos inicios seguidos; un login por contexto de Playwright.
- `publish-pr-shots.sh` publica cualquier PNG de la carpeta: vaciarla antes.
- Bugs heredados de main (decide César): tarjeta de diezmo transparente sobre navy en el modal a ≤ 500 px de alto en claro; `IconButton` de filas de `DashboardTable` sin nombre accesible (crítico axe en `/dashboard/proyectos` a 320 px) — **la ola 4 lo arregla al migrar la tabla**.
