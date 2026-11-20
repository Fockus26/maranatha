# D115 · Formularios · `DateField` y `TimeField` sobre Radix Popover: portal dentro del `role="dialog"` que los contiene, `z-modal`, Escape no cierra el modal · Implementado

**Decisión:** los dos selectores propios (D062, D089) dejan `Popper` + `ClickAwayListener` de MUI por `components/ui/popover.tsx` (Radix, no modal), con la misma API (`DateFieldProps`, `TimeFieldProps`).
- **Portal:** al abrir, el panel se porta al `[role="dialog"]` más cercano al disparador (el `Paper` del `Dialog`/`Drawer` de MUI) o a `body` si no hay. Así la trampa de foco de MUI lo cuenta como propio y no le roba el foco. `PopoverContent` y `SelectContent` aceptan `container`.
- **`z-modal`** (410, el `zIndex.modal` del tema MUI): dentro del diálogo queda sobre su contenido; en `body`, encima de un modal ya abierto por orden de DOM.
- **Escape:** Radix cierra el panel y devuelve el foco al campo; el `onKeyDown` del panel corta la propagación para que el `Dialog`/`Drawer` de MUI no se cierre también (los eventos de React suben por el portal).
- **Foco:** al abrir, al día elegido (o hoy, o la fecha máxima) / a la opción marcada de la primera columna; al cerrar por selección, «Listo», Enter o Escape, vuelve al campo; con clic fuera, donde se hizo clic. Tab fuera de cualquier extremo del panel lo cierra y devuelve el foco al campo (lo que ya hacía `TimeField`).
- **Calendario:** la grilla pasa a una sola parada de Tab con flechas (día / semana), Inicio/Fin (semana), RePág/AvPág (mes); el mes visible es `aria-live="polite"`. El disparador se nombra con la etiqueta **y** el valor (`aria-labelledby`), antes solo la etiqueta.
- **Movimiento:** animación de entrada de `tw-animate-css`, apagada con `motion-reduce`.

**Por qué:** Radix da clic fuera, Escape y retorno de foco; lo único propio es el comportamiento junto a los modales MUI que conviven hasta la ola 4, medido en la página de QA dentro de un `Dialog` y un `Drawer`.
**Alternativa descartada:** `modal` en el popover (Radix pondría `aria-hidden` y su propia trampa sobre el `Dialog` de MUI: dos trampas peleando); sin portal (el panel quedaría recortado o mal posicionado dentro de contenedores con `overflow`/`transform`).
