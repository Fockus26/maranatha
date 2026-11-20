# Current Phase — Iglesia Maranatha

> **Tablero, no diario.** ≤ 60 líneas / 4 KB. Solo lo abierto, lo que bloquea y lo que sigue.
> Lo cerrado va a `PHASE_LOG/<rama>.md`. Al cerrar: `wc -c context/CURRENT_PHASE.md` → si pasa de 4000, podar.

## Ahora

**Fase:** 08–09 — Pulido y salida a producción · **Track:** Producto
**Ola:** — (esta fase no se hace en olas)

| Unidad | Rama | Estado | Log |
|---|---|---|---|
| Versión (changesets de la tanda 2026-11-19 y anteriores) | `changeset-release/main` | PR #46 — lo mergea César | — |
| W1 skeleton por página (tanda 2026-11-20) | `feat/skeletons-por-pagina` | PR #52 — mergeado | `PHASE_LOG/feat-skeletons-por-pagina.md` |
| W2 caché del panel | `feat/cache-panel` | PR #55 — mergeado | `PHASE_LOG/feat-cache-panel.md` |
| W3 separación Ofrendar | `fix/ofrendar-separacion` | PR #53 — mergeado | `PHASE_LOG/fix-ofrendar-separacion.md` |
| W4 ojo + iniciales | `feat/panel-perfil-y-contrasena` | PR #54 — mergeado | `PHASE_LOG/feat-panel-perfil-y-contrasena.md` |

Tanda 2026-11-19 cerrada (#47–#51, main @ be90296): `PHASE_LOG/tanda-2026-11-19.md`, QA en `plans/qa-tanda-2026-11-19.md`; medios y bajos en `plans/backlog.md`. Todos los PRs que listaba este tablero (#2–#33) están mergeados.

## Bloquea (acciones de César o externas)

- **GitHub Actions sin facturación**: desde 56b1cc4 ningún job arranca ("recent account payments have failed or your spending limit needs to be increased"). `main` @ fc94345 no está desplegado en maranatha.fockus.dev; CI no corrió (verificado a mano: typecheck, lint, 109 tests OK). Arreglar Billing & plans y relanzar el workflow `Deploy (VPS)` de main.

- PR #54: si las cuentas admin se llaman "Administrador", ponerles nombre y apellido (SQL en el PR) en preview y producción.

- Crear la cuenta de kevindominguez91@gmail.com (`scripts/create-admin.ts` + `ADMIN_EMAILS`); borrar `PAY_ZINLI_*`/`PAY_WALLY_*` de kit-deploy y Vercel.

- Probar en producción: login de admin, recuperación de contraseña (¿llega o cae en spam?), aprobar un pago, editar la agenda.
- Supabase: vivo y sin escrituras hasta el 2026-12-09 (rollback D082); luego borrar el proyecto y `NEXT_PUBLIC_SUPABASE_*` / `SUPABASE_SECRET_KEY` de Vercel, y `supabase/` del repo.
- Rotar la clave SMTP de Brevo (se compartió en un chat).
- Binance Pay: KYB de comercio + API key + webhook en el portal.
- GitHub › Settings › Actions › General › "Allow GitHub Actions to create and approve pull requests".
- GitHub › Settings › General › "Automatically delete head branches"; proteger `main`.
- Vercel: PayPal en sandbox (Production Branch ya es `main`, D091).
- Hosting en kit-deploy (D093) **encendido el 2026-11-19**: `main` → https://maranatha.fockus.dev (deploy ec9f0c6 sano). Falta: login de admin ahí, reporte de pago con comprobante en un preview de PR, webhook de PayPal al pasar a Live. Vercel sigue de respaldo una semana (hasta ~2026-11-26); apagarlo lo decide César.

## Sigue

- **Fase propia: migración MUI → shadcn** (decidida 2026-11-20). Planificar en otra sesión con §0 de `orchestrate` (`context/plans/orchestration-2026-11-20.md`, ola 2). Antes: `DashboardPageSkeleton.tsx` quedó sin uso (#52); token de ancho 960 (#53).

- PR `style/biome-format`: formatear con Biome, corregir los 9 errores de lint y añadir el CI (D076).
- Persistir los proyectos del dashboard en la base (Postgres, hoy en memoria, D045).
- Antes del lanzamiento: borrar de producción `admin@maranatha.test` y los 13 pagos de prueba.
- Revisar los contrastes marcados en `COLORS.md` (modo oscuro, `info`).
- Contenido real: ver `CONTENT_CHECKLIST.md`.

## Fases

| # | Fase | Estado |
|---|---|---|
| 01 | Tokens | cerrada |
| 02 | Layout base | cerrada |
| 03 | Componentes | cerrada |
| 04 | Secciones | cerrada |
| 05 | Páginas | cerrada |
| 06 | Estados | cerrada (D067) |
| 07 | Backend | parcial — pagos y auth listos; proyectos del dashboard sin persistir |
| 08 | Responsive y pulido | sin registro |
| 09 | QA final | pendiente |

<!-- Numeración según phases/ del kit actual. El código cita "fase 07/09" de una
     numeración anterior del kit: no coinciden 1 a 1. Pendientes sueltos: plans/pendientes.md. -->
