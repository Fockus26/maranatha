# Prompts — fase migración MUI → shadcn · ola 2 (2026-11-20)

Común a las cuatro: lee primero el brief
`C:\Users\Cesar\Documents\Work\maranatha\context\plans\orchestration-2026-11-20-shadcn-ola2.md`
y, del plan `context/plans/phase-migracion-shadcn.md`, "Decisiones de César", "Reglas de la
fase" y la fila de tu unidad. Mapa hecho sobre `origin/main` @ dd080a4; lo que este prompt
afirma con path:line ya está comprobado: no lo vuelvas a verificar.

Qué pide César (para las cuatro):
> "dejar MUI y desarrollar los componentes con shadcn" — migrar todo, como fase propia; look
> igual con ajustes menores, íconos lucide-react, capturas antes/después por unidad.

Esta ola crea las **primitivas** de `components/ui/` (minúscula, de shadcn) que usarán las
zonas (olas 3–4) y migra **enteros** los compuestos compartidos de tu fila. Los consumidores de
esos compuestos siguen en MUI hasta su ola: tu compuesto migrado tiene que funcionar dentro de
una página MUI sin cambiarla (salvo la prop puntual que tu prompt autoriza).

---

## W1 — `feat/ui-acciones`

Eres el worker **W1**. Rama: `feat/ui-acciones`. Slot y puerto: los del mensaje que te lanza.
Decisiones: **D112–D113**. Filas de CONTENT_CHECKLIST: ninguna. Changeset: `patch`.
Modelo · esfuerzo: **sonnet · medium**. Docker: **no**. Build local: **no**. Servicios de test: **no**.
Decisiones que te restringen: D025 (navy fijo), D067 (transición del toggle de modo), D085/D086
(foco) — `grep -rl "<ID>" context/decisions/` y abre solo esas.

### Qué haces
1. **Primitivas:** `avatar`, `tooltip`, `badge` con el CLI de shadcn (ver brief › Reglas) y
   `components/ui/link.tsx` propio (shadcn no trae uno): ancla con estilo de enlace del sitio
   (el `MuiLink` del tema: color primario por modo, subrayado al hover, foco D085), con
   `asChild` para `next/link`. Ajusta todas a los tokens (sin valores mágicos, sin `text-sm` &c.
   que no existen). Tooltip: el de MUI del sitio (fondo gris oscuro, texto blanco, `text-small`);
   `TooltipProvider` dentro de la propia primitiva o exportado, documentado en tu informe.
   Avatar: la usan `DashboardTopbar`/`LeaderCard` en la ola 3 (iniciales: `initialsOf` de `lib/auth/initials.ts`). Nota: `theme/theme.ts:297-300` ya
   tiene un `maxWidth: 1600` ≥ 1920 para `Container`: no es tuyo (es de W4), solo no lo choques.
2. **Migra `components/ui/SegmentedToggle.tsx`** (135 líneas; MUI `Box` + `useTheme` + framer
   `motion` con indicador deslizante). Hoy es `role="radiogroup"` con `role="radio"` y
   `aria-checked` y flechas (`:61-92`): **conserva esa semántica** (trampa de `UI-LIBRARIES.md`:
   un toggle group de Radix sale como `toolbar`/`group`; si usas Radix, `RadioGroup` o mide el
   rol que renderiza). API sin cambios (`value`, `options`, `onChange`, `aria-label`). Consumidor:
   `components/ui/TitheForm.tsx:219` y `:242` (no lo toques; no le pasa `sx`).
