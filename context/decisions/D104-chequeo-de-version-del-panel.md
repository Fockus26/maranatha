# D104 · Datos · Chequeo de versión del panel (count + max(updated_at)) al montar, foco y visibilidad, máx. 1 cada 15 s · Implementado

**Decisión:** `components/ui/PanelFreshness.tsx` (en `DashboardPayments` y `DashboardAgenda`)
compara la versión con la que se renderizó la página contra la del servidor
(`app/actions/panelVersion.ts` → `getPanelVersion(scope)`, con `getAdminStrict()`) al montarse,
en `focus` y en `visibilitychange` → visible; si difiere, `router.refresh()`. La lógica es pura
en `lib/panelFreshness.ts` (tests en `tests/unit/panel-freshness.test.ts`).
- **Versión:** una sola query por scope. Pagos: `count(*)` + `max(updated_at)` de `payments` +
  `max(updated_at)` de `settings` (tasas de respaldo). Agenda: `count(*)` + `max(updated_at)` de
  `agenda_events`. `updated_at` lo mueven los triggers `*_set_updated_at`. Altas y cambios mueven
  el max; bajas mueven el count. El token es opaco; `at` (reloj del servidor) ordena versiones.
- **Orden:** la página lee la versión antes que los datos (no en el mismo `Promise.all`): si algo
  cambia entre las dos lecturas, la versión queda más vieja que los datos (a lo sumo un refresco
  de más), nunca al revés.
- **Throttle:** lo último sabido vive por scope en memoria del módulo; no se consulta si se supo
  hace < 15 s (reloj del navegador), tampoco tras un fallo. Una página más nueva que lo sabido
  (re-render tras una acción del propio admin) pasa a ser lo sabido: no hay ciclo de refrescos.
  Un filtro cacheado más viejo que lo sabido y con otro token se refresca sin consultar.
  Sin `setInterval`: con la pestaña quieta y visible no se consulta nada.
**Por qué:** `revalidatePath` desde un webhook (PayPal, Binance) no llega al navegador del admin;
un dato viejo en el panel es riesgo real (ver un pago como pendiente ya confirmado).
**No cubre:** un cambio que no toca `updated_at` ni el count (SQL a mano sin trigger, p. ej.
`update … set updated_at = <valor viejo>`); las tasas en vivo de DolarApi (no son datos de la
base); un cambio externo mientras el admin mira la pestaña sin cambiar de foco (se ve al
siguiente foco, navegación o recarga).
**Alternativa descartada:** polling con `setInterval` (consultas aunque nadie mire);
hash de las filas del listado (una query cara por filtro); SSE/websocket (infra nueva).
