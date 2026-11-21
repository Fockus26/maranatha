# D139 · Componentes · `button` (error, inherit, icon-sm/xs, link), `progress` color, `alert` action, `field` hideLabel · Implementado

**Decisión:**
- `Button`: `color="error"` (contained `bg-destructive text-destructive-foreground`, hover 90 %; outlined/text `text-destructive`, borde y hover del mismo color) y `color="inherit"` (text/outlined heredan el color del padre, hover `bg-accent`); `size="icon-sm"` (30 px) y `"icon-xs"` (28 px), redondos, `p-1.25`, ícono por defecto `size-5`; `variant="link"` (enlace en línea: `text-primary dark:text-primary-300` como `Link tone="primary"`, sin mínimos de botón, subrayado al hover). Foco D085 sin cambios (compartido en la base).
- `Progress`: `color` = `primary` (def.) | `secondary` | `success` (el tercero se añadió porque `ProjectCard` y `ProjectSidebar` colorean la barra de éxito).
- `Alert`: `action?: ReactNode`, ranura en una tercera columna, centrada en vertical (el "Reintentar" de `PaymentStep`).
- `Field`: `hideLabel` — la etiqueta queda como `sr-only` (el campo "Otro monto" de `AmountSelector`; el nombre accesible sale ahora del `<label>`, no de `aria-label`).
**Por qué:** eran los sustitutos con `className` de la ola 3 (`size-7 p-1.25`, `text-inherit hover:bg-accent`, `**:data-[slot=progress-indicator]:bg-secondary`); W1 los usa en el panel.
**Alternativa descartada:** `variant="destructive"` aparte de `color`: rompe el vocabulario de MUI (`color="error"`) que la traducción conserva.
