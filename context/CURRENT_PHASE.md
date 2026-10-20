# Current Phase — Iglesia Maranatha

> **Tablero, no diario.** ≤ 60 líneas / 4 KB. Solo lo abierto, lo que bloquea y lo que sigue.
> Lo cerrado va a `PHASE_LOG/<rama>.md`. Al cerrar: `wc -c context/CURRENT_PHASE.md` → si pasa de 4000, podar.

## Ahora

**Fase:** 08–09 — Pulido y salida a producción · **Track:** Producto
**Ola:** — (esta fase no se hace en olas)

| Unidad | Rama | Estado | Log |
|---|---|---|---|
| QA agenda/pagos/Binance · hallazgos | `fix/qa-agenda-binance` | PR #20 en revisión | `PHASE_LOG/fix-qa-agenda-binance.md` |
| QA pagos · 6 hallazgos medios | `fix/qa-pagos` | mergeada (PR #16) | `PHASE_LOG/fix-qa-pagos.md` |
| Binance Pay Merchant por webhook (D081) | `feat/binance-pay-merchant` | PR en revisión | `PHASE_LOG/feat-binance-pay-merchant.md` |
| Agenda editable desde el dashboard (D080) | `feat/agenda-dashboard` | PR en revisión | `PHASE_LOG/feat-agenda-dashboard.md` |
| Adenda · pantallas de estado (D079) | `feat/pantallas-estado` | PR en revisión (apilado sobre marca) | `PHASE_LOG/feat-pantallas-estado.md` |
| Adenda · marca provisional (D078) | `feat/marca-provisional` | PR en revisión | `PHASE_LOG/feat-marca-provisional.md` |
| Adenda · selección y scrollbar (D077) | `style/seleccion-scrollbar` | PR en revisión | `PHASE_LOG/style-seleccion-scrollbar.md` |
| Login amplio + motivo de rechazo centrado | `fix/ui-login-rechazo` | PR #4 en revisión | — |
| Adoptar kit v3 (Changesets, modo pr, context) | `chore/kit-changesets-context` | PR en revisión | `PHASE_LOG/chore-kit-changesets-context.md` |
| Feedback de UI en pagos y login | `fix/ui-feedback-pagos` | mergeada (PR #1) | `PHASE_LOG/fix-ui-feedback-pagos.md` |
| Deploy doble Vercel + VPS | `chore/deploy-setup` | mergeada (local) | `PHASE_LOG/chore-deploy-setup.md` |

## Bloquea (acciones de César o externas)

- Aplicar `supabase/migrations/20261019210000_agenda_events.sql` (agenda).
- Binance Pay: KYB de comercio + API key + webhook en el portal; aplicar `20261019230000_binance_pay_gateway.sql`.
- Aplicar `supabase/migrations/0004_auth_email_exists.sql` en Supabase (si no se hizo).
- GitHub › Settings › Actions › General › "Allow GitHub Actions to create and approve pull requests".
- GitHub › Settings › General › "Automatically delete head branches"; proteger `main`.
- Vercel: rama de producción = `vercel`, PayPal en sandbox.
- VPS: configuración inicial pendiente (`deploy/README.md` §2–4).

## Sigue

- PR `style/biome-format`: formatear con Biome, corregir los 9 errores de lint y añadir el CI (D076).
- Persistir los proyectos del dashboard en Supabase (hoy en memoria, D045).
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
