SET local check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.auth_email_exists (
  p_email text
)
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  select exists (select 1 from auth.users where lower(email) = lower(p_email));
$function$;

