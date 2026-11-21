# Formas compartidas de la ola 2 (primitivas, #59–#62) — copiar al brief de la ola 3

Se suman a `formas-compartidas-shadcn.md` (ola 1), que también se copia. Todo en `components/ui/`.
Regla de las olas 3–4: un archivo de zona solo **importa** estas primitivas; si a una le falta algo,
va a "Primitivas que faltaron" del informe.

## Tokens nuevos
- `--accent` / `--accent-foreground` (`bg-accent`): hover/resaltado (claro 4 %, oscuro y navy 8 %). `accentRoles` en `theme/roles.ts` (D116).
- `--muted` (`bg-muted`): skeleton y pistas de progreso (D119).
- Tamaños ≥ 1920 px dentro de `text-h1`…`text-body` (72/52/36/26, 20/18); variante `wide:` (1920); anchos de página `max-w-page-*` (D119).
- Traducción `Typography variant` → clases: `h1` → `font-heading font-extrabold text-h1 leading-h1`; `body1` → `text-body-lg leading-body`; `body2` → `text-body`; `caption` → `text-small`; el resto, en `context/plans/mapa-iconos.md`. Sin `@utility` de texto. El `letter-spacing` de MUI en h1/h2/h4 no se tradujo (si se nota: token `tracking-*`).

## Íconos
- `context/plans/mapa-iconos.md`: cada `@mui/icons-material` usado → su lucide, y los tamaños (`fontSize` small → `size-5`, medium → `size-6`; `sx fontSize n` → `size-n/4`). `aria-hidden` en todo ícono decorativo.
- Logos: lucide ≥ 1.0 no trae marcas → `components/ui/brand-icons.tsx` (`InstagramIcon`, `YoutubeIcon`), 7 usos en Footer, SocialLinks, InstagramPostDialog, LeaderCard, ProjectSidebar, Sermons.
- `SelfImprovement` → `PersonStanding` (cambia de forma).

## Acciones (W1, #59, D112–D113)
- `Avatar` (`size` sm 24 · default 32 · lg 40), `AvatarImage`, `AvatarFallback` (primary-600, blanco, `font-heading`): `<Avatar><AvatarImage src={url} alt="" /><AvatarFallback>{initialsOf(name, email)}</AvatarFallback></Avatar>` (`initialsOf` de `lib/auth/initials.ts`).
- `Tooltip` / `TooltipTrigger asChild` / `TooltipContent` — trae su propio provider (100 ms), no hace falta uno global.
- `Badge` `variant` default · secondary · success · destructive · outline; `asChild`.
- `Link` `tone` primary (def.) · muted; `underline` hover (def.) · always; `asChild` para `next/link`: `<Link asChild tone="muted" underline="always"><NextLink href="/x">Texto</NextLink></Link>`. Primario en oscuro = `primary-300` (AA).
- `ThemeToggle` `size` small · medium · large, `className`; dentro de `data-surface="navy"` no necesita clases.
- `SegmentedToggle` sin cambios de API (radiogroup).

## Campos (W2, #60, D114–D116)
- `Field` (`label`, `description?`, `error?` texto o `true`, `required?`, `disabled?`, `id?`, `className?`): pasa por Slot `id`, `aria-describedby`, `aria-invalid`, `data-field-control` al hijo; función hija `(control, { labelId }) => …` para controles que no aceptan esas props. Error en `<p role="alert">`. Exporta `FieldDescription`, `FieldError`, `useField()`.
- `Input` / `Textarea` como el nativo; `fieldControlClasses` (de `input.tsx`) para disparadores `<button>`. Alto 40 px, borde 23 %, radio 4 px, sangría 14 px (alinea con el `TextField` MUI, que mide 37,1 px).
- `Label` (12 px, medio; `--destructive` en un `Field` inválido).
- `Select` / `SelectTrigger {...control}` / `SelectValue placeholder` / `SelectContent position="popper" container?` / `SelectItem` (44 px, `--accent`, check).
- `RadioGroup` / `RadioGroupItem` (20 px) dentro de `<label className="flex items-center gap-2 text-small">`.
- `Popover` / `PopoverTrigger asChild` / `PopoverContent` (`w-70`, `p-4`, `z-modal`, `sideOffset` 6). **Dentro de un modal MUI vivo:** `container={trigger.closest('[role="dialog"]')}` y `stopPropagation()` de Escape en el contenido.
- `DateField` / `TimeField`: API sin cambios.

