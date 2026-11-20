# feat/cache-panel — Caché inteligente del panel (W2, tanda 2026-11-20)

- `experimental.staleTimes { dynamic: 30, static: 180 }` (D103): volver a un filtro o página del panel < 30 s no pide RSC (medido: 0 RSC, 125 ms).
- `PanelFreshness` + `getPanelVersion(scope)` (D104): count + max(updated_at) por scope, al montar / focus / visibilidad, máx. 1 consulta cada 15 s; refresca solo si cambió. Lógica pura en `lib/panelFreshness.ts` con 8 tests.
- QA con `qa:local --preview` (base local): `.qa/cache.mjs` 8/8 y `.qa/cache-agenda.mjs` OK.
- Docker: tras arrancar Docker Desktop, el primer `docker start` del contenedor de Postgres falló con "bind: acceso a un socket no permitido" (carrera); reintentado a mano funcionó. Luego Postgres tardó ~15 min en recuperarse (fsync del data dir) y `qa:local` abortó a los 5 min; segundo intento OK.
