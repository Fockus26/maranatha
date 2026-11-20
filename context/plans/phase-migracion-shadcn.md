# Fase propia — Migración MUI → shadcn · plan de olas

> Escrito por `orchestrate` el 2026-11-20, sobre `origin/main` @ fc94345 (la ola 1 sale de 4029221: #46, release, mergeado). Cada ola corre en
> **su propia sesión**: la sesión que arranca una ola lee este archivo y `CURRENT_PHASE.md`,
> nada más del plan. Se actualiza al cerrar cada ola (estado, PRs, qué pasa a la siguiente).
> Carpeta principal: `C:\Users\Cesar\Documents\Work\maranatha` · Sin archivo en `phases/`
> (fase fuera del track; decidida por César el 2026-11-20 contra el consejo de
> `UI-LIBRARIES.md`, ver `orchestration-2026-11-20.md`).
> Sin handoff nuevo: el diseño es el sitio actual (es una migración, no un rediseño).

## Decisiones de César (2026-11-20, una sola ronda)

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
| 1 | `feat/shadcn-base` · tokens de `theme/tokens.ts` generados a Tailwind `@theme`, variables por modo (claro/oscuro/navy), variante `dark` por `data-color-mode` resuelto en el servidor, `cn` del proyecto con `extendTailwindMerge`, `components.json` (init revisado), **todas** las dependencias de la fase, `button.tsx` como primera primitiva, token de ancho 960, borrar `DashboardPageSkeleton.tsx` · `app/globals.css`, `app/layout.tsx`, `theme/tokens.ts`, `lib/utils.ts`, `components.json`, `components/ui/button.tsx`, `scripts/`, `package.json` | — | en curso |
| 2 | `feat/ui-acciones` · avatar, tooltip, link, badge; migra `SegmentedToggle`, `ThemeToggle` · `components/ui/{avatar,tooltip,badge}.tsx`, esos dos | ola 1 | pendiente |
| 2 | `feat/ui-campos` · input, textarea, label, field (etiqueta + ayuda + error, D085/D086), select, radio-group, popover; migra `DateField`, `TimeField` · `components/ui/{input,textarea,label,field,select,radio-group,popover}.tsx`, esos dos | ola 1 | pendiente |
| 2 | `feat/ui-superposiciones` · dialog (D057), sheet, alert, toast (sonner, con el ancho y la pila medidos: trampa de `UI-LIBRARIES.md`); migra `ConfirmDialog` · `components/ui/{dialog,sheet,alert,sonner}.tsx`, `ConfirmDialog.tsx` | ola 1 | pendiente |
| 2 | `feat/ui-estados` · skeleton, progress, tabs, container, utilidades de tipografía y de patrón (sustituto de `theme/patterns.ts`), **mapa de íconos MUI → lucide** (`context/plans/mapa-iconos.md` + tamaños por token); migra `EmptyState`, `Reveal`, `StepTransition` · `components/ui/{skeleton,progress,tabs,container}.tsx`, esos tres | ola 1 | pendiente |
| 3 | `refactor/shadcn-sitio-marco` · layout público + proyectos: `Navbar`, `PageNavbar`, `Footer`, `MobileMenuOverlay`, `NavigationProgress`, `brand/Logo`, `status/StatusScreen`, `app/pago/resultado`, `PublicPageSkeleton`, `app/proyectos/*`, `ProjectCard`, `ProjectDetailContent`, `ProjectSidebar` | ola 2 | pendiente |
| 3 | `refactor/shadcn-sitio-secciones` · `sections/{Hero,Agenda,History,Leaders,Projects,Sermons,ServiceAreas,SocialLinks}`, tarjetas `AgendaItem`, `LeaderCard`, `PhotoAnchorBand`, `PhotoOverlayCard`, `ServiceAreaCard`, `SocialLinkCard`, `TimelineItem`, `TimelineZigzagItem`, `YoutubeEmbedCard`, `InstagramPostDialog` | ola 2 | pendiente |
| 3 | `refactor/shadcn-pagos` · **riesgo (opus)** · `sections/Tithe`, `TitheForm`, `TitheLayout`, `TitheModal`, `PaymentStep`, `AmountSelector`, `DonationFormCard`, `ProjectContributionForm` (D099 se conserva) | ola 2 | pendiente |
| 3 | `refactor/shadcn-panel-marco` · **Docker: sí** · `DashboardShell`, `DashboardSidebar`, `DashboardTopbar`, `DashboardAuthShell`, `DashboardLogin/Forgot/ResetForm`, `PasswordField`, `DashboardStatBand`, `skeletons/*`, `app/dashboard/(panel)/page.tsx` | ola 2 | pendiente |
| 4 | `refactor/shadcn-panel-datos` · **Docker: sí** · `DashboardPayments`, `DashboardTable`, `DashboardAgenda`, `DashboardFormDrawer`, `DashboardProjectForm`, `ImageUploadField`, `app/dashboard/(panel)/proyectos/page.tsx` | ola 3 | pendiente |
| 5 | `chore/quitar-mui` · quitar `@mui/*`, `@emotion/*`, `ThemeRegistry` (queda solo el contexto de modo + `MotionConfig`), `theme/{theme,globalStyles,fieldStyles,patterns}.ts`, `outlinedActionSx.ts`, las reglas `.Mui*` de `globals.css` (pasan a selectores propios: D077, D085, D086, transición de D067); actualiza `CLAUDE.md`, `PROJECT_CONTEXT.md` › Stack y `DESIGN_RULES.md` con una **decisión nueva de cierre de fase**; guard de test que prohíbe `@mui/` y `@emotion/` | ola 4 | pendiente |

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

## Ola actual: 1

- Brief y prompt: `context/plans/orchestration-2026-11-20-shadcn.md` / `…-shadcn-prompts.md`
- PRs: #58 W1 base — abierto (ci y deploy verdes). Decisiones D109–D111 (D108 lo tomó #56)
- QA: no aplica (QA: al final)

## Cierres

| Ola | PRs | QA (C · A · M · B) | Pasa a la siguiente | Datos sin borrar |
|---|---|---|---|---|
| 1 | #58 (abierto) | no aplica | ver "Para la ola 2" | ninguno |

## Para la ola 2 (del informe de W1, #58)

- **Formas compartidas:** la tabla token → clase, las variables por modo (`theme/roles.ts`) y la API de `button.tsx` están en `context/plans/formas-compartidas-shadcn.md`: cópialas al brief de la ola 2.
- **Trampas:** `max-w-md`/`w-lg` resuelven al espaciado (para anchos, `max-w-narrow`/`max-w-form-drawer`); no existen los valores por defecto de Tailwind (`text-sm`, `bg-red-500`); `shadcn add` mete el paquete npm `cn` (cambiar a `@/lib/utils` y `git checkout package.json bun.lock`, lo vigila `tests/unit/shadcn-config.test.ts`); el CLI con `node node_modules/shadcn/dist/index.js add <x> -y` (`bunx` se cuelga); tras tocar `tokens.ts`/`roles.ts`, `bun scripts/tokens-css.ts`.
- **Faltan:** `--muted` y `--accent` (los define y mide la unidad que los use: skeleton, hover de menú); los tamaños de h1–h4 y body desde 1920 px (72/52/36/26 y 20/18) están a mano en `theme.ts`, sin token: unidad de estados o la base de la ola 2.
- **Contrastes bajo AA heredados de MUI** (copiados tal cual, a decidir por César: cambio visible): oscuro `primary` sobre card 3.10:1 y sobre fondo 3.78:1 (outlined/text primary), `primary-foreground`/`primary` 3.55:1, `secondary-foreground`/`secondary` 2.77:1; `success` 2.71:1 e `info` 2.84:1 con su foreground; hover de `text` en claro 2.77:1.
- `tailwind.config.ts` (`content: ./src/**`) sin uso en v4: señalado, no se borra sin preguntar.

## Prompt de inicio de la siguiente ola

```
/orchestrate ola 2 de la fase migración MUI → shadcn. Plan: context/plans/phase-migracion-shadcn.md
```
