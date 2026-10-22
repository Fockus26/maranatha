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

- [x] (PR #21) Bajo: el diálogo de confirmación se cierra al hacer clic, aunque la acción falle por red o 500. Pasa en "Eliminar evento" de la agenda y en "Confirmar pago". Sale el aviso, pero no se puede reintentar desde el diálogo. La causa es `ConfirmDialog` (`components/ui/ConfirmDialog.tsx:64-67`), que llama a `onClose()` justo después de `onConfirm()`, y la guarda `pending` del padre lee un valor viejo (`DashboardAgenda.tsx:614`, `DashboardPayments.tsx:1029`). Rechazar y Tasas sí quedan abiertos.
- [x] (PR #21, también `Reveal`, `Agenda` y `PhotoAnchorBand`) Bajo: error de hidratación en el Hero de `/` con `prefers-reduced-motion: reduce`. `useReducedMotion()` da null en el servidor y true en el cliente, y cambian el aria-label y el `disabled` del botón de pausa (`components/sections/Hero.tsx:67`, `:303-305`). Es previo al PR #20.

**Verificado y correcto en navegador:** el aviso de red o 500 en crear y editar de la agenda (el diálogo queda abierto con lo escrito y el panel no se cae). La fecha 1999 marca error en el campo. Por POST, `2026-02-31`, `1800-01-01` y `3000-01-01` dan invalid_input. Las páginas vacías de pagos muestran el total, y "Anterior" lleva a la última página con filas. `approvePayment` sobre Binance de pasarela o PayPal pendiente da invalid_input. Las tasas fuera de rango no se guardan y no sale la burbuja nativa; `900.5`/`4100` se guardan. "Otro monto" y las referencias `...`/`---` funcionan. El aviso de red sale en Confirmar, Rechazar, Comprobante y Tasas. El checkout Binance fallido (451) no deja filas. El webhook con timestamp de 2020 da 400 sin llamar a Binance, y en seis POST seguidos hubo una sola descarga del certificado. axe da 0 violaciones en 5 vistas × claro/oscuro × 375/1280. Contrastes: "PRÓXIMO EVENTO" 8.31:1, "Ver toda la agenda" 15.4:1 en claro y 6.6:1 en oscuro. Teclado y foco en la paginación y los diálogos están bien, y no hay scroll horizontal a 320 px.

## design-qa fase 09 (20-10-2026)

Probado en origin/main 598bd34 (PR #20 y #21 incluidos), con Supabase local. Capturas en `..\maranatha-wt\design-qa\.qa\design\`. Resultado: 0 críticos · 4 altos · 5 medios · 3 bajos.

- [x] (PR #23) Alto: en `forced-colors` no se distingue lo seleccionado (montos, Tipo, Frecuencia, filtros y navegación del panel). Ver `AmountSelector.tsx:75-100`, `SegmentedToggle.tsx:85-113`, `DashboardPayments.tsx:751-775`, `DashboardTopbar.tsx:162` y `app/globals.css:77-89`. Corrección: Highlight/HighlightText o un borde de 3px para `aria-pressed`, `aria-checked` y `aria-current`. Captura: `prefs/diezmo-forced-seleccion.png`.
- [x] (PR #23) Alto: `styleOverrides.containedPrimary` (`theme/theme.ts:271-285`) ya no se aplica en MUI 9. Por eso el botón "Ir al inicio" del 404/500 en oscuro queda a 3.54:1, y hay parches con `#FFFFFF` en `DashboardAgenda.tsx:303,562`. Corrección: pasarlo a `variants`. Captura: `404-dark-boton.png`.
- [x] (PR #23) Alto: `PageNavbar.tsx:120-153` todavía usa la marca de relleno ("■ Iglesia") en `/proyectos`, el detalle de proyecto, `/historia` y `/pago/resultado`. Corrección: usar `<Logo>` como en `Navbar.tsx`. Captura: `hdr_proyectos.png`.
- [x] (PR #23) Alto (decisión de diseño): en la barra superior del panel, entre 320 y 600 px, "Agenda" (y "Pagos" a 320) quedan ocultas, sin ninguna pista de que se puede desplazar (`DashboardTopbar.tsx:108-114`). Captura: `dash/topbar-320.png`.
- [x] (PR #23) Medio: la descripción del detalle de proyecto no tiene ancho máximo y llega a unos 117 caracteres por línea desde 1920 (`ProjectDetailContent.tsx:74-84`). Corrección: `maxWidth: 70ch`.
- [x] (PR #23) Medio: voseo en `TitheForm.tsx` (~203, 266, 279): "Elegí", "Ingresá". Pasarlo a tuteo.
- [x] (PR #23) Medio: objetivos táctiles de menos de 44px: indicadores y pausa del Hero, Instagram de líderes, chips de Prédicas y filtros de proyectos, enlaces del pie, "Abrir menú" (40px).
- [x] (PR #23) Medio (decisión de diseño): el modal de pago en horizontal (844×390) mete una tarjeta dentro de otra y deja unos 290px útiles. Captura: `flows/aporte-2-Zelle-844x390-light.png`.
- [x] (PR #23) Medio: falta la galería de estados `/estados?screen=…`. Sin ella, 500, sin conexión y mantenimiento quedaron sin verificar.
- [x] (PR #23) Bajo: los chips "Pendiente" y "Cancelado" usan el mismo gris (`DashboardPayments.tsx:185-202`).
- [x] (PR #23) Bajo: los campos de texto (login, buscador de proyectos) no muestran el anillo de foco naranja.
- [x] (PR #23) Bajo: falta `scrollbar-color` estándar en `theme/globalStyles.ts`; en Firefox se verá la barra del sistema.
- [x] (PR #23) Deuda de coherencia que sigue desde 77abe88:
  - hex sueltos en `Agenda`, `Tithe`, `Sermons`, `SocialLinks` (12 degradados), `Dashboard*`, `SegmentedToggle` y `theme.ts:28,38`
  - 58 radios fuera de la escala (10, 14, 20, 2, 999)
  - sombras sueltas en `Agenda.tsx:206,209`
  - 262 `fontSize` literales
  - íconos de variantes mezcladas (Rounded, Outlined y rellenos)
  - el CTA de las pantallas de estado es navy en el 404 y naranja en `/pago/resultado`

**Bien:** cero scroll horizontal en 13 rutas × 11 anchos (320 a 3840) × claro y oscuro, y en todo el checkout. Reflujo al 400 % correcto. Layout correcto desde 1920. axe: 1 violación en 24 corridas. Reduced-motion correcto. Contraste de la selección y del scrollbar correcto. El 404 devuelve HTTP 404 real. Anillo de foco visible.
**Verificado después (PR #23):** 500, sin conexión y mantenimiento en `/estados`, en claro y oscuro, a 360, 1440 y 2560 (axe 0, sin scroll horizontal). Ahí salieron y se corrigieron dos fallos: el desborde del 500 con código y el subrayado del correo.
- [ ] Sin conexión al navegar: sale la página de error del navegador porque no hay service worker. En curso en una sesión aparte.
**Sin verificar:** Diezmo en oscuro y en horizontal (cubierto por Aporte); contraste medido sobre la foto del hero; Firefox y Safari.
