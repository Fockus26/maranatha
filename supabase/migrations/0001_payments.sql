-- Pagos (diezmos, ofrendas y aportes a proyectos).
--
-- Dos orígenes:
--   · gateway (PayPal): el servidor crea el registro `pending` antes de
--     redirigir y lo confirma al capturar la orden / por webhook.
--   · manual (Pago Móvil, Zelle, Bancolombia, Binance, Zinli, Wally): el
--     donante reporta la referencia y un admin lo aprueba o rechaza.
--
-- RLS activado SIN políticas: nadie con la clave pública lee ni escribe.
-- Todo el acceso pasa por el servidor con la clave secreta (lib/supabase/admin.ts).

create extension if not exists pgcrypto;

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  purpose text not null check (purpose in ('diezmo', 'ofrenda', 'proyecto')),
  project_slug text,
  frequency text not null default 'once' check (frequency in ('once', 'monthly')),

  -- Monto comprometido en USD (lo que se suma al recaudado).
  amount_usd numeric(12, 2) not null check (amount_usd > 0),
  -- Monto efectivamente pagado en la moneda del método (Bs, COP, USDT, USD).
  amount_paid numeric(14, 2),
  currency text not null default 'USD' check (currency in ('USD', 'VES', 'COP', 'USDT')),
  exchange_rate numeric(14, 4),

  method text not null check (method in ('paypal', 'pagomovil', 'zelle', 'bancolombia', 'binance', 'zinli', 'wally')),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'rejected', 'cancelled')),

  donor_name text not null check (char_length(donor_name) between 1 and 120),
  donor_email text not null check (char_length(donor_email) between 3 and 254),

  -- Pagos manuales
  reference text check (reference is null or char_length(reference) between 3 and 64),
  paid_at date,
  receipt_path text,

  -- PayPal
  provider_order_id text unique,
  provider_capture_id text unique,
  provider_subscription_id text,

  confirmed_at timestamptz,
  confirmed_by text,
  notes text,

  constraint payments_project_slug_required
    check ((purpose = 'proyecto') = (project_slug is not null)),
  constraint payments_monthly_only_paypal
    check (frequency = 'once' or method = 'paypal'),
  constraint payments_manual_requires_reference
    check (method = 'paypal' or reference is not null)
);

-- Un mismo número de referencia no se puede reportar dos veces en el mismo método.
create unique index payments_method_reference_key
  on public.payments (method, reference)
  where reference is not null;

create index payments_status_created_idx on public.payments (status, created_at desc);
create index payments_project_confirmed_idx
  on public.payments (project_slug)
  where status = 'confirmed';

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger payments_set_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();

-- Suma de lo confirmado por proyecto (lo lee el sitio público vía servidor).
create or replace view public.project_raised
with (security_invoker = true) as
  select project_slug, sum(amount_usd)::numeric(12, 2) as raised_usd, count(*) as contributions
  from public.payments
  where status = 'confirmed' and project_slug is not null
  group by project_slug;

-- Planes de suscripción de PayPal por monto (se crean al vuelo y se reutilizan).
create table public.paypal_plans (
  amount_usd numeric(12, 2) primary key,
  plan_id text not null unique,
  created_at timestamptz not null default now()
);

-- Ajustes editables desde el dashboard (ej. tasa de cambio manual de respaldo).
create table public.settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.payments enable row level security;
alter table public.paypal_plans enable row level security;
alter table public.settings enable row level security;

-- Comprobantes subidos por los donantes: bucket privado (se leen con URL firmada).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('receipts', 'receipts', false, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do nothing;