3. **Migra `components/ui/ThemeToggle.tsx`** (59 líneas; `IconButton` MUI + íconos
   `DarkModeRounded`/`LightModeRounded`, `useColorMode` de `theme/ThemeRegistry`). Usa
   `components/ui/button.tsx` (`variant="plain"`, `size="icon"`) y lucide (`Moon`/`Sun`). Props:
   `size?: "small" | "medium"` y `className?: string` (en lugar de `sx`). **Autorizado tocar solo
   la prop en las tres llamadas que pasan `sx`** (archivos de la ola 3):
   `components/layout/DashboardSidebar.tsx:124` (color blanco 75 %, hover `rgba(255,255,255,.08)` → usa
   `text-on-navy-muted hover:bg-on-navy-hover hover:text-on-navy`, el más cercano: listado en el PR),
   `components/layout/DashboardTopbar.tsx:241` (`onNavy.muted` / `onNavy.hover` / blanco: las mismas clases),
   `components/layout/MobileMenuOverlay.tsx:277` (`mutedColor`/`hoverBg`/`textColor` según modo, `:62-66`:
   tradúcelo a `text-muted-foreground hover:bg-… hover:text-foreground` con el token más
   cercano; si falta `--accent`, usa `hover:bg-accent` y dilo: lo añade W2). `Navbar.tsx:245` y
   `PageNavbar.tsx:182` no pasan nada. Comprueba que esos tres sitios ya están dentro de
   `data-surface="navy"` (Sidebar `:46`, Topbar `:99`): si es así, la variante `navy:` dentro del
   propio `ThemeToggle` puede bastar y la llamada queda sin clases — elige lo más simple y dilo.
   Conserva la transición de D067 si vive aquí (regla `.Mui*` de `app/globals.css` que la ola 5
   pasa a selector propio: no la borres; si tu botón la pierde, replícala con un selector propio
   y anótalo).

### Trampas
- `tooltip` de Radix necesita `TooltipProvider`; sin él, error en runtime (no en typecheck).
- El indicador de `SegmentedToggle` usa `motion` (layout): con `prefers-reduced-motion` no anima
  (`useHydratedReducedMotion` de `lib/`); conserva eso.
- No toques `tokens.ts`/`roles.ts`/`tokens.css` (brief › Formas compartidas).

### Cómo verificar
- Capturas antes/después: `/` (navbar con `ThemeToggle`; sección de diezmo con `SegmentedToggle`
  — ancla de la sección en `components/sections/Tithe.tsx`), menú móvil abierto a 360 px
  (`MobileMenuOverlay`), `/dashboard/login`; claro y oscuro, 360 y 1280 px. Panel con sesión
  (`DashboardSidebar`/`Topbar`): página temporal sin commitear con el `ThemeToggle` dentro de un
  `div data-surface="navy"` en los dos modos; captura y contraste de reposo/hover.
- Página temporal con avatar (imagen y fallback de iniciales), tooltip (hover y foco por
  teclado), badge (cada variante) y link (reposo, hover, foco), claro/oscuro; contraste de cada
  par en el informe.
- Teclado en `SegmentedToggle`: Tab entra a la opción activa, flechas mueven y seleccionan;
  rol medido en el DOM (`radiogroup`/`radio`, `aria-checked`).
- typecheck, `bunx biome check` de lo tocado, `bun run test`, `bun run a11y` sobre `/` y
  `/dashboard/login`.

### Cierre
Decisiones (D112–D113): una para las primitivas de acción (link propio, tooltip/provider,
variantes de badge); la otra libre (p. ej. ThemeToggle en navy). PR con "Decisión tomada /
alternativa" y las diferencias visibles (forma de los íconos). Informe con "Formas
compartidas": API de `avatar`, `tooltip`, `badge`, `link`, `ThemeToggle`, `SegmentedToggle`.

---

## W2 — `feat/ui-campos`

Eres el worker **W2**. Rama: `feat/ui-campos`. Slot y puerto: los del mensaje que te lanza.
Decisiones: **D114–D116**. Filas de CONTENT_CHECKLIST: ninguna. Changeset: `patch`.
Modelo · esfuerzo: **opus · medium**. Docker: **no**. Build local: **no**. Servicios de test: **no**.
Decisiones que te restringen: D062 (DateField propio), D089 (TimeField propio), D085 (campos:
borde 2px, sin outline exterior), D086 (foco de campos en `forced-colors`), D099 (ids con
`useId`; dos instancias de `TitheForm`) — ábrelas.

### Qué haces
1. **Primitivas:** `input`, `textarea`, `label`, `select`, `radio-group`, `popover` con el CLI de
   shadcn, y `components/ui/field.tsx` (compuesto propio: etiqueta + control + ayuda + error,
   ids con `useId`, `aria-describedby` a ayuda/error, `aria-invalid`; error con texto, no solo
   color). Estilo = el `TextField` outlined del sitio: `theme/fieldStyles.ts` (16 líneas,
   `SMALL_FIELD_SX`) y el `MuiOutlinedInput`/`MuiInputLabel` de `theme/theme.ts` — borde
   `--input`, hover, foco con borde 2px `--focus-ring` y sin outline exterior (D085), error
   `--destructive`, deshabilitado. La **etiqueta flotante** de MUI puede pasar a etiqueta fija
   encima del campo (ajuste menor aceptado por César): decide, mide el alto resultante y
   anótalo en el PR. `theme/fieldStyles.ts` **no se borra** (lo usan 7 archivos MUI hasta la ola 3–4).
