# D124 · Componentes · `Logo` sin `sx`: `className`, `size` numérico o `{ xs, sm }` por variables CSS y `dark:` en lugar de `useTheme` · Implementado

**Decisión:** `Logo` pierde `sx` y `useTheme`; gana `className`. Conserva `variant` (`horizontal | compact | mark | responsive`), `tone` y `size` como `number | { xs: number; sm: number }` (sin `ResponsiveStyleValue`). El tamaño y las proporciones por breakpoint (separación, tamaño del nombre) viajan como variables CSS en línea (`--logo-size-xs/sm`, `--logo-gap-*`, `--logo-name-*`) que leen clases `sm:`; el color del texto y el símbolo `-inverse` siguen `tone="inverse"` o la variante `dark:` (el modo llega del servidor). Los consumidores de otra unidad que pasaban `sx` (`DashboardTopbar`, 2 usos) se adaptan en W4 envolviendo el logo en un `<span>`.
**Por qué:** una sola API sin MUI para los 8 usos; el modo por CSS evita parpadeo de hidratación.
**Alternativa descartada:** aceptar `sx` hasta la ola 5 (mantiene a MUI en la marca).
