# Orquestación del 2026-11-20 — fase migración MUI → shadcn · ola 3 de 5 (zonas) · brief compartido

> Plan de la fase: `C:\Users\Cesar\Documents\Work\maranatha\context\plans\phase-migracion-shadcn.md`
> (léelo: "Decisiones de César", "Reglas de la fase", la fila de tu unidad en la ola 3 y "Para la
> ola 3"). Escrito sobre `origin/main` @ 75306fd (olas 1–2 mergeadas: #58, #59–#62).

> **Todo worker** lee esto antes de empezar. Su prompt trae solo lo propio de su unidad. Carpeta
> principal del repo: `C:\Users\Cesar\Documents\Work\maranatha` (ahí viven los archivos locales:
> `context/CURRENT_PHASE.md`, `context/CONTENT_CHECKLIST.md`, `context/PHASE_LOG/`, `context/plans/`).
> Su `context/` es `C:\Users\Cesar\Documents\Work\maranatha\context`: siempre esa ruta absoluta.
>
> **Mapa de íconos:** `C:\Users\Cesar\Documents\Work\maranatha\context\plans\mapa-iconos.md`
> (MUI → lucide, tamaños, y la traducción de `Typography`). Léelo antes de tocar el primer ícono.
>
> **Datos del proyecto:** tests con `bun:test` (`tests/unit/`), sin entorno DOM (lo visual se mide
> con Playwright) · lint `bunx biome check <archivos>` · referencia del kit en `~/.claude/kit-reference/`
> (`UI-LIBRARIES.md` › shadcn, `STACK-NEXTJS.md` › Tailwind) · Next 16: antes de usar una API de Next,
> su guía en `node_modules/next/dist/docs/` (AGENTS.md) · MUI 9 + Emotion siguen vivos hasta la ola 5.
>
> **CI funciona** (repo público): tras el push, `gh pr checks <n> --watch` en segundo plano; el
> build de Next lo da el CI (nadie tiene "Build local: sí").

## Unidades

| # | Rama | Qué | Modelo · esfuerzo | Docker | Servidor / capturas |
|---|---|---|---|---|---|
| W1 | `refactor/shadcn-sitio-marco` | navbar, pie, menú móvil, barra de progreso, logo, pantallas de estado, `/pago/resultado`, `/proyectos` y su detalle, tarjetas y barra lateral de proyecto | sonnet · medium | no | **espera aviso** |
| W2 | `refactor/shadcn-sitio-secciones` | secciones de la home (Hero … SocialLinks) y sus tarjetas, visor de Instagram | sonnet · medium | no | **espera aviso** |
| W3 | `refactor/shadcn-pagos` | sección y modal de diezmo, `TitheForm`, `PaymentStep`, `AmountSelector`, `DonationFormCard`, `ProjectContributionForm` | **opus · medium** | no | desde el inicio |
| W4 | `refactor/shadcn-panel-marco` | marco del panel, login/olvido/restablecer, `PasswordField`, banda de stats, esqueletos, resumen del panel | sonnet · medium | **sí** (`qa:local`) | desde el inicio |

**Servidores: máximo 2 a la vez** (en la ola 2 cuatro saturaron la máquina). W3 y W4 levantan su
servidor cuando lo necesiten. **W1 y W2: implementa, typecheck, lint y `test:related` primero, sin
levantar `bun run dev` ni Playwright; commitea y empuja, escribe en `.qa/progress.md` "listo para
capturas" y termina tu turno con un informe corto que diga eso.** El orquestador te avisa por
`SendMessage` cuando haya hueco; entonces haces capturas, axe, la suite completa y el PR.

Ningún archivo está en dos unidades. Sin orden de merge obligatorio; si `main` se movió:
`git merge origin/main` (nunca rebase).

### Cruces entre unidades (API que **no** cambia)

| Compuesto (dueño) | Lo usa (otra unidad) | Regla |
|---|---|---|
| `ProjectCard` (W1) | `components/sections/Projects.tsx:153` (W2) | props sin cambios, ninguna `sx` |
| `ProjectContributionForm`, `PaymentStep` (W3) | `app/proyectos/[slug]/ProjectDetailClient.tsx:161,172` (W1) | props sin cambios |
| `TitheModal` (W3) | `app/layout.tsx:95` | no se toca el layout |
| `DashboardStatBand` (W4) | `DashboardPayments.tsx:702`, `skeletons/PagosSkeleton.tsx` (ola 4 / W4) | props sin cambios (`stats`, `loading`, `accent`) |
| `PasswordField` (W4) | solo formularios de W4 | libre |
| `StatusScreen` (W1) | `app/error.tsx`, `global-error.tsx`, `not-found.tsx`, `mantenimiento/`, `offline/`, `estados/` | props sin cambios |

Las piezas que siguen en MUI hasta la ola 4–5 (`outlinedActionSx.ts`, `theme/fieldStyles.ts`,
`theme/patterns.ts`, `theme/theme.ts`, `ThemeRegistry`) **no se borran ni se editan**: deja de
importarlas en tus archivos y listo. `outlinedActionSx` → `<Button variant="action">` (D084/D092).

## Números reservados

| Unidad | Decisiones | Filas `CONTENT_CHECKLIST` | Changeset |
|---|---|---|---|
| W1 | D122–D124 | ninguna | `patch` — "Interfaz migrada a shadcn en el marco del sitio y las páginas de proyectos" |
| W2 | D125–D127 | ninguna | `patch` — "Interfaz migrada a shadcn en las secciones de la página de inicio" |
| W3 | D128–D130 | ninguna | `patch` — "Interfaz migrada a shadcn en los formularios de diezmo y aporte" |
| W4 | D131–D133 | ninguna | `patch` — "Interfaz migrada a shadcn en el acceso y el marco del panel" |

Último ID en `origin/main`: D121; ningún PR abierto reserva IDs. Si el tuyo ya existe al mergear
`origin/main`, toma el siguiente libre y dilo en el informe. Esta ola no trae copy nuevo: si
necesitas uno, provisional y marcado, y la fila va en tu informe (no edites el checklist).

## Formas compartidas

### De la ola 1 (#58) — copia de `formas-compartidas-shadcn.md`

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

### De la ola 2 (#59–#62) — copia de `formas-compartidas-shadcn-ola2.md`

#### Formas compartidas de la ola 2 (primitivas, #59–#62) — copiar al brief de la ola 3

Se suman a `formas-compartidas-shadcn.md` (ola 1), que también se copia. Todo en `components/ui/`.
Regla de las olas 3–4: un archivo de zona solo **importa** estas primitivas; si a una le falta algo,
va a "Primitivas que faltaron" del informe.

##### Tokens nuevos
- `--accent` / `--accent-foreground` (`bg-accent`): hover/resaltado (claro 4 %, oscuro y navy 8 %). `accentRoles` en `theme/roles.ts` (D116).
- `--muted` (`bg-muted`): skeleton y pistas de progreso (D119).
- Tamaños ≥ 1920 px dentro de `text-h1`…`text-body` (72/52/36/26, 20/18); variante `wide:` (1920); anchos de página `max-w-page-*` (D119).
- Traducción `Typography variant` → clases: `h1` → `font-heading font-extrabold text-h1 leading-h1`; `body1` → `text-body-lg leading-body`; `body2` → `text-body`; `caption` → `text-small`; el resto, en `context/plans/mapa-iconos.md`. Sin `@utility` de texto. El `letter-spacing` de MUI en h1/h2/h4 no se tradujo (si se nota: token `tracking-*`).

##### Íconos
- `context/plans/mapa-iconos.md`: cada `@mui/icons-material` usado → su lucide, y los tamaños (`fontSize` small → `size-5`, medium → `size-6`; `sx fontSize n` → `size-n/4`). `aria-hidden` en todo ícono decorativo.
- Logos: lucide ≥ 1.0 no trae marcas → `components/ui/brand-icons.tsx` (`InstagramIcon`, `YoutubeIcon`), 7 usos en Footer, SocialLinks, InstagramPostDialog, LeaderCard, ProjectSidebar, Sermons.
- `SelfImprovement` → `PersonStanding` (cambia de forma).

##### Acciones (W1, #59, D112–D113)
- `Avatar` (`size` sm 24 · default 32 · lg 40), `AvatarImage`, `AvatarFallback` (primary-600, blanco, `font-heading`): `<Avatar><AvatarImage src={url} alt="" /><AvatarFallback>{initialsOf(name, email)}</AvatarFallback></Avatar>` (`initialsOf` de `lib/auth/initials.ts`).
- `Tooltip` / `TooltipTrigger asChild` / `TooltipContent` — trae su propio provider (100 ms), no hace falta uno global.
- `Badge` `variant` default · secondary · success · destructive · outline; `asChild`.
- `Link` `tone` primary (def.) · muted; `underline` hover (def.) · always; `asChild` para `next/link`: `<Link asChild tone="muted" underline="always"><NextLink href="/x">Texto</NextLink></Link>`. Primario en oscuro = `primary-300` (AA).
- `ThemeToggle` `size` small · medium · large, `className`; dentro de `data-surface="navy"` no necesita clases.
- `SegmentedToggle` sin cambios de API (radiogroup).

##### Campos (W2, #60, D114–D116)
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

##### Superposiciones (W3, #62, D117–D118)
- `Dialog` / `DialogContent showCloseButton closeLabel="Cerrar" container?` / `DialogHeader` / `DialogTitle` / `DialogDescription` / `DialogFooter` (+ `DialogTrigger`, `DialogClose`, `DialogOverlay`). 444 px, `rounded-xl`, `shadow-lg`, `bg-card` sólido (D057), backdrop 50 %, `z-modal`. Dentro de un modal MUI vivo: `container={…}` (el focus-trap de MUI roba el foco si va a `body`).
- `Sheet` / `SheetContent side="right|left|top|bottom" showCloseButton closeLabel` / `SheetHeader` / `SheetTitle` / `SheetDescription` / `SheetFooter`: pantalla completa en móvil, `md:max-w-form-drawer`.
- `Alert severity="success|info|warning|error" appearance="standard|filled" hideIcon?` + `AlertTitle`; `role="alert"`, ícono lucide por severidad, AA en los dos modos (info relleno con texto `gray-900`).
- Toast: `<Toaster />` ya montado en `app/layout.tsx`. `import { toast } from "sonner"; toast.success("…", { duration: 6000 })` (+ `error`, `info`, `warning`). Por defecto 5 s (`TOAST_DURATION_MS`), 448 px, abajo al centro, cierre "Cerrar aviso". Reemplaza `Snackbar` + `Alert filled`.
- `ConfirmDialog`: API sin cambios; con un modal MUI abierto se porta dentro de su papel (se quita cuando el Drawer pase a `sheet`, ola 4); devuelve el foco a quien lo abrió.
- Botón destructivo: `button.tsx` no tiene `color="error"` → `variant="contained"` + `className="bg-destructive text-destructive-foreground …"` como en `ConfirmDialog`.

##### Estados (W4, #61, D119–D121)
- `<Skeleton className="h-5 w-56" />` (`bg-muted`, pulso, quieto con reduced-motion, `aria-hidden`).
- `<Progress value={42} aria-label="…" />`; sin `value` = indeterminada. `aria-label` obligatorio.
- `<Tabs value onValueChange><TabsList aria-label><TabsTrigger value>…</TabsTrigger></TabsList><TabsContent value /></Tabs>` (línea del sitio, 44 px, activa `secondary-700`).
- `<Container maxWidth="xs|sm|md|lg|none" disableGutters asChild>` (def. `lg`: 1200 → 1440 desde `xl` → 1600 desde `wide:`; gutters 8/12 px como MUI).
- `<PatternLayer stroke? secondsPerTile? className? />` como primer hijo de un `relative overflow-hidden` (sustituye a `patternLayerSx`; `theme/patterns.ts` reexporta `theme/patternTile.ts` hasta la ola 5).
- `<EmptyState icon={IconoLucideOMui} title description? ctaLabel? onCtaClick? compact? className? />` (`sx` → `className`; a un ícono MUI le fuerza `size-*!`).
- `Reveal`, `StepTransition`: API sin cambios.

##### Trampas aprendidas en la ola 2
- Playwright en dev: `waitUntil: "commit"` + `waitForSelector` de un atributo hidratado; nunca `networkidle`/`load`. `bun run shots` hace clic antes de hidratar: capturar con script propio y publicar desde una carpeta propia (`bash scripts/publish-pr-shots.sh .qa/shots`).
- `shadcn add` puede tardar > 2 min y preguntar si sobrescribe `button.tsx`: `echo n | node node_modules/shadcn/dist/index.js add <x> -y`, con timeout.
- `bun run a11y` tiene rutas fijas (incluye el panel con sesión): para rutas concretas, axe con un script propio con las mismas etiquetas.
- `run-on-main.sh` se cuelga en `bun install` sin red: el "antes" con `git checkout origin/main -- <archivos>` en el slot, mismo servidor, y restaurar.
- Contenedores `qa-maranatha-pg`/`-mailpit` compartidos entre slots: el worker no los baja.
- Contraste heredado: botón outlined "Cancelar" en oscuro 3,09:1; días de otro mes del calendario al 40 %.

### Nuevas de la ola 3 (fijadas aquí; nadie improvisa otras)

- **Primitivas: solo se importan.** Ningún worker edita `components/ui/<minúscula>.tsx`,
  `tokens.ts`, `roles.ts`, `tokens-css.ts` ni `tokens.css`. Lo que falte (p. ej. `color="error"`
  en `button.tsx`, un tamaño de 30 px, un `tracking-*`) va a "Primitivas que faltaron" / "Tokens
  que faltaron" del informe con el sustituto que usaste (`className` sobre la primitiva). El
  orquestador junta todo en un PR de faltantes al cerrar la ola.
- **`sx` → `className`** en todo compuesto que migras y que hoy recibe `sx`; los consumidores de
  otra unidad no pasan `sx` (tabla de cruces): si encuentras uno que sí, dilo y no lo toques.
- **`Typography` → elemento semántico** con las clases del mapa (`h2` real para títulos de
  sección; nada de `<div>` con clase de título). El orden de encabezados de cada página se
  conserva (lo mide axe).
- **`useTheme`/`useMediaQuery` de MUI → CSS** (`sm:`/`md:`/`dark:`/`navy:`); si de verdad hace
  falta en JS, `window.matchMedia` en un hook con `useSyncExternalStore` (cuidado con la
  hidratación). `theme.palette.mode` → la variante `dark:` (el modo llega del servidor).
- **`Snackbar` → `toast()`** de `sonner` (ya montado); **`Dialog` MUI → `dialog`**; **`Drawer` →
  `sheet`**; **`LinearProgress` → `Progress`**; **`Skeleton` → `Skeleton`**; **`Tabs` → `Tabs`**;
  **`Container` → `Container`**; **`Avatar` → `Avatar`**; **`Tooltip` → `Tooltip`**;
  **`TextField` → `Field` + `Input`/`Textarea`**; **`Alert` → `Alert`**.
- **Movimiento:** `framer-motion` (`motion`, `Reveal`, `StepTransition`) se queda; solo cambia el
  estilo. `prefers-reduced-motion` igual que hoy.

## Decisiones de César para esta fase

- Look igual al actual, con ajustes menores aceptados y anotados en el PR; capturas antes/después
  (main vs rama, claro y oscuro, 360 y 1280 px) de las rutas que toca.
- Íconos `lucide-react`, el equivalente más cercano (mapa de íconos).
- Servidor de desarrollo propio en el puerto del slot, **con el escalonado de arriba**. Docker: solo W4.
- `QA: al final`: no hay `wave-qa`.
- El orquestador mergea los PRs de la fase (CI verde + verificación local). Tú nunca mergeas.
- Nada destructivo en la base. Ninguna migración de base de datos en esta fase.
- No toques `package.json` ni `bun.lock`.
- Contrastes bajo AA heredados de MUI ("Para la ola 3" del plan): se copian tal cual; no los
  "arregles" (cambio visible que decide César). Sí lístalos si tu zona los usa.

## Simular el backend

- Sitio público: `bun run dev -- --port <puerto>` en tu slot, log en `.qa/dev.log` (W1/W2: solo
  tras el aviso del orquestador).
- **W3:** el flujo de pago se recorre como invitado hasta antes de enviar. **No envíes un reporte
  de pago** contra el `.env` (apunta a producción). Lo que necesita enviar (paso de "reportado",
  error del servidor) se fuerza interceptando la respuesta de la acción en el navegador solo para
  depurar, o va al "No verificado".
- **W4 (Docker: sí):** `bun run qa:local -- --port <puerto>` (Postgres + Mailpit en Docker, cuentas
  de `.env.test.local`, nunca la base real); inicia sesión con `ADMIN_EMAIL_TEST`/`ADMIN_PASSWORD_TEST`
  sin mostrar los valores. Los contenedores `qa-maranatha-pg`/`-mailpit` son compartidos: **no los
  bajes** (los baja el orquestador al cerrar la ola).
- Nada del `.qa/` de otro slot.

## Reglas de la tanda (además de `CLAUDE.md`)

Las reglas de `~/.claude/skills/orchestrate/brief-template.md` § "Batch rules" aplican tal cual
(léelas allí; son la fuente). Resumen de lo que más se olvida:

1. Lee solo `CLAUDE.md`, lo que cita tu prompt y, con `git grep`, lo demás.
2. Trabaja SOLO en tu slot; no crees worktrees, no corras `wt`, no cambies de rama.
3. No edites `CURRENT_PHASE.md` ni `CONTENT_CHECKLIST.md`; tu `PHASE_LOG/<rama-con-guiones>.md` va a la carpeta principal o en el informe.
4. Una decisión por archivo `context/decisions/D1NN-<tema>.md` dentro de tu rango (formato en `context/decisions/README.md`).
5. Changeset `.changeset/<desc>.md` con el bump y el texto de la tabla. No toques `version` ni `CHANGELOG.md`.
6. Servidor en tu puerto, log en `.qa/dev.log`; al terminar `taskkill /PID <pid> /T /F`.
7. Navegador: tu propia pestaña con `tabId`. Playwright con `node`, scripts en `.qa/`. `MSYS_NO_PATHCONV=1` para rutas en Git Bash.
8. `.env` apunta a producción: no inicies sesión ni escribas datos reales (W4 inicia sesión solo contra `qa:local`).
9. `bun run test:related` mientras trabajas; la suite completa sola, en segundo plano, a `.qa/test.log`.
10. Archivos con Read/Write/Edit; scripts en `.qa/*.mjs`.
11. `sleep` está bloqueado; lo largo en segundo plano. Buscar con `git grep`.
12. Commit al cerrar cada etapa + `wip:` cada ~20 min + `.qa/progress.md`. Push antes de los checks largos. **Si la red te corta**, al volver mira `git status`, `git log` y `.qa/progress.md` del slot y sigue desde ahí.
13. Antes del PR: typecheck, lint, tests, skill `a11y` (axe claro y oscuro, 320 px, teclado). El build lo da el CI.
14. Capturas: script propio en `.qa/` y `bash scripts/publish-pr-shots.sh .qa/shots` (trampas de la ola 2). Antes: `git checkout origin/main -- <archivos>` en el slot con el mismo servidor, y restaurar.
15. Sin poder preguntar: opción conservadora + "Decisión tomada / alternativa" en el PR.
16. Arregla la clase entera en la primera pasada. Prevén lo de `~/.claude/kit-reference/QA-PREVENTION.md` que aplique. Al terminar, `git grep -n "@mui/\|@emotion/" -- <tus archivos>` debe salir vacío.
17. Copy nuevo = provisional, marcado + fila del checklist en el informe.
18. Cierre: commits convencionales en español, push, `gh pr create --body-file .qa/pr-body.md` (Write y `gh pr create` en turnos separados), `gh pr checks` en verde. Slot limpio. Nunca merge, push a `main`, force-push ni rebase.
19. Informe final breve: URL del PR, slot, changeset, verificado / no verificado, decisiones abiertas, acciones manuales, bugs vistos de pasada, **tokens que faltaron**, **primitivas que faltaron**, **formas compartidas que fijaste** (API nueva de tus compuestos; la ola 4 la copia), PHASE_LOG si no pudiste escribirlo.