2. **`--accent` / `--accent-foreground`** (dueño W2, brief › Formas compartidas): en
   `theme/roles.ts` + `scripts/tokens-css.ts`, regenera `app/tokens.css`, y ajusta
   `tests/unit/tokens-css.test.ts` si su lista de roles lo requiere. Contraste del texto sobre
   `bg-accent` en claro, oscuro y navy en el informe.
3. **Migra `components/ui/DateField.tsx`** (423 líneas: `Popper` + `ClickAwayListener` +
   `IconButton` + `motion`, calendario propio de D062) y **`components/ui/TimeField.tsx`**
   (436 líneas: `Popper` + `ButtonBase` + columnas, D089; importa `DateField`). Usa tus
   `popover`, `field`/`input` y `button.tsx`; lucide (`Calendar`, `ChevronLeft`, `ChevronRight`,
   `Clock`). **API sin cambios** (`DateFieldProps` y `TimeFieldProps`: `label`, `value`,
   `onChange`, `error`, `helperText`, `max` / `required`). Consumidores, sin tocarlos (ninguno
   pasa `sx`): `DashboardAgenda.tsx:249,262`, `DashboardProjectForm.tsx:284`, `PaymentStep.tsx:670`.
   Conserva todo el comportamiento de teclado, ARIA y foco que documentan D062/D089 (léelo en el
   archivo y en la decisión; es la parte de riesgo de la unidad): navegación del calendario con
   flechas, Escape devuelve el foco al campo, cierre al hacer clic fuera (Radix Popover lo da:
   mide que no se pierda nada), `prefers-reduced-motion`.
   Convivencia: hasta la ola 3–4 estos dos campos se ven **al lado de `TextField` MUI** en el
   mismo formulario (PaymentStep, DashboardAgenda): su alto, borde, radio, etiqueta y texto de
   error tienen que alinear con los MUI vecinos. Mídelo (alto en px de un `TextField` small vs
   tu campo) y, si la etiqueta fija rompe la alineación, prioriza alinear y dilo.

### Trampas
- `PaymentStep` vive en las dos instancias de `TitheForm` (D099): ids siempre con `useId`, nunca
  fijos; el modal no monta cerrado.
- Radix Popover se porta a `body`: su `z-index` debe quedar sobre el `Dialog`/`Drawer` MUI del
  panel (`DashboardFormDrawer`, `TitheModal`): usa `z-modal`/`z-dropdown` y mídelo dentro del
  modal de diezmo. Y el foco atrapado del `Dialog` MUI puede robarle el foco al popover portado
  fuera: compruébalo (si pasa, `container` del portal dentro del contenido o `modal` en el
  popover; elige y dilo en la decisión).
- `forced-colors` (D086): borde de foco visible en alto contraste con selectores propios, no `.Mui*`.
- Tras `shadcn add`, `git checkout package.json bun.lock` (brief).

### Cómo verificar
- Capturas antes/después: flujo de diezmo hasta el paso con `DateField` (`/` › sección de diezmo
  → paso 2 de un método manual; también en el modal de diezmo), claro y oscuro, 360 y 1280 px,
  con el calendario abierto. `TimeField` y el `DateField` del panel: página temporal sin
  commitear con ambos al lado de un `TextField` MUI `size="small"` con `SMALL_FIELD_SX` (estado
  normal, foco, error con `helperText`, abierto), en los dos modos.
- Teclado completo de los dos selectores (abrir, mover, elegir, Escape, Tab fuera) y el rol/ARIA
  medido en el DOM; foco visible en `forced-colors` (Playwright `forcedColors: "active"`).
- Página temporal con cada primitiva (input, textarea, select abierto, radio-group, field con
  error); contrastes en el informe.
- typecheck, biome, `bun run test`, `bun run a11y` sobre `/`.

