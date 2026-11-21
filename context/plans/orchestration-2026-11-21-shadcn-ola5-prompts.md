# Prompts — fase migración MUI → shadcn · ola 5 (2026-11-21)

Lee primero el brief
`C:\Users\Cesar\Documents\Work\maranatha\context\plans\orchestration-2026-11-21-shadcn-ola5.md`
(trae las formas compartidas de las olas 1–4 y las reglas) y, del plan
`context/plans/phase-migracion-shadcn.md`: "Decisiones de César", "Reglas de la fase", la fila
de la ola 5 y "Para la ola 5". Mapa hecho sobre `origin/main` @ 416dcad; lo que este prompt
afirma con path:line ya está comprobado: no lo vuelvas a verificar.

Qué pide César:
> "dejar MUI y desarrollar los componentes con shadcn" — migrar todo, como fase propia; look
> igual con ajustes menores, íconos lucide-react, capturas antes/después por unidad.

**Red inestable:** tras cada paso de "Qué haces", commit (`wip:` vale), push y una línea en
`.qa/progress.md` ("hecho: paso N · sigue: paso N+1 · notas"). Si te reanudan, empieza por
`git status`, `git log --oneline origin/main..HEAD` y `.qa/progress.md`.

---

## W1 — `chore/quitar-mui`

Eres el worker **W1** (única unidad de la ola, última de la fase). Rama: `chore/quitar-mui`.
Slot y puerto: los del mensaje que te lanza.
Decisiones: **D140–D142** para lo que decidas en la unidad y **D143 = decisión de cierre de fase**
(obligatoria). Filas de CONTENT_CHECKLIST: ninguna. Changeset: `minor`
("Interfaz completa sobre shadcn/ui: se retira MUI").
Modelo · esfuerzo: **opus · medium** (toca el CSS global, el foco y el proveedor de modo de todo el sitio).
Docker: **sí** (`qa:local`). Build local: **sí** (cambian dependencias; en segundo plano).
Decisiones que te restringen (ábrelas: `grep -rl "<ID>" context/decisions/`): D025 (piezas navy,
`data-surface="navy"`), D053 (el modo lo decide el toggle), D067 (transición del toggle, 280 ms,
sin ella con `prefers-reduced-motion`), D077 (selección y scroll por tokens), D085 (anillo 2 px /
offset 2 px con `--focus-ring`; campos: borde 2 px sin outline exterior), D086 (foco de campos en
`forced-colors`), D108–D110 (base shadcn, tokens → `app/tokens.css`, `data-color-mode` resuelto en
el servidor), D121 (íconos), D138 (literales de un solo componente).

### Lo que queda con MUI (origin/main @ 416dcad, comprobado)

Importan `@mui/*` solo: `theme/ThemeRegistry.tsx:3-4` (`CssBaseline`, `ThemeProvider`,
`PaletteMode`, `AppRouterCacheProvider`), `theme/theme.ts:5`, `theme/globalStyles.ts:1`
(`PaletteMode`), `theme/patterns.ts:1` (`keyframes`), `components/ui/outlinedActionSx.ts:1`.
Nadie importa ya `outlinedActionSx`, `theme/fieldStyles.ts` ni `theme/patterns.ts` (solo
comentarios: `button.tsx:8-11`, `container.tsx:11`, `dialog.tsx:11`, `pattern-layer.tsx:7`,
`theme/patternTile.ts:3`, `theme/roles.ts:7`, `scripts/tokens-css.ts:234`).
`ThemeRegistry` lo usan `app/layout.tsx:20,92` y `app/global-error.tsx:6,27`; `useColorMode`
solo `components/ui/ThemeToggle.tsx:6,23`. Comentarios MUI: `components/ui/EmptyState.tsx:18`,
`components/ui/brand-icons.tsx:7`. `package.json:30-34`: `@emotion/react`, `@emotion/styled`,
`@mui/icons-material`, `@mui/material`, `@mui/material-nextjs`.
`app/globals.css`: `.MuiButtonBase-root:focus-visible` `:76`; `forced-colors` `.MuiButton-*` `:103-104`,
`.MuiInputBase-root.Mui-focused…` `:137`, `.MuiLinearProgress-*` `:144-152`; transición D067 con
`.Mui*` `:170-198`; comentario de scroll/selección `:201-205`.
`tests/unit/global-styles.test.ts:2` importa `getGlobalStyles` de `theme/globalStyles`.

