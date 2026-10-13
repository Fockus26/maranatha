-- Advisor de Supabase (function_search_path_mutable): fija el search_path del
-- trigger para que no dependa del rol que lo ejecuta.
alter function public.set_updated_at() set search_path = '';