### Cierre
Decisiones (D114–D116): estilo de campo shadcn (etiqueta, alturas, D085 en la forma nueva);
`DateField`/`TimeField` sobre Radix Popover (portal, foco, z-index); la tercera libre (p. ej.
`--accent`). Informe con "Formas compartidas": API de `field`, `input`, `textarea`, `label`,
`select`, `radio-group`, `popover` con un ejemplo de formulario (el que copiará la ola 3 de pagos).

---

## W3 — `feat/ui-superposiciones`

Eres el worker **W3**. Rama: `feat/ui-superposiciones`. Slot y puerto: los del mensaje que te lanza.
Decisiones: **D117–D118**. Filas de CONTENT_CHECKLIST: ninguna. Changeset: `patch`.
Modelo · esfuerzo: **sonnet · medium**. Docker: **sí** (`qa:local`, único de la ola). Build
local: **no**. Servicios de test: **no**.
Decisiones que te restringen: D057 (sin overlay blanco en modales oscuros), D085 (foco),
D099 (el modal no monta cerrado) — ábrelas.

### Qué haces
1. **Primitivas:** `dialog`, `sheet`, `alert`, `sonner` con el CLI de shadcn, ajustadas a tokens:
   - `dialog`: fondo `bg-card`, sin el overlay blanco que MUI pone en papel oscuro (D057),
     backdrop `bg-black/50` (o el valor del `MuiBackdrop`/`MuiDialog` de `theme/theme.ts`),
     `z-modal-backdrop`/`z-modal`, radio y sombra del `MuiDialog` actual, botón de cerrar con
     lucide `X` y nombre accesible en español. `sheet`: el mismo lenguaje (lo usarán
     `DashboardFormDrawer` y `MobileMenuOverlay`; ancho `max-w-form-drawer`).
   - `alert`: variantes por severidad (`success`, `info`, `warning`, `error`) como los `Alert`
     MUI del sitio (9 archivos, p. ej. `components/ui/DashboardLoginForm.tsx`,
     `PaymentStep.tsx`), con ícono lucide y el estado dicho en texto/ícono, no solo color.
   - `sonner`: el reemplazo de los 5 `Snackbar` (`components/sections/Tithe.tsx:7`,
     `TitheModal.tsx:9`, `DashboardAgenda.tsx:16`, `DashboardPayments.tsx:16`,
     `app/proyectos/[slug]/ProjectDetailClient.tsx:10` — no los migres: son de las olas 3–4;
     mira cómo se ven para igualarlo). Trampa de `UI-LIBRARIES.md`: con `unstyled` pierde el
     ancho y la pila; el toast del proyecto trae su ancho, el `gap` de la pila, `z-toast`,
     posición y duración (la del `autoHideDuration` actual) — **test** (Playwright) que mide el
     ancho a 1280 y 360 px. Monta `<Toaster />` una vez en `app/layout.tsx` (único cambio en
     ese archivo) para que las olas siguientes solo llamen `toast()`; con `aria-live` correcto.
2. **Migra `components/ui/ConfirmDialog.tsx`** (86 líneas; `Dialog`, `DialogTitle`,
   `DialogContent(Text)`, `DialogActions`, `Button` MUI) a tu `dialog` + `button.tsx` (variante
   destructiva = la del botón de error actual; si `button.tsx` no tiene color error, usa
   `className` con `bg-destructive text-destructive-foreground` y anótalo en "Primitivas que
   faltaron"). **API sin cambios** (`ConfirmDialogProps`: `open`, `title`, `description: ReactNode`,
   `confirmLabel`, `cancelLabel`, `destructive`, `onConfirm`, `onClose`, `pending`). Conserva:
   con `pending`, botones deshabilitados y sin cerrar con Escape/clic fuera; foco inicial y
   retorno del foco al disparador. Consumidores (sin tocarlos, no pasan `sx`):
   `DashboardAgenda.tsx:589`, `DashboardFormDrawer.tsx:177`, `DashboardPayments.tsx:1124`,
   `DashboardTable.tsx:643`.

### Trampas
- `ConfirmDialog` se abre **desde dentro** de `DashboardFormDrawer` (un `Drawer` MUI con su
  propio foco atrapado y `z-index`): tu dialog Radix portado a `body` debe quedar encima y
  recibir el foco. Mídelo en el panel con sesión; si el focus-trap de MUI se lo roba, elige la
  salida (p. ej. `disableEnforceFocus` no se puede tocar: es del Drawer, ola 4 — entonces el
  portal o `onOpenAutoFocus`) y escríbela en la decisión.
