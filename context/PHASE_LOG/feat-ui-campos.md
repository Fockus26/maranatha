# feat/ui-campos — ola 2 shadcn (W2) · 2026-11-20

- Primitivas `input`, `textarea`, `label`, `select`, `radio-group`, `popover` (shadcn add + tokens) y `field.tsx` propio.
- `--accent`/`--accent-foreground` (D116) en roles + tokens.css + test de contraste.
- `DateField`/`TimeField` sobre Radix Popover (D115), API sin cambios; caja de campo D114 alineada al `TextField` small (40 px, borde 23 %, radio 4, sangría 14).
- Verificado con Playwright en `/qa-w2` (temporal): teclado completo, ARIA, foco D085/D086 (forced-colors), dentro de `Dialog` y `Drawer` MUI (portal al `role="dialog"`, Escape no cierra el modal), axe claro/oscuro 1280/320.
- No verificado: flujo de diezmo real (necesita DB) y panel con sesión.
- Máquina saturada (4 workers + suites): la suite tardó 34 min con 8 timeouts de 5 s, que pasan solos.
