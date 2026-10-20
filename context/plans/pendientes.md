# Pendientes

Sueltos que no son de la unidad en curso. Uno por bloque: qué, por qué, cuándo.

## Persistir proyectos del dashboard (D045)
- **Qué:** tabla de proyectos en Supabase + Server Actions; `lib/projectsData.ts` deja de ser la fuente.
- **Por qué:** hoy el CRUD del panel se pierde al recargar.

## Contrastes en modo oscuro e `info`
- **Qué:** comprobar dónde se usan `primary.main` oscuro como texto, `secondary.contrastText`
  en oscuro e `info` con blanco (ver `COLORS.md`) y ajustar tokens si hace falta.
- **Por qué:** los ratios calculados no llegan a AA.

## Componentes sin uso
- **Qué:** decidir si se borran `AgendaItem`, `TimelineZigzagItem`, `DashboardSidebar`,
  `sections/Projects.tsx`, `sections/Tithe.tsx`.
- **Por qué:** ruido para quien busca qué componente reutilizar.

## Del kit 3.3.0 (actualización a 3.5.0)

Unidades de diseño + implementación (fase 06 / 02), una por línea. No se hicieron en el PR del kit.

- [ ] Pantalla 404 (`app/not-found.tsx`): con sesión de admin / invitado — `reference/STATUS-SCREENS.md`
- [ ] Pantalla 500 (`app/error.tsx` + `app/global-error.tsx`): con / sin código de error
- [ ] Estado sin conexión y error de red
- [ ] Mantenimiento (con / sin hora) — solo si César lo quiere (`MAINTENANCE_MODE`)
- [ ] Color de selección `::selection` como token, claro y oscuro, con contraste verificado (fase 02)
- [ ] Logo provisional (Claude Design) hasta que el cliente entregue el suyo; luego icono, favicon, apple icon y OG desde ese logo
- [ ] Scrollbar con los colores del sistema, claro y oscuro (fase 02)

