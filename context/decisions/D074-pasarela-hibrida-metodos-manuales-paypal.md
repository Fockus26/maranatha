# D074 · Pagos · Pasarela híbrida: métodos manuales con comprobante + PayPal único y mensual · Implementado

**Decisión:** métodos manuales (Pago Móvil, Zelle, Bancolombia, Binance, Zinli, Wally) que el donante reporta con comprobante y un admin aprueba, más PayPal (pago único y suscripción mensual, confirmados por retorno + webhook). Un método sin sus variables `PAY_*` / `PAYPAL_*` no se ofrece. Lo recaudado en proyectos suma solo pagos confirmados.
**Por qué:** los donantes están en Venezuela, Colombia y el exterior; ninguna pasarela única cubre a todos.
**Nota de estado:** Implementado (bloque `feat/payments`)
