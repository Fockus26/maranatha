-- Lo que Drizzle no modela, traído de supabase/migrations/ (D082): el trigger
-- de updated_at, la vista de recaudado, el rate limit atómico y los KPIs del
-- mes. Sin grants a anon/authenticated/service_role: aquí hay un solo rol, el
-- de la app, dueño de todo.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
--> statement-breakpoint
create trigger payments_set_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();
--> statement-breakpoint
create trigger agenda_events_set_updated_at
  before update on public.agenda_events
  for each row execute function public.set_updated_at();
--> statement-breakpoint

-- Suma de lo confirmado por proyecto (lo lee el sitio público vía servidor).
create or replace view public.project_raised as
  select project_slug, sum(amount_usd)::numeric(12, 2) as raised_usd, count(*) as contributions
  from public.payments
  where status = 'confirmed' and project_slug is not null
  group by project_slug;
--> statement-breakpoint

-- Rate limit por clave (IP o correo hasheado + acción), atómico: el lock por
-- clave serializa las peticiones concurrentes. El advisory lock es de
-- transacción, así que funciona detrás de PgBouncer en modo transacción.
create or replace function public.hit_rate_limit(p_key text, p_max int, p_window_seconds int)
returns boolean
language plpgsql
set search_path = ''
as $$
declare
  hits int;
begin
  perform pg_advisory_xact_lock(hashtext(p_key));
  delete from public.rate_limit_hits
    where key = p_key and created_at < now() - make_interval(secs => p_window_seconds);
  select count(*) into hits from public.rate_limit_hits where key = p_key;
  if hits >= p_max then
    return false;
  end if;
  insert into public.rate_limit_hits (key) values (p_key);
  return true;
end;
$$;
--> statement-breakpoint

-- KPIs del mes en hora de Venezuela, sumados en la base. Pendientes = solo
-- los manuales (con referencia): los de pasarela se resuelven solos (D081).
create or replace function public.payment_month_stats(p_tz text default 'America/Caracas')
returns table (pending_count bigint, confirmed_usd numeric, confirmed_count bigint)
language sql
stable
set search_path = ''
as $$
  select
    (select count(*) from public.payments where status = 'pending' and reference is not null),
    coalesce(sum(amount_usd), 0),
    count(*)
  from public.payments
  where status = 'confirmed'
    and confirmed_at >= (date_trunc('month', now() at time zone p_tz) at time zone p_tz);
$$;
