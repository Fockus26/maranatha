# Prompts — fase migración MUI → shadcn · ola 3 (2026-11-20)

Común a las cuatro: lee primero el brief
`C:\Users\Cesar\Documents\Work\maranatha\context\plans\orchestration-2026-11-20-shadcn-ola3.md`
(trae las formas compartidas de las olas 1–2: la API de cada primitiva) y el mapa de íconos
`C:\Users\Cesar\Documents\Work\maranatha\context\plans\mapa-iconos.md`. Del plan
`context/plans/phase-migracion-shadcn.md`: "Decisiones de César", "Reglas de la fase", la fila
de tu unidad y "Para la ola 3". Mapa hecho sobre `origin/main` @ 75306fd; lo que este prompt
afirma con path:line ya está comprobado: no lo vuelvas a verificar.

Qué pide César (para las cuatro):
> "dejar MUI y desarrollar los componentes con shadcn" — migrar todo, como fase propia; look
> igual con ajustes menores, íconos lucide-react, capturas antes/después por unidad.

Esta ola migra **zonas**: cada archivo de tu fila se migra **entero** (cero `@mui/` y
`@emotion/` al final) importando solo las primitivas de `components/ui/` (minúscula) y los
compuestos ya migrados (`EmptyState`, `Reveal`, `StepTransition`, `ConfirmDialog`, `DateField`,
`TimeField`, `ThemeToggle`, `SegmentedToggle`, `PatternLayer`, `brand-icons`). No editas
primitivas ni tokens (brief › Nuevas de la ola 3).

Equivalencias que se repiten: `visuallyHidden` de `@mui/utils` → clase `sr-only`; `keyframes`
de Emotion → `@keyframes` en un CSS Module del componente (no en `globals.css`, que es de la
ola 5) o una animación de `framer-motion`; `alpha(color, n)` → modificador de opacidad del token
(`bg-primary-900/60`); `theme.palette.mode === "dark"` → `dark:`; `theme.breakpoints.down("md")`
→ `max-md:` o `md:`.

---

## W1 — `refactor/shadcn-sitio-marco`

Eres el worker **W1**. Rama: `refactor/shadcn-sitio-marco`. Slot y puerto: los del mensaje que te lanza.
Decisiones: **D122–D124**. Filas de CONTENT_CHECKLIST: ninguna. Changeset: `patch`.
Modelo · esfuerzo: **sonnet · medium**. Docker: **no**. Build local: **no**.
**Servidor y capturas: espera el aviso del orquestador** (brief › Unidades).
Decisiones que te restringen: D023 (navItems, scroll-spy, píldora activa), D025 (navy fijo del
menú móvil), D051 (activo `secondary[700]`), D055 (transición de página), D078 (logo), D079
(pantallas de estado), D084/D092 (botón de acción), D095 (barra de progreso y `loading.tsx`),
D101 (CTA de `ProjectCard` es enlace real; la barra ignora `popstate`), D044 (páginas de
proyectos), D020 (aporte en modal) — `grep -rl "<ID>" context/decisions/` y abre solo esas.

### Archivos (líneas en origin/main)
`components/layout/Navbar.tsx` (281), `PageNavbar.tsx` (218), `Footer.tsx` (233),
`MobileMenuOverlay.tsx` (295), `NavigationProgress.tsx` (165, `keyframes` en `:10`),
`components/brand/Logo.tsx` (129, `@mui/system` `ResponsiveStyleValue` y `sx` en su API),
`components/status/StatusScreen.tsx` (475, `CircularProgress` en `:314`), `app/pago/resultado/page.tsx`
(153), `components/ui/PublicPageSkeleton.tsx` (49), `app/proyectos/ProyectosClient.tsx` (298,
`Tabs` en `:128`, `IconButton` vista grilla/lista), `app/proyectos/[slug]/ProjectDetailClient.tsx`
(205, `Dialog` en `:126` con el aporte y `Snackbar` en `:183`), `components/ui/ProjectCard.tsx`
(343, `outlinedActionSx` en `:199`, `LinearProgress`), `ProjectDetailContent.tsx` (131),
`ProjectSidebar.tsx` (252, `Avatar`, `LinearProgress`, `outlinedActionSx` en `:161`).

### Qué haces
1. Migra los 14 archivos. Navbar/PageNavbar: conserva scroll-spy, píldora activa, `aria-current`,
   alto y `z-navbar`; el menú móvil (`MobileMenuOverlay`) pasa a `sheet` o queda como overlay
   propio con `motion` — elige lo que conserve el foco atrapado, Escape y el retorno del foco al
   botón de menú, y dilo en la decisión. `ThemeToggle` ya migrado ahí: no cambies su llamada.