- `body` con `overflow: hidden` / `padding-right` que ponen Radix y MUI a la vez: sin salto de
  scroll al abrir.
- No toques `tokens.ts`/`roles.ts`/`tokens.css`.

### Cómo verificar
- `bun run qa:local -- --port <tu puerto>` (Docker). Con sesión de admin de prueba: antes/después
  de abrir `ConfirmDialog` en `/dashboard/agenda` (eliminar un evento), en `/dashboard/pagos`
  (rechazar/eliminar), y desde el drawer de `/dashboard/proyectos` (descartar cambios), claro y
  oscuro, 360 y 1280 px. Antes = `main` contra la misma base local (`scripts/run-on-main.sh`).
  Teclado: foco inicial, Tab atrapado, Escape, retorno del foco. No confirmes ninguna acción que
  borre datos que necesites; es la base local, pero deja constancia de lo que hiciste.
- Página temporal sin commitear: `dialog`, `sheet`, cada `alert`, y un `toast()` de cada tipo
  (con la medida de ancho), claro/oscuro; contrastes en el informe.
- typecheck, biome, `bun run test`, `bun run a11y` sobre `/` y `/dashboard/login`. Baja los
  contenedores al terminar.

### Cierre
Decisiones (D117–D118): superposiciones sobre Radix (dialog/sheet, D057 en la forma nueva,
convivencia con el foco de MUI); toast con sonner (ancho, pila, duración, dónde se monta).
Informe con "Formas compartidas": API de `dialog`, `sheet`, `alert`, `toast()` y `ConfirmDialog`.

---

## W4 — `feat/ui-estados`

Eres el worker **W4**. Rama: `feat/ui-estados`. Slot y puerto: los del mensaje que te lanza.
Decisiones: **D119–D121**. Filas de CONTENT_CHECKLIST: ninguna. Changeset: `patch`.
Modelo · esfuerzo: **sonnet · medium**. Docker: **no**. Build local: **no**. Servicios de test: **no**.
Decisiones que te restringen: D067 (estados de carga y vacíos), D087 (animación de listas y
pasos), D025 (navy) — ábrelas.

### Qué haces
1. **Primitivas:** `skeleton`, `progress`, `tabs` con el CLI de shadcn y
   `components/ui/container.tsx` propio (el `Container` MUI: `maxWidth` lg/md/sm del tema,
   gutters por breakpoint y el escalón `maxWidth: 1600` ≥ 1920 de `theme/theme.ts:297-300` —
   léelos ahí; 12 archivos lo usan hoy). Ajusta a tokens.
   `progress`: también la versión indeterminada (la de `LinearProgress`/`NavigationProgress`).
   `tabs`: rol `tablist`/`tab` medido; foco D085.
2. **Tokens (dueño W4):** `--muted` (brief › Formas compartidas) y los **tamaños de h1–h4 y body
   desde 1920 px** (72/52/36/26 y 20/18) que hoy están a mano en `theme/theme.ts` sin token: a
   `theme/tokens.ts`, generados por `scripts/tokens-css.ts` a `app/tokens.css` (que `text-h1`…
   `text-body` tengan su paso ≥ 1920), y `theme.ts` los lee del token (mismo valor: sin cambio
   visible). Ajusta `tests/unit/tokens-css.test.ts` si hace falta.
3. **Utilidades de tipografía:** si `text-h1`… ya bastan (ola 1), solo documenta en tu informe
   cómo traducir cada `Typography variant` (h1–h6, subtitle, body1/2, caption, overline) a clases
   (familia, peso, tamaño, interlineado, color) — tabla que la ola 3 copia. Si falta una
   combinación repetida, una utilidad `@utility` en `app/globals.css` (solo eso de ese archivo).
4. **Capa de patrón:** `components/ui/pattern-layer.tsx` (o utilidad CSS) equivalente a
   `patternLayerSx` de `theme/patterns.ts:37-47` (tile SVG de `PATTERN_TILE` px, pan de un tile,
   sin animación con `prefers-reduced-motion`). `theme/patterns.ts` **no se borra** (lo usan
   `Tithe.tsx`, `DashboardAuthShell.tsx`, `DashboardStatBand.tsx`, `TitheModal.tsx` hasta la ola 3).
