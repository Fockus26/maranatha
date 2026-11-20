# Prompts de la tanda 2026-11-20 (ola 1)

Brief compartido: `C:\Users\Cesar\Documents\Work\maranatha\context\plans\orchestration-2026-11-20.md` — léelo primero.

---

## W1 — Skeleton por página del panel

**Rama:** `feat/skeletons-por-pagina` · **Decisión:** D102 · **Changeset:** minor · **Docker:** no · **Build local:** no

### Lo que pidió César
> "En la transición del dashboard al cambiar de página solo hay un skeleton general y que ocupa todo el ancho; debe ser un skeleton conforme al layout de cada página."

### Dónde está
- `app/dashboard/(panel)/loading.tsx` — único `loading` del panel: `DashboardShell` + `DashboardPageSkeleton` (D095, en `context/decisions/D095-*.md`).
- `components/ui/DashboardPageSkeleton.tsx` — título + subtítulo + un bloque de 360 px a todo el ancho (lo que hay que reemplazar).
- Páginas (cada una monta su propio `DashboardShell`):
  - Resumen `app/dashboard/(panel)/page.tsx` — `DashboardStatBand` navy a todo el ancho (ya tiene `loading`) + grid `{xs:"1fr", md:"1.6fr 1fr"}` en `maxWidth: 1400` con "Próximos cierres" y "Acciones rápidas" (líneas ~95–110; ya hay filas-skeleton propias en ~140–175).
  - Proyectos `app/dashboard/(panel)/proyectos/page.tsx` — encabezado h1 + botón, buscador de 320 px, `DashboardTable` (ya tiene `loading`).
  - Pagos `app/dashboard/(panel)/pagos/page.tsx` → `components/ui/DashboardPayments.tsx` (Server Component: aquí es donde más se ve el skeleton).
  - Agenda `app/dashboard/(panel)/agenda/page.tsx` → `components/ui/DashboardAgenda.tsx` (Server Component).
- `DASHBOARD_CONTENT_SX` en `components/layout/DashboardShell.tsx`.

### Enfoque decidido
- Un `loading.tsx` por ruta: `(panel)/pagos/loading.tsx`, `(panel)/agenda/loading.tsx`, `(panel)/proyectos/loading.tsx`; el de `(panel)/loading.tsx` queda para Resumen. Cada uno = `DashboardShell` + el skeleton de su página.
- Cada skeleton reproduce el layout real de su página (mismos contenedores, `maxWidth`, padding, columnas y breakpoints): leer el componente real y copiar su estructura, no inventarla. **Reutiliza** los skeletons que ya existen (`DashboardStatBand loading`, `DashboardTable loading`, las filas de Próximos cierres) en vez de duplicarlos; si hace falta, extrae las piezas compartidas a `components/ui/skeletons/` (una por página: `ResumenSkeleton`, `ProyectosSkeleton`, `PagosSkeleton`, `AgendaSkeleton`).
- Lo que no cambia entre carga y contenido (títulos fijos como "Pagos", "Agenda", "Proyectos", las pestañas de filtro si son texto fijo) se pinta **real**, no en gris: menos salto al llegar.
- `DashboardPageSkeleton` genérico: si queda sin uso, **no lo borres**; márcalo en el informe.
- Accesibilidad: `aria-busy="true"` en el contenedor y un texto `visuallyHidden` "Cargando <página>…" con `role="status"`; respeta movimiento reducido (MUI `Skeleton` con `animation={false}` si `prefers-reduced-motion`, ver cómo lo hace el proyecto con `useHydratedReducedMotion`).

### Trampas conocidas
- La barra de progreso de navegación (D095, D101, `components/layout/NavigationProgress.tsx`) convive con estos `loading`: no la toques.
- Resumen y Proyectos son Client Components; su `loading` se ve poco (solo mientras llega el payload). Igual lo necesitan.
- W2 (en paralelo) activa `experimental.staleTimes`: con eso los `loading` se reutilizan en navegaciones repetidas. No dependas de su PR.
- Cero valores mágicos: alturas y anchos de skeleton desde `theme/tokens.ts` o derivados del componente real.

### Cómo verificar (sin sesión)
- Crea una página **temporal sin commitear** **fuera de `/dashboard`** (p. ej. `app/qa-preview/page.tsx`: `proxy.ts` manda al login todo `/dashboard/*` sin cookie salvo login/recuperar/restablecer, y las carpetas con `_` no son rutas) que renderice los 4 skeletons uno debajo del otro; mídelos y captúralos a 1280, 768 y 360 px, claro y oscuro, al lado de la página real (las páginas reales las ves en las capturas de `bun run shots` previas o en `.pr-shots` anteriores si hace falta). Bórrala antes del commit; el slot queda limpio.
- axe sobre esa página temporal; sin scroll horizontal a 320 px.
- En el PR: capturas skeleton vs. layout real por página.

