# Design Tokens — Iglesia Maranatha

> Fuente única: `theme/tokens.ts`. Todo componente consume estos tokens en vez de valores
> sueltos. Este archivo los resume; si difiere del código, gana el código y se corrige aquí.

## Espaciado

Unidad base: 4px

| Token | Valor |
|---|---|
| spacing.xs | 4px |
| spacing.sm | 8px |
| spacing.md | 12px |
| spacing.base | 16px |
| spacing.lg | 24px |
| spacing.xl | 32px |
| spacing.2xl | 48px |
| spacing.3xl | 64px |
| spacing.4xl | 96px |

## Radios de borde

| Token | Valor | Uso |
|---|---|---|
| radius.xs | 4px | detalles pequeños |
| radius.sm | 6px | `shape.borderRadius` de MUI (inputs, botones) |
| radius.md | 8px | cards |
| radius.lg | 12px | modales, bloques destacados |
| radius.xl | 16px | superficies grandes |

## Sombras

| Token | Valor | Uso (índices de `theme.shadows`) |
|---|---|---|
| shadow.sm | `0 1px 3px rgba(6, 10, 29, 0.06)` | 1–3 |
| shadow.md | `0 2px 8px rgba(6, 10, 29, 0.08)` | 4–8 |
| shadow.lg | `0 4px 16px rgba(6, 10, 29, 0.10)` | 9–24 |

## Z-index

| Token | Valor |
|---|---|
| base | 0 |
| navbar | 100 |
| sidebar | 200 |
| dropdown / tooltip | 300 |
| modalBackdrop | 400 |
| modal | 410 |
| toast | 500 |

## Breakpoints

Ver `DESIGN_RULES.md` — deben coincidir exactamente, este archivo no los redefine.

## Transiciones / animación

No hay tokens de movimiento en `tokens.ts`; estos son los valores en uso:

| Uso | Valor | Dónde |
|---|---|---|
| hover de botones | 150ms `ease` | `theme.ts` › MuiButton |
| aparición al hacer scroll | 700ms `cubic-bezier(0.2, 0.8, 0.2, 1)` | `components/ui/Reveal.tsx` |
| transición de página | 300ms | `components/layout/PageTransition.tsx` |
| cambio claro/oscuro | 280ms `ease` | `app/globals.css` (D067) |
| patrón diagonal | un tile de 56px en bucle | `theme/patterns.ts` |

Reveal, PageTransition, el parallax (Hero, PhotoAnchorBand), el patrón y el cambio de tema
respetan `prefers-reduced-motion`. Una animación nueva también tiene que hacerlo.
