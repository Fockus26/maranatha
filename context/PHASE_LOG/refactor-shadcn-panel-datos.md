# refactor/shadcn-panel-datos — ola 4 fase shadcn (W1) · PR #68

- 7 archivos del panel de datos sin MUI: DashboardPayments, DashboardTable, DashboardAgenda, DashboardFormDrawer (→ sheet), DashboardProjectForm, ImageUploadField, `proyectos/page.tsx`. Además ConfirmDialog sin `findMuiModalPaper`, `SkeletonFrame.module.css` borrado, ProyectosSkeleton en cliente (en main el loading de proyectos fallaba por pasar `noop` desde un Server Component).
- Decisiones D134 (sheet + ConfirmDialog), D135 (tabla: aria-sort, botones con nombre, esqueleto), D136 (pagos/agenda: dialogs, toast, Field). Changeset patch. Mergeado origin/main (#67) y usada la API nueva (color error/inherit, icon-sm, Progress color, max-w-agenda/panel).
- Medido: recorridos reales en qa:local (confirmar, rechazar con motivo, tasa; crear/editar/descartar/eliminar evento y proyecto), Tab atrapado y foco de vuelta en sheet y diálogos, DateField/TimeField dentro del sheet, toast sobre el overlay sin robar foco, axe 28/28 (320/1280, claro/oscuro; main: 10 `button-name` críticos en tarjetas móviles), medidas DOM antes/después.
- No verificado: alturas de loading.tsx (D102), "Ver comprobante" (sin comprobantes en R2 local).
