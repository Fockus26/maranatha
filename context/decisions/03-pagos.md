# Decisiones — Pagos y dashboard

## D074 — Pasarela híbrida: métodos manuales + PayPal
**Decisión:** métodos manuales (Pago Móvil, Zelle, Bancolombia, Binance, Zinli, Wally) que el donante reporta con comprobante y un admin aprueba, más PayPal (pago único y suscripción mensual, confirmados por retorno + webhook). Un método sin sus variables `PAY_*` / `PAYPAL_*` no se ofrece. Lo recaudado en proyectos suma solo pagos confirmados.
**Por qué:** los donantes están en Venezuela, Colombia y el exterior; ninguna pasarela única cubre a todos.
**Estado:** Implementado (bloque `feat/payments`)

## D075 — Login del dashboard con errores específicos
**Decisión:** el login distingue "sin acceso", "no existe una cuenta", "contraseña incorrecta" y "correo sin confirmar". La distinción cuenta/contraseña solo existe para correos de `ADMIN_EMAILS`; a los demás solo "sin acceso", sin consultar nada. Rate limit propio de 10 intentos / 15 min por IP. Usa la función SQL `auth_email_exists` (migración 0004, solo `service_role`).
**Por qué:** pedido explícito de mensajes claros, sin convertir el formulario en un oráculo de cuentas. El rate limit de Supabase Auth se aplica a la IP del servidor, no a la del atacante.
**Estado:** Implementado (PR #1)
