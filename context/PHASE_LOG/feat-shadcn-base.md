# feat/shadcn-base — migración MUI → shadcn, ola 1 (2026-11-20)

Unidad base, sin cambio visible. W1 en wt1 (puerto 4301). Decisiones D109–D111 (D108 lo tomó #56 en main mientras corría la ola).

- `theme/tokens.ts` → `app/tokens.css` con `bun scripts/tokens-css.ts`; test de sincronía `tests/unit/tokens-css.test.ts`. Escalas de Tailwind reseteadas a las del proyecto; breakpoints de MUI; `--spacing: 4px` (= `spacing()` de MUI) + nombres `p-xs…p-4xl`; `max-w-narrow` (token nuevo `layout.contentNarrow` 960) y `max-w-form-drawer`. Token nuevo `typography.lineHeight.button` 1.75.
- Roles por modo en `theme/roles.ts` (lo leen `getPaletteOptions` y el generador): `:root`, `[data-color-mode="dark"]`, `[data-surface="navy"]`. `layout.tsx` escribe `data-color-mode` desde el servidor. Variantes `dark:` y `navy:`.
- `components.json` (radix-nova), `lib/utils.ts` (`cn` con `extendTailwindMerge`, nombres en `theme/tailwindNames.ts`), `components/ui/button.tsx` con las variantes del MuiButton. `shadcn add` importa el paquete `cn`: se cambia a `@/lib/utils` (guard en `tests/unit/shadcn-config.test.ts`).
- Dependencias de la fase: clsx, tailwind-merge, class-variance-authority, radix-ui, lucide-react, sonner, tw-animate-css, shadcn (dev).
- Borrado `DashboardPageSkeleton.tsx` (D111). `biome.json` ignora `app/tokens.css` (generado; Biome no parsea `@theme inline reference`).

Medido: capturas de 5 rutas × claro/oscuro × 360/1280 idénticas píxel a píxel con main; `getComputedStyle(body)` igual; skip link igual; `<html data-color-mode="dark">` en el HTML del servidor con la cookie; botón vs MUI igual en reposo/hover/foco salvo formato oklab y ripple; axe sin violaciones nuevas.
