# Orquestación del 2026-11-20 — fase migración MUI → shadcn · ola 2 de 5 (primitivas) · brief compartido

> Plan de la fase: `context/plans/phase-migracion-shadcn.md` (léelo: "Decisiones de César",
> "Reglas de la fase" y la fila de tu unidad en la ola 2). Escrito sobre `origin/main` @ dd080a4
> (ola 1 mergeada, #58).

> **Todo worker** lee esto antes de empezar. Su prompt trae solo lo propio de su unidad. Carpeta
> principal del repo: `C:\Users\Cesar\Documents\Work\maranatha` (ahí viven los archivos locales:
> `context/CURRENT_PHASE.md`, `context/CONTENT_CHECKLIST.md`, `context/PHASE_LOG/`, `context/plans/`).
> Su `context/` es `C:\Users\Cesar\Documents\Work\maranatha\context`: siempre esa ruta absoluta.
>
> **Datos del proyecto:** tests con `bun:test` (`tests/unit/`), sin entorno DOM (no hay happy-dom ni
> jsdom: lo visual se verifica midiendo con Playwright) · lint `bunx biome check <archivos>` · referencia
> del kit en `~/.claude/kit-reference/` (`UI-LIBRARIES.md` › shadcn, `STACK-NEXTJS.md` › Tailwind) ·
> Next 16: antes de usar una API de Next, su guía en `node_modules/next/dist/docs/` (AGENTS.md) ·
> MUI 9 + Emotion siguen vivos hasta la ola 5: conviven (ver "Convivencia" en las reglas de la fase).
>
> **CI funciona otra vez** (repo público): tras el push, `gh pr checks <n> --watch` en segundo plano;
> el build de Next lo lee del CI (nadie tiene "Build local: sí" en esta ola).

## Unidades

| # | Rama | Qué | Modelo · esfuerzo | Docker | Build local | Servicios de test |
|---|---|---|---|---|---|---|
| W1 | `feat/ui-acciones` | avatar, tooltip, link, badge; migra `SegmentedToggle`, `ThemeToggle` | sonnet · medium | no | no | no |
| W2 | `feat/ui-campos` | input, textarea, label, field, select, radio-group, popover; migra `DateField`, `TimeField` | opus · medium | no | no | no |
| W3 | `feat/ui-superposiciones` | dialog (D057), sheet, alert, sonner (+ `<Toaster>` montado); migra `ConfirmDialog` | sonnet · medium | **sí** | no | no |
| W4 | `feat/ui-estados` | skeleton, progress, tabs, container, tipografía, capa de patrón, `--muted`, tamaños ≥ 1920, **mapa de íconos**; migra `EmptyState`, `Reveal`, `StepTransition` | sonnet · medium | no | no | no |

Ningún archivo está en dos unidades. Sin orden de merge obligatorio: el que mergee después hace
`git merge origin/main` y resuelve (ver "Formas compartidas" › tokens).

## Números reservados

| Unidad | Decisiones | Filas `CONTENT_CHECKLIST` | Changeset |
|---|---|---|---|
| W1 | D112–D113 | ninguna | `patch` — "Interfaz migrada a shadcn: selector segmentado y botón de modo" |
| W2 | D114–D116 | ninguna | `patch` — "Interfaz migrada a shadcn: campos de fecha y hora" |
| W3 | D117–D118 | ninguna | `patch` — "Interfaz migrada a shadcn: diálogo de confirmación" |
| W4 | D119–D121 | ninguna | `patch` — "Interfaz migrada a shadcn: estados vacíos y transiciones" |

Último ID en `origin/main`: D111; ningún PR abierto reserva IDs. Si el tuyo ya existe al mergear
`origin/main`, toma el siguiente libre y dilo en el informe. Esta ola no trae copy nuevo: si
necesitas uno, provisional y marcado, y la fila va en tu informe (no edites el checklist).

## Formas compartidas

### De la ola 1 (#58) — copiado de `context/plans/formas-compartidas-shadcn.md`

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
No existen `--muted` ni `--accent` (los añade esta ola, ver abajo).

**`components/ui/button.tsx`:** `variant` = `contained` (def.) · `outlined` · `text` · `action`
(la de `outlinedActionSx`, D084) · `plain` (IconButton sin color); `color` = `primary` (def.) ·
`secondary`; `size` = `small` · `medium` (def., ≥ 44 px) · `large` (≥ 48 px) · `icon` (40×40,
redondo); `asChild`: `<Button asChild variant="outlined" color="secondary"><Link href="/proyectos">Ver proyectos</Link></Button>`;
`type="button"` por defecto; exporta `buttonVariants` y `ButtonProps`. `button.tsx` no se edita
en esta ola: si te falta algo, va a "Primitivas que faltaron" del informe.

**Reglas:** tras `shadcn add`, el import `cn` del paquete npm se cambia a `@/lib/utils` y
`git checkout package.json bun.lock` (lo vigila `tests/unit/shadcn-config.test.ts`); el CLI corre
con `node node_modules/shadcn/dist/index.js add <x> -y` (`bunx` se cuelga); tras tocar
`tokens.ts`/`roles.ts`, `bun scripts/tokens-css.ts` (lo vigila `tests/unit/tokens-css.test.ts`).

### Nuevas de la ola 2 (fijadas aquí; nadie improvisa otras)

- **Tokens de color nuevos, con dueño único:**
  - `--accent` / `--accent-foreground` (clases `bg-accent`, `text-accent-foreground`): fondo de
    hover/resaltado de opciones de menú y celdas (el `action.hover` de MUI: claro
    `gray[900]` al 4 %, oscuro blanco al 8 %; navy: `onNavy.hover`). **Dueño: W2** (lo usa el
    `select` y el calendario de `DateField`).
  - `--muted` (clase `bg-muted`): fondo de skeleton y de pistas de progreso (el `Skeleton` de MUI:
    `text.primary` al 11 % claro, 13 % oscuro). **Dueño: W4.**
  - Los dos se añaden en `theme/roles.ts` + `scripts/tokens-css.ts` y se regeneran en
    `app/tokens.css`. Son líneas vecinas: quien mergee segundo hace `git merge origin/main`,
    se queda con ambas y corre `bun scripts/tokens-css.ts` (nunca edita `tokens.css` a mano).
  - W1 y W3 **no tocan** `tokens.ts`, `roles.ts`, `tokens-css.ts` ni `tokens.css`: lo que les
    falte va a "Tokens que faltaron" del informe (si es `--accent`/`--muted`, usa el nombre de
    clase de arriba y dilo: se resuelve al mergear W2/W4).
- **Íconos:** `lucide-react`. Tamaños por token (los fija W4 en el mapa; hasta entonces cada
  unidad usa `size-5` = 20 px, el `fontSize="small"` de MUI, y `size-6` = 24 px, el `medium`).
  `aria-hidden` en todo ícono decorativo; el nombre accesible lo lleva el botón.
- **Prop de ícono de un compuesto** (`EmptyState.icon`): tipo `ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" }>`
  — acepta un ícono de lucide **y** uno de `@mui/icons-material` mientras conviven (los
  consumidores sin migrar siguen pasando íconos MUI).
- **Compuestos con `sx` hoy:** el migrado cambia `sx` por `className?: string` (fusionado con `cn`).
  Si un consumidor sin migrar le pasa `sx`, el worker **solo** cambia esa prop en la llamada por
  las clases equivalentes (nada más del archivo) y lo lista en el PR; su prompt dice cuáles.

## Decisiones de César para esta fase

- Look igual al actual, con ajustes menores aceptados y anotados en el PR; capturas antes/después
  (main vs rama, claro y oscuro, 360 y 1280 px) de las rutas que toca.
- Íconos `lucide-react`, el equivalente más cercano.
- Servidor de desarrollo propio en el puerto del slot. Docker: solo W3 (`qa:local`).
- `QA: al final`: no hay `wave-qa`.
- El orquestador mergea los PRs de la fase (CI verde + verificación local). Tú nunca mergeas.
- Nada destructivo en la base. Ninguna migración de base de datos en esta fase.
- No toques `package.json` ni `bun.lock` (dependencias ya instaladas en la ola 1).
- Contrastes bajo AA heredados de MUI (ver "Para la ola 2" del plan): se copian tal cual; no los
  "arregles" (cambio visible que decide César). Sí lístalos si tu componente los usa.

## Simular el backend

- Sitio público y páginas sin sesión: `bun run dev -- --port <puerto>` en tu slot, log en `.qa/dev.log`.
- **Componentes que solo viven en el panel con sesión** (W1, W2, W4 sin Docker): móntalos en una
  página temporal **sin commitear** (`app/qa-<unidad>/page.tsx`, borrada antes del PR; `git status`
  limpio) junto a la versión de `main` cuando sirva, y captura ahí. Lo que solo se ve con sesión
  y datos va al "No verificado" del informe.
- **W3 (Docker: sí):** `bun run qa:local -- --port <puerto>` (Postgres + Mailpit en Docker, cuentas
  de `.env.test.local`, nunca la base real); inicia sesión con `ADMIN_EMAIL_TEST`/`ADMIN_PASSWORD_TEST`
  sin mostrar los valores. Al terminar, baja sus contenedores.
- Nada del `.qa/` de otro slot.

## Reglas de la tanda (además de `CLAUDE.md`)

Las reglas de `~/.claude/skills/orchestrate/brief-template.md` § "Batch rules" aplican tal cual
(léelas allí; son la fuente). Resumen de lo que más se olvida:

1. Lee solo `CLAUDE.md`, lo que cita tu prompt y, con `git grep`, lo demás.
2. Trabaja SOLO en tu slot; no crees worktrees, no corras `wt`, no cambies de rama.
3. No edites `CURRENT_PHASE.md` ni `CONTENT_CHECKLIST.md`; tu `PHASE_LOG/<rama-con-guiones>.md` va a la carpeta principal o en el informe.
4. Una decisión por archivo `context/decisions/D0NN-<tema>.md` dentro de tu rango (formato en `context/decisions/README.md`).
5. Changeset `.changeset/<desc>.md` con el bump y el texto de la tabla. No toques `version` ni `CHANGELOG.md`.
6. Servidor en tu puerto, log en `.qa/dev.log`; al terminar `taskkill /PID <pid> /T /F`.
7. Navegador: tu propia pestaña con `tabId`. Playwright con `node`, scripts en `.qa/`. `MSYS_NO_PATHCONV=1` para rutas en Git Bash.
8. `.env` apunta a producción: no inicies sesión ni escribas datos reales (W3 inicia sesión solo contra `qa:local`).
9. `bun run test:related` mientras trabajas; la suite completa sola, en segundo plano, a `.qa/test.log`.
10. Archivos con Read/Write/Edit; scripts en `.qa/*.mjs`.
11. `sleep` está bloqueado; lo largo en segundo plano. Buscar con `git grep`.
12. Commit al cerrar cada etapa + `wip:` cada ~20 min + `.qa/progress.md`. Push antes de los checks largos.
13. Antes del PR: typecheck, lint, tests, skill `a11y` (axe claro y oscuro, 320 px, teclado). El build lo da el CI.
14. Capturas: `.pr-shots.json` propio, `bun run shots` y luego `bun run shots:publish` (dos comandos). Antes/después: las de `main` con `bash scripts/run-on-main.sh`.
15. Sin poder preguntar: opción conservadora + "Decisión tomada / alternativa" en el PR.
16. Arregla la clase entera en la primera pasada. Prevén lo de `~/.claude/kit-reference/QA-PREVENTION.md` que aplique.
17. Copy nuevo = provisional, marcado + fila del checklist en el informe.
18. Cierre: commits convencionales en español, push, `gh pr create --body-file .qa/pr-body.md` (Write y `gh pr create` en turnos separados), `gh pr checks` en verde. Slot limpio. Nunca merge, push a `main`, force-push ni rebase (si `main` se movió: `git merge origin/main`).
19. Informe final breve: URL del PR, slot, changeset, verificado / no verificado, decisiones abiertas, acciones manuales, bugs vistos de pasada, **tokens que faltaron**, **primitivas que faltaron**, **formas compartidas que fijaste** (API de cada primitiva nueva, con un ejemplo de uso: la ola 3 la copia a su brief), PHASE_LOG si no pudiste escribirlo.
