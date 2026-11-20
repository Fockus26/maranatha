# D103 · Datos · Caché del router del cliente: `staleTimes` dynamic 30 s / static 180 s, invalidada por `revalidatePath` · Implementado

**Decisión:** `experimental.staleTimes: { dynamic: 30, static: 180 }` en `next.config.ts`
(sigue bajo `experimental` en Next 16, doc instalada `05-config/01-next-config-js/staleTimes.md`).
Volver a una página o a un filtro del panel (`/dashboard/pagos?estado=…`, `/dashboard/agenda`)
visitado hace menos de 30 s se sirve de la caché del navegador: sin request RSC ni skeleton.
Los `Link` de filtros y paginación mantienen el prefetch por defecto (sin `prefetch={true}`).
**Qué la invalida:** las Server Actions del propio admin (`approvePayment`, `rejectPayment`,
`saveFallbackRates`, CRUD de agenda) llaman `revalidatePath`, que vacía la caché del router del
cliente: el cambio se ve al instante al volver a cualquier filtro. Lo que cambia por fuera
(webhooks, otro admin) no la vacía: lo cubre el chequeo de versión de D104.
**Por qué:** en Next 15+ `dynamic` vale 0 por defecto y cada vuelta recargaba el listado completo.
30 s cubre el ir y venir "de manera seguida" entre filtros (medido en el PR); más tiempo
alargaría la ventana en la que una página cacheada se muestra antes de que D104 la corrija.
**Alternativa descartada:** `cacheComponents` (cambia el modelo de render de toda la app);
`prefetch={true}` en los 5 filtros (carga 5 listados por visita).
