# style/seleccion-scrollbar

**Qué:** `::selection` y barra de scroll de la adenda de diseño, desde tokens (D077).

- Tokens `selection` y `scrollbar` en `theme/tokens.ts`; estilos en `theme/globalStyles.ts` (MuiCssBaseline).
- Se quitó el scroll translúcido de `app/globals.css`.
- `data-surface="navy"` en `DashboardSidebar` y `DashboardTopbar`.
- Test `tests/unit/global-styles.test.ts`: ratios de selección (≥ 4.5) y thumb/track (≥ 3) por modo.

**Verificado:** typecheck, Biome en los archivos tocados, suite completa (16), build; CSS serializado con Emotion revisado.
**No verificado:** en navegador (sin servidor corriendo; lo levanta César), capturas y axe.
**Pendiente a vigilar:** con `scrollbar-gutter: stable`, que el bloqueo de scroll de los modales MUI no duplique el hueco del riel.
