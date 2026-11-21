# D137 · Tokens · Texto 12.5–58 px, interlineados, `tracking-*` y anchos `agenda`/`panel`/`reading` · Implementado

**Decisión:** `theme/tokens.ts` suma, y `bun scripts/tokens-css.ts` genera en `app/tokens.css`:
- `fontScale`: 12.5, 13.5, 36, 38, 44, 52, 58 → `text-12.5` … `text-58` (sin interlineado propio, como `text-13`).
- `typography.lineHeight`: `tight` 1.15, `snug` 1.3, `normal` 1.4, `relaxed` 1.65 → `leading-*`.
- `typography.letterSpacing` (nuevo): `tighter` −0.02em, `tight` −0.01em, `wide` 0.02em, `wider` 0.03em, `wide-4`, `wide-5`, `wide-6` (0.04/0.05/0.06em), `caps` 0.08em, `eyebrow` 0.14em, `eyebrow-lg` 0.18em → `tracking-*`. Se resetea `--tracking-*` (los de Tailwind valen −0.05/−0.025/0.025/0.05/0.1em y ya no existen; ningún archivo usaba `tracking-tight/wide/…` por defecto, comprobado con `git grep`).
- Anchos: `layout.agenda` 1000 px (`max-w-agenda`), `layout.panel` 1400 px (`max-w-panel`), `readingMeasure` "70ch" (`max-w-reading`; `CONTAINERS` admite valores en texto). **El brief pedía `max-w-prose`, pero el `max-w-prose` estático de Tailwind (65ch) gana a `--container-prose`**: medido en `/proyectos/<slug>` (756 px → 702 px a 1280); por eso se llama `reading`.
- `lib/utils.ts` (`cn`) registra `tracking`; `tests/unit/tokens-css.test.ts` cubre contenedores, tracking y leading.
Los 13 `tracking-[0.18em]`, los 13 `tracking-[-0.01em]`, `text-[38px]`… y los `max-w-[1400px]` de `components/` y `app/` pasan a estos nombres sin cambio de valor computado.
**Por qué:** eran literales repetidos o con nombre de diseño (ola 3, "Tokens que faltaron"); con nombre, la ola 5 y W1 los usan sin `[…]`.
**Alternativa descartada:** dejar vivos los `tracking-*` de Tailwind: sus valores no son los del sitio y `tracking-tight` (−0.025em) se confundiría con el nuestro (−0.01em). `text-white/55` de `DashboardStatBand` no se tokeniza: el `onNavy` más cercano (`subtle`, 65 %) es otro valor visible; se deja y se anota.