5. **Mapa de íconos MUI → lucide:** `context/plans/mapa-iconos.md` en la **carpeta principal**
   (local; si no puedes escribir ahí, va entero en tu informe). Lista todos los íconos de
   `@mui/icons-material` importados en `app/` y `components/` (`git grep -h "@mui/icons-material/" -- app components`,
   ~60 distintos), cada uno con su lucide más cercano y la nota si cambia de forma de manera
   visible; más los tamaños: `fontSize` small/medium/large y los `sx={{ fontSize: n }}` → clase
   `size-*` por token. Comprueba que cada nombre lucide existe en la versión instalada
   (`node_modules/lucide-react`).
6. **Migra** `components/ui/EmptyState.tsx` (99 líneas: `Box`, `Button`, `Typography`,
   `useTheme`), `components/ui/Reveal.tsx` (56: `useTheme` + `useMediaQuery` + `motion`) y
   `components/ui/StepTransition.tsx` (116: `Box` + `motion`, D087).
   - `EmptyState`: prop `icon` con el tipo del brief (acepta lucide y MUI); botón con
     `button.tsx`. Consumidores sin tocar (pasan íconos MUI): `app/dashboard/(panel)/page.tsx:165`,
     `app/dashboard/(panel)/proyectos/page.tsx:186`, `app/proyectos/ProyectosClient.tsx:237`,
     `DashboardAgenda.tsx:410`, `DashboardPayments.tsx:835`, `DashboardTable.tsx:124`.
   - `Reveal`: el `useMediaQuery` de MUI se va (un `matchMedia` propio o el breakpoint por CSS,
     sin desajuste de hidratación; conserva `useHydratedReducedMotion`). API sin cambios
     (`children`, `delay`, `y`). 9 consumidores (secciones): no los toques.
   - `StepTransition`: API sin cambios (`showSecond`, `first`, `second`, `firstRef`…);
     `aria-hidden` y sin foco en el paso oculto, alto animado y reduced-motion (D087).
     Consumidores: `Tithe.tsx:232`, `TitheModal.tsx:330`, `ProjectDetailClient.tsx:157`.

### Trampas
- `Reveal` y `StepTransition` se renderizan en el servidor: sin `window` en el render; mide que
  no hay warning de hidratación en consola.
- El ícono MUI pasado a `EmptyState` recibe `className`: su tamaño por `font-size` de MUI puede
  ganarle a `size-*` (Emotion sin capa). Mide el tamaño real en una de las páginas que pasan
  íconos MUI y, si no cuadra, fíjalo con la prop que el ícono MUI respete sin `sx` y dilo.
- `--muted` lo añade W4; `--accent` lo añade W2 en paralelo (líneas vecinas de `roles.ts`): si
  W2 mergea primero, `git merge origin/main`, conserva ambos y regenera.

### Cómo verificar
- Capturas antes/después: `/` (secciones con `Reveal`; diezmo con `StepTransition` al pasar al
  paso 2), `/proyectos` (estado vacío: si no hay forma de vaciarlo sin datos, página temporal),
  `/proyectos/<slug>` (aporte paso 1 → 2), claro y oscuro, 360 y 1280 px; y a 1920 px una
  página con h1–h4 para comprobar que los tamaños grandes no cambian. `EmptyState` del panel y
  cada primitiva (skeleton, progress determinado/indeterminado, tabs, container, capa de patrón
  sobre navy): página temporal sin commitear, en los dos modos; contrastes en el informe.
- `prefers-reduced-motion` (Playwright `reducedMotion: "reduce"`): sin desplazamiento en
  `Reveal`/`StepTransition` ni pan del patrón.
- typecheck, biome, `bun run test`, `bun run a11y` sobre `/` y `/proyectos`.

### Cierre
Decisiones (D119–D121): tokens de 1920 y `--muted`; patrón y transiciones sin MUI; el mapa de
íconos y sus tamaños. Informe con "Formas compartidas": API de `skeleton`, `progress`, `tabs`,
`container`, la capa de patrón, `EmptyState`, la tabla `Typography variant → clases` y la ruta
del mapa de íconos.