### Trampas (comprobadas)

- **`CssBaseline` hacía más que selección y scroll.** Hoy `<body>` no tiene fondo, color ni
  fuente fuera de MUI (`app/layout.tsx:88`, `globals.css` solo le pone la transición). Al quitar
  `CssBaseline` + `ThemeProvider` se pierden: fondo `background.default` y color de texto por modo,
  `font-family`/tamaño/interlineado del `body1` (con el tamaño grande de `LARGE_SCREEN_QUERY`,
  `theme/theme.ts:~189-192`), `-webkit-font-smoothing`, `color-scheme`, `box-sizing` y los márgenes.
  Mide **antes** en main (computed style de `html`/`body` en claro y oscuro, 360 y ≥ 1920 px) y
  reproduce lo mismo con los roles de `app/tokens.css` (`bg-background`, `text-foreground` o la
  variable equivalente) en una capa `@layer base` de `globals.css`. Lo que preflight de Tailwind
  ya da no lo dupliques.
- **`--focus-ring` lo define `theme/globalStyles.ts:71-73`** (claro `secondary[600]`, oscuro
  `secondary[500]`, navy `secondary[500]`) y lo lee `globals.css:77` y `scripts/tokens-css.ts:234`.
  Pásalo a `app/tokens.css` desde el generador (`scripts/tokens-css.ts`, tokens de `theme/tokens.ts`;
  cero hex a mano: `tokens.test.ts` lo vigila) o a `globals.css` con variables ya generadas.
- **Scroll y selección (D077)** viven en `theme/globalStyles.ts:39-105` con variables `--sb-*` y
  reglas por modo y por navy, más un `@supports not selector(::-webkit-scrollbar)` para Firefox.
  Reescríbelo en CSS propio con los mismos valores; `global-styles.test.ts` tiene que seguir
  vigilando los contrastes (selección ≥ 4.5:1, scroll ≥ 3:1) — cambia su `describe("getGlobalStyles")`
  para que lea la fuente nueva (CSS generado o el módulo de tokens), no lo borres.
- `ThemeRegistry` tiene lógica que **se conserva entera**: contexto `useColorMode`, cookie
  `color-mode` + `localStorage`, migración de una vez, `data-color-mode` en `<html>`, `MotionConfig`.
  Cambia `PaletteMode` por un tipo propio (`"light" | "dark"`). Nombre del archivo: puedes dejarlo
  o renombrarlo (`theme/ColorModeProvider.tsx`); si lo renombras, actualiza sus 3 consumidores y el
  mensaje de error de `useColorMode`.
- `app/global-error.tsx` monta su propio `<html>` **sin** `data-color-mode` (`:25`): sin MUI, el
  modo oscuro ahí depende solo de ese atributo. Añádelo al `<html>` de `global-error` con el modo
  que ya calcula (`:20-22`) y mide `/` forzando el error si es fácil; si no, "No verificado".
- **Transición D067** (`globals.css:170-198`): sin `.Mui*` queda en `body` y `[data-color-mode]`.
  Las superficies shadcn ya animan color con sus propias clases o no; mide que el cambio de modo
  sigue siendo un fade y no un salto en navbar, tarjetas, diálogos y campos. No uses `*` universal
  (el comentario explica por qué: choca con los fills de framer-motion).
- **`forced-colors`** (`globals.css:102-153`): `.MuiButton-*` → los `button[type=…]` ya cubiertos y
  el `data-slot="button"` de la primitiva si hace falta; `.MuiLinearProgress-*` →
  `[data-slot="progress"]` / `[data-slot="progress-indicator"]` (mira `components/ui/progress.tsx`).
  Mide con `forcedColors: "active"` de Playwright (emulateMedia) antes y después.
- Quitar `.MuiButtonBase-root:focus-visible` de la regla de foco (`:76`): ya no hay `ButtonBase`.
- `bun remove @mui/material @mui/icons-material @mui/material-nextjs @emotion/react @emotion/styled`.
  Mira si queda algún otro `@mui/*` o `@emotion/*` en `package.json` (p. ej. `@mui/utils`,
  `@mui/system` si estaban directos) y quítalos también. `next.config.*`: busca `optimizePackageImports`
  o `transpilePackages` con MUI y límpialo.
