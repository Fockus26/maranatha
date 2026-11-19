# D099 · Pagos · Sección y modal pueden montar `TitheForm` a la vez sin chocar · Aprobada

**Decisión:** la sección y el modal usan cada uno su propia instancia de `TitheForm`/`PaymentStep`, con estado independiente. No se comparte estado entre ambas; no se tocó `PaymentStep` ni `lib/payments/`.
**Por qué:** los ids de campos los genera MUI/`useId` (sin ids fijos) y PayPal y Binance Pay son redirecciones del servidor (no hay SDK ni contenedor global que cargar dos veces). El `Dialog` de MUI no monta su contenido cerrado, así que normalmente solo hay una instancia; abierto, hace focus-trap y `aria-hidden` sobre la sección.
**Alternativa descartada:** un único formulario con estado en el contexto del modal: acopla la sección al store global sin ganancia real.
