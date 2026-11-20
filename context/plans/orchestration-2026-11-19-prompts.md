# Prompts por unidad — tanda 2026-11-19

Brief compartido: `C:\Users\Cesar\Documents\Work\maranatha\context\plans\orchestration-2026-11-19.md`.

---

## W1 — `feat/progreso-navegacion`

Eres el worker **W1**. Rama `feat/progreso-navegacion`. Decisiones: **D095**. Checklist: ninguna.
Modelo · esfuerzo: **sonnet · medium**. Docker: **no**. Build local: **no**. Servicios de test: **no**.

Lee primero el brief compartido. Decisiones que te limitan: D055 (transición solo de entrada), D067 (estados de carga y vacíos) — `ls context/decisions/D055-* D067-*` y léelas.

### Qué pide César
> "Necesito que agregues una transicion o algo al momento de cambiar de pagina ya que doy click y como tarda en cambiar la pagina se queda todo quieto y no muestra nada"

Lo leo así: el problema es el **tiempo entre el clic y que llegue la página nueva**. La transición que ya existe (`PageTransition`) solo anima cuando la página nueva ya montó, así que durante la espera no pasa nada. Hace falta respuesta inmediata al clic.

### Dónde está
- `app/template.tsx` y `app/dashboard/(panel)/template.tsx` — montan `PageTransition` (`components/layout/PageTransition.tsx`, fade + 12 px). Se quedan.
- No existe ningún `loading.tsx` en `app/`.
- Rutas: `/`, `/historia`, `/proyectos`, `/proyectos/[slug]`, y el panel `/dashboard`, `/dashboard/pagos`, `/dashboard/proyectos`, `/dashboard/agenda`.

### Enfoque decidido
1. **Barra de progreso fina arriba** (color `secondary.main`, 3 px, encima de navbar/topbar) que aparece al instante al iniciar una navegación interna y se completa/desvanece al llegar. Un componente cliente montado en `app/layout.tsx` (sirve para sitio y panel). Cómo detectar la navegación: primero mira en `node_modules/next/dist/docs/` lo que ofrece Next 16.3 (`useLinkStatus`, `onNavigate` de `Link`, eventos del router); si no hay una API global, escucha clics en `<a>` internos (mismo origen, sin `target`, sin modificadores, distinto pathname/search) y termina cuando cambia `usePathname()`/`useSearchParams()`. Sin dependencias nuevas (nada de nprogress): MUI `LinearProgress` o un `Box` animado.
2. **`loading.tsx`** con esqueletos sobrios (MUI `Skeleton`, tokens) en `app/dashboard/(panel)/loading.tsx` y en las rutas públicas que hacen fetch en el servidor (`app/proyectos/`, `app/proyectos/[slug]/`, y la home si su espera se nota). En el panel, el esqueleto ocupa solo el contenido: sidebar y topbar quietos.
3. `prefers-reduced-motion`: la barra aparece sin animación de avance (o sin barra, solo el esqueleto). Accesible: `role="progressbar"` con `aria-label="Cargando página"`, o `aria-busy` donde corresponda; no anuncies cada navegación por voz.

### Trampas conocidas
- No toques `components/layout/Navbar.tsx`, `PageNavbar.tsx`, `MobileMenuOverlay.tsx`, `components/ui/Tithe*`, `app/page.tsx` (los toca W3) ni `components/ui/Dashboard*` (W2).
- Enlaces de ancla (`/#agenda`) y el botón que abre el modal no son navegación: la barra no debe quedarse colgada. Si en 10 s no llegó nada, se oculta sola.
- Biome y `tokens.test.ts` vigilan valores mágicos: usa tokens.

### Cómo verificar
- Playwright con la red ralentizada (CDP `Network.emulateNetworkConditions` o `route` con retraso): al hacer clic en un enlace del sitio, la barra existe en el DOM en < 100 ms; desaparece al llegar. Ancla y modal: no aparece.
- `/dashboard/*` redirige a login sin sesión: verifica el `loading.tsx` del panel leyendo el código y con una navegación pública; anota en "Cómo probar" que `wave-qa` lo vea con sesión.
- a11y: axe claro/oscuro, 320 px.

