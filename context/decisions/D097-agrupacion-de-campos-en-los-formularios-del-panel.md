# D097 · Dashboard · Campos agrupados en secciones con subtítulo (`DrawerSection`) dentro del panel · Implementado

**Decisión:** dentro del panel, los campos se agrupan con `DrawerSection` (h3 de 14 px + línea divisoria). Proyecto: Información (título, descripción), Imagen, Meta y fechas (meta, cierre, recaudado), Presupuesto y Encargados (con su botón "Agregar" en la cabecera de la sección). Evento: Evento (tipo, nombre), Cuándo (día o fecha, hora), Dónde (lugar). Los botones Guardar/Cancelar salen de los formularios y pasan al pie del panel.
**Por qué:** ordena la lectura y cada sección tiene su encabezado semántico (h2 del panel > h3 de sección). Los "cambios sin guardar" se calculan comparando un snapshot de los valores con los iniciales (`onDirtyChange` en el formulario de proyecto; comparación directa en el de evento).
**Tokens:** solo `formDrawer.width` (560 px) en `theme/tokens.ts`; el resto usa tokens existentes.