### No tocar
`next.config.ts`, `components/ui/DashboardPayments.tsx` y `DashboardAgenda.tsx` (salvo leerlos), `components/layout/DashboardTopbar.tsx`, `app/dashboard/(panel)/layout.tsx`.

### Cierre
Brief, reglas 13–19. Decisión D102: "skeleton por página del panel" (reemplaza la parte de D095 que fijaba un skeleton genérico).

---

## W2 — Caché inteligente del panel (páginas y filtros)

**Rama:** `feat/cache-panel` · **Decisiones:** D103–D104 · **Changeset:** minor · **Docker:** sí · **Build local:** sí

### Lo que pidió César
> "Quiero que se guarde caché inteligentemente en las páginas y en los filtros para que cada vez que se vuelva a llamar de manera seguida esta no tenga que volver a cargar por completo a no ser que haya cambiado."

### Dónde está
- `next.config.ts` — sin `staleTimes` ni `cacheComponents`. En Next 16 el `dynamic` de `staleTimes` es 0 por defecto: cada vuelta a `/dashboard/pagos?estado=…` o a `/dashboard/agenda` vuelve al servidor y muestra el `loading`. Doc: `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/staleTimes.md` y `.../02-guides/prefetching.md`.
- Pagos: `app/dashboard/(panel)/pagos/page.tsx` (filtro `?estado=` y `?pagina=`, `listPayments` + `getPaymentStats` + `getExchangeRateSources`); enlaces de filtro en `components/ui/DashboardPayments.tsx:777-781` y de paginación `:530` (`paymentsHref`) y `:580-591`.
- Agenda: `app/dashboard/(panel)/agenda/page.tsx` → `listAgendaEvents`.
- Invalidación que ya existe: `revalidatePath("/dashboard/pagos")` en `app/actions/adminPayments.ts:35,137`, `revalidatePath("/dashboard/agenda")` en `app/actions/adminAgenda.ts:30`; también en `lib/payments/{paypalSettle,binanceSettle,paypalSubscriptions}.ts` (esos corren en webhooks: **no** limpian la caché del navegador del admin).
- Proyectos del dashboard: estado en memoria en `lib/dashboardProjectsStore.tsx`, montado una vez en el layout (`:145-150` simula 600 ms de carga solo al montar). No hay fetch real: fuera de alcance salvo que veas que recarga al navegar.
- Tablas: `payments.updated_at` y `agenda_events.updated_at` existen (`lib/db/schema.ts:32-36`, `timestamps`).

### Enfoque decidido
1. **Caché del router del cliente:** `experimental.staleTimes: { dynamic: 30, static: 180 }` en `next.config.ts` (verifica en la doc instalada que sigue bajo `experimental` y los nombres). Con eso, volver a una página o a un filtro visitado hace < 30 s no vuelve al servidor ni muestra skeleton. Si al medir ves que 30 s no alcanza para "de manera seguida", sube `dynamic` (máx. 60) y explícalo en D103. **No** actives `cacheComponents` (cambia el modelo de toda la app).
2. **Lo que cambia el propio admin** ya invalida: las Server Actions llaman `revalidatePath`, que en Next limpia la caché del router del cliente. Confírmalo midiendo (aprobar un pago en la base local y volver al filtro: debe verse el cambio al instante).
3. **Lo que cambia por fuera** (webhook de PayPal/Binance, otro admin): un chequeo barato al volver a mostrarse la página. Componente cliente `components/ui/PanelFreshness.tsx` que recibe `scope: "payments" | "agenda"` y la `version` con la que se renderizó la página; en `visibilitychange` → visible, en `focus` y al montarse desde la caché del router, llama a una Server Action `getPanelVersion(scope)` (nueva, en `app/actions/panelVersion.ts`, con `getAdminStrict()`; devuelve `count(*)` + `max(updated_at)` como string, una sola query por scope, en `lib/payments/repository.ts` / `lib/agenda/repository.ts`, `server-only`) y si difiere hace `router.refresh()`. Throttle: no más de una consulta cada 15 s por scope. Sin `setInterval` permanente.
   - La página server calcula la `version` en el mismo `Promise.all` que ya tiene y la pasa a `DashboardPayments` / `DashboardAgenda`, que montan `<PanelFreshness>`.
4. **Filtros de pagos:** los `Link` de estado y paginación conservan el prefetch por defecto; no pongas `prefetch={true}` en los 5 filtros (carga 5 listados por visita). Si al medir el primer clic de un filtro tarda, prueba `prefetch` al `onMouseEnter`/foco (`router.prefetch`) y documenta en D104.
5. D103: caché del router (`staleTimes`) y qué la invalida. D104: el chequeo de versión (por qué count+max, el throttle, lo que no cubre: un cambio que no toca `updated_at`).

