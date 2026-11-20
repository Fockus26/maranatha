# Prompts de la tanda 2026-11-10

Brief compartido: `C:\Users\Cesar\Documents\Work\maranatha\context\plans\orchestration-2026-11-10.md`

---

## W1 — `fix/instagram-visor`

Eres el worker **W1**. Rama `fix/instagram-visor`. Decisiones: **D083–D084**. Filas
CONTENT_CHECKLIST: ninguna. Modelo · esfuerzo: sonnet · medium. Docker: no. Servicios de
test: no.

Lee primero el brief compartido. Decisiones previas: D035 (tres cuentas de Instagram con
selector) — `cat context/decisions/D035-*.md`.

### Qué pide César
> "en la parte del redes sociales el boton seguir que esta en las tabs no tiene un contraste
> que se note en su modo default ni en su modo hover"
>
> "al abrir el modal el boton de la x esta muy pegado en la esquina necesita algo de padding
> el boton dar like o comentar en instagram tiene el mismo problema que el boton seguir
> ademas esta muy largo el texto, preferiria que dijera dar like o comentar y un icono de
> apuntar a nueva pestaña, me gustaria que se pudiera pasar del slide cuando es un carousel
> de fotos al hacer scroll horizontal hacia la izquierda o derecha, me gusta que se pueda
> hacer con los botones y arrastrando como esta ahorita solo que agregar esta manera tambien"
>
> "las imagenes del instagram estan viniendo un poco de mala calidad esto se puede mejorar?"
>
> "Me gustaria que la imagen tuviera un mejor aspect ratio, ya que algunas imagenes utilizan
> un cover y deberia de ser contain para que se vea toda la imagen, pero que en el apartado
> de la imagen no queden espacios sin llenar, es decir el modal ajusta su width segun el
> aspect ratio de esta imagen"

### Dónde está
- `components/ui/SocialLinkCard.tsx:121-143` — botón "Seguir": `outlined` con
  `borderColor: divider` y `color: text.secondary` (medido en claro: texto rgb(67,74,99),
  borde rgb(203,208,224) sobre fondo transparente → el borde no llega a 3:1).
  Lo usa `components/sections/SocialLinks.tsx:256-268` (`ctaLabel="Seguir"`).
- `components/ui/InstagramPostDialog.tsx:369` — `IconButton` Cerrar con `edge="end"`
  (margen negativo: por eso queda pegado a la esquina).
- `components/ui/InstagramPostDialog.tsx:477-497` — CTA "Dar like o comentar en Instagram",
  mismo tratamiento outlined gris (`borderColor: divider`, `color: text.primary`).
- `components/ui/InstagramPostDialog.tsx:180-270` — escenario: `aspect` fijo
  `"1 / 1"` (o `9/16` en video) con un comentario que dice "los tamaños de Behold son
  cuadrados": **es falso**. Medido hoy en el feed real: imagen
  `small 302x400 · medium 529x700 · large 756x1000 · full 1511x2000` (≈3:4), carrusel
  `300x400…1500x2000`, reel `225x400…1127x2000`. Behold escala por **alto**
  (400/700/1000/2000) y conserva la proporción.
- `components/ui/InstagramPostDialog.tsx:85-112` — `<img>`/`<video>` con
  `objectFit: "cover"`; `IMAGE_SIZES` en línea 43 = `"(min-width: 900px) 640px, 100vw"`.
- `lib/instagram.ts:129-160` — `toImageSource` arma `src` = `large` y `srcSet` con los
  `width`; el comentario de la línea 9 también dice "cuadrados". El tipo `BeholdSize`
  (línea 79) ya trae `width` y `height`.
- Arrastre actual: `drag="x"` de framer-motion en `InstagramPostDialog.tsx:257-263`
  (`SWIPE_PX = 60`, línea 46); botones Anterior/Siguiente en 272-290; flechas del teclado
  en el `onKeyDown` del Dialog (línea 198).
- Miniaturas de la grilla: `components/sections/SocialLinks.tsx` (~líneas 380-450), celdas
  `aspectRatio: "4 / 5"`; revisa qué `sizes`/`src` usan.