### Cierre
Changeset: minor — "Al hacer clic en un enlace aparece una barra de carga arriba y un esqueleto mientras llega la página."
"Decisión tomada / alternativa" en el PR: cómo detectas la navegación.

---

## W2 — `feat/formularios-panel-lateral`

Eres el worker **W2**. Rama `feat/formularios-panel-lateral`. Decisiones: **D096–D097**. Checklist: ninguna.
Modelo · esfuerzo: **sonnet · medium**. Docker: **sí** (solo tú en esta ola). Build local: **no**. Servicios de test: **no**.

Lee primero el brief. Decisiones que te limitan: D065 (modal de proyecto a pantalla completa en móvil), D057 (sin el overlay blanco de MUI), D062 (DateField con calendario propio), D080 (agenda editable desde el dashboard), D092 (botones outlined) — `ls context/decisions/D0NN-*`.

### Qué pide César
> "sobre todo en el dashboard necesito que los formularios para crear editar los mejores ya que no me gusta como se ve"

Elegido por César: **panel lateral** — "El formulario se abre como un panel que entra por la derecha, con secciones agrupadas y una barra fija con Guardar y Cancelar. En el celular ocupa toda la pantalla."

### Dónde está
- `components/ui/DashboardProjectModal.tsx` (133 líneas) — envuelve el formulario de proyecto en un Dialog.
- `components/ui/DashboardProjectForm.tsx` (544) — campos del proyecto.
- `components/ui/DashboardAgenda.tsx:139` — `AgendaEventDialog` (Dialog de crear/editar evento) y su formulario en el mismo archivo.
- `components/ui/ConfirmDialog.tsx` — se queda como Dialog (confirmar borrar no es un formulario).
- Páginas: `app/dashboard/(panel)/proyectos/page.tsx`, `.../agenda/page.tsx`.

### Enfoque decidido
- Un primitivo compartido nuevo `components/ui/DashboardFormDrawer.tsx` (MUI `Drawer` anchor right, ancho ~560 px desde `md`, 100 % abajo de `md`): cabecera fija (título "Nuevo proyecto"/"Editar proyecto", botón cerrar con `aria-label`), cuerpo con scroll, pie fijo con Cancelar (outlined) y Guardar (contained, deshabilitado y con progreso mientras guarda).
- Dentro: campos agrupados en secciones con subtítulo (p. ej. proyecto: "Información", "Meta y fechas", "Imagen"; evento: "Evento", "Cuándo", "Dónde"), etiquetas visibles, ayudas bajo el campo, errores por campo, vista previa de la imagen si el formulario tiene imagen. La agrupación concreta la decides tú leyendo los campos reales.
- Ambos formularios (proyecto y evento) usan el mismo Drawer. Ninguna lógica de guardado ni validación cambia: solo presentación. Si ves un bug de lógica, va a "visto de pasada".
- Cerrar con cambios sin guardar: confirmación (reutiliza `ConfirmDialog`). Esc y clic fuera cierran (con esa confirmación si hay cambios).

### Trampas conocidas
- Foco: al abrir, al primer campo; al cerrar, vuelve al botón que lo abrió. Drawer de MUI lo hace si no rompes el `TrapFocus`.
- No toques `components/layout/*`, `app/layout.tsx`, `app/template.tsx` (W1) ni nada de `components/ui/Tithe*` / pagos (W3, W4).
- Valores sin token (560 px): usa un token existente o añade uno en `theme/tokens.ts` y regístralo en tu decisión.

### Cómo verificar
- `bun run qa:local -- --port <tu puerto>` y entra con `ADMIN_EMAIL_TEST`/`ADMIN_PASSWORD_TEST` de `.env.test.local` (sin imprimir los valores). Crea y edita un proyecto y un evento en la base local: se guardan igual que antes.
- Mide a 360, 768 y 1440 px, claro y oscuro: pie siempre visible, sin scroll horizontal, cuerpo con scroll propio.
- Teclado: Tab recorre el panel sin escaparse; Esc cierra.
- Capturas con el bloque `login` de `.pr-shots.json` contra `qa:local`: panel de proyecto (nuevo y editar), panel de evento, móvil.

