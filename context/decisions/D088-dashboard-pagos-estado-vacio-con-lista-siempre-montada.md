# D088 · Dashboard · La lista de pagos queda siempre montada; el estado vacío es un hermano con fade · Vigente

**Decisión:** en `DashboardPayments`, el `ul` de pagos ya no se reemplaza por `EmptyState` cuando `rows` queda vacío: se mantiene montado (con `aria-hidden` si está vacío) para que las últimas filas puedan animar su salida, y el `EmptyState` aparece a su lado con fade. El cambio de filtro no re-monta el componente (no hay `loading.tsx` en `/dashboard/pagos`; solo cambian los `rows`), por eso la animación depende de `exit`/`initial` por fila y no de re-montar.
**Por qué:** si el `ul` se desmonta de golpe al pasar a vacío, la animación de salida no ocurre.
**Alternativa descartada:** envolver el ternario en otro `AnimatePresence`: complica la clave de la lista y duplica la animación de salida.
