# D113 · Componentes · `ThemeToggle` y `SegmentedToggle` sin MUI; el toggle de modo trae la variante `navy:` · Implementado

**Decisión:**
- **`ThemeToggle`** usa `Button variant="plain" size="icon"` y los íconos lucide `Moon`/`Sun` (20 px; 24 px con `size="large"`). Props: `size` (`small` | `medium` | `large`) y `className` (en lugar de `sx`). Conserva el área táctil de 44 px, el radio `xl`, el giro de 20° al hover (D067; ahora también se anula con `prefers-reduced-motion`) y el color `muted-foreground`. Sobre `data-surface="navy"` (D025) pone solo `navy:text-on-navy-muted navy:hover:bg-on-navy-hover navy:hover:text-on-navy`, así que `DashboardSidebar` y `DashboardTopbar` llaman `<ThemeToggle size="small" />` sin clases (ya están dentro de `data-surface="navy"`).
- **`MobileMenuOverlay`** no es una superficie navy fija (sigue el modo): su llamada pasa `hover:bg-accent hover:text-foreground dark:text-on-navy-muted dark:hover:text-on-navy`; el hover lo da `hover:bg-accent` (claro 4 %, oscuro 8 %).
- **`SegmentedToggle`**: `div role="radiogroup"` + `button role="radio"` con `aria-checked` y roving tabindex, flechas que mueven la selección y el indicador deslizante (`layoutId`) de framer-motion, todo igual. Sin Radix (un toggle group de Radix expone `toolbar`/`group`). Con `prefers-reduced-motion` el indicador salta sin deslizar (`useHydratedReducedMotion`). `p-0.75`/`gap-0.5` = los 3 px / 2 px de antes en la escala de 4 px.

**Por qué:** la API pública no cambia (`TitheForm` no se toca); la semántica de radio se mide en el DOM.
**Alternativa descartada:** pasar las clases navy desde cada llamada (3 sitios con clases casi idénticas) — la variante `navy:` dentro del toggle lo resuelve donde ya existe el contexto.