### Cierre
Changeset: minor — "Los formularios de crear y editar proyectos y eventos del panel se abren en un panel lateral más ordenado."
D096: el primitivo `DashboardFormDrawer`. D097 (si hace falta): agrupación de campos / tokens nuevos.

---

## W3 — `feat/seccion-ofrendar`

Eres el worker **W3**. Rama `feat/seccion-ofrendar`. Decisiones: **D098–D099**. Checklist: **1 fila** (entrégala en el informe).
Modelo · esfuerzo: **sonnet · medium**. Docker: **no**. Build local: **no**. Servicios de test: **no**.

Lee primero el brief. Decisiones que te limitan: D018 (TitheForm solo recolecta datos), D020 (aporte a proyecto en modal), D049 (modales globales con store), D048 (fondo con patrón geométrico) — `ls context/decisions/D0NN-*`.

### Qué pide César
> "Necesito que se agregue una seccion para aportar en la pagina de inicio ademas de mostrarse al dar click en el boton para incentivar la donacion, cambia el texto diezmo por ofrendar"

Elegido por César:
- Propuesta **B**: "Formulario en la página — el formulario completo dentro de la sección." Maqueta aprobada: fondo navy (`primary[700]`), a la izquierda eyebrow "Da con propósito", h2 "Tu ofrenda sostiene esta obra" y un párrafo corto; a la derecha la tarjeta clara con el formulario (tipo Diezmo/Ofrenda, montos, datos, Continuar).
- "Ofrendar" en **botones y títulos**: el CTA "Diezmo" del menú → "Ofrendar"; el título del modal y de la sección dicen "ofrenda". Dentro del formulario se sigue eligiendo Diezmo u Ofrenda.
- El botón del menú **sigue abriendo el modal** (también en la home).

### Dónde está
- `components/sections/Tithe.tsx` (236) — la sección vieja, `id="diezmo"` (:120), título (:209); hoy no se monta en ninguna parte. Base natural para la nueva.
- `components/ui/TitheModal.tsx:316` — h2 "Tu diezmo y tus aportes sostienen esta obra" → "Tu ofrenda sostiene esta obra" (o similar, mismo largo). Montado en `app/layout.tsx:89` (no toques el layout).
- `components/ui/TitheForm.tsx` (305) — formulario; `ContributionType` (:59) y las opciones (:224) se quedan.
- CTA "Diezmo": `components/layout/Navbar.tsx:253`, `components/layout/PageNavbar.tsx:191`, `components/layout/MobileMenuOverlay.tsx:51` (`ctaLabel`), y `components/status/StatusScreen.tsx:298` si muestra el texto. Comentarios y `aria-label` que digan "Diezmo" del botón, también.
- `components/layout/navItems.ts` — `TITHE_ANCHOR_ID`.
- `app/page.tsx:49-67` — orden de secciones de la home.

### Enfoque decidido
- Monta la sección en `app/page.tsx` entre `<Agenda>` y el segundo `<PhotoAnchorBand>` (después de la agenda, antes de Historia). `id="ofrendar"`; actualiza `TITHE_ANCHOR_ID` y lo que lo use.
- Reutiliza `TitheForm` (+ su paso de pago) dentro de la sección; no dupliques el formulario.
- Headings: h2 de la sección; dentro de la tarjeta, sin h2 nuevo.
- Copy nuevo provisional (si escribes uno distinto al del modal) con su fila de checklist.

### Trampas conocidas
- **Dos instancias de `TitheForm` a la vez** (sección + modal): ids de campos con `useId`, nada de ids fijos; el SDK de PayPal (`PaymentStep`) no debe cargarse dos veces ni chocar contenedores — verifica que el paso PayPal funciona en la sección y en el modal. Si el modal está abierto sobre la sección, la sección no debe robar foco.
- No toques `lib/payments/*` ni `components/ui/PaymentStep.tsx` (W4 los cambia; quita Zinli y Wally). Si necesitas algo de ahí, dilo en el informe.
- No toques `app/layout.tsx` ni `app/template.tsx` (W1), ni `components/ui/Dashboard*` (W2).
- Ningún test de ruta usa `#diezmo`? `git grep -n "diezmo" -- tests scripts` antes de renombrar el ancla.

