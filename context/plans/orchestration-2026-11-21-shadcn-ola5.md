# Orquestación del 2026-11-21 — fase migración MUI → shadcn · ola 5 de 5 (quitar MUI) · brief compartido

> Plan de la fase: `C:\Users\Cesar\Documents\Work\maranatha\context\plans\phase-migracion-shadcn.md`
> (léelo: "Decisiones de César", "Reglas de la fase", la fila de la ola 5 y "Para la ola 5").
> Escrito sobre `origin/main` @ 416dcad (olas 1–4 mergeadas: #58, #59–#62, #63–#66, #67–#68).

> **El worker** lee esto antes de empezar. Su prompt trae solo lo propio de su unidad. Carpeta
> principal del repo: `C:\Users\Cesar\Documents\Work\maranatha` (ahí viven los archivos locales:
> `context/CURRENT_PHASE.md`, `context/CONTENT_CHECKLIST.md`, `context/PHASE_LOG/`, `context/plans/`).
> Su `context/` es `C:\Users\Cesar\Documents\Work\maranatha\context`: siempre esa ruta absoluta.
>
> **Mapa de íconos:** `C:\Users\Cesar\Documents\Work\maranatha\context\plans\mapa-iconos.md`
> (MUI → lucide, tamaños, traducción de `Typography`). En esta ola ya no queda ningún ícono MUI;
> sirve de referencia para los comentarios que cites.
>
> **Datos del proyecto:** tests con `bun:test` (`tests/unit/`), sin entorno DOM (lo visual se mide
> con Playwright) · lint `bunx biome check <archivos>` · referencia del kit en `~/.claude/kit-reference/`
> (`UI-LIBRARIES.md` › shadcn, `STACK-NEXTJS.md` › Tailwind) · Next 16: antes de usar una API de Next,
> su guía en `node_modules/next/dist/docs/` (AGENTS.md).
>
> **CI funciona** (repo público): tras el push, `gh pr checks <n> --watch` en segundo plano.

## Unidades

| # | Rama | Qué | Modelo · esfuerzo | Docker | Build local | Servidor / capturas |
|---|---|---|---|---|---|---|
| W1 | `chore/quitar-mui` | quitar `@mui/*` y `@emotion/*` (dependencias y código), `ThemeRegistry` → proveedor de modo + `MotionConfig`, borrar `theme/{theme,globalStyles,fieldStyles,patterns}.ts` y `outlinedActionSx.ts`, reglas `.Mui*` de `globals.css` → selectores propios, docs + decisión de cierre de fase, guard de test | **opus · medium** | **sí** (`qa:local`) | **sí** (es la única unidad y cambia dependencias) | desde el inicio |

Una sola unidad: no hay escalonado ni formas que fijar con otra. **La red se corta seguido** (olas
3–4: 2–4 veces por worker): escribe `.qa/progress.md` tras cada paso, haz `wip:` frecuentes y push;
el orquestador te reanuda con `SendMessage`, no te relanza.

## Números reservados

| Unidad | Decisiones | Filas `CONTENT_CHECKLIST` | Changeset |
|---|---|---|---|
| W1 | D140–D142 (decisiones de la unidad) + **D143 = decisión de cierre de fase** | ninguna | `minor` — "Interfaz completa sobre shadcn/ui: se retira MUI" |

Último ID en `origin/main`: D139; ningún PR abierto reserva IDs (solo #57, el de release). Si el
tuyo ya existe al mergear `origin/main`, toma el siguiente libre y dilo en el informe. Esta ola no
trae copy nuevo.

## Decisiones de César para esta fase

- Look igual al actual, con ajustes menores aceptados y anotados en el PR; capturas antes/después
  (main vs rama, claro y oscuro, 360 y 1280 px) de las rutas que cambien a la vista.
- Servidor de desarrollo propio en el puerto del slot. Docker: sí (única unidad).
- `QA: al final`: no hay `wave-qa`. El QA de versión (09) lleva `design-qa` en todas las rutas y
  `functional-qa` en pagos y sesión.
- El orquestador mergea el PR (CI verde + verificación local). Tú nunca mergeas.
- Nada destructivo en la base. Ninguna migración de base de datos en esta fase.
- **Esta ola sí toca `package.json` y `bun.lock`, pero solo para quitar** (`bun remove`); no
  añade paquetes. Si al quitar algo falla el build por una dependencia transitiva que hacía falta,
  dilo en el informe antes de añadir nada.
- Contrastes bajo AA heredados de MUI ("Para la ola 3" y "Para la ola 5" del plan): se conservan;
  no los "arregles".
- Decisiones abiertas de la ola 3 (asterisco de D128, foco de D129, 34 px de D132): no las toques.
- `tailwind.config.ts` (sin uso en Tailwind v4, `content: ./src/**`): **no se borra** sin permiso
  de César. Señálalo en el PR ("Archivo sin uso") y en el informe.

## Simular el backend

- `bun run qa:local -- --port <puerto>` (Postgres + Mailpit en Docker, cuentas de
  `.env.test.local`, nunca la base real); inicia sesión con `ADMIN_EMAIL_TEST`/`ADMIN_PASSWORD_TEST`
  sin mostrar los valores. Rate limit del login: **un login por contexto de Playwright** (guarda
  `storageState` y reúsalo). Los contenedores `qa-maranatha-pg`/`-mailpit` son compartidos: **no los
  bajes** (los baja el orquestador al cerrar la fase). Si `qa:local` ya los encuentra vivos, úsalos.
- Nada del `.qa/` de otro slot.

## Formas compartidas de las olas anteriores

Lo que sigue es copia literal de los cuatro archivos `formas-compartidas-shadcn*.md` (olas 1–4):
la API de cada primitiva y compuesto que ya está en main. En esta ola no cambias ninguna API:
solo borras lo que ya no se importa y reescribes en CSS propio lo que vivía en MUI.

### De la ola1 — copia de `formas-compartidas-shadcn.md`

#### Formas compartidas de la base shadcn (W1, PR #58) — copiar al brief de la ola 2

| token de `tokens.ts` | clase Tailwind |
|---|---|
| `primary[700]`, `secondary[500]`, `gray[600]` | `bg-primary-700`, `text-secondary-500`, `text-gray-600` |
| `common.white` / `common.black` | `text-white`, `bg-black/50` |
| `semantic.successFilled`, `errorOnLight`, `errorOnDark`, `error` | `bg-success-filled`, `text-error-on-light`, `text-error-on-dark`, `text-error` |
| `onNavy.text/.muted/.subtle/.hover/.divider/.border` | `text-on-navy`, `text-on-navy-muted`, `-subtle`, `bg-on-navy-hover`, `border-on-navy-divider`, `-border` |
| `typography.size.h1…h4` | `text-h1`…`text-h4` (móvil < 600, escritorio ≥ 600, con interlineado) |
| `bodyLarge` / `body` / `small` | `text-body-lg`, `text-body`, `text-small` |
| `fontScale[13]`, `fontScale[10.5]` | `text-13`, `text-10.5` (sin interlineado propio) |
| `typography.lineHeight.*` | `leading-h1`…`leading-small`, `leading-button` (1.75, nuevo) |
| `fontFamily.heading` / `body` | `font-heading`, `font-body` |
| `weight` 400/500/600/700/800 | `font-normal`, `font-medium`, `font-semibold`, `font-bold`, `font-extrabold` |
| `spacing.lg` | `p-lg` (xs 4, sm 8, md 12, base 16, lg 24, xl 32, 2xl 48, 3xl 64, 4xl 96) |
| MUI `p: n` | `p-n` (`--spacing: 4px`, igual que `spacing()` del tema: `theme/theme.ts:176`, 4 px por unidad) |
| `radius.md`, `radius.pill` | `rounded-md`, `rounded-pill` (xs 4, sm 6, md 8, lg 12, xl 16) |
| `shadow.*` | `shadow-sm/md/lg`, `shadow-hover`, `shadow-hover-navy` |
| `zIndex.*` | `z-modal-backdrop`, `z-navbar`, `z-sidebar`, `z-dropdown`, `z-modal`, `z-toast`, `z-progress`, `z-base` |
| `layout.contentNarrow` (960), `formDrawer.width` | `max-w-narrow`, `max-w-form-drawer` |
| `breakpoints` | `sm:` 600, `md:` 900, `lg:` 1200, `xl:` 1536 (sin `2xl`) |

**Trampas:** `max-w-md`, `w-lg` y similares resuelven al **espaciado**; para anchos usa solo
`max-w-narrow`/`max-w-form-drawer`. No existen los valores por defecto de Tailwind (`text-sm`,
`bg-red-500`, `shadow-xl` no generan nada).

**Variables por modo** (`theme/roles.ts`; claro en `:root`, oscuro en `[data-color-mode="dark"]`):
`background`, `foreground`, `card`, `popover` (con `-foreground`), `primary` (+ `-foreground`,
`-light`, `-dark`), `secondary` (ídem), `muted-foreground`, `destructive` (+ `-foreground`),
`success`, `warning`, `info` (+ `-foreground`), `border`, `input`; foco `outline-ring` /
`ring-ring` = `var(--focus-ring)` (D085). `dark:` lee `data-color-mode` (llega del servidor).
`[data-surface="navy"]` redefine background/card/popover (`primary[900]`), los foreground
(blanco), `muted-foreground` (`onNavy.muted`), border/input (`onNavy.divider`); variante `navy:`.
No existen `--muted` ni `--accent`.

**`components/ui/button.tsx`:** `variant` = `contained` (def.) · `outlined` · `text` · `action`
(la de `outlinedActionSx`, D084) · `plain` (IconButton sin color); `color` = `primary` (def.) ·
`secondary`; `size` = `small` · `medium` (def., ≥ 44 px) · `large` (≥ 48 px) · `icon` (40×40,
redondo); `asChild`: `<Button asChild variant="outlined" color="secondary"><Link href="/proyectos">Ver proyectos</Link></Button>`;
`type="button"` por defecto; exporta `buttonVariants` y `ButtonProps`.

**Reglas olas 2–4:** tras `shadcn add`, el import `cn` del paquete npm se cambia a
`@/lib/utils` y `git checkout package.json bun.lock` (lo vigila
`tests/unit/shadcn-config.test.ts`); el CLI corre con `node node_modules/shadcn/dist/index.js add <x> -y`;
tras tocar `tokens.ts`/`roles.ts`, `bun scripts/tokens-css.ts`.

### De la ola2 — copia de `formas-compartidas-shadcn-ola2.md`

#### Formas compartidas de la ola 2 (primitivas, #59–#62) — copiar al brief de la ola 3

Se suman a `formas-compartidas-shadcn.md` (ola 1), que también se copia. Todo en `components/ui/`.
Regla de las olas 3–4: un archivo de zona solo **importa** estas primitivas; si a una le falta algo,
va a "Primitivas que faltaron" del informe.

## Tokens nuevos
- `--accent` / `--accent-foreground` (`bg-accent`): hover/resaltado (claro 4 %, oscuro y navy 8 %). `accentRoles` en `theme/roles.ts` (D116).
- `--muted` (`bg-muted`): skeleton y pistas de progreso (D119).
- Tamaños ≥ 1920 px dentro de `text-h1`…`text-body` (72/52/36/26, 20/18); variante `wide:` (1920); anchos de página `max-w-page-*` (D119).
- Traducción `Typography variant` → clases: `h1` → `font-heading font-extrabold text-h1 leading-h1`; `body1` → `text-body-lg leading-body`; `body2` → `text-body`; `caption` → `text-small`; el resto, en `context/plans/mapa-iconos.md`. Sin `@utility` de texto. El `letter-spacing` de MUI en h1/h2/h4 no se tradujo (si se nota: token `tracking-*`).

## Íconos
- `context/plans/mapa-iconos.md`: cada `@mui/icons-material` usado → su lucide, y los tamaños (`fontSize` small → `size-5`, medium → `size-6`; `sx fontSize n` → `size-n/4`). `aria-hidden` en todo ícono decorativo.
- Logos: lucide ≥ 1.0 no trae marcas → `components/ui/brand-icons.tsx` (`InstagramIcon`, `YoutubeIcon`), 7 usos en Footer, SocialLinks, InstagramPostDialog, LeaderCard, ProjectSidebar, Sermons.
- `SelfImprovement` → `PersonStanding` (cambia de forma).

## Acciones (W1, #59, D112–D113)
- `Avatar` (`size` sm 24 · default 32 · lg 40), `AvatarImage`, `AvatarFallback` (primary-600, blanco, `font-heading`): `<Avatar><AvatarImage src={url} alt="" /><AvatarFallback>{initialsOf(name, email)}</AvatarFallback></Avatar>` (`initialsOf` de `lib/auth/initials.ts`).
- `Tooltip` / `TooltipTrigger asChild` / `TooltipContent` — trae su propio provider (100 ms), no hace falta uno global.
- `Badge` `variant` default · secondary · success · destructive · outline; `asChild`.
- `Link` `tone` primary (def.) · muted; `underline` hover (def.) · always; `asChild` para `next/link`: `<Link asChild tone="muted" underline="always"><NextLink href="/x">Texto</NextLink></Link>`. Primario en oscuro = `primary-300` (AA).
- `ThemeToggle` `size` small · medium · large, `className`; dentro de `data-surface="navy"` no necesita clases.
- `SegmentedToggle` sin cambios de API (radiogroup).

## Campos (W2, #60, D114–D116)
- `Field` (`label`, `description?`, `error?` texto o `true`, `required?`, `disabled?`, `id?`, `className?`): pasa por Slot `id`, `aria-describedby`, `aria-invalid`, `data-field-control` al hijo; función hija `(control, { labelId }) => …` para controles que no aceptan esas props. Error en `<p role="alert">`. Exporta `FieldDescription`, `FieldError`, `useField()`.
- `Input` / `Textarea` como el nativo; `fieldControlClasses` (de `input.tsx`) para disparadores `<button>`. Alto 40 px, borde 23 %, radio 4 px, sangría 14 px (alinea con el `TextField` MUI, que mide 37,1 px).
- `Label` (12 px, medio; `--destructive` en un `Field` inválido).
- `Select` / `SelectTrigger {...control}` / `SelectValue placeholder` / `SelectContent position="popper" container?` / `SelectItem` (44 px, `--accent`, check).
- `RadioGroup` / `RadioGroupItem` (20 px) dentro de `<label className="flex items-center gap-2 text-small">`.
- `Popover` / `PopoverTrigger asChild` / `PopoverContent` (`w-70`, `p-4`, `z-modal`, `sideOffset` 6). **Dentro de un modal MUI vivo:** `container={trigger.closest('[role="dialog"]')}` y `stopPropagation()` de Escape en el contenido.
- `DateField` / `TimeField`: API sin cambios.

```tsx
<Field label="Referencia" required description={hint} error={touched && !ok ? "Ingresa la referencia." : undefined}>
  <Input name="reference" required value={v} onChange={(e) => setV(e.target.value)} />
</Field>
<Field label="Método">
  {(control) => (
    <Select value={m} onValueChange={setM}>
      <SelectTrigger {...control}><SelectValue placeholder="Elige un método" /></SelectTrigger>
      <SelectContent>{methods.map((x) => <SelectItem key={x.id} value={x.id}>{x.label}</SelectItem>)}</SelectContent>
    </Select>
  )}
</Field>
```

## Superposiciones (W3, #62, D117–D118)
- `Dialog` / `DialogContent showCloseButton closeLabel="Cerrar" container?` / `DialogHeader` / `DialogTitle` / `DialogDescription` / `DialogFooter` (+ `DialogTrigger`, `DialogClose`, `DialogOverlay`). 444 px, `rounded-xl`, `shadow-lg`, `bg-card` sólido (D057), backdrop 50 %, `z-modal`. Dentro de un modal MUI vivo: `container={…}` (el focus-trap de MUI roba el foco si va a `body`).
- `Sheet` / `SheetContent side="right|left|top|bottom" showCloseButton closeLabel` / `SheetHeader` / `SheetTitle` / `SheetDescription` / `SheetFooter`: pantalla completa en móvil, `md:max-w-form-drawer`.
- `Alert severity="success|info|warning|error" appearance="standard|filled" hideIcon?` + `AlertTitle`; `role="alert"`, ícono lucide por severidad, AA en los dos modos (info relleno con texto `gray-900`).
- Toast: `<Toaster />` ya montado en `app/layout.tsx`. `import { toast } from "sonner"; toast.success("…", { duration: 6000 })` (+ `error`, `info`, `warning`). Por defecto 5 s (`TOAST_DURATION_MS`), 448 px, abajo al centro, cierre "Cerrar aviso". Reemplaza `Snackbar` + `Alert filled`.
- `ConfirmDialog`: API sin cambios; con un modal MUI abierto se porta dentro de su papel (se quita cuando el Drawer pase a `sheet`, ola 4); devuelve el foco a quien lo abrió.
- Botón destructivo: `button.tsx` no tiene `color="error"` → `variant="contained"` + `className="bg-destructive text-destructive-foreground …"` como en `ConfirmDialog`.

## Estados (W4, #61, D119–D121)
- `<Skeleton className="h-5 w-56" />` (`bg-muted`, pulso, quieto con reduced-motion, `aria-hidden`).
- `<Progress value={42} aria-label="…" />`; sin `value` = indeterminada. `aria-label` obligatorio.
- `<Tabs value onValueChange><TabsList aria-label><TabsTrigger value>…</TabsTrigger></TabsList><TabsContent value /></Tabs>` (línea del sitio, 44 px, activa `secondary-700`).
- `<Container maxWidth="xs|sm|md|lg|none" disableGutters asChild>` (def. `lg`: 1200 → 1440 desde `xl` → 1600 desde `wide:`; gutters 8/12 px como MUI).
- `<PatternLayer stroke? secondsPerTile? className? />` como primer hijo de un `relative overflow-hidden` (sustituye a `patternLayerSx`; `theme/patterns.ts` reexporta `theme/patternTile.ts` hasta la ola 5).
- `<EmptyState icon={IconoLucideOMui} title description? ctaLabel? onCtaClick? compact? className? />` (`sx` → `className`; a un ícono MUI le fuerza `size-*!`).
- `Reveal`, `StepTransition`: API sin cambios.

## Trampas aprendidas en la ola 2
- Playwright en dev: `waitUntil: "commit"` + `waitForSelector` de un atributo hidratado; nunca `networkidle`/`load`. `bun run shots` hace clic antes de hidratar: capturar con script propio y publicar desde una carpeta propia (`bash scripts/publish-pr-shots.sh .qa/shots`).
- `shadcn add` puede tardar > 2 min y preguntar si sobrescribe `button.tsx`: `echo n | node node_modules/shadcn/dist/index.js add <x> -y`, con timeout.
- `bun run a11y` tiene rutas fijas (incluye el panel con sesión): para rutas concretas, axe con un script propio con las mismas etiquetas.
- `run-on-main.sh` se cuelga en `bun install` sin red: el "antes" con `git checkout origin/main -- <archivos>` en el slot, mismo servidor, y restaurar.
- Contenedores `qa-maranatha-pg`/`-mailpit` compartidos entre slots: el worker no los baja.
- Contraste heredado: botón outlined "Cancelar" en oscuro 3,09:1; días de otro mes del calendario al 40 %.

### De la ola3 — copia de `formas-compartidas-shadcn-ola3.md`

#### Formas compartidas de la ola 3 (zonas, #63–#66) — copiar al brief de la ola 4

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

### De la ola4 — copia de `formas-compartidas-shadcn-ola4.md`

#### Formas compartidas de la ola 4 (#67 faltantes, #68 panel de datos) — copiar al brief de la ola 5

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

## Reglas de la tanda (además de `CLAUDE.md`)


Las reglas de `~/.claude/skills/orchestrate/brief-template.md` § "Batch rules" aplican tal cual
(léelas allí; son la fuente). Resumen de lo que más se olvida:

1. Lee solo `CLAUDE.md`, lo que cita tu prompt y, con `git grep`, lo demás.
2. Trabaja SOLO en tu slot; no crees worktrees, no corras `wt`, no cambies de rama.
3. No edites `CURRENT_PHASE.md` ni `CONTENT_CHECKLIST.md`; tu `PHASE_LOG/<rama-con-guiones>.md` va a la carpeta principal o en el informe.
4. Una decisión por archivo `context/decisions/D1NN-<tema>.md` dentro de tu rango (formato en `context/decisions/README.md`).
5. Changeset `.changeset/<desc>.md` con el bump y el texto de la tabla . No toques `version` ni `CHANGELOG.md`.
6. Servidor en tu puerto, log en `.qa/dev.log`; al terminar `taskkill /PID <pid> /T /F`.
7. Navegador: tu propia pestaña con `tabId`. Playwright con `node`, scripts en `.qa/`. `MSYS_NO_PATHCONV=1` para rutas en Git Bash.
8. `.env` apunta a producción: no inicies sesión ni escribas datos reales (solo contra `qa:local`).
9. `bun run test:related` mientras trabajas; la suite completa sola, en segundo plano, a `.qa/test.log`.
10. Archivos con Read/Write/Edit; scripts en `.qa/*.mjs`.
11. `sleep` está bloqueado; lo largo en segundo plano. Buscar con `git grep`.
12. Commit al cerrar cada etapa + `wip:` cada ~20 min + `.qa/progress.md` (paso hecho, siguiente paso). Push antes de los checks largos. **Si la red te corta**, al volver mira `git status`, `git log` y `.qa/progress.md` del slot y sigue desde ahí.
13. Antes del PR: typecheck, lint, tests, skill `a11y` (axe claro y oscuro, 320 px, teclado). Build local: sí (`bun run build`, en segundo plano, log en `.qa/build.log`).
14. Capturas: script propio en `.qa/` y `bash scripts/publish-pr-shots.sh .qa/shots` (vacía la carpeta antes). Antes: `git checkout origin/main -- <archivos>` en el slot con el mismo servidor, y restaurar.
15. Sin poder preguntar: opción conservadora + "Decisión tomada / alternativa" en el PR.
16. Arregla la clase entera en la primera pasada. Prevén lo de `~/.claude/kit-reference/QA-PREVENTION.md` que aplique. Al terminar, `git grep -n "@mui/\|@emotion/" -- app components lib theme tests scripts package.json bun.lock` debe salir vacío.
17. Copy nuevo = provisional, marcado + fila del checklist en el informe.
18. Cierre: commits convencionales en español, push, `gh pr create --body-file .qa/pr-body.md` (Write y `gh pr create` en turnos separados), `gh pr checks` en verde. Slot limpio. Nunca merge, push a `main`, force-push ni rebase.
19. Informe final breve: URL del PR, slot, changeset, verificado / no verificado, decisiones abiertas, acciones manuales, bugs vistos de pasada, **tokens que faltaron**, **primitivas que faltaron**, **formas compartidas que fijaste** (la ola 5 las copia), PHASE_LOG si no pudiste escribirlo.
