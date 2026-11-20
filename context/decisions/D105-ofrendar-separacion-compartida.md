# D105 · UI · La sección Ofrendar y el modal comparten la fila texto + formulario · Aprobada

**Decisión:** `components/ui/TitheLayout.tsx` contiene la fila (centrada, `maxWidth` 960, `gap` { xs: 6, md: 10 }) con la columna de texto (480) y la del formulario (440). La sección del inicio y `TitheModal` la usan; cada una pasa su propio texto y formulario (copy y estado sin cambios, D099).
**Por qué:** la sección usaba `space-between` en 1200 px y dejaba el texto y el formulario en los extremos; el modal ya tenía la separación buscada. Un solo componente evita que vuelvan a divergir.
**Sin token:** 960 queda como constante con nombre dentro del componente; no se creó token nuevo.
