# D134 · Componentes · Formulario lateral del panel sobre `sheet`; `ConfirmDialog` sin portal al papel MUI · Implementado

**Decisión:**
- `DashboardFormDrawer` (agenda y proyectos) pasa del `Drawer` de MUI al `Sheet side="right"` de shadcn: pantalla completa bajo `md`, `max-w-form-drawer` desde `md` (la primitiva), cabecera con `SheetTitle` (`h2`) y botón "Cerrar" de 44 px, cuerpo con scroll propio y pie fijo con Cancelar (`variant="action"`) / Guardar. API sin cambios (`open`, `title`, `formId`, `dirty`, `saving`, `submitLabel`, `onClose`, `children`). Con `saving`, Guardar queda deshabilitado con un `LoaderCircle` en lugar del texto (el `loading` de MUI) y "Guardando…" para lectores de pantalla.
- Se abre sin `SheetTrigger`: guarda `document.activeElement` en `onOpenAutoFocus` y le devuelve el foco en `onCloseAutoFocus` (patrón D129). El foco inicial va al campo marcado `data-autofocus` (Nombre / Título) o al primer campo; sustituye el `setTimeout` de 350 ms que necesitaba la transición de MUI. Los `autoFocus` de los campos se quitan: con Radix, un `autoFocus` hace que `FocusScope` no dispare `onOpenAutoFocus` y el foco no vuelve al botón que abrió el panel.
- `DrawerSection`: mismas props + `className` opcional.
- `ConfirmDialog`: se quita `findMuiModalPaper` y su `container` (ya no queda `Drawer`/`Dialog` MUI que lo abra). Abierto desde el sheet ("¿Descartar los cambios?") se porta a `body` y la pila de capas de Radix lo pone encima y atrapa el foco.
- `ImageUploadField`: `Tabs` de MUI → `tabs` (con `TabsContent`, 44 px de alto, pestaña activa del sitio).

**Por qué:** el `Drawer` era el último modal MUI del panel; mientras vivía, `ConfirmDialog` tenía que montarse dentro de su papel porque el focus-trap de MUI robaba el foco (D117). Medido en el PR: Tab atrapado en el sheet, Escape, foco de vuelta al botón que lo abrió y calendario/lista de hora de `DateField`/`TimeField` dentro del sheet.
**Alternativa descartada:** `Dialog` a pantalla completa en móvil (D126): el panel lateral es el patrón ya decidido para crear/editar (D096).