### Trampas conocidas
- Datos de admin desactualizados son un riesgo real (aprobar dos veces, ver un pago como pendiente): la acción de aprobar ya revalida en servidor el estado, pero verifica que un pago aprobado por fuera aparece al volver con foco.
- `revalidatePath` desde un webhook no llega al navegador: por eso el punto 3.
- En `next dev` el prefetch y la caché del router no se comportan igual que en producción: **mide con `bun run qa:local -- --port <puerto> --preview`** (build). Un solo build; si tarda >10 min, déjalo en segundo plano y sigue.
- Tests puros en `tests/unit/` para la comparación de versión y el throttle (función pura extraída del componente).
- W1 (en paralelo) crea `loading.tsx` por página: no los toques.

### Cómo verificar
- Base local con `qa:local` y la cuenta admin de `.env.test.local`. Script Playwright en `.qa/cache.mjs` que: entra a Pagos, cambia a "Confirmados", vuelve a "Pendientes" dentro de 30 s y cuenta las requests RSC (`?_rsc=` / header `RSC`) — debe ser 0 en la vuelta; aprueba un pago (acción) y verifica que el listado cambia; cambia `updated_at` de un pago con SQL en la base **local** y al disparar `focus` la página se refresca. Adjunta el conteo antes/después en el PR.
- Lo mismo navegando Resumen → Pagos → Agenda → Pagos.

### No tocar
`app/dashboard/(panel)/**/loading.tsx`, `components/ui/DashboardPageSkeleton.tsx`, `components/layout/DashboardTopbar.tsx`, `components/layout/DashboardShell.tsx`, `app/dashboard/(panel)/layout.tsx`, `lib/auth/admin.ts`.

### Cierre
Brief, reglas 13–19. Manual para César en el PR: nada (sin migraciones).

---

## W3 — Separación contenido/formulario en la sección Ofrendar del inicio

**Rama:** `fix/ofrendar-separacion` · **Decisión:** D105 · **Changeset:** patch · **Docker:** no · **Build local:** no

### Lo que pidió César
> "En la sección de ofrendar en la página de inicio quiero que se vea como al tocar el botón ofrendar en cuanto a la separación del contenido y del formulario, ya que actualmente está muy separada."

### Dónde está (medido)
- Sección: `components/sections/Tithe.tsx:157-166` — `Container maxWidth="lg"` + fila `justifyContent: "space-between"`, `gap: { xs: 6, md: 8 }`: el texto (maxWidth 480) y el formulario (440) quedan en los extremos de ~1200 px.
- Modal (la referencia): `components/ui/TitheModal.tsx:254-262` — fila `justifyContent: "center"`, `gap: { xs: 6, md: 10 }`, `maxWidth: 960`, `mx: "auto"`.
- Las dos instancias del formulario: D099 (`context/decisions/D099-dos-instancias-de-titheform.md`) — léelo, no lo contradigas.

### Enfoque decidido
- Extrae la fila compartida (texto + formulario) a un componente, p. ej. `components/ui/TitheLayout.tsx` (o el nombre que encaje con lo que ya hay), con los valores del modal, y úsalo en las dos: así no vuelven a divergir. Si el contenido de la columna de texto difiere entre las dos (títulos, copy), el componente recibe esa columna como `children`/prop; no cambies el copy.
- Valores: los del modal (`maxWidth: 960`, `justifyContent: "center"`, `gap {xs: 6, md: 10}`). Si `960` no tiene token, usa el mismo literal que ya usa el modal movido a una constante con nombre en el componente compartido (no crees un token nuevo) y anótalo en "Tokens que faltaron".
- El fondo y el padding vertical de la sección no cambian.

### Cómo verificar
- `bun run dev -- --port <puerto>`; mide con Playwright la distancia entre el borde derecho de la columna de texto y el izquierdo del formulario en la sección y en el modal a 1280, 1440 y 1920 px: deben ser iguales. Capturas antes/después de la sección y del modal (el modal no debe cambiar).
- 768 y 360 px: apilado igual que antes, sin scroll horizontal a 320 px.

### No tocar
Lógica de `TitheForm`, `lib/titheModalStore.tsx`, copy.

### Cierre
Brief, reglas 13–19.

---

## W4 — Ver contraseña + iniciales del admin en el panel

**Rama:** `feat/panel-perfil-y-contrasena` · **Decisiones:** D106–D107 · **Changeset:** minor · **Docker:** no · **Build local:** no

