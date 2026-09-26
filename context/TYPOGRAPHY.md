# Typography — Iglesia Maranatha

> Fuente: `theme/fonts.ts` y `typography` en `theme/tokens.ts`.

## Familias

- Heading: **Sora** (`--font-heading`) — 600 / 700 / 800
- Body: **IBM Plex Sans** (`--font-body`) — 400 / 500

Ambas con `next/font/google`, `display: swap`, subset latin.

## Escala (mobile-first)

El tamaño mobile aplica por debajo de `sm` (600px); desde `sm` va el de desktop.

| Nivel | Variante MUI | xs (< 600px) | ≥ 600px | Peso | Line-height |
|---|---|---|---|---|---|
| h1 | `h1` | 36px | 60px | 800 | 1.1 |
| h2 | `h2` | 28px | 44px | 700 | 1.15 |
| h3 | `h3` | 22px | 30px | 600 | 1.2 |
| h4 | `h4` | 18px | 22px | 600 | 1.25 |
| body grande | `body1` | 18px | 18px | 400 | 1.6 |
| body | `body2` | 16px | 16px | 400 | 1.6 |
| small / caption | `caption` | 14px | 14px | 400 | 1.5 |
| botón | `button` | hereda | hereda | 500 | — (sin mayúsculas) |

## Reglas

- Todo tamaño de fuente que no esté en esta tabla es una decisión nueva — regístrala en
  `decisions/` antes de usarla.
- Campos de formularios compactos (pago, login, tasas): `SMALL_FIELD_SX` de
  `theme/fieldStyles.ts` (14px en label y root, para que el hueco del label cuadre).
- Botones sin `text-transform`.