2. `Logo`: su API pierde `sx` → `className`; **conserva** `variant`, `tone` y `size` como
   `number | { xs: number; sm: number }` (sin `@mui/system`), traducido a clases o a estilo en
   línea. Consumidores: los tuyos (`Navbar.tsx:129`, `PageNavbar.tsx:134`, `Footer.tsx:125` con
   `sx={{ mb: 1.5 }}` → `className="mb-1.5"`, `StatusScreen.tsx:129,142`) y los de W4
   (`DashboardSidebar.tsx:61`, `DashboardTopbar.tsx:135,141,298`), que W4 adapta envolviendo el
   logo en un `<span>` con la clase de visibilidad (no le pasa `sx` ni `className`): no los toques.
   `tone="auto"` hoy lee `theme.palette.mode`: pásalo a `dark:` (el modo llega del servidor).
3. `ProjectDetailClient`: `Dialog` MUI → `dialog` (fullscreen en móvil si hoy lo es); dentro va
   `ProjectContributionForm` + `PaymentStep` (de W3, en paralelo): no los toques; el `DateField`
   de `PaymentStep` ya busca `closest('[role="dialog"]')` para su portal — mide que el calendario
   abra y reciba foco dentro de tu dialog nuevo. `Snackbar` → `toast()`.
4. `ProjectCard`: `layout` vertical/horizontal y props sin cambios (lo usa W2 en
   `components/sections/Projects.tsx:153`); botón de acción = `<Button variant="action">`; la
   CTA sigue siendo enlace real (`asChild` + `next/link`, D101). Barras = `Progress` con
   `aria-label`.
5. `StatusScreen`: las 7 variantes de `app/estados/StatusGallery.tsx` se ven igual; el spinner
   pasa a lucide `LoaderCircle animate-spin` (quieto con reduced-motion) con texto accesible.

### Trampas
- `NavigationProgress` vive en todas las páginas: si su animación cambia de mecanismo, comprueba
  que sigue ignorando `popstate` sin navegación (D101) y que no deja la barra colgada.
- Footer y Navbar usan `Container`: el ancho a ≥ 1920 lo da la primitiva (`max-w-page-*`); compara
  a 1280 y a 1920.
- El orden de encabezados de `/proyectos/[slug]` y de las pantallas de estado se conserva.

### Cómo verificar (tras el aviso)
- Capturas antes/después, claro y oscuro, 360 y 1280: `/` (navbar arriba y con scroll, pie),
  menú móvil abierto a 360, `/proyectos` (grilla y lista), `/proyectos/<slug>` (con el modal de
  aporte abierto y el calendario de `PaymentStep` abierto), `/pago/resultado?status=…` (cada
  estado que la página acepta), `/estados` (las 7 variantes), `/proyectos` cargando (el
  `loading.tsx`: fuerza el esqueleto con una página temporal sin commitear si no se ve).
- Teclado: navbar, menú móvil (Tab atrapado, Escape, retorno del foco), modal de aporte.
- typecheck, biome, `bun run test`, axe (script propio, brief › trampas) sobre esas rutas.

### Cierre
Decisiones (D122–D124): marco (navbar/menú móvil/progreso: mecanismo y foco), proyectos
(dialog de aporte, `ProjectCard`), la tercera libre (p. ej. `Logo` sin `sx`). Informe con
"Formas compartidas": API nueva de `Logo`, `ProjectCard`, `StatusScreen`.

---

## W2 — `refactor/shadcn-sitio-secciones`

Eres el worker **W2**. Rama: `refactor/shadcn-sitio-secciones`. Slot y puerto: los del mensaje que te lanza.
Decisiones: **D125–D127**. Filas de CONTENT_CHECKLIST: ninguna. Changeset: `patch`.
Modelo · esfuerzo: **sonnet · medium**. Docker: **no**. Build local: **no**.
**Servidor y capturas: espera el aviso del orquestador** (brief › Unidades).
Decisiones que te restringen: D028 (parallax del Hero y `PhotoAnchorBand`), D029/D032 (headings
de sección), D030 (una sección = un archivo), D035 (tres cuentas de Instagram con selector),
D039 (agenda en mosaico, hover), D041 (datos de proyectos), D057 (sin overlay blanco en modales
oscuros), D083 (visor de Instagram: escenario con la proporción real, `contain`), D084/D092
(botón de acción) — ábrelas.