### Enfoque decidido
1. **Contraste de Seguir y del CTA del modal**: en reposo, borde y texto que cumplan
   (texto ≥ 4.5:1, borde ≥ 3:1 contra el fondo real del card/panel, claro y oscuro); en
   hover, un cambio que se note (p. ej. fondo `primary` con texto contraste, o borde+texto
   `primary.main` con un fondo de alpha mayor) — elige con tokens y deja los pares
   medidos en el PR. Mismo tratamiento para los dos botones (son la misma clase).
2. **CTA**: texto "Dar like o comentar" + icono de pestaña nueva (`OpenInNewRounded` de
   `@mui/icons-material`, como `endIcon`; el de Instagram puede quedarse al inicio o
   quitarse, decide y explica). El nombre accesible debe seguir diciendo que es Instagram
   y que abre pestaña nueva (`aria-label`, p. ej. "Dar like o comentar en Instagram
   (pestaña nueva)").
3. **X**: quitar `edge="end"` y darle aire (padding/margen con tokens de espaciado) para
   que no quede pegada a la esquina del panel; área táctil ≥ 44 px.
4. **Rueda / trackpad horizontal**: en el escenario de un carrusel, `wheel` con
   `|deltaX| > |deltaY|` pasa de diapositiva (`go(±1)`), con umbral acumulado y un
   bloqueo hasta que termine la animación (un gesto de trackpad dispara decenas de
   eventos: un gesto = una diapositiva). `preventDefault` solo en ese caso (listener no
   pasivo, vía `addEventListener` en un ref). El scroll vertical no se toca. Botones,
   arrastre y flechas siguen igual.
5. **Calidad**: corrige `IMAGE_SIZES` para el ancho real del escenario en cada breakpoint
   (el modal ahora cambia de ancho) y asegúrate de que el `srcSet` use descriptores `w`
   correctos para cada medio; revisa también las miniaturas de la grilla (que su `sizes`
   no elija la de 302 px en pantallas de DPR 2). Mide qué `currentSrc` elige el navegador
   a 1440 px DPR 1 y DPR 2 antes y después, y ponlo en el PR.
6. **Aspect ratio**: la proporción del escenario sale del medio (`width/height` del
   tamaño de Behold, que `lib/instagram.ts` debe exponer en `InstagramMedia`, p. ej.
   `aspectRatio: number`). `objectFit: "contain"` y el escenario con exactamente esa
   proporción, así que no quedan franjas vacías. En desktop (md+) el alto del escenario se
   mantiene (`min(640px, 85vh, …)`) y el **ancho del diálogo** sale de la proporción; en
   mobile (fullScreen) el ancho es 100 % y el alto sale de la proporción, con un tope para
   que el panel de texto siga visible. En un carrusel con medios de proporciones distintas,
   el escenario usa **la proporción del primer elemento** para que el diálogo no salte
   entre diapositivas, y los demás van en `contain` sobre el color `placeholder`
   (decisión conservadora; explica la alternativa en el PR). Si falta `sizes`, cae a 4:5
   (formato por defecto de Instagram) para imagen y 9:16 para video. Pon una cota de
   proporción (p. ej. entre 4:5 y 1.91:1, los límites de Instagram) para que un dato raro no
   rompa el layout. Corrige los comentarios que dicen "cuadrados".
   Registra el criterio en D083.

### Trampas conocidas
- `tests/unit/` puede tener tests de `lib/instagram.ts`: `git grep -n instagram -- tests/`
  y actualízalos/añade casos (proporción desde `sizes`, fallback sin `sizes`).
- `useReducedMotion` ya existe en el diálogo: la rueda debe funcionar también con motion
  reducido (solo cambia la animación).
- La grilla de SocialLinks y `SocialLinkCard` son tuyos; `app/globals.css` y
  `theme/theme.ts` son de W2: no los toques (el anillo de foco lo arregla W2).
- Los `<img>` son externos (CDN de Behold): no los pases a `next/image` (no está en
  `remotePatterns` y cambiaría el pipeline); basta con `srcSet`/`sizes` correctos.

### Cómo verificar
- Servidor en tu puerto, home `/`, sección de redes: mide contraste de Seguir en reposo y
  hover (claro y oscuro) y el `getBoundingClientRect` de la X respecto al panel (distancia
  a los bordes > 0, ≥ 8 px).
- Abre un post de imagen, un carrusel y un reel: ancho del escenario / alto = proporción
  del medio (±1 px), sin franjas (el `<img>` llena el escenario), sin scroll horizontal a
  320 px, y el diálogo cabe a 1280×720 y 1920×1080.
- Rueda horizontal: dispara `WheelEvent` con `deltaX` en el escenario y comprueba que
  avanza una sola diapositiva por gesto, y que `deltaY` no cambia de diapositiva.
- Tests nuevos de la capa pura en `lib/instagram.ts`.

### Cierre
Changeset: patch — "Visor de Instagram: las fotos se ven completas y nítidas, el modal se
adapta a cada imagen, se puede pasar de foto con el scroll horizontal y los botones Seguir
y Dar like o comentar tienen mejor contraste."
En el PR, "Decisión tomada / alternativa" para: proporción en carruseles mixtos, estilo
hover de los botones, icono de Instagram en el CTA. Acciones manuales: ninguna.

---

## W2 — `style/anillo-foco`

Eres el worker **W2**. Rama `style/anillo-foco`. Decisiones: **D085–D086**. Filas
CONTENT_CHECKLIST: ninguna. Modelo · esfuerzo: sonnet · medium. Docker: no. Servicios de
test: no.

Lee primero el brief compartido. Decisiones previas: `git grep -ln "foco\|focus" --
context/decisions/` y abre solo las que traten del anillo de foco (el comentario de
`theme/theme.ts:329` cita "design-qa fase 09").

### Qué pide César
> "Cuando haces un focus active sobre los botones desde el teclado se muestra como en la
> imagen y se ve feo"
>
> "cuando se muestra el outline niterfiere con el placeholder"

Lo leo así: (1) el anillo de foco de teclado de los botones se ve mal; (2) el outline del
foco de los campos de texto cruza la etiqueta flotante (el "placeholder" que sube al borde).
César eligió: **anillo naranja 2px, offset 2px, que sigue la forma de cada control, sin el
ripple pulsante**; e **inputs sin outline exterior, borde del propio campo en naranja 2px**.

### Dónde está
- `app/globals.css:54-62` — regla global `a, button, [role=button], [tabindex],
  .MuiButtonBase-root :focus-visible { outline: 2px solid #f9750d; outline-offset: 2px;
  border-radius: 3px; }`. El `border-radius: 3px` **cambia el radio del propio control**
  al enfocarlo (un botón con `radius.sm`, un chip o un IconButton redondo pasan a 3 px):
  esa es la causa principal de que se vea feo.
- MUI añade además el ripple de foco (`focusRipple`, pulso) en `Button`/`IconButton`/
  `ButtonBase`: se desactiva con `disableRipple`? **No** — el ripple de clic se queda;
  se quita solo el de foco con `defaultProps: { focusRipple: false }` en `MuiButtonBase`
  (y verifica que `Button` no lo vuelva a activar: en MUI `Button` pasa `focusRipple` a
  `ButtonBase`; ponlo también en `MuiButton`/`MuiIconButton` si hace falta). Comprueba en
  `node_modules/@mui/material/Button/Button.js` cómo lo pasa la versión instalada.
- `theme/theme.ts:325-337` — `MuiOutlinedInput.root["&.Mui-focused"]` con `outline 2px
  secondary[500]` + `outlineOffset: 2`: es lo que cruza la etiqueta.
- `app/globals.css:107-113` — en `forced-colors`, `.MuiInputBase-root.Mui-focused` con
  outline `Highlight` (ajústalo al nuevo criterio: en alto contraste el borde del
  fieldset sí se pinta con colores de sistema; deja el foco visible ahí).
- `app/globals.css:47-52` — skip link (no lo cambies salvo que choque).
- `theme/fieldStyles.ts` — estilos de campos pequeños.

### Enfoque decidido
1. Quita `border-radius: 3px` de la regla global; el outline sigue el radio del elemento
   (los navegadores actuales ya lo curvan). Mantén color `#f9750d` (= `secondary[500]`),
   2 px, offset 2 px. Si `globals.css` usa hex porque no puede leer tokens, mantenlo así
   (ya existe ese patrón); si hay una variable CSS del token disponible, úsala.
2. Quita el ripple de foco de MUI (no el de clic) desde `theme/theme.ts`.
3. Revisa casos donde el outline queda cortado por `overflow: hidden` del padre (tarjetas,
   tabs, `ButtonBase` de la grilla de Instagram, filas del dashboard): usa `outline-offset`
   negativo **solo** donde se corte, por componente con `sx` — pero si el componente es de
   otra unidad de la tanda (ver tabla del brief: `InstagramPostDialog`, `SocialLinks`,
   `SocialLinkCard`, `DashboardPayments`, `DashboardTable`, `TitheModal`, `PaymentStep`,
   `ProjectDetailClient`, `DashboardAgenda`, `DateField`), no lo toques: anótalo en el
   informe como "visto de paso".
4. Inputs: elimina el outline de `MuiOutlinedInput` y pinta el `notchedOutline` en
   `secondary[500]` con `borderWidth: 2` en `&.Mui-focused` (también en estado `error`:
   decide si el foco con error se ve rojo 2 px o naranja; conservador: rojo, porque el
   estado de error manda, y que el grosor marque el foco). Mismo criterio para
   `MuiFilledInput`/`MuiInput` si se usan (`git grep -n "variant=\"filled\"\|variant=\"standard\"" -- app components`).
   El color de la etiqueta enfocada (`MuiInputLabel` / `MuiFormLabel` `.Mui-focused`)
   debe tener 4.5:1 sobre el fondo: si el naranja no llega, deja la etiqueta en
   `text.primary`/`primary` y solo el borde naranja.
   Ojo: `components/ui/DateField.tsx` tiene su propio campo (es de W4): no lo edites; si
   no hereda el nuevo foco, anótalo para el informe.
5. Registra el criterio en D085 (anillo de foco y foco de campos), reemplazando lo que
   diga la decisión anterior si la hay (cítala).

### Trampas conocidas
- Contraste: el anillo naranja sobre navy/naranja (navbar, CTA del hero, sidebar navy del
  dashboard D024) puede no llegar a 3:1. Mide en esos fondos; si no llega, aplica en esos
  contextos un anillo blanco (o `outline-color` alterno) por componente/zona — es la misma
  clase y entra en tu unidad si el archivo no es de otra.
- `tests/unit/tokens.test.ts` vigila valores mágicos: córrelo.
- No toques el resto de `theme.ts` ni `globals.css` más allá del foco.

### Cómo verificar
- Script de Playwright en `.qa/` que recorre con Tab `/`, `/proyectos`, un proyecto,
  `/dashboard/login` (público) y mide, para cada elemento enfocado: `outline-style`,
  `outline-color`, y que `border-radius` computado con foco == sin foco. Antes (en `main`
  vía `bash scripts/run-on-main.sh` si existe, si no, con `git stash`-free: corre el
  ANTES: corre el script contra tu servidor antes de tu primer commit de código (tu
  slot parte de `origin/main`); DESPUÉS: el mismo script al terminar. Ambos resultados en
  el PR. (No existe `scripts/run-on-main.sh` en este repo.)
- Inputs: en un `TextField` con etiqueta enfocado, el `outline-style` del root es `none` y
  el `border-width` del `fieldset` es 2 px naranja; la caja de la etiqueta no se solapa con
  ningún trazo nuevo.
- Sin ripple: tras `Tab` a un botón no existe `.MuiTouchRipple-ripplePulsate`.
- Claro y oscuro, y `forced-colors` (emulado con Playwright `forcedColors: 'active'`).

### Cierre
Changeset: patch — "Foco de teclado más limpio: el anillo naranja sigue la forma de cada
botón y los campos de texto marcan el foco en su borde sin tapar la etiqueta."
En el PR, "Decisión tomada / alternativa" para: color del foco con error, anillo en fondos
oscuros. Capturas: un botón, un IconButton, un chip y un input enfocados (claro/oscuro).

---

## W3 — `feat/animaciones-listas`

Eres el worker **W3**. Rama `feat/animaciones-listas`. Decisiones: **D087–D088**. Filas
CONTENT_CHECKLIST: ninguna. Modelo · esfuerzo: sonnet · medium. Docker: no. Servicios de
test: no.

Lee primero el brief compartido. Decisiones previas que te limitan: D052 (no animar filas
`<tr>` de DashboardTable: por eso es un grid de divs), D055 (transición de página vía
`template.tsx`, sin `AnimatePresence` anidados en `mode="wait"`) —
`cat context/decisions/D052-*.md context/decisions/D055-*.md`.

### Qué pide César
> "Me gustaria una transicion en las paginas, por ejemplo en el modal cuando pasa al pago"
>
> "agregar animacion en las listas, por ejemplo en el apartado de pagos cuando cambio los
> filtros no hay animacion en los layouts"
>
> "No hay una buena animacion en el buscador de los proyectos al cambiar los elementos de
> la tabla"

Lo leo así: la transición entre páginas ya existe (`components/layout/PageTransition.tsx`,
D055); lo que falta es la transición entre **pasos** dentro de un flujo — el modal de
diezmo y la página de un proyecto al pasar del formulario al paso de pago y al volver.
Las listas: pagos del dashboard al cambiar filtro y la tabla de proyectos del dashboard al
buscar.

### Dónde está
- `components/ui/TitheModal.tsx:340-360` — paso 1 (`TitheForm`) queda montado y oculto con
  `display: none` (para que "Volver" conserve los datos) y `PaymentStep` aparece cuando
  hay `contribution`: cambio seco. `stepOneRef` (línea 136) se usa para devolver el foco.
- `app/proyectos/[slug]/ProjectDetailClient.tsx:43-75, ~169` — mismo patrón con
  `PaymentStep` para aportes a proyectos.
- `components/ui/DashboardPayments.tsx:760-830` — filtros (`f === filter`, línea 763) que
  navegan con `paymentsHref` (línea 521, cambian `?estado=`), y la lista `ul` con
  `rows.map` (línea 825) sin animación.
- `components/ui/DashboardTable.tsx:280-300` y `489-500` — ya hay `AnimatePresence
  initial={false}` + `motion.div layout` con `scale 0.98` y `EASE` (línea 55), pero **sin
  `mode="popLayout"`**: las filas que salen siguen ocupando sitio mientras las nuevas
  entran y el resto salta. La búsqueda está en `app/dashboard/(panel)/proyectos/page.tsx:140-180`
  (incluye un estado vacío con `SearchOffRoundedIcon`).
- Referencia de lo que ya funciona bien: `app/proyectos/ProyectosClient.tsx` usa
  `AnimatePresence mode="popLayout"` para tabs y lista↔cuadrícula.

### Enfoque decidido
1. **Pasos del pago**: transición corta (≈0.25–0.3 s, `EASE [0.2, 0.8, 0.2, 1]`) de
   desplazamiento horizontal + fade: el paso de pago entra desde la derecha y "Volver" lo
   hace salir hacia la derecha mientras el formulario vuelve desde la izquierda. Mantén el
   formulario **montado** (no lo desmontes: perdería los datos) — anímalo con `animate`
   sobre un `motion.div` en vez de `display: none`, y saca de la tabulación / del árbol
   accesible el paso oculto (`inert` o `hidden` al terminar la animación). Que el alto del
   contenedor no salte (anima `height` con `layout` o fija el contenedor). Conserva el
   manejo de foco existente (`stepOneRef`, el foco al título del paso 2 si lo hay).
   Aplícalo igual en `TitheModal` y `ProjectDetailClient` (misma clase): extrae un
   componente pequeño `components/ui/StepTransition.tsx` si evita duplicar.
2. **Lista de pagos**: `AnimatePresence mode="popLayout" initial={false}` con
   `motion.li layout`, entrada/salida fade + 8 px, y escalonado leve (≤ 30 ms por fila,
   tope ~200 ms). Al cambiar de filtro, la lista cambia de `rows`: comprueba que el
   componente no se re-monta entero en la navegación (si se re-monta, anima la entrada con
   `initial` en vez de depender de `exit`). El contador / estado vacío también con fade.
3. **Tabla de proyectos**: `mode="popLayout"` en los dos `AnimatePresence` de
   `DashboardTable`, quita el `scale` si produce texto borroso, y fade del estado vacío de
   búsqueda (que no aparezca de golpe mientras las filas salen).
4. Todo con `useReducedMotion()`: con motion reducido, sin desplazamiento ni layout,
   cambio inmediato (fade de 0 s está bien).
5. Registra en D087 el patrón (duraciones, curva, popLayout, reduced motion) para que las
   próximas listas lo sigan.

### Trampas conocidas
- D055: no metas un `AnimatePresence mode="wait"` que envuelva páginas; los de esta unidad
  son locales a cada lista/paso.
- `popLayout` necesita que el hijo directo acepte ref (`motion.*` o `forwardRef`); con MUI
  `Box component={motion.li}` funciona como ya se hace en `DashboardTable`.
- Las pantallas del dashboard exigen sesión: no inicies sesión. Verifica por código y con
  una página/test aislado solo si te hace falta; el QA con sesión lo hace `wave-qa`.
- El modal de diezmo y la página de proyecto son públicos: ahí sí mide en el navegador
  (abre el modal, llena el paso 1 con datos de prueba **sin enviar pagos**: el paso 2 se
  muestra en cliente; no pulses "Reportar"/"Pagar").
- `PaymentStep.tsx` y `TitheModal.tsx` no los toca otra unidad.

### Cómo verificar
- Modal de diezmo y página de proyecto: al pasar al pago, el contenedor del paso tiene
  `transform` animado (muestras con `requestAnimationFrame`), el paso oculto no recibe
  foco con Tab, "Volver" conserva monto y datos, sin scroll horizontal a 320 px durante la
  transición (`overflow-x` del contenedor), y con `reducedMotion: 'reduce'` no hay
  transform.
- Lista/tabla: no hay entorno DOM de test (sin happy-dom ni jsdom en package.json, verificado);
  verificación por código + lo que pueda
  medirse sin sesión, y "Cómo probar" detallado para `wave-qa` (rol admin: cambiar filtros
  de Pagos, buscar en Proyectos).

### Cierre
Changeset: minor — "Transiciones suaves al pasar al paso de pago y animación de las listas
de pagos y proyectos del panel al filtrar o buscar."
En el PR, "Decisión tomada / alternativa" para: dirección y duración de la transición,
escalonado de la lista.

---

## W4 — `feat/selector-hora`

Eres el worker **W4**. Rama `feat/selector-hora`. Decisiones: **D089–D090**. Filas
CONTENT_CHECKLIST: ninguna. Modelo · esfuerzo: sonnet · medium. Docker: no. Servicios de
test: no.

Lee primero el brief compartido. Decisiones previas: D062 (DateField con calendario
propio), D080 (agenda editable desde el dashboard) — `cat context/decisions/D062-*.md
context/decisions/D080-*.md`.

### Qué pide César
> "al seleccionar la hora de los evenetos aparece el native deberia de ser uno custom para
> mantener el mismo estilo en todo el sitio"

César eligió: **Popper con columnas hora/minuto (saltos de 5) + a. m./p. m., mismo patrón
y estilo que `DateField`**.

### Dónde está
- `components/ui/DashboardAgenda.tsx:266-279` — `TextField type="time"` (label "Hora",
  `required`, `value={form.startTime}` en formato `"HH:MM"` 24 h, error "Elige la hora.",
  `sx={SMALL_FIELD_SX}`).
- `components/ui/DateField.tsx` (415 líneas) — el patrón a seguir: campo que abre un
  `Popper` con `ClickAwayListener`, `motion` para la apertura, `useId`, navegación por
  teclado, `error`/`helperText` como un `TextField`. Léelo entero antes de empezar.
- `lib/agenda/schema.ts` — validación de la hora en el servidor (no cambia: el valor sigue
  siendo `"HH:MM"` 24 h).
- `git grep -n 'type="time"' -- app components` → hoy solo `DashboardAgenda.tsx:268`;
  si aparece otro, entra en tu unidad (misma clase).

### Enfoque decidido
- Nuevo `components/ui/TimeField.tsx` con la misma API que `DateField`
  (`label`, `value: "HH:MM"`, `onChange`, `error`, `helperText`, `required`).
- El campo muestra la hora en formato es-VE de 12 h ("7:30 p. m."); el valor interno es
  `"HH:MM"` 24 h.
- Popper: columnas Hora (1–12), Minutos (00–55 en saltos de 5) y a. m./p. m.; la opción
  elegida resaltada (no solo por color: también peso/borde o check), cada columna
  desplaza su seleccionada a la vista al abrir. Si el valor guardado tiene minutos fuera
  de la grilla (p. ej. 19:07), se muestra tal cual y la columna no marca ninguno hasta que
  se elija (no lo redondees en silencio).
- Accesibilidad: el disparador es un botón/campo con `aria-haspopup="dialog"` y
  `aria-expanded`; cada columna un `listbox` con `aria-label` ("Hora", "Minutos",
  "a. m. o p. m.") y opciones `option` con `aria-selected`; flechas arriba/abajo dentro de
  la columna, Tab/Shift+Tab entre columnas, Enter/Escape cierran (Escape devuelve el foco
  al campo), clic fuera cierra. Áreas ≥ 44 px de alto en táctil. Sigue lo que haga
  `DateField` para el foco y el anuncio.
- Estilo: los mismos tokens, radios, sombras y animación de apertura que `DateField`.
- Reemplaza el `TextField type="time"` en `DashboardAgenda.tsx` por `TimeField`.
- Registra el componente en D089 (y una fila en `context/COMPONENTS_INVENTORY.md` de la
  carpeta principal si existe; es local: si no puedes escribirla, va en tu informe).

### Trampas conocidas
- El anillo de foco global y el foco de inputs los cambia W2 en `app/globals.css` y
  `theme/theme.ts`: no los toques. Si tu campo reutiliza `TextField`/`OutlinedInput`,
  heredará el nuevo criterio solo.
- `DateField.tsx` no es de otra unidad, pero no lo refactorices: copia el patrón; si
  extraes algo común, que sea mínimo y sin cambiar su comportamiento.
- La agenda exige sesión: no inicies sesión. Para verlo en el navegador, monta el
  componente en una ruta temporal **no commiteada** o verifica con un test de la lógica
  pura (parseo/formato `"HH:MM"` ↔ 12 h) en `tests/unit/`.
- `tests/unit/tokens.test.ts` vigila valores mágicos.

### Cómo verificar
- Tests de la capa pura: `"00:00"` → 12:00 a. m., `"12:00"` → 12:00 p. m., `"19:07"`
  mostrado sin redondear, y la composición inversa.
- En navegador (ruta temporal): abrir con clic y con teclado, elegir con flechas, Escape
  devuelve el foco, axe sin violaciones en el Popper abierto, claro y oscuro, a 320 px el
  Popper cabe sin scroll horizontal.
- "Cómo probar" para `wave-qa` (rol admin: crear y editar un evento de la agenda con hora).

### Cierre
Changeset: minor — "Selector de hora propio en la agenda del panel, con el mismo estilo
que el calendario."
En el PR, "Decisión tomada / alternativa" para: minutos fuera de la grilla, formato
mostrado.
