# feat/binance-pay-merchant — Binance Pay Merchant por webhook (D081)

**Qué:** Binance pasa a pasarela (como PayPal) solo con `BINANCE_PAY_API_KEY` + `BINANCE_PAY_SECRET_KEY`;
sin ellas sigue manual. Orden v3 + checkoutUrl, webhook firmado RSA-SHA256 (`PAY_SUCCESS` confirma,
`PAY_CLOSED` cancela), rutas de retorno que consultan la orden. Manual vs. pasarela = `reference` nula o no.

**Verificado:** tests unitarios (firma HMAC, verificación RSA con clave generada, mapeo de estados,
merchantTradeNo, flag de entorno), typecheck, lint, suite completa, build.

**No verificado:** contra la API real de Binance (no hay cuenta de comercio). Formato exacto de la
respuesta de `/certificates` (se aceptan objeto o arreglo, PEM o base64). Sin a11y/axe ni capturas:
la UI solo cambia textos y se ve igual mientras el flag esté apagado.

**Acciones de César:** KYB en Binance Merchant, API key, URL del webhook en el portal, aplicar
`20261019230000_binance_pay_gateway.sql`.
