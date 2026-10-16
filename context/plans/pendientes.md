# Pendientes

Sueltos que no son de la unidad en curso. Uno por bloque: qué, por qué, cuándo.

## Persistir proyectos del dashboard (D045)
- **Qué:** tabla de proyectos en Supabase + Server Actions; `lib/projectsData.ts` deja de ser la fuente.
- **Por qué:** hoy el CRUD del panel se pierde al recargar.

## Contrastes en modo oscuro e `info`
- **Qué:** comprobar dónde se usan `primary.main` oscuro como texto, `secondary.contrastText`
  en oscuro e `info` con blanco (ver `COLORS.md`) y ajustar tokens si hace falta.
- **Por qué:** los ratios calculados no llegan a AA.

## Componentes sin uso
- **Qué:** decidir si se borran `AgendaItem`, `TimelineZigzagItem`, `DashboardSidebar`,
  `sections/Projects.tsx`, `sections/Tithe.tsx`.
- **Por qué:** ruido para quien busca qué componente reutilizar.

## Del kit 3.3.0 (actualización a 3.5.0)

Unidades de diseño + implementación (fase 06 / 02), una por línea. No se hicieron en el PR del kit.

- [ ] Pantalla 404 (`app/not-found.tsx`): con sesión de admin / invitado — `reference/STATUS-SCREENS.md`
- [ ] Pantalla 500 (`app/error.tsx` + `app/global-error.tsx`): con / sin código de error
- [ ] Estado sin conexión y error de red
- [ ] Mantenimiento (con / sin hora) — solo si César lo quiere (`MAINTENANCE_MODE`)
- [ ] Color de selección `::selection` como token, claro y oscuro, con contraste verificado (fase 02)
- [ ] Logo provisional (Claude Design) hasta que el cliente entregue el suyo; luego icono, favicon, apple icon y OG desde ese logo
- [ ] Scrollbar con los colores del sistema, claro y oscuro (fase 02)
