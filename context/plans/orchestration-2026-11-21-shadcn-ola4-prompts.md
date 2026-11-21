# Prompts — fase migración MUI → shadcn · ola 4 (2026-11-21)

Común a las dos: lee primero el brief
`C:\Users\Cesar\Documents\Work\maranatha\context\plans\orchestration-2026-11-21-shadcn-ola4.md`
(trae las formas compartidas de las olas 1–3 —la API de cada primitiva y de cada compuesto— y las
formas fijadas entre W1 y W2) y el mapa de íconos
`C:\Users\Cesar\Documents\Work\maranatha\context\plans\mapa-iconos.md`. Del plan
`context/plans/phase-migracion-shadcn.md`: "Decisiones de César", "Reglas de la fase", la fila
de tu unidad y "Para la ola 4". Mapa hecho sobre `origin/main` @ 22e3360; lo que este prompt
afirma con path:line ya está comprobado: no lo vuelvas a verificar.

Qué pide César (para las dos):
> "dejar MUI y desarrollar los componentes con shadcn" — migrar todo, como fase propia; look
> igual con ajustes menores, íconos lucide-react, capturas antes/después por unidad.

**Red inestable:** tras cada paso de "Qué haces", commit (`wip:` vale), push y una línea en
`.qa/progress.md` ("hecho: paso N · sigue: paso N+1 · notas"). Si te reanudan, empieza por
`git status`, `git log --oneline origin/main..HEAD` y `.qa/progress.md`.

---

## W1 — `refactor/shadcn-panel-datos`

Eres el worker **W1**. Rama: `refactor/shadcn-panel-datos`. Slot y puerto: los del mensaje que te lanza.
Decisiones: **D134–D136**. Filas de CONTENT_CHECKLIST: ninguna. Changeset: `patch`
("Interfaz migrada a shadcn en pagos, agenda y proyectos del panel").
Modelo · esfuerzo: **opus · medium** (aprobar/rechazar pagos y guardar datos del panel).
Docker: **sí** (`qa:local`, único de la ola). Build local: **no**. Servidor: desde el inicio.
Decisiones que te restringen (ábrelas: `grep -rl "<ID>" context/decisions/`): D045 (proyectos
del panel en memoria), D048 (patrón del panel), D057 (sin overlay blanco en modales oscuros),
D062 (DateField, `ConfirmDialog` con `ReactNode`), D067/D102 (esqueletos sin salto), D085/D086
(foco), D089 (TimeField), D117 (`ConfirmDialog` sobre `dialog`), D131 (menú móvil del panel =
`Sheet` navy), D133 (esqueletos; `SkeletonFrame.module.css` se borra en esta ola). Además
busca las de pagos del panel: `grep -rhi "^# D.*\(pago\|tasa\|comprobante\|agenda\|tabla\)" context/decisions/`.

### Archivos (líneas en origin/main)
`components/ui/DashboardPayments.tsx` (1200: dos `Dialog` MUI en `:280` y `:387` —rechazo y
tasas—, `Snackbar` `:1174`, `Alert` `:818`, `TextField` con `SMALL_FIELD_SX`, `outlinedActionSx`
`:767`, `:1059`, `ConfirmDialog` `:1124`, `DashboardStatBand` `:702`),
`components/ui/DashboardTable.tsx` (672: `TableSortLabel` `:194`, `Skeleton` MUI `:237-272`,
`LinearProgress` `:347`, `IconButton` `:391`, `:408`, `ConfirmDialog` `:643`),
`components/ui/DashboardAgenda.tsx` (631: `RadioGroup` `:195`, `TextField select` `:233`,
`DateField` `:249`, `TimeField` `:262`, `IconButton` `:361`, `:364`, `Snackbar`, `Alert`,
`ConfirmDialog` `:589`), `components/ui/DashboardFormDrawer.tsx` (243: `Drawer` `:74`,
`IconButton` Cerrar `:119`, `outlinedActionSx` `:161`, `ConfirmDialog` `:177`),
`components/ui/DashboardProjectForm.tsx` (510: `TextField`, `DateField` `:284`, líneas de
presupuesto con `IconButton` `:377`, `useTheme`), `components/ui/ImageUploadField.tsx` (155:
`Tabs` `:81`, `TextField` `:139`, `outlinedActionSx` `:130`),
`app/dashboard/(panel)/proyectos/page.tsx` (206: `useTheme`, `Button`, `Typography`, tokens
`fontScale/radius/typography` de `theme/tokens`).
Y además (solo lo indicado): `components/ui/ConfirmDialog.tsx` (quitar `findMuiModalPaper`
`:20-25` y `container=` `:86`), `components/ui/DashboardProjectModal.tsx` (si cambia la API del
drawer), `components/ui/skeletons/SkeletonFrame.tsx` (quitar el import del módulo `:2` y la
clase `frame`) + **borrar** `SkeletonFrame.module.css`, `components/ui/skeletons/ProyectosSkeleton.tsx`
(entero tuyo).

