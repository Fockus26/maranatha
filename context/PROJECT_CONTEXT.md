# Project Context — Iglesia Maranatha

> Reconstruido el 2026-09-26 a partir del código (el registro original de la entrevista no
> se conservó). Lo que no se pudo deducir del código dice `PENDIENTE` y tiene su fila en
> `CONTENT_CHECKLIST.md`.

## Resumen

Sitio de la Iglesia Maranatha para que miembros y visitantes conozcan la iglesia (áreas de
servicio, liderazgo, prédicas, agenda, historia, proyectos) y puedan diezmar o aportar a
proyectos en línea. Incluye un panel privado para aprobar pagos y gestionar proyectos.

## Tipo de proyecto

Sitio institucional + dashboard/app (pagos y panel de administración).

## Negocio

- **Qué hace:** iglesia cristiana con varias áreas de servicio y tres cuentas de Instagram
  (Maranatha, Evangelio, JEF).
- **Qué debe lograr el sitio:** informar (reuniones, agenda, prédicas) y recibir aportes.
- **Acción principal:** aportar — diezmo/ofrenda (modal global) o aporte a un proyecto.

## Público objetivo

Miembros de la congregación (aportan, siguen la agenda y las prédicas) y visitantes que
buscan conocer la iglesia y dónde/cuándo se reúne. Donantes en Venezuela, Colombia y el
exterior (de ahí la mezcla de métodos de pago).

## Tono de marca

PENDIENTE (no quedó registrado). Lo que muestra el sitio: "comunidad de fe y propósito".

**No debe parecer:** PENDIENTE.

## Idioma y mercado

- Idioma: español
- País / locale: Venezuela · `es_VE` (`lib/siteConfig.ts`)
- Monedas: USD y USDT (base), VES y COP convertidas con DolarApi + tasa de respaldo

## Referencias visuales

PENDIENTE (no quedó registrado).

## Restricciones de marca

- **Logo:** íconos generados en `app/icon.tsx` / `apple-icon.tsx`; logo definitivo PENDIENTE.
- **Colores:** navy (`primary`) y naranja (`secondary` `#F9750D`) — ver `COLORS.md`.
- **Tipografía:** Sora (títulos) + IBM Plex Sans (texto) — ver `TYPOGRAPHY.md`.

## Stack técnico

- Framework: Next.js 16 (App Router), React 19 + React Compiler
- Lenguaje: TypeScript estricto
- Componentes: MUI 9 (+ Emotion) — theming claro/oscuro completo y componentes accesibles
- Estilos: `sx`/`styled` de MUI con `theme/tokens.ts`. Tailwind 4 está instalado
  (`app/globals.css`) pero no es el sistema de estilos: no se usa en código nuevo.
- Animación: framer-motion (`Reveal`, `PageTransition`), respetando reduced-motion
- Gestor de paquetes: **bun**
- Documentación: **Context7** antes de usar la API de cualquier librería
- Base de datos: Supabase Postgres (`supabase/migrations/`), cliente admin solo en servidor
- Autenticación: Supabase Auth, solo para el dashboard; acceso por lista `ADMIN_EMAILS`
- Pagos: métodos manuales reportados con comprobante (Pago Móvil, Zelle, Bancolombia, Binance,
  Zinli, Wally) + PayPal (orden única y suscripción mensual, con webhook)
- Datos externos: YouTube (prédicas), Behold.so (feeds de Instagram), DolarApi (tasas)
- Correo: N/A
- Analítica: `@vercel/analytics` solo en Vercel
- Despliegue: Vercel = pruebas (rama `vercel`); VPS Hetzner con Docker + Caddy = producción
  (rama `vps`). Ver `deploy/README.md`.
- Dominio: PENDIENTE

## Alcance de páginas

| Página | Ruta | Prioridad v1 |
|---|---|---|
| Home | `/` | alta |
| Proyectos | `/proyectos` | alta |
| Detalle de proyecto | `/proyectos/[slug]` | alta |
| Resultado de pago | `/pago/resultado` | alta |
| Dashboard: login | `/dashboard/login` | alta |
| Dashboard: resumen, proyectos, pagos | `/dashboard`, `/dashboard/proyectos`, `/dashboard/pagos` | alta |
| Historia | `/historia` | removida: redirige a `/` |

## Funcionalidad más allá de lo estático

- [x] Autenticación (solo administradores del dashboard)
- [ ] Persistencia de datos de usuario
- [x] Pagos
- [ ] Carrito / checkout (no aplica: aportes directos)
- [x] Dashboard (proyectos todavía en memoria, D045)
- [x] Formularios con envío real (reporte de pago con comprobante)
- [ ] CMS / blog
- [ ] Buscador
- [ ] Multi-idioma
- [ ] Correos que manda la app (no aplica, ver § "Correos")

## Repo y despliegue

- Repo: https://github.com/Fockus26/maranatha (`delete_branch_on_merge` activo; `main` sin protección de rama)
- Vercel: hoy el único despliegue, publica la rama `vercel` (no indexable, D073); sin `.vercel/` enlazado en local
- Producción: VPS Hetzner con Docker, rama `vps` (D071, D072), previsto pero aún sin uso · Previews: los de Vercel
- Mantenimiento: no aplica (no hay página de mantenimiento)
- Secretos duplicados en GitHub (se reponen si cambian en Vercel): `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY` (`deploy-vps.yml`)

## Assets de marca

| Pieza | Estado | Dónde / nota |
|---|---|---|
| Logo | lo tiene el cliente, aún no lo entrega | provisional de Claude Design mientras tanto (fila en CONTENT_CHECKLIST) |
| Icono / isotipo | provisional, generado en código | `app/icon.tsx` (monograma sobre navy) |
| Favicon | existe | `app/favicon.ico` |
| Apple touch icon | existe, generado en código | `app/apple-icon.tsx` |
| Imagen Open Graph | existe, generada en código | `app/opengraph-image.tsx` |

Detalle de tamaños y archivos: `reference/BRAND-ASSETS.md` del kit.

## Correos

No aplica: la app no manda correos. Las cuentas del dashboard se crean a mano en Supabase y el
login es con contraseña, sin recuperación por correo. Si eso cambia, se diseña entonces
(`reference/EMAIL-TEMPLATES.md` del kit).

## Track de fases

**Producto** — Razón: además del sitio hay auth, pagos con persistencia y un panel de
administración.

## Modo de trabajo

- Dark mode: sí — toggle con cookie (D053); algunas piezas son navy fijo a propósito (D025)
- Rama madre: no, las unidades salen de `main` — ver `GIT_STATE.md`

## Particularidades

- El dashboard puede servirse desde un subdominio (`ADMIN_HOST`, `proxy.ts`).
- Límite de body de Server Actions 4.5 MB (comprobantes de hasta 4 MB); en el VPS el proxy
  acepta 6 MB (`deploy/Caddyfile`).
- La tasa VES/COP viene de DolarApi; si falla, se usa la de respaldo guardada por el admin.
