# D075 · Auth · Login con errores específicos solo para ADMIN_EMAILS + rate limit propio · Implementado

**Decisión:** el login distingue "sin acceso", "no existe una cuenta", "contraseña incorrecta" y "correo sin confirmar". La distinción cuenta/contraseña solo existe para correos de `ADMIN_EMAILS`; a los demás solo "sin acceso", sin consultar nada. Rate limit propio de 10 intentos / 15 min por IP. Usa la función SQL `auth_email_exists` (migración 0004, solo `service_role`).
**Por qué:** pedido explícito de mensajes claros, sin convertir el formulario en un oráculo de cuentas. El rate limit de Supabase Auth se aplica a la IP del servidor, no a la del atacante.
**Nota de estado:** Implementado (PR #1)