```tsx
<Field label="Referencia" required description={hint} error={touched && !ok ? "Ingresa la referencia." : undefined}>
  <Input name="reference" required value={v} onChange={(e) => setV(e.target.value)} />
</Field>
<Field label="Método">
  {(control) => (
    <Select value={m} onValueChange={setM}>
      <SelectTrigger {...control}><SelectValue placeholder="Elige un método" /></SelectTrigger>
      <SelectContent>{methods.map((x) => <SelectItem key={x.id} value={x.id}>{x.label}</SelectItem>)}</SelectContent>
    </Select>
  )}
</Field>
```

## Superposiciones (W3, #62, D117–D118)
- `Dialog` / `DialogContent showCloseButton closeLabel="Cerrar" container?` / `DialogHeader` / `DialogTitle` / `DialogDescription` / `DialogFooter` (+ `DialogTrigger`, `DialogClose`, `DialogOverlay`). 444 px, `rounded-xl`, `shadow-lg`, `bg-card` sólido (D057), backdrop 50 %, `z-modal`. Dentro de un modal MUI vivo: `container={…}` (el focus-trap de MUI roba el foco si va a `body`).
- `Sheet` / `SheetContent side="right|left|top|bottom" showCloseButton closeLabel` / `SheetHeader` / `SheetTitle` / `SheetDescription` / `SheetFooter`: pantalla completa en móvil, `md:max-w-form-drawer`.
- `Alert severity="success|info|warning|error" appearance="standard|filled" hideIcon?` + `AlertTitle`; `role="alert"`, ícono lucide por severidad, AA en los dos modos (info relleno con texto `gray-900`).
- Toast: `<Toaster />` ya montado en `app/layout.tsx`. `import { toast } from "sonner"; toast.success("…", { duration: 6000 })` (+ `error`, `info`, `warning`). Por defecto 5 s (`TOAST_DURATION_MS`), 448 px, abajo al centro, cierre "Cerrar aviso". Reemplaza `Snackbar` + `Alert filled`.
- `ConfirmDialog`: API sin cambios; con un modal MUI abierto se porta dentro de su papel (se quita cuando el Drawer pase a `sheet`, ola 4); devuelve el foco a quien lo abrió.
- Botón destructivo: `button.tsx` no tiene `color="error"` → `variant="contained"` + `className="bg-destructive text-destructive-foreground …"` como en `ConfirmDialog`.

## Estados (W4, #61, D119–D121)
- `<Skeleton className="h-5 w-56" />` (`bg-muted`, pulso, quieto con reduced-motion, `aria-hidden`).
- `<Progress value={42} aria-label="…" />`; sin `value` = indeterminada. `aria-label` obligatorio.
- `<Tabs value onValueChange><TabsList aria-label><TabsTrigger value>…</TabsTrigger></TabsList><TabsContent value /></Tabs>` (línea del sitio, 44 px, activa `secondary-700`).
- `<Container maxWidth="xs|sm|md|lg|none" disableGutters asChild>` (def. `lg`: 1200 → 1440 desde `xl` → 1600 desde `wide:`; gutters 8/12 px como MUI).
- `<PatternLayer stroke? secondsPerTile? className? />` como primer hijo de un `relative overflow-hidden` (sustituye a `patternLayerSx`; `theme/patterns.ts` reexporta `theme/patternTile.ts` hasta la ola 5).
- `<EmptyState icon={IconoLucideOMui} title description? ctaLabel? onCtaClick? compact? className? />` (`sx` → `className`; a un ícono MUI le fuerza `size-*!`).
- `Reveal`, `StepTransition`: API sin cambios.

## Trampas aprendidas en la ola 2
- Playwright en dev: `waitUntil: "commit"` + `waitForSelector` de un atributo hidratado; nunca `networkidle`/`load`. `bun run shots` hace clic antes de hidratar: capturar con script propio y publicar desde una carpeta propia (`bash scripts/publish-pr-shots.sh .qa/shots`).
- `shadcn add` puede tardar > 2 min y preguntar si sobrescribe `button.tsx`: `echo n | node node_modules/shadcn/dist/index.js add <x> -y`, con timeout.
- `bun run a11y` tiene rutas fijas (incluye el panel con sesión): para rutas concretas, axe con un script propio con las mismas etiquetas.
- `run-on-main.sh` se cuelga en `bun install` sin red: el "antes" con `git checkout origin/main -- <archivos>` en el slot, mismo servidor, y restaurar.
- Contenedores `qa-maranatha-pg`/`-mailpit` compartidos entre slots: el worker no los baja.
- Contraste heredado: botón outlined "Cancelar" en oscuro 3,09:1; días de otro mes del calendario al 40 %.
