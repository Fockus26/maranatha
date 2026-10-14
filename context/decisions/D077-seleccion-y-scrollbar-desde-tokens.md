# D077 · Tema · `::selection` y barra de scroll con tokens propios, por MuiCssBaseline · Implementado

**Decisión:** la selección de texto y la barra de scroll salen de dos tokens nuevos (`selection`, `scrollbar` en `theme/tokens.ts`, roles sobre escalas existentes) y se aplican en `theme/globalStyles.ts` vía `MuiCssBaseline`. Reemplaza el scroll translúcido de `globals.css`. Selección: claro `secondary[200]`/`gray[900]` (11.8:1), oscuro y navy `secondary[800]`/blanco (7.8:1). Scroll: riel 12 px página / 8 px cajas, thumb ≥ 3:1 sobre el track en reposo, hover y activo; `scrollbar-gutter: stable`.
**Por qué:** adenda de diseño (selección sin definir en `COLORS.md`; el thumb anterior, `rgba(...,0.18)` sobre track transparente, no llegaba a 3:1). En CSS plano no se pueden leer los tokens.
**Detalle:** las piezas navy fijas (D025) llevan `data-surface="navy"` y redefinen `--sb-*` y la selección. Firefox usa `scrollbar-color`/`scrollbar-width` dentro de `@supports not selector(::-webkit-scrollbar)` (Chrome 121+ ignora las -webkit si ve las estándar). En `forced-colors` no se pinta nada.
**Nota de estado:** Implementado (`style/seleccion-scrollbar`)
