-- Correcciones de la QA funcional del flujo de pagos.

-- M1/M2 — Referencia duplicada: se compara normalizada (sin espacios, guiones,
-- puntos ni guiones bajos, en mayúsculas), y un reporte RECHAZADO ya no
-- bloquea la referencia: el donante puede corregir y volver a reportar.
alter table public.payments
  add column reference_norm text
  generated always as (upper(regexp_replace(reference, '[\s._-]', '', 'g'))) stored;

drop index if exists public.payments_method_reference_key;
create unique index payments_method_reference_norm_key
  on public.payments (method, reference_norm)
  where reference_norm is not null and status <> 'rejected';

-- A2 — Rate limit por clave (IP hasheada + acción), atómico: el lock por
-- clave serializa las peticiones concurrentes, así 12 envíos en paralelo no
-- pasan todos el conteo antes de insertar.
create table public.rate_limit_hits (
  key text not null,
  created_at timestamptz not null default now()
);
create index rate_limit_hits_key_created_idx on public.rate_limit_hits (key, created_at);
alter table public.rate_limit_hits enable row level security;

create or replace function public.hit_rate_limit(p_key text, p_max int, p_window_seconds int)
returns boolean
language plpgsql
security definer
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

-- Solo el servidor (clave secreta) puede llamarla.
revoke all on function public.hit_rate_limit(text, int, int) from public, anon, authenticated;

-- B11 — KPIs del mes en hora de Venezuela y sumados en la base (el select de
-- filas de PostgREST corta en 1000).
create or replace function public.payment_month_stats(p_tz text default 'America/Caracas')
returns table (pending_count bigint, confirmed_usd numeric, confirmed_count bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    (select count(*) from public.payments where status = 'pending' and method <> 'paypal'),
    coalesce(sum(amount_usd), 0),
    count(*)
  from public.payments
  where status = 'confirmed'
    and confirmed_at >= (date_trunc('month', now() at time zone p_tz) at time zone p_tz);
$$;

revoke all on function public.payment_month_stats(text) from public, anon, authenticated;
grant execute on function public.hit_rate_limit(text, int, int) to service_role;
grant execute on function public.payment_month_stats(text) to service_role;