### Qué haces
1. `DashboardFormDrawer` → `Sheet side="right"` (pantalla completa en móvil, `md:max-w-form-drawer`,
   ya en la primitiva), con título, cierre "Cerrar" de 44 px, el pie de acciones fijo y el
   `ConfirmDialog` de "¿descartar cambios?" que ya tiene. `DrawerSection`: props sin cambios
   salvo `sx` → `className`. Mide que `DateField`/`TimeField` abren su calendario/lista **dentro**
   del sheet y que reciben foco (buscan `closest('[role="dialog"]')` para el portal).
2. `ConfirmDialog`: cuando ningún `Drawer`/`Dialog` MUI lo abra ya (tras los pasos 1 y 3), quita
   `findMuiModalPaper` y el `container`. Comprueba que confirmar desde dentro del sheet (descartar
   cambios) atrapa el foco y lo devuelve al botón que lo abrió.
3. `DashboardPayments`: los dos `Dialog` MUI → `Dialog` de shadcn (patrón del brief si se abren
   sin `DialogTrigger`: guarda y devuelve el foco, D129/D123); `Snackbar` → `toast()`; `Alert` →
   `Alert`; `TextField` → `Field` + `Input`; botones de fila (comprobante, rechazar, confirmar) con
   su `aria-label` actual; rechazar = botón destructivo (sustituto o `color="error"` según el
   brief). **Contrato de las acciones del servidor sin cambios** (`app/actions/`): no cambies qué
   se envía ni cuándo; el doble clic sigue bloqueado mientras `pending`.
4. `DashboardTable`: `TableSortLabel` → botón en la cabecera con `aria-sort` en el `<th>` y un
   ícono lucide (`ArrowUp`/`ArrowDown`); `LinearProgress` → `Progress`; `Skeleton` MUI → el de
   la primitiva (o `SkeletonLine` de `skeletons/skeletonParts`) con las mismas medidas; luego borra
   `SkeletonFrame.module.css`. **Nombre accesible** en todo botón de ícono de la tabla, también en
   la vista de tarjetas a 320 px (axe dio un crítico en `/dashboard/proyectos` a 320 px: mídelo
   en main primero y nombra el elemento exacto en el PR).
5. `DashboardAgenda`: `RadioGroup` → `RadioGroup` de la primitiva (grupo con nombre), `TextField
   select` → `Select` dentro de `Field`, el resto de campos a `Field` + `Input`/`Textarea`;
   `Snackbar` → `toast()`. `DashboardProjectForm` e `ImageUploadField` (`Tabs` → `Tabs`) igual.
   Las líneas de presupuesto conservan su `aria-label` por campo.
6. `proyectos/page.tsx`: `Typography` → elementos semánticos, `useTheme` → clases, ancho con
   `DASHBOARD_CONTENT_CLASS`.
7. Al final: `git grep -n "@mui/\|@emotion/\|outlinedActionSx\|fieldStyles" -- <tus archivos>`
   vacío. Si W2 (`feat/ui-faltantes`) ya está en `origin/main`, `git merge origin/main` y cambia
   tus sustitutos por la API nueva (brief › Formas compartidas entre W1 y W2).