### Cómo verificar
- Home a 320, 768, 1440 px, claro y oscuro: sección visible, sin scroll horizontal, tarjeta del formulario legible (4.5:1).
- Rellenar la sección como invitado hasta el paso de pago **sin enviar** un reporte real (la base es de producción): llega al selector de métodos.
- El CTA dice "Ofrendar" en Navbar, PageNavbar y menú móvil, y abre el modal.
- a11y: axe claro/oscuro, teclado por toda la sección.

### Cierre
Changeset: minor — "Nueva sección para ofrendar en el inicio, con el formulario completo; el botón del menú ahora dice «Ofrendar»."
D098: la sección vuelve a la home con formulario (revierte lo de "sección removida" del comentario de TitheModal). D099 si hace falta.

---

## W4 — `fix/quitar-zinli-wally`

Eres el worker **W4**. Rama `fix/quitar-zinli-wally`. Decisiones: **D100**. Checklist: ninguna.
Modelo · esfuerzo: **opus · medium** (validación de pagos). Docker: **no**. Build local: **no**. Servicios de test: **no**.

Lee primero el brief y `context/PROJECT_CONTEXT.md` › Stack técnico (solo esa sección).

### Qué pide César
> "quítame zinli y wally como métodos de pago"

### Dónde está
- `lib/payments/methods.ts:144-171` — definiciones de Zinli y Wally (variables `PAY_ZINLI_*`, `PAY_WALLY_*`).
- `lib/payments/schema.ts:10-27` — `PAYMENT_METHOD_IDS` y `MANUAL_METHOD_IDS` (los usa el servidor para validar).
- `lib/payments/labels.ts:16-17` — etiquetas.
- `components/ui/PaymentStep.tsx:48` — comentario que los nombra.
- `.env.example:57-60`.
- `lib/db/schema.ts:99`, `drizzle/`, `supabase/migrations/` — el CHECK de la base los incluye.

### Enfoque decidido
- Un pago nuevo con `zinli` o `wally` ya no se puede ofrecer **ni aceptar**: fuera del listado de métodos y rechazado por el esquema que valida la entrada en el servidor (`app/actions/`).
- **Los pagos viejos guardados con esos métodos siguen mostrándose bien** en el dashboard (etiqueta "Zinli"/"Wally", filtros, totales). Por eso: separa "métodos aceptados" de "métodos que pueden existir en la base" si el tipo `PaymentMethodId` se usa para leer filas. Las etiquetas se quedan.
- La base **no cambia**: el CHECK se queda (sin migración). Dilo en la decisión.
- Quita `PAY_ZINLI_*`/`PAY_WALLY_*` de `.env.example` y de donde se lean; en el PR, acción manual: borrarlas de las variables de producción si existen.

### Trampas conocidas
- Antes de cambiar el tipo, `git grep -n "PaymentMethodId\|PAYMENT_METHOD_IDS\|MANUAL_METHOD_IDS"` y `bun run typecheck` con el cambio: los filtros del dashboard y `labels.ts` pueden ser `Record<PaymentMethodId, …>`.
- Los filtros del dashboard (`components/ui/DashboardPayments.tsx`) pueden seguir ofreciendo Zinli/Wally para buscar pagos viejos: decide lo conservador (mantenerlos si hay filas posibles) y explícalo.
- No toques `components/ui/TitheForm.tsx`, `components/sections/*`, `components/layout/*` (W3).

### Cómo verificar
- Tests en `tests/unit/`: el esquema de entrada rechaza `zinli` y `wally` y acepta los demás; las etiquetas de un pago viejo con `zinli` siguen resolviendo.
- En el navegador (invitado, sin enviar): el paso de pago ya no muestra Zinli ni Wally.
- Suite completa, typecheck, lint.

### Cierre
Changeset: minor — "Zinli y Wally ya no aparecen como métodos de pago."
Acción manual en el PR: borrar `PAY_ZINLI_*` y `PAY_WALLY_*` de las variables de producción (kit-deploy) y de Vercel.
