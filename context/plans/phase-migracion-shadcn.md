# Fase propia — Migración MUI → shadcn · plan de olas

> Escrito por `orchestrate` el 2026-11-20, sobre `origin/main` @ fc94345 (la ola 1 sale de 4029221: #46, release, mergeado). Cada ola corre en
> **su propia sesión**: la sesión que arranca una ola lee este archivo y `CURRENT_PHASE.md`,
> nada más del plan. Se actualiza al cerrar cada ola (estado, PRs, qué pasa a la siguiente).
> Carpeta principal: `C:\Users\Cesar\Documents\Work\maranatha` · Sin archivo en `phases/`
> (fase fuera del track; decidida por César el 2026-11-20 contra el consejo de
> `UI-LIBRARIES.md`, ver `orchestration-2026-11-20.md`).
> Sin handoff nuevo: el diseño es el sitio actual (es una migración, no un rediseño).

## Decisiones de César (2026-11-20, una sola ronda)

- **Merge:** César autorizó que el orquestador mergee él mismo los PRs de esta fase (CI verde y verificación local hecha; `gh pr merge <n> --merge`, nunca auto-merge ni push a `main`) hasta cerrar la ola 5. No cubre el PR de release.

- **Look:** igual al actual, **con ajustes menores aceptados** — si copiar MUI exacto cuesta
  mucho (ripple, sombras de elevación, etiqueta flotante), se acerca al estilo shadcn y la
  diferencia se anota en el PR. Cada unidad con UI lleva **capturas antes/después** (main vs
  rama, claro y oscuro, 360 y 1280 px) de las rutas que toca.
- **Íconos:** `lucide-react` (el set de shadcn). Cambian de forma: es el "ajuste menor" más
  visible; cada unidad elige el equivalente más cercano según el mapa de la ola 2.
- **`components/ui/DashboardPageSkeleton.tsx`** (sin uso desde #52): se borra en la ola 1.
- **Docker:** un worker por ola puede levantar `qa:local` (Postgres + Mailpit, cuentas de
  `.env.test.local`, nunca la base real) para capturar pantallas con sesión.
- Servidor de desarrollo: cada worker el suyo, en el puerto de su slot.
- `QA: al final`: no hay `wave-qa`. El QA de versión lleva `design-qa` sobre **todas** las
  rutas y `functional-qa` sobre los flujos de pago y de sesión.

## Mapa (origin/main @ fc94345)

77 archivos con `@mui/*` o `@emotion/*` en `app/`, `components/`, `lib/`, `theme/` (~17,7 k
líneas). Imports: íconos 102 (60 distintos), Box 59, styles/useTheme 40, Typography 38,
Button 24, IconButton 16, Container 12, TextField 11, Skeleton 9, Alert 9, Dialog 6,
Snackbar 5, LinearProgress 4, Link 4; sueltos: Tabs/Tab, Popper, ClickAwayListener, Drawer,
Avatar, Tooltip, TableSortLabel, RadioGroup/Radio, MenuItem, InputAdornment, CircularProgress,
`useMediaQuery`, `@mui/utils`, `@mui/system`, `@mui/material-nextjs`.

Decisiones que dependen de MUI y que cada unidad debe conservar en su forma nueva:
D057 (sin overlay blanco en modales oscuros) · D062 (DateField propio) · D077 (selección y
scroll por tokens, hoy en `MuiCssBaseline`) · D085 (anillo de foco 2px/offset 2px con
`--focus-ring`; campos: borde 2px, sin outline exterior) · D086 (foco de campos en
`forced-colors`) · D089 (TimeField propio) · D099 (dos instancias de `TitheForm`; ids con
`useId`, el modal no monta cerrado). También D101 y D106 citan MUI.

Piezas compartidas entre zonas (por eso se migran antes, en la ola 2): `SegmentedToggle`,
`ThemeToggle`, `EmptyState`, `ConfirmDialog`, `Reveal`, `StepTransition`, `DateField`,
`TimeField`, `outlinedActionSx.ts` (variante de botón), `theme/fieldStyles.ts` (estilo de
campo), `theme/patterns.ts` (fondos con patrón).

## Olas

| Ola | Unidades (rama · qué · archivos principales) | Depende de | Estado |
|---|---|---|---|
| 1 | `feat/shadcn-base` · tokens de `theme/tokens.ts` generados a Tailwind `@theme`, variables por modo (claro/oscuro/navy), variante `dark` por `data-color-mode` resuelto en el servidor, `cn` del proyecto con `extendTailwindMerge`, `components.json` (init revisado), **todas** las dependencias de la fase, `button.tsx` como primera primitiva, token de ancho 960, borrar `DashboardPageSkeleton.tsx` · `app/globals.css`, `app/layout.tsx`, `theme/tokens.ts`, `lib/utils.ts`, `components.json`, `components/ui/button.tsx`, `scripts/`, `package.json` | — | cerrada (#58) |
| 2 | `feat/ui-acciones` · avatar, tooltip, link, badge; migra `SegmentedToggle`, `ThemeToggle` · `components/ui/{avatar,tooltip,badge}.tsx`, esos dos | ola 1 | cerrada (#59) |
| 2 | `feat/ui-campos` · input, textarea, label, field (etiqueta + ayuda + error, D085/D086), select, radio-group, popover; migra `DateField`, `TimeField` · `components/ui/{input,textarea,label,field,select,radio-group,popover}.tsx`, esos dos | ola 1 | cerrada (#60) |
| 2 | `feat/ui-superposiciones` · dialog (D057), sheet, alert, toast (sonner, con el ancho y la pila medidos: trampa de `UI-LIBRARIES.md`); migra `ConfirmDialog` · `components/ui/{dialog,sheet,alert,sonner}.tsx`, `ConfirmDialog.tsx` | ola 1 | cerrada (#62) |
| 2 | `feat/ui-estados` · skeleton, progress, tabs, container, utilidades de tipografía y de patrón (sustituto de `theme/patterns.ts`), **mapa de íconos MUI → lucide** (`context/plans/mapa-iconos.md` + tamaños por token); migra `EmptyState`, `Reveal`, `StepTransition` · `components/ui/{skeleton,progress,tabs,container}.tsx`, esos tres | ola 1 | cerrada (#61) |
| 3 | `refactor/shadcn-sitio-marco` · layout público + proyectos: `Navbar`, `PageNavbar`, `Footer`, `MobileMenuOverlay`, `NavigationProgress`, `brand/Logo`, `status/StatusScreen`, `app/pago/resultado`, `PublicPageSkeleton`, `app/proyectos/*`, `ProjectCard`, `ProjectDetailContent`, `ProjectSidebar` | ola 2 | cerrada (#66) |
| 3 | `refactor/shadcn-sitio-secciones` · `sections/{Hero,Agenda,History,Leaders,Projects,Sermons,ServiceAreas,SocialLinks}`, tarjetas `AgendaItem`, `LeaderCard`, `PhotoAnchorBand`, `PhotoOverlayCard`, `ServiceAreaCard`, `SocialLinkCard`, `TimelineItem`, `TimelineZigzagItem`, `YoutubeEmbedCard`, `InstagramPostDialog` | ola 2 | cerrada (#65) |
| 3 | `refactor/shadcn-pagos` · **riesgo (opus)** · `sections/Tithe`, `TitheForm`, `TitheLayout`, `TitheModal`, `PaymentStep`, `AmountSelector`, `DonationFormCard`, `ProjectContributionForm` (D099 se conserva) | ola 2 | cerrada (#63) |
| 3 | `refactor/shadcn-panel-marco` · **Docker: sí** · `DashboardShell`, `DashboardSidebar`, `DashboardTopbar`, `DashboardAuthShell`, `DashboardLogin/Forgot/ResetForm`, `PasswordField`, `DashboardStatBand`, `skeletons/*`, `app/dashboard/(panel)/page.tsx` | ola 2 | cerrada (#64) |
| 4 | `feat/ui-faltantes` · primitivas y tokens que faltaron en la ola 3 (`button` color error/inherit y tamaños 28/30, `progress` color, `alert` acción, `field` sin etiqueta; tokens de texto, interlineado, `tracking-*`, anchos) y reemplazo de los `[…]` arbitrarios en los archivos de la ola 3 · `components/ui/{button,progress,alert,field}.tsx`, `theme/tokens.ts`, `scripts/tokens-css.ts`, `app/tokens.css`, archivos de la ola 3 con `[…]` | ola 3 | cerrada (#67) |
| 4 | `refactor/shadcn-panel-datos` · **Docker: sí** · `DashboardPayments`, `DashboardTable`, `DashboardAgenda`, `DashboardFormDrawer`, `DashboardProjectForm`, `ImageUploadField`, `app/dashboard/(panel)/proyectos/page.tsx` | ola 3 | cerrada (#68) |
| 5 | `chore/quitar-mui` · quitar `@mui/*`, `@emotion/*`, `ThemeRegistry` (queda solo el contexto de modo + `MotionConfig`), `theme/{theme,globalStyles,fieldStyles,patterns}.ts`, `outlinedActionSx.ts`, las reglas `.Mui*` de `globals.css` (pasan a selectores propios: D077, D085, D086, transición de D067); actualiza `CLAUDE.md`, `PROJECT_CONTEXT.md` › Stack y `DESIGN_RULES.md` con una **decisión nueva de cierre de fase**; guard de test que prohíbe `@mui/` y `@emotion/` | ola 4 | cerrada (#69) |

Regla de corte: ningún archivo está en dos unidades. En las olas 3–4, un archivo de zona solo
importa primitivas de `components/ui/` (olas 1–2) y nunca edita una; si a una primitiva le
falta algo, el worker lo anota en su informe ("Primitivas que faltaron") y la sesión de la ola
lo junta en un PR al cerrar, como los tokens que faltan (§4 de `orchestrate`).

## Reglas de la fase (van al brief de cada ola)

- **Dependencias:** las instala solo la ola 1 (todas las de la fase: `clsx`, `tailwind-merge`,
  `class-variance-authority`, `radix-ui`, `lucide-react`, `sonner`, `tw-animate-css`, y lo que
  pida `shadcn init`). Olas 2–4 no tocan `package.json` ni `bun.lock`; si `shadcn add` pide un
  paquete que falta, el worker lo anota y no lo instala. La ola 5 solo quita.
- **Primitivas:** `bunx shadcn@latest add <x>` y luego se ajusta a los tokens (nunca a mano lo
  que shadcn trae). Nombres en minúscula de shadcn (`components/ui/button.tsx`); los
  compuestos del proyecto siguen en PascalCase.
- **Convivencia:** mientras dure la fase conviven MUI (Emotion, sin capa) y Tailwind (en
  capas). Un archivo se migra **entero**: nada de clases de Tailwind sobre un componente MUI
  ni `sx` sobre una primitiva nueva (el estilo de Emotion sin capa le gana a la utilidad).
  Un compuesto ya migrado que hoy recibe `sx` de un consumidor sin migrar conserva su API
  con `className` y el consumidor se adapta en su ola; si eso obliga a tocar un archivo de
  otra unidad, el worker lo dice y no lo toca.
- **Cero valores mágicos** también en Tailwind: nada de `w-[347px]` ni `text-[#…]`; si falta,
  falta un token (lista "Tokens que faltaron" en el informe).
- **Accesibilidad:** Radix resuelve teclado y ARIA; se mide igual (trampas de
  `UI-LIBRARIES.md`: rol real de los toggle groups, ancho de sonner). Foco según D085/D086;
  `forced-colors` cubierto con selectores propios, no `.Mui*`.
- **Capturas:** antes (main) y después (rama) de cada ruta tocada, claro y oscuro, 360 y
  1280 px; diferencias visibles listadas en el PR con su motivo.
- **Changesets:** olas 1–2 `none` salvo cambio visible; olas 3–4 `patch` ("Interfaz migrada a
  shadcn en …"); ola 5 `minor`.
- **Decisiones:** IDs contra `origin/main` al lanzar cada ola. Ola 1: D108–D110. La ola 5
  reserva además el ID de la decisión de cierre de fase.

## Estado: **fase cerrada** (2026-11-21) · olas 1–5 cerradas · decisión de cierre D143

- Ola 2: brief `context/plans/orchestration-2026-11-20-shadcn-ola2.md` / `…-ola2-prompts.md`. Cerrada el 2026-11-20 (#59–#62, main @ 75306fd). D112–D121.
- Ola 3: brief `context/plans/orchestration-2026-11-20-shadcn-ola3.md` / `…-ola3-prompts.md`. Cerrada el 2026-11-21 (#63–#66, main @ 22e3360). D122–D133.
- Ola 4: brief `context/plans/orchestration-2026-11-21-shadcn-ola4.md` / `…-ola4-prompts.md`. **Ola 4 cerrada el 2026-11-21**: #67 `feat/ui-faltantes` (patch, D137–D139) y #68 `refactor/shadcn-panel-datos` (patch, D134–D136), mergeados por el orquestador (main @ 416dcad). Sin colisiones de IDs.
- Ola 5: brief `context/plans/orchestration-2026-11-21-shadcn-ola5.md` / `…-ola5-prompts.md`. **Cerrada el 2026-11-21**: #69 `chore/quitar-mui` (minor, D140–D143), mergeado por el orquestador (main @ b245f0b). `git grep "@mui/\|@emotion/"` vacío en código (`app components lib theme tests scripts package.json bun.lock`); solo quedan menciones históricas en D062, D089, D121, D127, D131, D143 y `.claude/kit-reference/UI-LIBRARIES.md` (del kit). Guard `tests/unit/sin-mui.test.ts`. Log `PHASE_LOG/chore-quitar-mui.md`.
- QA: no aplica (QA: al final).

## Cierres

| Ola | PRs | QA (C · A · M · B) | Pasa a la siguiente | Datos sin borrar |
|---|---|---|---|---|
| 1 | #58 (mergeado) | no aplica | ver "Para la ola 2" (copiado al brief de la ola 2) | ninguno |
| 2 | #59, #60, #61, #62 (mergeados) | no aplica | ver "Para la ola 3" | ninguno |
| 3 | #63, #64, #65, #66 (mergeados) | no aplica | ver "Para la ola 4"; unidad `feat/ui-faltantes` añadida | ninguno |
| 4 | #67, #68 (mergeados) | no aplica | ver "Para la ola 5" | ninguno (base local `qa_4301` de Docker, desechable) |
| 5 | #69 (mergeado) | no aplica | **fase cerrada**; sigue QA de versión 09 (ver "Después de la fase") | ninguno (bases locales de Docker, desechables) |

## Para la ola 3 (de los informes de la ola 2)

- **Formas compartidas:** copia al brief de la ola 3 **los dos** archivos: `context/plans/formas-compartidas-shadcn.md` (ola 1: tokens → clases, roles por modo, `button.tsx`) y `context/plans/formas-compartidas-shadcn-ola2.md` (API de todas las primitivas de la ola 2, tokens `--accent`/`--muted`/≥ 1920, traducción de `Typography`, trampas). Mapa de íconos: `context/plans/mapa-iconos.md` (local; la sesión de la ola lo cita con ruta absoluta).
- **Servidores: máximo 2 workers con dev server a la vez.** En la ola 2 los cuatro a la vez saturaron la máquina (dev sin responder 15 min, suites con timeouts falsos) y 3 de 4 PRs salieron sin capturas ni axe; hubo que pedirlas en una segunda ronda escalonada. En la ola 3: lanza los 4, pero el prompt de 2 de ellos dice "implementa, typecheck y tests primero; capturas y axe solo cuando el orquestador te avise" (el orquestador los avisa al terminar los otros dos). Docker: solo `refactor/shadcn-panel-marco`; los contenedores `qa-maranatha-pg`/`-mailpit` son compartidos: el worker no los baja, el orquestador sí al cerrar.
- **Ya tocado en la ola 2 en archivos de la ola 3** (solo la prop, autorizado): `ThemeToggle` en `DashboardSidebar.tsx` y `DashboardTopbar.tsx` quedó sin `sx` (lo resuelve la variante `navy:`), en `MobileMenuOverlay.tsx` con `className` (se borró su `hoverBg` sin uso). `EmptyState` pasó de `sx` a `className`.
- **Primitivas que faltaron (no bloquean):** `button.tsx` sin `color="error"` (patrón de `ConfirmDialog`: `variant="contained"` + `className="bg-destructive text-destructive-foreground"`; si `refactor/shadcn-pagos` o el panel lo repiten, que una unidad lo añada a `button.tsx` dentro de su fila o va al PR de faltantes al cerrar la ola 3); sin tamaño de 30 px (`size="icon"` + `className="size-7.5 p-1.25"`). Ningún token pendiente; si se nota el `letter-spacing` de MUI en h1/h2/h4, token `tracking-*`.
- **Convivencia con modales MUI:** un `Popover`/`Dialog` de Radix abierto dentro de un `Dialog`/`Drawer` MUI vivo necesita `container` (el focus-trap de MUI roba el foco si va a `body`). Al migrar `TitheModal` (pagos) a `dialog`, eso desaparece para su contenido.
- **Contrastes bajo AA heredados de MUI** (sin cambiar, decide César: cambio visible): oscuro `primary` sobre card 3.10:1 y sobre fondo 3.78:1 (outlined/text primary; p. ej. "Cancelar" outlined en oscuro 3.09:1), `primary-foreground`/`primary` 3.55:1, `secondary-foreground`/`secondary` 2.77:1; `success` 2.71:1 con su foreground; hover de `text` en claro 2.77:1; días de otro mes del calendario al 40 %.
- **Por revisar en el QA de versión** (`backlog.md`): paso 2 del diezmo a 360 px claro 742 → 732 px tras #61 (sin confirmar). Sin verificar con sesión en la ola 2: `ThemeToggle` del panel, `EmptyState` del panel, `DateField`/`TimeField` en agenda y proyectos, eliminar pagos/proyectos desde `ConfirmDialog`.
- `tailwind.config.ts` (`content: ./src/**`) sin uso en v4: señalado, no se borra sin preguntar.

## Para la ola 4 (de los informes de la ola 3)

- **Formas compartidas:** copia al brief de la ola 4 **los tres** archivos: `formas-compartidas-shadcn.md`, `formas-compartidas-shadcn-ola2.md` y `formas-compartidas-shadcn-ola3.md` (API nueva de los compuestos de zona, patrones fijados, la lista de faltantes y las trampas). Mapa de íconos: `context/plans/mapa-iconos.md` (ruta absoluta).
- **Unidades:** `refactor/shadcn-panel-datos` (Docker, la de la fila) y `feat/ui-faltantes` (sin servidor salvo para medir; no toca archivos del panel de datos). Si `panel-datos` necesita un faltante, usa el sustituto con `className` y lo anota; `ui-faltantes` lo reemplaza si mergea después (o al revés: quien mergee segundo hace `git merge origin/main` y sustituye).
- **`panel-datos` además:** borrar `components/ui/skeletons/SkeletonFrame.module.css` al migrar `DashboardTable` (D133); dar nombre accesible a los `IconButton` de las filas de `DashboardTable` (crítico axe en `/dashboard/proyectos` a 320 px); `DashboardFormDrawer` → `sheet` (quita el `container` de `ConfirmDialog`); `DASHBOARD_CONTENT_CLASS` (antes `_SX`) para el ancho del contenido.
- **Servidores:** con 2 unidades no hace falta escalonar, pero los cortes de red fueron constantes (cada worker 2–4 veces): el prompt pide `.qa/progress.md` tras cada paso y `wip:` frecuente; el orquestador reanuda con `SendMessage`, no relanza.
- **Simular el backend:** sin `DATABASE_URL` en el slot (W4 de la ola 3 lo resolvió con `qa:local`; `panel-datos` también lo usa). Login de `qa:local` con rate limit: un login por contexto de Playwright.
- **Decisiones abiertas de César (ola 3, no bloquean):** asterisco de obligatorio en nombre y correo del diezmo (D128); foco inicial del modal de diezmo en "Cerrar" (D129); filas "Acciones rápidas" del resumen a 34 px en vez de 44 (D132/D131); tarjeta de diezmo transparente sobre navy a ≤ 500 px de alto en claro (heredado).
- **Sin verificar en la ola 3** (va al QA de versión, `backlog.md`): envío real de un reporte de pago, toast de "¡Gracias!" y redirección a PayPal; `DateField` dentro del dialog de aporte de `/proyectos/[slug]` con métodos reales; restablecer contraseña con token real de Mailpit; `popstate` de `NavigationProgress`; "Ver más" de la agenda (pocos eventos); cuentas 2–3 de Redes; `Projects.tsx` no está montada en la home (¿sin uso? señalado, no se borra).
- Contrastes bajo AA heredados (ver "Para la ola 3"): sin cambios.

## Para la ola 5 (de los informes de la ola 4)

- **Formas compartidas:** copia al brief de la ola 5 los **cuatro** archivos: `formas-compartidas-shadcn.md`, `-ola2.md`, `-ola3.md` y `formas-compartidas-shadcn-ola4.md` (primitivas completadas, tokens nuevos con `max-w-reading`, compuestos del panel, trampas, y la lista exacta de lo que queda con MUI en main @ 416dcad). Mapa de íconos: `context/plans/mapa-iconos.md` (ruta absoluta).
- **Una sola unidad**, `chore/quitar-mui` (fila de la ola 5): quitar `@mui/*`, `@emotion/*` de `package.json`/`bun.lock` (la única ola que toca dependencias), `ThemeRegistry` (queda contexto de modo + `MotionConfig`), `theme/{theme,globalStyles,fieldStyles,patterns}.ts`, `outlinedActionSx.ts`, comentarios/tipos MUI de `EmptyState`/`brand-icons`, reglas `.Mui*` de `globals.css` → selectores propios (D077 selección y scroll, D085/D086 foco y `forced-colors`, transición de D067; `global-styles.test.ts` lo vigila); `tailwind.config.ts` sin uso (preguntar o señalar, no borrar sin permiso); docs (`CLAUDE.md` › Stack "migrando de MUI…" y regla "MUI antes que reimplementar" → shadcn, `PROJECT_CONTEXT.md` › Stack, `DESIGN_RULES.md`) con la **decisión de cierre de fase**; guard de test que prohíbe `@mui/` y `@emotion/` en `app/ components/ lib/ theme/`. Bump `minor`. Riesgo (toca todo el sitio y el foco global): `opus` · medium; Docker sí para ver el panel con sesión.
- **IDs:** último usado D139. La ola 5 reserva D140–D142 + uno de cierre de fase (contrastar con `origin/main` al lanzar).
- **Literales que quedan por D138** (no son deuda): `grid-cols-[…]` de `DashboardTable` (`minmax(0,1fr)_130px_200px_130px_96px`) y `DashboardProjectForm` (`1fr_160px_auto`, `1fr_auto`), y los listados en #67.
- **Sin verificar en la ola 4** (va al QA de versión, `backlog.md`): alturas de los `loading.tsx` del panel (D102) tras #68; "Ver comprobante" (no había comprobantes en la base local); el panel con sesión tras #67 (W2 sin Docker; mismas equivalencias medidas en público); estado de error de carga de métodos en `PaymentStep` ("Reintentar" pasó de 8 a 12 px).
- **Cambios visibles aceptados en #68:** cerrar del sheet 36 → 44 px, pestañas de imagen 32 → 44 px, campos 37,1 → 40 px, relleno de diálogos 14 → 28 px, etiquetas fijas (no flotantes).
- **Contrastes bajo AA heredados** (ver "Para la ola 3"; sin cambios): además, error de `Field` sobre navy en claro 3,49:1.
- Decisiones abiertas de César de la ola 3 (D128, D129, D132/D131): siguen abiertas, no bloquean.
- Restos: `.git/pr-shots-tmp.51376` (worktree temporal bloqueado de un script de capturas cortado): `git worktree unlock` + `prune` lo decide César.

## Después de la fase (de los informes de la ola 5)

- **Sigue el QA de versión (fase 09):** `design-qa` sobre **todas** las rutas y `functional-qa` sobre los flujos de pago y de sesión; incluye los "Sin verificar" de las olas 2–4 (arriba) y los contrastes heredados.
- **Sin verificar en la ola 5:** `global-error` en ejecución (ahora con `data-color-mode` e import de `globals.css`); Firefox (scroll por `@supports not selector(::-webkit-scrollbar)`). Build local falla en `next/font/google` (Sora, "Can't resolve '@vercel/turbopack-next/internal/font/google/font'") igual sin los cambios de la rama: entorno; el build de CI pasa.
- **Formas nuevas (#69, D140–D142):** `ColorModeProvider` + `useColorMode` en `@/theme/ColorModeProvider` (antes `ThemeRegistry`); `--focus-ring`, `--sb-*`, `--selection-*` por superficie generados por `scripts/tokens-css.ts` en `app/tokens.css`; base de `body` en `@layer base` de `globals.css`; reglas `.Mui*` retiradas sin sustituto (D142). La transición D067 queda en `body` y `<html>`.
- **Acción manual:** `bun install` en cada copia local (las carpetas `node_modules/@mui` huérfanas no se borran solas; no borrarlas a mano en Windows: muy lento). Archivo sin uso señalado: `tailwind.config.ts` (lo decide César).

## Prompt de inicio de lo que sigue

```
QA de versión (fase 09): design-qa en todas las rutas y functional-qa en pagos y sesión, tras la fase migración MUI → shadcn (cerrada, D143). Plan: context/plans/phase-migracion-shadcn.md › "Después de la fase".
```