### Archivos
`components/sections/Hero.tsx` (434: carrusel, `keyframes` de progreso en `:57`, pausa/reanudar,
`alpha`), `Agenda.tsx` (560: mosaico, "ver más" con `ExpandMore`), `History.tsx` (140),
`Leaders.tsx` (137), `Projects.tsx` (192: usa `ProjectCard` de W1 sin cambiar sus props),
`Sermons.tsx` (233: `Dialog` en `:173` con el embed, `outlinedActionSx` en `:165`),
`ServiceAreas.tsx` (188), `SocialLinks.tsx` (492: `ButtonBase` en `:199` y `:305`, selector de
cuentas), y en `components/ui/`: `AgendaItem.tsx` (142), `LeaderCard.tsx` (81, `IconButton`
Instagram), `PhotoAnchorBand.tsx` (137), `PhotoOverlayCard.tsx` (110), `ServiceAreaCard.tsx` (64),
`SocialLinkCard.tsx` (139, `outlinedActionSx` en `:130`), `TimelineItem.tsx` (118),
`TimelineZigzagItem.tsx` (105, sin uso según D043: **señálalo, no lo borres**; mígralo igual),
`YoutubeEmbedCard.tsx` (137), `InstagramPostDialog.tsx` (579: `Dialog` en `:255`, `useMediaQuery`
en `:181` para `fullScreen` bajo `md`, carrusel con flechas, `Avatar`, `outlinedActionSx` en `:557`).

### Qué haces
1. Migra los 18 archivos. Carrusel del Hero: autoplay, pausa con botón (nombre accesible que
   cambia), flechas, `prefers-reduced-motion` (sin autoplay ni parallax), igual que hoy; la
   barra de progreso del slide como `@keyframes` en un CSS Module o `motion`.
2. `ButtonBase` → `<button type="button">` con las clases y el foco D085 (o `Button variant="plain"`
   si encaja); conserva `aria-pressed`/`aria-selected` que tenga el selector de cuentas.
3. `InstagramPostDialog` y el `Dialog` de `Sermons` → `dialog`; pantalla completa bajo `md` con
   clases (`max-md:` …), no con `useMediaQuery` (sin salto de hidratación). D083: escenario con
   la proporción real del medio y `object-contain`; flechas con teclado (←/→) si hoy las tiene.
   El `if (!post) return <Dialog open={false} />` de `:236` desaparece (Radix no monta cerrado).
4. Botones de acción (`outlinedActionSx`) → `<Button variant="action">` (el `minHeight: 44` de
   `:557` = `size="medium"`).

### Trampas
- Parallax (D028) usa `motion` con scroll: verifica que no cause scroll horizontal a 320 px.
- Los títulos de sección son `h2` reales; el Hero tiene el único `h1` de la home.
- `SocialLinks` mezcla íconos de marca (`brand-icons.tsx`) y lucide; los de marca ya traen `aria-hidden`.
- La sección de diezmo (`Tithe.tsx`) es de W3: no la toques aunque esté en la home.

### Cómo verificar (tras el aviso)
- Capturas antes/después, claro y oscuro, 360 y 1280: `/` entera por secciones (Hero, Agenda
  con "ver más" abierto, Historia, Líderes, Proyectos, Prédicas con el modal abierto, Áreas,
  Redes con cada cuenta y el visor de Instagram abierto a 360 y 1280).
- Teclado: carrusel (Tab a controles, pausa), selector de cuentas, visor (flechas, Escape,
  retorno del foco a la tarjeta), modal de prédica.
- typecheck, biome, `bun run test`, axe sobre `/` claro y oscuro.

### Cierre
Decisiones (D125–D127): Hero (carrusel/animación sin Emotion), visores (`dialog` con pantalla
completa por CSS), la tercera libre. Informe con "Formas compartidas" de lo que expongas.

---

## W3 — `refactor/shadcn-pagos`

Eres el worker **W3**. Rama: `refactor/shadcn-pagos`. Slot y puerto: los del mensaje que te lanza.
Decisiones: **D128–D130**. Filas de CONTENT_CHECKLIST: ninguna. Changeset: `patch`.
Modelo · esfuerzo: **opus · medium**. Docker: **no**. Build local: **no**.
**Servidor y capturas: desde el inicio** (eres uno de los dos con servidor).
Es la unidad de **riesgo**: el flujo de dinero. Lo funcional no cambia ni una línea de lógica
(validaciones, `app/actions/`, `lib/payments/`): solo la capa visual.
Decisiones que te restringen: D049 (modales globales en el layout + store), D057, D074 (pasarela
híbrida), D087 (transición de pasos; "Volver" conserva lo escrito), D098/D105 (sección Ofrendar
y modal comparten la fila texto + formulario), **D099** (sección y modal montan `TitheForm` a la
vez: ids con `useId`, el modal no monta cerrado), D100 (Zinli y Wally retirados), D062/D115
(`DateField` dentro de un modal: portal en el `role="dialog"`), D048 (fondo con patrón) — ábrelas.