- **El guard de test** que prohíbe los imports no puede contener el literal `@mui/` ni `@emotion/`
  (si no, el `git grep` del cierre lo encuentra a él): arma el patrón por partes
  (`["@", "mui/"].join("")`). Recorre `app/ components/ lib/ theme/` (y `package.json` como JSON:
  ninguna dependencia que empiece por esos prefijos). Archivo: `tests/unit/sin-mui.test.ts`.
- `next typegen` (typecheck) con el dev vivo dejó una ruta en 404 hasta reiniciar (ola 4).
- `.claude/kit-reference/UI-LIBRARIES.md:79` y las decisiones D062, D089, D121 citan `@mui/` como
  historia: **no las edites** (la referencia es del kit; las decisiones son historial). El
  `git grep` de cierre se limita a `app components lib theme tests scripts package.json bun.lock`.

### Qué haces
1. Mide el "antes" en main con `qa:local` (estilos computados de `html`/`body`, foco de un botón,
   un enlace y un campo en claro/oscuro/navy, selección, scroll, `forced-colors`) y guárdalo en
   `.qa/antes.json`. Capturas "antes" de `/`, `/proyectos`, `/pago/resultado`, `/dashboard/login`,
   `/dashboard` y `/dashboard/pagos` (con sesión), claro y oscuro, 360 y 1280 px.
2. CSS propio: base de `body`/`html`, `--focus-ring`, scroll y selección (D077), `forced-colors`
   y transición D067 sin `.Mui*`. Ajusta `global-styles.test.ts`.
3. `ThemeRegistry` sin MUI (contexto de modo + `MotionConfig`), `global-error` con `data-color-mode`.
4. Borra `theme/theme.ts`, `theme/globalStyles.ts`, `theme/fieldStyles.ts`, `theme/patterns.ts`,
   `components/ui/outlinedActionSx.ts`. Si `theme/patternTile.ts`, `theme/roles.ts` u otro módulo
   quedan sin uso tras eso, **señálalos, no los borres** (regla de `CLAUDE.md`). Limpia los
   comentarios que citan MUI o los archivos borrados (`button.tsx`, `container.tsx`, `dialog.tsx`,
   `pattern-layer.tsx`, `EmptyState.tsx`, `brand-icons.tsx`, `patternTile.ts`, `roles.ts`,
   `tokens-css.ts`, `globals.css:201-205`): que digan de dónde sale el valor hoy.
5. `bun remove` de los paquetes; `bun install` limpio; `next.config` sin restos.
6. Guard `tests/unit/sin-mui.test.ts`.
7. Docs: `CLAUDE.md` › Stack ("migrando de MUI 9 a shadcn/ui…" → "shadcn/ui (Radix + Tailwind);
   MUI retirado en D143") y la regla no negociable "MUI antes que reimplementar un primitivo" →
   "shadcn/ui antes que reimplementar un primitivo (`bunx shadcn@latest add`)";
   `context/PROJECT_CONTEXT.md` › Stack; `context/DESIGN_RULES.md` (donde cite MUI, `sx`,
   `ThemeRegistry` o `theme/theme.ts`); busca además `git grep -n "MUI\|\bsx\b" -- CLAUDE.md context/*.md`
   en archivos versionados. **D143** = cierre de fase: qué se migró (olas 1–5, PRs #58–#68 + este),
   qué se conserva (decisiones D057, D062, D077, D085, D086, D089, D099 en su forma nueva), qué quedó
   para el QA de versión (contrastes heredados, "Sin verificar" de las olas 2–4 del plan) y el guard.
8. "Después": las mismas medidas y capturas en la rama (`.qa/despues.json`); diferencias con su
   motivo en el PR. axe claro y oscuro a 320 px en esas rutas; teclado (Tab visible) en home y panel.
9. Verificación y cierre: typecheck, lint, `bun run test`, `bun run build` (local, en segundo plano),
   `git grep -n "@mui/\|@emotion/" -- app components lib theme tests scripts package.json bun.lock`
   vacío. PR con: qué se quitó, tabla antes/después de los estilos computados, capturas,
   "Archivo sin uso" (`tailwind.config.ts` y lo que el paso 4 señale), acciones manuales (ninguna
   de base de datos).

### Informe
Lo de la regla 19 del brief, más: tamaño de `node_modules`/bundle si lo mides (no obligatorio),
la lista de archivos sin uso señalados y el texto de D143 en dos líneas.
