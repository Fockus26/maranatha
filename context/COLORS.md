# Colors — Iglesia Maranatha

> Fuente: `theme/tokens.ts` (escalas) y `theme/theme.ts` (roles por modo). Ratios calculados
> el 2026-09-26 con la fórmula de luminancia de WCAG 2.1.

## Light mode

| Rol | Hex | Uso | Contraste verificado contra |
|---|---|---|---|
| primary.main | `#101B45` (primary 700) | CTAs principales, títulos de marca | fondo `#F5F6FA` → 15.4:1 · blanco encima → 16.6:1 |
| secondary.main | `#B34C02` (secondary 700) | CTA de aporte, activo del navbar | fondo `#F5F6FA` → 4.9:1 · blanco encima → 5.3:1 |
| background.default | `#F5F6FA` (gray 50) | fondo de página | — |
| background.paper | `#FFFFFF` | cards, modales | — |
| text.primary | `#12131F` (gray 900) | texto | fondo → 17.1:1 |
| text.secondary | `#434A63` (gray 600) | texto secundario | fondo → 8.1:1 · paper → 8.8:1 |
| text.disabled | default de MUI | | no verificado |
| success.main | `#16B37A` | íconos y bordes de éxito | blanco encima → 2.7:1 ✗ (usar `successFilled` `#0B7A54` → 5.3:1) |
| warning.main | `#F5A524` | avisos | `#12131F` encima → 9.0:1 |
| error.main | `#C62828` (errorOnLight) | errores, helpers inválidos | paper → 5.6:1 |
| info.main | `#3B9EF5` | informativo | blanco encima → 2.8:1 ✗ |
| divider | `#CBD0E0` (gray 200) | separadores decorativos | fondo → 1.4:1 (decorativo, no borde de input) |

## Dark mode

| Rol | Hex | Uso | Contraste verificado contra |
|---|---|---|---|
| primary.main | `#5B6B9E` (primary 400) | acentos | fondo `#060A1D` → 3.8:1 ⚠ · `#12131F` encima → 3.5:1 ⚠ |
| secondary.main | `#F9750D` (secondary 500) | CTA de aporte | fondo → 7.1:1 · blanco encima → 2.8:1 ✗ |
| background.default | `#060A1D` (primary 900) | fondo de página | — |
| background.paper | `#1D2032` (gray 800) | cards, modales | — |
| text.primary | `#F5F6FA` (gray 50) | texto | fondo → 18.2:1 · paper → 14.9:1 |
| text.secondary | `#A6AEC7` (gray 300) | texto secundario | fondo → 8.9:1 · paper → 7.3:1 |
| text.disabled | default de MUI | | no verificado |
| success.main | `#16B37A` | éxito | fondo → 7.3:1 |
| warning.main | `#F5A524` | avisos | `#12131F` encima → 9.0:1 |
| error.main | `#F87171` (errorOnDark) | errores | paper → 5.8:1 · con texto encima va gray 900 |
| info.main | `#3B9EF5` | informativo | blanco encima → 2.8:1 ✗ |
| divider | `#2F3448` (gray 700) | separadores decorativos | fondo → 1.6:1 (decorativo) |

## Notas de contraste

- Naranja de marca en claro: baja a `secondary[700]` porque `#F9750D` da 2.6:1 como texto y
  2.8:1 con blanco encima (D011, D051).
- Rojo de error por modo (`errorOnLight` / `errorOnDark`): hallazgo a11y del paso de pago.
- **Pendientes de revisar** (marcados ⚠/✗ arriba, anotados en `plans/pendientes.md`):
  `primary.main` en oscuro como texto sobre el fondo (3.8:1) y su `contrastText` (3.5:1);
  `secondary.contrastText` blanco en oscuro (2.8:1); `info` con blanco (2.8:1). Hay que
  confirmar si algún componente los usa realmente así antes de cambiar tokens.