### Archivos
`components/sections/Tithe.tsx` (277: `patternLayerSx`, `Snackbar` en `:254`, `Alert`),
`components/ui/TitheForm.tsx` (305: `TextField` con `SMALL_FIELD_SX`, `AmountSelector` en `:199`,
`SegmentedToggle` en `:219`/`:242`), `TitheLayout.tsx` (45), `TitheModal.tsx` (376: `Dialog` en
`:162`, `patternLayerSx`, `Snackbar` en `:353`), `PaymentStep.tsx` (927: `Tooltip` de copiar en
`:115`, `CircularProgress` en `:833`, `TextField`, `Alert`, `outlinedActionSx` en `:620`, subida
de comprobante, `DateField` en `:670`), `AmountSelector.tsx` (199: `TextField`), `DonationFormCard.tsx`
(48), `ProjectContributionForm.tsx` (283: `TextField`, `AmountSelector` en `:235`).

### Qué haces
1. Migra los 8 archivos. `TextField` → `Field` + `Input` (ejemplo de formulario en el brief ›
   Campos); errores bajo el campo con texto (D067), `aria-invalid`, `required`; el alto de la
   caja es 40 px (D114): mide que el paso 1 y el paso 2 no salten de alto más de lo anotado y
   lista la diferencia.
2. `TitheModal`: `Dialog` MUI → `dialog`; sigue sin montar cerrado (D099), abierto desde el store
   de D049 (sin cambiar el store), `PatternLayer` en lugar de `patternLayerSx`. Al pasar a Radix,
   el `container` especial del `DateField`/`Popover` dentro de un modal MUI deja de hacer falta
   para tu contenido — mide que el calendario abre, recibe foco y Escape cierra **solo** el
   calendario, no el modal.
3. `Snackbar` → `toast()` (mismo texto y duración que hoy); `Tooltip` de copiar → `Tooltip`
   (también con foco por teclado; el "Copiado" se anuncia: `aria-live` o el toast); spinner →
   lucide `LoaderCircle animate-spin` con texto accesible; botón de acción → `variant="action"`.
4. Las dos instancias de `TitheForm` (sección + modal abierto a la vez): ningún id duplicado
   (mídelo en el DOM con el modal abierto sobre la home).

### Trampas
- `PaymentStep` también vive en `/proyectos/[slug]` dentro del dialog de W1 (en paralelo): tu
  versión no puede depender de estar en el modal de diezmo.
- No envíes reportes de pago reales (brief › Simular el backend). El paso "reportado" y el error
  del servidor: intercepta la respuesta de la acción solo para depurar, o "No verificado".
- PayPal: el botón/SDK no se toca; solo su contenedor.
- `button.tsx` sin `color="error"`: si lo necesitas, el patrón de `ConfirmDialog` y a "Primitivas
  que faltaron".

### Cómo verificar
- Capturas antes/después, claro y oscuro, 360 y 1280: sección Ofrendar en `/` (paso 1 con cada
  modo del `SegmentedToggle`, montos, error de validación), paso 2 de un método manual (con el
  calendario abierto y con comprobante elegido), PayPal (paso 2), el modal de diezmo (abierto
  desde el navbar) en los mismos pasos, y `/proyectos/<slug>` paso 1 del aporte (el contenedor
  es de W1: captura solo el formulario).
- Teclado del flujo entero sin ratón (Tab, flechas del toggle, copiar, subir archivo, Volver
  conserva lo escrito, Escape del calendario vs el modal).
- `bun run test` (hay tests de pagos: deben seguir verdes sin tocarlos), typecheck, biome, axe
  sobre `/` con el modal abierto y cerrado, claro y oscuro.

### Cierre
Decisiones (D128–D130): formulario de pago sobre `Field` (alturas, errores), `TitheModal` sobre
`dialog` (D099/D049 en la forma nueva), la tercera libre. Informe con "Formas compartidas" y
las diferencias de alto medidas.

---

## W4 — `refactor/shadcn-panel-marco`

