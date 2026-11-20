# Prompts — fase migración MUI → shadcn · ola 1 (2026-11-20)

## W1 — `feat/shadcn-base`

Eres el worker **W1**. Rama: `feat/shadcn-base`. Slot y puerto: los del mensaje que te lanza
(`wt take`). Decisiones: rango **D108–D110**, un archivo `context/decisions/D0NN-<tema>.md` por
cada una. Filas de CONTENT_CHECKLIST: **ninguna**.
Modelo · esfuerzo: **opus · medium**. Docker: **no**. Build local: **sí**. Servicios de test: **no**.

Lee primero el brief compartido:
`C:\Users\Cesar\Documents\Work\maranatha\context\plans\orchestration-2026-11-20-shadcn.md` y, del plan
de fase `context/plans/phase-migracion-shadcn.md`, "Decisiones de César", "Reglas de la fase" y
la fila de la ola 1.
Decisiones que te restringen: D077 (selección y scroll por tokens), D085 (anillo de foco con
`--focus-ring`), D086 (foco en `forced-colors`), D067 (transición del toggle de modo), D025
(piezas navy fijas, `data-surface="navy"`) — `grep -rl "<ID>" context/decisions/` y abre solo esas.

### Qué pide César
> "dejar MUI y desarrollar los componentes con shadcn" — migrar todo, como fase propia.

Esta unidad es la **base**: no migra ningún componente existente. Deja listo lo que las olas
2–5 usarán, **sin cambio visible** en el sitio.

### Dónde está
- `theme/tokens.ts` (248 líneas) — fuente única de tokens: `primary`, `secondary`, `gray`,
  `common`, `onNavy`, `semantic`, `selection`, `scrollbar`, `typography` (familia, peso,
  tamaños h1–h4 desktop/mobile, `bodyLarge`, `body`, `small`, interlineados), `fontScale`
  (10.5–64 px), `spacing` (xs 4 … 4xl 96, en px), `radius` (xs 4 … xl 16, pill 999), `shadow`
  (sm, md, lg, hover, hoverNavy), `breakpoints` (**sm 600, md 900, lg 1200, xl 1536**: los de
  MUI, no los de Tailwind), `formDrawer`, `zIndex`, `navProgress`, `og`.
- `theme/theme.ts:19-60` — `getPaletteOptions(mode)`: los roles por modo que hoy usan los
  componentes (`primary.main/light/dark/contrastText`, `secondary.*`, `error` con
  `errorOnLight/errorOnDark`, `background.default/paper`, `text.primary/secondary`, `divider`).
  `theme/theme.ts:256+` — variantes de `MuiButton` (contained primary/secondary con los navy y
  naranjas AA por modo, outlined, text, disabled `gray[200]`/`gray[400]`); `:230-238` sin
  ripple de foco (D085). `components/ui/outlinedActionSx.ts` — variante "acción delineada"
  que usan 9 archivos.
- `theme/globalStyles.ts` — `--focus-ring`, `::selection`, scroll (D077), por `MuiCssBaseline`;
  lo cubre `tests/unit/global-styles.test.ts`.
- `theme/ThemeRegistry.tsx:100-104` — `data-color-mode` en `<html>` se pone **solo en el
  cliente** (`useEffect`); `app/layout.tsx:73-80` ya resuelve el modo en el servidor por la
  cookie `color-mode` pero no lo escribe en `<html>`.
- `app/globals.css` — `@import "tailwindcss"` sin `source()`; restos de `create-next-app`
  (`--background #fff`, `--foreground`, `@theme inline` con Geist, `body { font-family: Arial }`,
  `prefers-color-scheme` propio); reglas `.Mui*` de foco, `forced-colors` y transición (se quedan
  hasta la ola 5).
