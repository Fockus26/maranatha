-- Agenda de la iglesia (sección "Agenda" del home), editable desde
-- /dashboard/agenda.
--
-- Dos tipos de evento:
--   · recurring: se repite cada semana el día `weekday` (0 = domingo).
--   · one_time: una sola fecha, `event_date`.
--
-- RLS activado SIN políticas, igual que `payments`: el sitio público y el
-- dashboard leen y escriben solo por el servidor con la clave secreta.

create table public.agenda_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  kind text not null check (kind in ('recurring', 'one_time')),
  weekday smallint check (weekday between 0 and 6),
  event_date date,
  start_time time not null,

  title text not null check (char_length(title) between 1 and 120),
  location text not null check (char_length(location) between 1 and 120),

  constraint agenda_events_kind_fields check (
    (kind = 'recurring' and weekday is not null and event_date is null)
    or (kind = 'one_time' and event_date is not null and weekday is null)
  )
);

create index agenda_events_event_date_idx
  on public.agenda_events (event_date)
  where kind = 'one_time';

create trigger agenda_events_set_updated_at
  before update on public.agenda_events
  for each row execute function public.set_updated_at();

alter table public.agenda_events enable row level security;

-- Las reuniones semanales que el sitio mostraba fijas en el código, para que
-- la agenda no quede vacía al aplicar la migración. Placeholder hasta que el
-- cliente confirme horarios (CONTENT_CHECKLIST).
insert into public.agenda_events (kind, weekday, start_time, title, location) values
  ('recurring', 0, '10:00', 'Servicio Dominical', 'Templo principal'),
  ('recurring', 3, '19:00', 'Reunión de oración', 'Salón de oración'),
  ('recurring', 5, '19:00', 'Reunión de jóvenes', 'Salón de jóvenes');
