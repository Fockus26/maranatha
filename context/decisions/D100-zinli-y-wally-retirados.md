# D100 · Pagos · Zinli y Wally se retiran: ni se ofrecen ni se aceptan; los pagos viejos se siguen mostrando · Implementado

**Decisión:** Zinli y Wally salen del catálogo (`lib/payments/methods.ts`) y de `MANUAL_METHOD_IDS`, así que
`manualReportSchema` los rechaza en el servidor (`app/actions/payments.ts`) aunque sus variables `PAY_ZINLI_*` /
`PAY_WALLY_*` sigan definidas. Se separan dos conjuntos en `lib/payments/schema.ts`: `PAYMENT_METHOD_IDS` (lo que puede
traer una fila de `payments`, igual al CHECK de la base, incluye `RETIRED_METHOD_IDS`) y `AcceptedMethodId` (lo que se
ofrece y se acepta; tipa `PaymentMethodInfo.id`). `METHOD_LABEL` conserva "Zinli" y "Wally" para los pagos viejos del
dashboard. La base **no cambia**: el CHECK `payments_method_check` se queda con los siete métodos (sin migración).
Amplía D074, que listaba los seis manuales.
**Por qué:** César: "quítame zinli y wally como métodos de pago". Puede haber pagos guardados con esos métodos; si el
tipo de lectura o el CHECK los excluyera, el dashboard mostraría filas sin etiqueta o una migración fallaría.
**Alternativa descartada:** quitarlos también del CHECK con una migración (requiere migrar o borrar filas viejas, y la
tanda no admite cambios en la base); dejarlos solo ocultos en la UI (el servidor los seguiría aceptando).