### Lo que pidió César
> "Quiero que agregues el poder ver la contraseña con el icono del ojo. Y que en dashboard el icono del perfil sean las iniciales del nombre y apellido."

### Dónde está
- Campos de contraseña (MUI `TextField type="password"`): `components/ui/DashboardLoginForm.tsx:101-115`, `components/ui/DashboardResetForm.tsx:85-95` y `:108-118` (nueva y confirmación).
- Iniciales: `components/layout/DashboardTopbar.tsx:224-243` — círculo `aria-hidden` con el texto fijo `PD`, oculto en xs.
- `DashboardShell` (`components/layout/DashboardShell.tsx`, client) monta `DashboardTopbar`; lo usan las 4 páginas y el `loading.tsx` del panel **sin props**.
- Sesión: `lib/auth/admin.ts:24-35` — `Admin { id, email }`; `result.user.name` existe (tabla `user.name NOT NULL`, `lib/db/schema.ts:256`). `scripts/create-admin.ts:16` pone `"Administrador"` si no se pasa nombre.
- Layout del panel: `app/dashboard/(panel)/layout.tsx` ya llama `requireAdmin()` y monta providers.

### Enfoque decidido
**Contraseña (D106):**
- Componente `components/ui/PasswordField.tsx`: envuelve `TextField` (mismas props), agrega un `IconButton` de fin (`InputAdornment position="end"`) con `VisibilityRounded` / `VisibilityOffRounded` de `@mui/icons-material`. `aria-label` "Mostrar contraseña" / "Ocultar contraseña" (cambia el label, sin `aria-pressed` además), `type="button"`, área táctil ≥ 44 px, foco visible con el anillo del proyecto (D085). No roba el foco del campo al hacer clic (`onMouseDown` preventDefault).
- Se usa en los 3 campos. En restablecer, cada campo con su propio ojo. `autoComplete` se conserva.

**Iniciales (D107):**
- `Admin` gana `name: string` (de `result.user.name`, `trim()`).
- Función pura `initialsOf(name, email)` en `lib/auth/initials.ts` (sin `server-only`): primera letra de la primera palabra + primera letra de la última palabra, en mayúsculas (`toLocaleUpperCase("es")`), ignorando partículas en minúscula de una o dos/tres letras (`de`, `del`, `la`, `los`, `y`) al elegir la última; una sola palabra → solo su primera letra; nombre vacío o "Administrador" (el valor por defecto del script) → primera letra del email. Respeta tildes y ñ ("Ángel Núñez" → "ÁN"). Tests en `tests/unit/initials.test.ts` con esos casos.
- El layout del panel pasa `{ name, email }` a un provider nuevo `lib/dashboardAdminStore.tsx` (`DashboardAdminProvider` + `useDashboardAdmin()`), y `DashboardTopbar` lo lee del contexto (no por props: así el `loading.tsx` también lo muestra). Fuera del provider (no debería pasar) → no pinta el círculo.
- El círculo deja de ser `aria-hidden`: `role="img"` + `aria-label="Sesión de <nombre>"` (o el email si no hay nombre). Sigue oculto en xs. Opcional y conservador: `title` con el nombre completo.

### Trampas conocidas
- `requireAdmin`/`getAdmin` se usan en 11 sitios: agregar `name` a `Admin` es aditivo; corre `typecheck` para confirmarlo.
- No inicies sesión (el `.env` es producción). Las iniciales se verifican con los tests puros y con una captura de la barra renderizada con un provider de ejemplo en una página **temporal sin commitear** fuera de `/dashboard` (p. ej. `app/qa-preview/page.tsx`; `proxy.ts` exige cookie en `/dashboard/*`; bórrala antes del commit).
- El ojo sí se ve sin sesión: `/dashboard/login` y `/dashboard/restablecer` en tu dev server.
- Acción manual para César (en el PR): si su cuenta o la de Kevin quedaron con nombre "Administrador", el SQL para ponerles nombre y apellido (`UPDATE "user" SET name = '…' WHERE email = '…';`) — escríbelo, no lo corras.

### Cómo verificar
- `bun run dev -- --port <puerto>`: login y restablecer — clic en el ojo alterna el tipo, el label cambia, el foco queda en el campo; teclado (Tab llega al botón, Enter/Espacio lo activa); axe claro y oscuro; 320 px sin scroll horizontal.
- `bun run test:related` con `initials.test.ts`.

### No tocar
`next.config.ts`, `app/dashboard/(panel)/**/loading.tsx`, `components/ui/DashboardPageSkeleton.tsx`, `components/ui/DashboardPayments.tsx`, `components/ui/DashboardAgenda.tsx`.

### Cierre
Brief, reglas 13–19.
