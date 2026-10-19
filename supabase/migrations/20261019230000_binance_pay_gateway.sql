-- Binance Pay Merchant como pasarela (mismo método `binance`, sin referencia).
--
-- Con credenciales de comercio (`BINANCE_PAY_*`) el servidor crea el pago
-- `pending` antes de redirigir a Binance Pay y el webhook lo confirma, igual
-- que PayPal: no hay referencia que reportar. Sin credenciales, Binance sigue
-- siendo manual (el donante reporta el ID de la orden, con fecha de pago).
--
-- Regla que distingue los dos orígenes en todo el sistema: manual = con
-- `reference`; pasarela = sin ella.

alter table public.payments
  drop constraint payments_manual_requires_reference;
alter table public.payments
  add constraint payments_manual_requires_reference
  check (
    method = 'paypal'
    or reference is not null
    -- Binance por pasarela: sin referencia ni fecha reportada por el donante.
    or (method = 'binance' and paid_at is null)
  );

-- KPI "pendientes por revisar": solo los manuales (los de pasarela se
-- resuelven solos). Antes: `method <> 'paypal'`.
create or replace function public.payment_month_stats(p_tz text default 'America/Caracas')
returns table (pending_count bigint, confirmed_usd numeric, confirmed_count bigint)
language sql
stable
security invoker
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