- `components/ui/TitheLayout.tsx:5` — `LAYOUT_MAX_WIDTH = 960` sin token (#53).
- `components/ui/DashboardPageSkeleton.tsx` — sin uso (`git grep DashboardPageSkeleton` solo
  da el propio archivo). César dijo borrarlo.
- No hay `components.json` ni `lib/utils.ts`; no hay `cn`.

### Enfoque decidido
1. **Dependencias de toda la fase**, en esta unidad y en ninguna otra: `bun add clsx
   tailwind-merge class-variance-authority radix-ui lucide-react sonner tw-animate-css` más lo
   que `shadcn init` pida. Revisa con Context7 la versión actual de shadcn (Tailwind v4 +
   React 19) antes del init. Nada de `npm`/`npx`: `bunx`.
2. **`shadcn init` sobre árbol limpio y diff revisado** (trampa de `UI-LIBRARIES.md`): restaura
   lo que reescriba (tokens, fuentes Sora/IBM Plex en `layout.tsx` — nada de Geist —, el `cn`).
   `components.json`: `rsc: true`, `tsx: true`, `iconLibrary: "lucide"`, `cssVariables: true`,
   `aliases.ui` → `@/components/ui`, `aliases.utils` → `@/lib/utils`, `tailwind.css` →
   `app/globals.css`. Después del init, `add` solo debe tocar `components/ui/`.
3. **Tokens a Tailwind, con `theme/tokens.ts` como fuente única:** un script
   (`scripts/tokens-css.ts`, se corre con `bun`) genera un CSS (`app/tokens.css`, importado
   desde `globals.css`) con el `@theme` de las escalas — colores (`--color-primary-700`…),
   `--text-*` (h1–h4 con su versión móvil por breakpoint, body-lg, body, small y los de
   `fontScale`, con su `--text-*--line-height`), `--font-heading`/`--font-body`, pesos,
   `--spacing-*` con los nombres de `spacing`, `--radius-*`, `--shadow-*`, `--breakpoint-*` con
   **los valores de MUI** (y quita los de Tailwind que no existan en `tokens.ts`, para que
   `md:` signifique 900 px como hoy), `--z-*` si te sirve — y un test en `tests/unit/` que
   falla si el CSS generado no coincide con `tokens.ts` (corre el generador en memoria y
   compara). Sin hex escritos a mano en `globals.css`.
4. **Roles por modo como variables CSS** (las que shadcn espera y las del proyecto), sacadas
   de `getPaletteOptions`: `--background` (= `background.default`), `--card`/`--popover`
   (= `paper`), `--foreground`, `--muted-foreground` (= `text.secondary`), `--primary`,
   `--primary-foreground`, `--secondary`, `--destructive` (= `error`), `--border`/`--input`
   (= `divider`), `--ring` (= `--focus-ring` de D085), y lo que veas que usan los componentes
   (`primary.light/dark`, `success`, `warning`, `info`). Valores en `:root` (claro) y en
   `[data-color-mode="dark"]`; las piezas navy fijas (`[data-surface="navy"]`, D025) las
   redefinen como hoy hace `globalStyles.ts`. Expuestas en `@theme inline` (`bg-background`,
   `text-muted-foreground`, `border-border`…). **Los valores salen del generador** (el mismo
   script), no a mano. Cálculo de contrastes de cada par texto/fondo en claro **y** oscuro en
   el informe (el test de `global-styles` ya enseña cómo).
5. **Variante `dark`:** `@custom-variant dark (&:where([data-color-mode="dark"], [data-color-mode="dark"] *));`
   y `app/layout.tsx` escribe `data-color-mode={initialMode}` en `<html>` desde el servidor
   (sin flash; `ThemeRegistry` sigue actualizándolo al cambiar). No uses `prefers-color-scheme`
   para los colores: manda el toggle (D053/D077).
6. **`cn` del proyecto** en `lib/utils.ts` con `extendTailwindMerge`: registra todo `--text-*`,
   `--shadow-*`, `--radius-*` y `--spacing-*` propios (`STACK-NEXTJS.md` › Tailwind: "`cn` lee un
   tamaño como color"). Test que recorre los `--text-*` del CSS generado y comprueba que cada uno
   sobrevive a `cn("text-<t>", "text-foreground")`, y lo mismo para sombras y radios.
7. **`@import "tailwindcss" source(none);`** con `@source "../app"`, `"../components"`, `"../lib"`
   (Tailwind escanea `context/` y `.claude/` si no: `STACK-NEXTJS.md`). `tw-animate-css` importado.
8. **Restos de `create-next-app` en `globals.css`:** se quitan (Geist, Arial, `--background`
   propio, `prefers-color-scheme`) **solo si las capturas no cambian** — hoy `CssBaseline` de MUI
   pinta el `body`; compruébalo. Las reglas `.Mui*` se quedan hasta la ola 5.
9. **`components/ui/button.tsx`** con `bunx shadcn@latest add button`, ajustado para replicar
   las variantes del `MuiButton` del proyecto (contained primary / contained secondary /
   outlined / text / la "acción delineada" de `outlinedActionSx.ts`; tamaños small/medium/large
   y uno de ícono para lo que hoy es `IconButton`), con los colores AA por modo de `theme.ts`,
   estado disabled, `asChild` (Radix `Slot`) para enlaces, y el foco de D085 (`outline` 2px,
   offset 2px, `--focus-ring`, respeta el radio). Nadie lo importa todavía: muéstralo en una
   página temporal **sin commitear** para medirlo y capturarlo junto a un `Button` MUI igual
   (claro/oscuro, hover, foco, disabled). Diferencias menores aceptadas (ripple de clic, por
   ejemplo): lístalas en el PR.
10. **Token de ancho 960:** en `tokens.ts` (p. ej. `layout.contentNarrow: 960`, el nombre lo
    eliges), generado a `--container-*` o equivalente, y `TitheLayout.tsx:5` lo lee del token
    (sigue en MUI: solo cambia la constante).
11. **Borrar** `components/ui/DashboardPageSkeleton.tsx`.
12. **`CLAUDE.md` › Stack:** dos líneas para que las olas siguientes no lean una regla vieja —
    "Librería de componentes: migrando de MUI 9 a shadcn/ui (fase en
    `context/plans/phase-migracion-shadcn.md`); estilos nuevos con Tailwind y los tokens de
    `theme/tokens.ts` generados a `app/tokens.css`". El resto de `CLAUDE.md`, `PROJECT_CONTEXT.md`
    y `DESIGN_RULES.md` es de la ola 5: no los toques.

Decisiones (D108–D110): una para la generación de tokens a CSS y los roles por modo (incluye
por qué breakpoints de MUI), otra para la configuración de shadcn (`components.json`, `cn`,
`button` y sus variantes); la tercera queda libre si la necesitas.

### Trampas conocidas
- `--spacing-xs`/`sm`/`md`… en Tailwind v4 pueden pisar `max-w-xs`/`max-w-md` y similares
  (`--container-*`). Lee el CSS que genera el build (`.next/static/css`), no la documentación,
  y elige nombres que no choquen; deja el ejemplo en el informe.
- MUI usa `spacing(1) = 8px`; Tailwind `--spacing` por defecto es 4 px (`p-4` = 16 px). Decide
  si se mantiene la escala numérica de Tailwind además de los nombres de `tokens.ts` y escríbelo
  en la decisión: las olas 3–4 traducen `p: 2` de MUI con esa regla.
- Emotion inyecta sus estilos **sin capa**; Tailwind va en capas, así que en un mismo elemento
  gana MUI. No cambies el orden de capas de MUI (`enableCssLayer`) en esta unidad: cambiaría
  la cascada de todo el sitio. Solo documenta la regla en la decisión.
- La preflight de Tailwind ya está activa hoy (el `@import "tailwindcss"` existe): no la quites
  ni la dupliques; `source(none)` no debe cambiar lo que se emite para `base`.
- `tests/unit/global-styles.test.ts` vigila `globalStyles.ts`: no lo toques y córrelo.
- `next build` en Windows puede tardar o colgarse con otros slots compilando: en segundo plano,
  a `.qa/build.log`.

### Cómo verificar
- Capturas **antes (main, `bash scripts/run-on-main.sh`) y después (rama)** de `/`, `/proyectos`,
  un `/proyectos/<slug>`, `/pago/resultado`, `/dashboard/login`, en claro y oscuro, a 360 y
  1280 px: deben ser iguales; si alguna difiere, el motivo en el PR. Mide además en el navegador
  que `getComputedStyle(document.body)` (fondo, color, fuente) es el mismo en main y en la rama.
- La página temporal del `button` (sin commitear): capturas de cada variante en claro/oscuro,
  foco por teclado y disabled; contraste de cada par en el informe.
- Primer paint en oscuro con la cookie `color-mode=dark`: `<html data-color-mode="dark">` ya en
  el HTML del servidor (`curl` o `view-source`).
- Tests nuevos: sincronía tokens ↔ CSS generado; `cn` con cada `--text-*`/`--shadow-*`/`--radius-*`.
- `bun run typecheck`, `bunx biome check` de lo tocado, `bun run test`, `bun run build` y
  `bun run a11y` sobre las rutas de arriba.

### Cierre
Changeset: **none** (sin cambio visible; si al final hay uno, `patch` y dilo).
En el PR, "Decisión tomada / alternativa" para: nombres de los tokens en Tailwind, la escala de
espaciado, qué restos de `globals.css` se quitaron y las diferencias del `button` frente a MUI.
Acciones manuales: ninguna esperada.
Informe final según el brief, con una sección **"Formas compartidas"**: tabla `token de
tokens.ts → clase de Tailwind` con ejemplos (`typography.size.h2` → `text-h2`,
`spacing.lg` → `p-lg`…), las variables por modo, la variante navy y la API de `button.tsx`
(variantes, tamaños, ejemplo de `asChild`). La ola 2 la copia a su brief.
