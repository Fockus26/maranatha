# Formas compartidas de la base shadcn (W1, PR #58) — copiar al brief de la ola 2

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