Eres el worker **W4**. Rama: `refactor/shadcn-panel-marco`. Slot y puerto: los del mensaje que te lanza.
Decisiones: **D131–D133**. Filas de CONTENT_CHECKLIST: ninguna. Changeset: `patch`.
Modelo · esfuerzo: **sonnet · medium**. Docker: **sí** (`qa:local`, único de la ola). Build local: **no**.
**Servidor y capturas: desde el inicio** (`qa:local` es tu servidor).
Decisiones que te restringen: D024/D025 (navy fijo del panel), D055/D056 (topbar y transición),
D067 (skeletons), D075 (errores de login), D102 (`loading.tsx` por página del panel), D106
(`PasswordField` con ojo), D107 (iniciales del admin por Context), D048 (patrón del
`DashboardAuthShell` y de `DashboardStatBand`), D113 (`ThemeToggle` en navy sin clases) — ábrelas.

### Archivos
`components/layout/DashboardShell.tsx` (70), `DashboardSidebar.tsx` (151), `DashboardTopbar.tsx`
(353: `Drawer` móvil en `:276`, avatar de iniciales D107), `components/ui/DashboardAuthShell.tsx`
(180, `patternLayerSx`), `DashboardLoginForm.tsx` (162), `DashboardForgotForm.tsx` (115),
`DashboardResetForm.tsx` (168), `PasswordField.tsx` (57: `TextField` + `InputAdornment` +
`IconButton`), `DashboardStatBand.tsx` (99: `Skeleton`, `patternLayerSx`; props sin cambios: lo
usa `DashboardPayments.tsx:702`, ola 4), `components/ui/skeletons/*` (6 archivos, ~540 líneas;
`visuallyHidden` → `sr-only`), `app/dashboard/(panel)/page.tsx` (370: `LinearProgress`,
`visuallyHidden`, `EmptyState`).

### Qué haces
1. Migra los 16 archivos. Topbar móvil: `Drawer` → `sheet` (navy, D025), foco atrapado, Escape,
   retorno del foco al botón de menú. Avatar → `Avatar` + `initialsOf` (D107, sin cambiar el
   Context).
2. `PasswordField`: `Field` + `Input` con el botón de ojo dentro de la caja (`Button
   variant="plain" size="icon"`, `aria-pressed` o nombre que cambia, `aria-controls`), D106. Los
   tres formularios de acceso conservan los errores específicos de D075 y su `Alert`.
3. Esqueletos: `Skeleton` de la primitiva; mismas dimensiones (sin salto al cargar, D102).
4. `Logo` es de W1 (en paralelo; conserva `variant`, `tone`, `size` y quita `sx`). En
   `DashboardTopbar.tsx:135-146` los dos `<Logo … sx={{ display: … }} />` pasan a
   `<span className="inline-flex sm:hidden"><Logo variant="mark" tone="inverse" size={32} /></span>`
   (y el otro con `hidden sm:inline-flex`): sin `sx` ni `className` en `Logo`, así compila con
   el `Logo` de `main` y con el de W1. `DashboardSidebar.tsx:61` y `:298` no cambian.
5. Los archivos de la ola 4 (`DashboardPayments`, `DashboardTable`, `DashboardAgenda`,
   `DashboardFormDrawer`, `DashboardProjectForm`, `ImageUploadField`, `proyectos/page.tsx`) siguen
   en MUI dentro de tu marco migrado: mide que se ven igual dentro del shell nuevo (ancho, márgenes).

### Trampas
- El panel vive en `data-surface="navy"` en partes (Sidebar, Topbar): usa la variante `navy:`.
- El login con `qa:local`: no muestres las credenciales; contenedores compartidos, no los bajes.
- `ADMIN_HOST` (`proxy.ts`): no lo toques; en local el panel está en `/dashboard`.

### Cómo verificar
- Capturas antes/después, claro y oscuro, 360 y 1280: `/dashboard/login` (vacío, error,
  contraseña visible), olvido y restablecer (con el token de Mailpit si el flujo lo da; si no,
  "No verificado"), resumen del panel con sesión, menú móvil del topbar abierto a 360, cada
  `loading.tsx` del panel (fuerza el esqueleto con una página temporal sin commitear o
  retrasando la respuesta), y una página de la ola 4 (pagos) dentro del shell.
- Teclado: login entero, ojo de contraseña, menú móvil, sidebar.
- typecheck, biome, `bun run test`, `bun run a11y` (trae el panel con sesión) o script propio.

### Cierre
Decisiones (D131–D133): marco del panel (sheet móvil, navy), acceso (`PasswordField`, D075/D106
en la forma nueva), la tercera libre (p. ej. esqueletos). Informe con "Formas compartidas": API
de `PasswordField`, `DashboardStatBand`, `SkeletonFrame`/`skeletonParts` (la ola 4 los usa).