## QA funcional de pagos y login (19-10-2026): hallazgos bajos
Los 6 medios se corrigieron en `fix/qa-pagos` (PR #16). Los bajos, uno por línea:

- [ ] Tope de 5 reportes pendientes por correo no atómico: 12 POST en paralelo crean 12 filas (`app/actions/payments.ts:141`).
- [ ] Nombres que se ven en blanco: U+3164, U+115F, U+1160, U+FFA0 y U+2800 pasan `UNSAFE_CHARS` (`lib/payments/schema.ts`).
- [ ] Correos con `<`, `>` o comillas se aceptan (`lib/validation.ts:9-10`).
- [ ] UUID inexistente o doble clic propio → "ya fue procesado por otra persona" (`mapRepoError`, `app/actions/adminPayments.ts`).
- [ ] Rechazar es irreversible; la nota acepta U+202E; nota de solo espacios se guarda como `""` en vez de `NULL`.
- [ ] Checkouts de PayPal abandonados quedan "Pendiente" para siempre en la lista (expirarlos o filtrarlos).
- [ ] Sesión revocada a mitad de una acción: vuelve al login sin mensaje y sin `next=`; un no admin en `/dashboard` no ve "tu cuenta no tiene acceso".
- [ ] Login: con un correo de más de 254 caracteres o una contraseña de 10 000 se marca en rojo el campo equivocado (`components/ui/DashboardLoginForm.tsx:30-47`).
- [ ] Cookie `sb-…-auth-token` no HttpOnly (default de `@supabase/ssr`); endurecimiento opcional.
- [ ] Voseo "Elegí un monto…" → "Elige" (`TitheForm.tsx:203`, `ProjectContributionForm.tsx:239`).
- [ ] `1e3` como **número** en el servidor sigue aceptándose (el cliente ya no lo deja escribir).

Sin verificar en la QA (requiere acciones de César): aprobar en PayPal con cuenta *buyer* de sandbox, webhook real con túnel, suscripción mensual en sandbox, `x-forwarded-for` no falsificable en Vercel y el VPS, y el conflicto de puertos con `world-flags` para `qa:local`.

## QA de main (agenda #15, pagos #16, Binance #17, PayPal sandbox), 19-10-2026
Corregidos en `fix/qa-agenda-binance` (PR #20), salvo el riesgo del 451, que es una acción de César. Detalle y capturas en `.qa/v3/` (local).

- [x] **Alto:** en el panel de agenda, una red caída o un error 500 al crear, editar o eliminar reemplaza todo el panel por la pantalla de error y se pierde lo escrito (`components/ui/DashboardAgenda.tsx:452-484`, sin try/catch). Copiar el `callAction` de `DashboardPayments.tsx`.
- [x] **Medio:** `approvePayment` por POST directo confirma un pago Binance de pasarela pendiente (`reference` nula). Hoy solo bloquea `paypal` (`app/actions/adminPayments.ts:60`).
- [x] **Medio:** una `?pagina=` fuera de rango hace que PostgREST devuelva PGRST103 y el panel muestre "No se pudieron cargar los pagos" (`lib/payments/repository.ts`). Tratarlo como página vacía con su total.
- [x] **Medio:** contraste de "PRÓXIMO EVENTO" en la celda destacada en modo claro, 3.12:1 (`components/sections/Agenda.tsx:159-162`).
- [x] **Medio:** contraste de "Ver toda la agenda (N)" en modo oscuro, 3.78:1 (`components/sections/Agenda.tsx:514-517`).
- [x] Bajo: agenda acepta fechas imposibles (`2026-02-31` da server_error) y años absurdos (1800, 3000) por POST (`lib/agenda/schema.ts`).
- [x] Bajo: Binance o PayPal con credenciales malas dejan una fila `cancelled` por intento (20 antes del rate limit).
- [x] Bajo: el webhook de Binance no revisa timestamp ni nonce, y cada POST firmado dispara una descarga del certificado si no está en caché.
- [x] Bajo: en el diálogo de tasas, `0.00001` muestra la burbuja nativa del input number; pegar `0x10` guarda 10.
- [ ] Riesgo: Binance Pay respondió HTTP 451 (bloqueo geográfico) desde esta máquina. Confirmar la región de Vercel o usarlo solo desde el VPS.

**Verificado y correcto:**
- Los arreglos de #16 en navegador.
- CRUD, autorización, XSS, teclado y respaldo de la agenda.
- Binance con el flag apagado y encendido con credenciales falsas.
- PayPal sandbox de punta a punta: captura única, retorno duplicado o concurrente, cancelación y tarjeta vencida.
- axe en claro y oscuro, a 375 y 1280: solo los 2 contrastes de arriba.

**Siguen pendientes de César:** región de Vercel para Binance, cuenta de comercio Binance (KYB), Negative Testing en PayPal (opcional), webhook real de PayPal con túnel, suscripción mensual y `x-forwarded-for` en Vercel/VPS.

## QA en navegador de PR #20 (`fix/qa-agenda-binance`), 20-10-2026
Contra Supabase local con puertos 544xx, sin tocar `world-flags`. Scripts y resultados en `.qa/v4/` del worktree `maranatha-wt/qa-pagos`. Capturas: comentario en el PR #20.

- [ ] Bajo: el diálogo de confirmación se cierra al hacer clic, aunque la acción falle por red o 500. Pasa en "Eliminar evento" de la agenda y en "Confirmar pago". Sale el aviso, pero no se puede reintentar desde el diálogo. La causa es `ConfirmDialog` (`components/ui/ConfirmDialog.tsx:64-67`), que llama a `onClose()` justo después de `onConfirm()`, y la guarda `pending` del padre lee un valor viejo (`DashboardAgenda.tsx:614`, `DashboardPayments.tsx:1029`). Rechazar y Tasas sí quedan abiertos.
- [ ] Bajo: error de hidratación en el Hero de `/` con `prefers-reduced-motion: reduce`. `useReducedMotion()` da null en el servidor y true en el cliente, y cambian el aria-label y el `disabled` del botón de pausa (`components/sections/Hero.tsx:67`, `:303-305`). Es previo al PR #20.

**Verificado y correcto en navegador:** el aviso de red o 500 en crear y editar de la agenda (el diálogo queda abierto con lo escrito y el panel no se cae). La fecha 1999 marca error en el campo. Por POST, `2026-02-31`, `1800-01-01` y `3000-01-01` dan invalid_input. Las páginas vacías de pagos muestran el total, y "Anterior" lleva a la última página con filas. `approvePayment` sobre Binance de pasarela o PayPal pendiente da invalid_input. Las tasas fuera de rango no se guardan y no sale la burbuja nativa; `900.5`/`4100` se guardan. "Otro monto" y las referencias `...`/`---` funcionan. El aviso de red sale en Confirmar, Rechazar, Comprobante y Tasas. El checkout Binance fallido (451) no deja filas. El webhook con timestamp de 2020 da 400 sin llamar a Binance, y en seis POST seguidos hubo una sola descarga del certificado. axe da 0 violaciones en 5 vistas × claro/oscuro × 375/1280. Contrastes: "PRÓXIMO EVENTO" 8.31:1, "Ver toda la agenda" 15.4:1 en claro y 6.6:1 en oscuro. Teclado y foco en la paginación y los diálogos están bien, y no hay scroll horizontal a 320 px.