### Trampas
- El panel vive dentro de `DashboardShell` (migrado en #64); el `Sheet` del topbar móvil (D131)
  y tu sheet de formulario no coinciden nunca abiertos, pero comprueba `z-modal` de tu sheet sobre
  la topbar a 360 px.
- `toast()` dentro de un sheet abierto: el `Toaster` está en `app/layout.tsx`; mide que se ve
  por encima del overlay del sheet y que no roba el foco.
- `qa:local`: un login por contexto de Playwright (rate limit); no muestres credenciales; no bajes
  los contenedores.
- `bun run a11y` tiene rutas fijas (incluye el panel con sesión): úsalo, o un script propio con
  las mismas etiquetas para pagos, agenda y proyectos a 320 px, claro y oscuro.
- `tests/unit/panel-freshness.test.ts`, `payments-qa.test.ts`, `qa-agenda-binance.test.ts` y
  `superposiciones.test.ts` probablemente vigilan archivos tuyos (no comprobado): `test:related` tras cada paso.

### Cómo verificar
- Con sesión (`qa:local`) y datos de prueba en la base local: capturas antes/después, claro y
  oscuro, 360 y 1280, de `/dashboard/pagos` (lista, filtro, dialog de rechazo, dialog de tasas,
  `ConfirmDialog`, toast), `/dashboard/agenda` (lista, sheet de nuevo evento con el calendario y la
  hora abiertos, `ConfirmDialog` de eliminar), `/dashboard/proyectos` (tabla ordenada por una
  columna, vista a 360, sheet de proyecto con imagen por URL y por archivo, líneas de
  presupuesto) y los `loading.tsx` de esas tres rutas (D102: alturas de página antes/después).
- Recorre de verdad en la base local: confirmar un pago, rechazarlo con motivo, cambiar la tasa,
  crear/editar/eliminar un evento y un proyecto. Teclado en todo (sheet: Tab atrapado, Escape,
  foco de vuelta).
- typecheck, biome, `bun run test`, axe (claro y oscuro, 320 px).

### Cierre
Decisiones (D134–D136): formulario del panel en `sheet` (y `ConfirmDialog` sin portal MUI),
tabla (orden accesible, botones con nombre, esqueleto), la tercera libre (p. ej. pagos: dialogs y
toasts). Informe con "Formas compartidas que fijaste" (API de `DashboardFormDrawer`,
`DrawerSection`, `DashboardTable`) y "Qué queda con MUI" (debería ser solo lo de la ola 5).

---

## W2 — `feat/ui-faltantes`

Eres el worker **W2**. Rama: `feat/ui-faltantes`. Slot y puerto: los del mensaje que te lanza.
Decisiones: **D137–D139**. Filas de CONTENT_CHECKLIST: ninguna. Changeset: `none` si nada cambia
a la vista; si algo cambia, `patch` ("Primitivas y tokens de la interfaz completados").
Modelo · esfuerzo: **sonnet · medium**. Docker: **no**. Build local: **no**. Servidor: tu dev, solo
para medir (rutas públicas como invitado).
Decisiones que te restringen: D109–D110 (tokens → `app/tokens.css`, `button.tsx`), D112–D121
(primitivas de la ola 2), D084/D092 (botón de acción), D085/D086 (foco), D119 (anchos de página,
`wide:`), D124, D130, D132, D133 (los compuestos de la ola 3 que tocas) — ábrelas.

### Qué haces
1. **Primitivas** (solo estas cuatro): `components/ui/button.tsx` (`color="error"`,
   `color="inherit"`, `size="icon-sm"` 30 px y `"icon-xs"` 28 px, `variant="link"`),
   `progress.tsx` (`color`), `alert.tsx` (`action`), `field.tsx` (`hideLabel`), con la API exacta
   del brief › Formas compartidas entre W1 y W2. Contraste AA de `color="error"` en claro y oscuro
   (contained, outlined, text) con los pares calculados en el informe. Foco D085 igual en todas.
2. **Tokens** en `theme/tokens.ts` (+ `scripts/tokens-css.ts` si hace falta un grupo nuevo, p. ej.
   `--tracking-*` o `--max-width-*`) y `bun scripts/tokens-css.ts` → `app/tokens.css`. Nombres del
   brief. Lee antes cómo `scripts/tokens-css.ts:90-125` resetea `--text-*`/`--leading-*`
   (`initial`) para no reintroducir los valores por defecto de Tailwind; si `tracking-*` o
   `max-w-*` por defecto de Tailwind siguen vivos, decide en D137 si se resetean (y comprueba que
   ningún archivo usaba uno de esos por defecto: `git grep -n "tracking-\(tight\|wide\|normal\)\|max-w-prose"`).
   Extiende `tests/unit/tokens-css.test.ts` con los grupos nuevos.
3. **Reemplazo** de los `[…]` con valor literal y de los sustitutos (tabla del brief) en los archivos
   de la ola 3. Lista (origin/main @ 22e3360, `git grep -l -E "(text|tracking|leading|max-w|w|grid-cols|top|rounded-t|auto-rows|min-h|mb|size)-\[[0-9.-]" -- components app`):
   `app/dashboard/(panel)/page.tsx`, `app/pago/resultado/page.tsx`, `app/proyectos/ProyectosClient.tsx`,
   `app/proyectos/[slug]/ProjectDetailClient.tsx`, `components/brand/Logo.tsx`,
   `components/layout/{DashboardShell,Footer}.tsx`, `components/sections/{Agenda,Hero,History,Leaders,Projects,Sermons,ServiceAreas,SocialLinks,Tithe}.tsx`,
   `components/status/StatusScreen.tsx`, `components/ui/{AgendaItem,DashboardAuthShell,DashboardStatBand,InstagramPostDialog,LeaderCard,PhotoAnchorBand,ProjectCard,ProjectDetailContent,ProjectSidebar,PublicPageSkeleton,ServiceAreaCard,TimelineZigzagItem,TitheModal,YoutubeEmbedCard}.tsx`,
   `components/ui/skeletons/{AgendaSkeleton,PagosSkeleton,ResumenSkeleton,skeletonParts}.tsx`;
   y los sustitutos en `components/ui/DateField.tsx:295,310` (`size-7.5 p-1.25`),
   `PaymentStep.tsx:129` (`size-7 p-1.25`), `:651`, `:689` (`text-inherit hover:bg-accent`),
   `:692` ("Reintentar" → `Alert action` si está en un `Alert`), `app/dashboard/(panel)/page.tsx:141`
   (indicador `secondary`), `DashboardStatBand.tsx:48` (`text-white/55`: token `onNavy.*` más
   cercano **solo si el contraste no baja**; si no hay uno igual, déjalo y dilo), "Otro monto" de
   `AmountSelector.tsx` (`Field hideLabel` si encaja). **No toques** los archivos de W1 (brief ›
   Unidades), ni `ConfirmDialog.tsx`, ni `skeletons/{SkeletonFrame,ProyectosSkeleton}.tsx`.
4. **Qué no es un valor mágico** (se queda): variantes y selectores (`data-[side=left]`,
   `has-[input:focus-visible]`, `**:data-[slot=…]`), listas de `transition-[…]`, expresiones con
   `var(...)`/`calc(... var ...)`/`color-mix` en primitivas, `rounded-[inherit]`, `size-[1em]`,
   `col-[1/-1]`. Los demás literales (`w-[70%]`, `top-[-12%]`, `rounded-t-[14px]`,
   `sm:auto-rows-[108px]`, `md:grid-cols-[1fr_340px]`, `min-h-[60vh]`, `mb-[0.35em]`…): token si
   se repite o tiene nombre de diseño; si es un valor único de un componente, una variable CSS con
   nombre en el propio componente o déjalo con un comentario `/* valor único: … */` — decide la
   regla en D138 y aplícala igual a todos.
5. **Idéntico a la vista:** cada reemplazo debe dar el mismo valor computado. Mide con un script
   `.qa/computed.mjs` (Playwright, `getComputedStyle` de los elementos tocados) en main y en la
   rama, rutas públicas (`/`, `/proyectos`, `/proyectos/<slug>`, `/pago/resultado`, `/estados`,
   `/dashboard/login`) a 360, 1280 y 1920 px; diff vacío o explicado. Para el panel con sesión
   (no tienes Docker), compara las clases generadas del CSS (`.next/static` del dev) por valor.

### Trampas
- `--spacing: 4px`: `max-w-md` y similares resuelven al espaciado; por eso los anchos van con
  nombre propio (`max-w-agenda`, `max-w-panel`, `max-w-prose`).
- `tests/unit/tokens-css.test.ts` y `shadcn-config.test.ts` vigilan tus archivos; `global-styles.test.ts`
  vigila `globals.css` (no lo toques: es de la ola 5).
- `text-38`, `text-44`… sin interlineado propio: cuidado con quitar un `leading-*` que iba junto.
- `tracking-[0.18em]` (13 usos) y `tracking-[-0.01em]` (13) son los más comunes: hazlos primero y mide.

### Cómo verificar
- `.qa/computed.mjs` antes/después (arriba); capturas antes/después de `/` y `/proyectos` claro y
  oscuro a 360 y 1280 (deben ser iguales); una página de muestra temporal (sin commitear) con todas
  las variantes nuevas de `button`, `progress`, `alert` y `field hideLabel` en claro, oscuro y navy,
  para capturas y axe.
- typecheck, biome, `bun run test`, axe en las rutas públicas tocadas.
- Al final, `git grep -n -E "-\[[0-9.-]+(px|em|%|vh|ch)?\]" -- components app` solo deja lo que D138
  permite (lístalo en el PR).

### Cierre
Decisiones (D137–D139): tokens nuevos y sus nombres (D137), regla de los valores únicos (D138),
API nueva de las primitivas (D139). Informe con "Formas compartidas que fijaste" (API exacta de
`button`, `progress`, `alert`, `field` y los nombres finales de los tokens: la ola 5 y W1 los usan).
