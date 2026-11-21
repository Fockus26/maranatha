# Current Phase — Iglesia Maranatha

> **Tablero, no diario.** ≤ 60 líneas / 4 KB. Solo lo abierto, lo que bloquea y lo que sigue.
> Lo cerrado va a `PHASE_LOG/<rama>.md`. Al cerrar: `wc -c context/CURRENT_PHASE.md` → si pasa de 4000, podar.

## Ahora

**Fase:** migración MUI → shadcn **cerrada** el 2026-11-21 (D143; olas 1–5: #58–#69, main @ b245f0b) · **Track:** Producto
**Sigue:** QA de versión 09 (`design-qa` en todas las rutas, `functional-qa` en pagos y sesión) · plan: `context/plans/phase-migracion-shadcn.md` › "Después de la fase"

| Unidad | Rama | Estado | Log |
|---|---|---|---|

Ola 5 cerrada el 2026-11-21: #69 `chore/quitar-mui` (minor, D140–D143; log `PHASE_LOG/chore-quitar-mui.md`). Sin `@mui`/`@emotion` en el código; guard `tests/unit/sin-mui.test.ts`. Tras el merge: `bun install` en cada copia local.

## Bloquea (acciones de César o externas)

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

- **QA de versión 09:** `design-qa` (todas las rutas) + `functional-qa` (pagos y sesión); incluye los "Sin verificar" de la fase shadcn y las decisiones abiertas D128, D129, D132 (ver el plan). `tailwind.config.ts` sin uso: decide César.

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
