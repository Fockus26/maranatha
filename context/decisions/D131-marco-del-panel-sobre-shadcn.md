# D131 · Componentes · Marco del panel sobre shadcn: topbar con `sheet` navy móvil, `Avatar` de iniciales y contenedor por clase · Implementado

**Decisión:**
- `DashboardShell`, `DashboardTopbar` y `DashboardSidebar` (sin uso, D024) quedan en Tailwind con los tokens (`bg-primary-900`, `border-on-navy-border`, `text-on-navy-subtle`, `z-navbar`/`z-sidebar`); cero `@mui/`. El topbar y la banda de KPIs siguen en `data-surface="navy"` (D025).
- `DASHBOARD_CONTENT_SX` pasa a `DASHBOARD_CONTENT_CLASS` (`mx-auto w-full max-w-[1400px] px-3 md:px-5`); lo usan topbar, `DashboardStatBand`, el Resumen y los esqueletos. El tope de 1400 px no tiene token (`layout.page` llega a 1200/1440/1600): queda como literal, igual que en `main`, y va a "Tokens que faltaron".
- Menú móvil (< `md`): `Drawer` MUI → `Sheet` lado derecho con `data-surface="navy"` en el `SheetContent` (el portal cuelga de `body`, fuera del header navy), 280 px (`max-w-70`), `showCloseButton={false}` y un `SheetClose` propio de 44 px en la cabecera con el logo (como el `Drawer`). El botón de menú es `SheetTrigger asChild`: Radix da foco atrapado, Escape, `aria-expanded`/`aria-controls` y el retorno del foco a ese botón. Título accesible `sr-only` ("Menú del panel"), sin descripción.
- Botones sobre navy: `variant="plain"` pinta el gris de acción (ilegible sobre navy fijo en claro), así que se fuerza `text-on-navy hover:bg-on-navy-hover` también bajo `dark:`.
- Iniciales del admin (D107): `Avatar` + `AvatarFallback` + `initialsOf`/`realName`, con `role="img"` y `aria-label="Sesión de …"`, oculto bajo `sm`. El Context no cambia.
- `Logo` (de W1, sin `sx`): los dos usos del topbar van envueltos en `<span className="inline-flex sm:hidden">` / `hidden sm:inline-flex`.

**Por qué:** es el marco que envuelve a las páginas de la ola 4 (siguen en MUI): el ancho, el padding y la altura de 72 px del topbar no cambian (medido: header 73 px, `main` desde y = 73, sin scroll horizontal a 360 px).
**Alternativa descartada:** `Sheet` con el cierre de serie (`showCloseButton`): es `plain` gris sobre navy y 40 px; el cierre propio conserva los 44 px y el color.
