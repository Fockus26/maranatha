# D135 · Componentes · Tabla de proyectos del panel: orden con `aria-sort`, botones de ícono con nombre y esqueleto de shadcn · Implementado

**Decisión:**
- `DashboardTable` deja MUI (API sin cambios: `projects`, `onEdit`, `onDelete`, `loading`, `onCreate`). Sigue siendo una grilla CSS con `role="table"/"row"/"cell"` (D052).
- Orden: `TableSortLabel` → un `<button>` dentro de cada `role="columnheader"`, que lleva `aria-sort="ascending|descending"` solo en la columna activa. Flecha lucide `ArrowUp` (asc) / `ArrowDown` (desc), visible en la activa y al 50 % al pasar el ratón o con foco en las demás (como MUI).
- Botones Editar / Eliminar de 32 px con borde (`Button variant="plain" size="icon"` + `size-8 p-1.25`, el `IconButton size="small"` de MUI con borde) y `aria-label` "Editar …" / "Eliminar …" **también en las tarjetas de móvil**: en `main` no tenían nombre (10 botones sin nombre a 360 px; crítico `button-name` de axe en `/dashboard/proyectos` a 320 px).
- `LinearProgress` → `Progress` (pista `bg-accent`, 5 px, `color="success"`/`"secondary"` de D139).
- `Skeleton` de MUI → `Skeleton` de shadcn con las mismas medidas (las líneas de texto con `scale-y-60`, como `SkeletonLine`, D133). `SkeletonFrame.module.css` se borra: ya no hay `Skeleton` de MUI que pausar con "reducir movimiento".
- `/dashboard/proyectos`: `DASHBOARD_CONTENT_CLASS`; el buscador recibe `aria-label="Buscar proyecto"` y anillo de foco (D085) en su contenedor: antes no tenía nombre y su `outline: none` lo dejaba sin foco visible.

**Por qué:** WCAG 4.1.2 (nombre de los botones) y 2.4.7 (foco visible) ganan a "look igual"; el resto replica las medidas de MUI (alturas de fila y de esqueleto medidas antes/después en el PR).
**Alternativa descartada:** `<table>` nativa: rompe la animación de filas de D052.
