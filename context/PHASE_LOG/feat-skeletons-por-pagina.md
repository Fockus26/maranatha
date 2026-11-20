# feat/skeletons-por-pagina — PR #52 (tanda 2026-11-20, W1)

- Un `loading.tsx` por ruta del panel (Resumen, Proyectos, Pagos, Agenda) con esqueleto propio en `components/ui/skeletons/` (SkeletonFrame + 4 por página), reutilizando `DashboardStatBand loading` y `DashboardTable loading`; textos fijos reales.
- D102 + nota en D095. Changeset minor.
- Verificado: axe claro/oscuro sin violaciones, sin overflow 320–1280 px, tests 91/0, biome limpio.
- No verificado: comparación en vivo contra las páginas reales (requieren sesión).
- `components/ui/DashboardPageSkeleton.tsx` quedó sin uso (no borrado).
