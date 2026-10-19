# feat/agenda-dashboard — Agenda editable desde el dashboard (D080)

**Qué:** tabla `agenda_events` (migración `20261019210000_agenda_events.sql`, con semilla de 3 reuniones),
`lib/agenda/` (schema, repository, monthly), Server Actions `app/actions/adminAgenda.ts`,
página `/dashboard/agenda` (`components/ui/DashboardAgenda.tsx`), ítem "Agenda" en el topbar,
y la sección Agenda del home leyendo de Supabase con respaldo.

**Verificado:** typecheck, tests (33, 7 nuevos de agenda), build, Biome en los archivos nuevos.
El build sin la tabla cae en el respaldo (log `[agenda] getPublicAgendaEvents`).

**No verificado:** axe y capturas (sin servidor corriendo); CRUD contra base real/local.

**Pendiente de César:** aplicar la migración en Supabase.
