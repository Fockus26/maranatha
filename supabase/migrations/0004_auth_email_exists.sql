-- Login del dashboard: distinguir "no existe una cuenta con ese correo" de
-- "contraseña incorrecta" (pedido explícito). Solo lo usa el servidor, y solo
-- para correos que ya están en ADMIN_EMAILS: a un correo fuera de la lista se
-- le responde "sin acceso" sin consultar nada.
create or replace function public.auth_email_exists(p_email text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from auth.users where lower(email) = lower(p_email));
$$;

revoke all on function public.auth_email_exists(text) from public, anon, authenticated;
grant execute on function public.auth_email_exists(text) to service_role;
