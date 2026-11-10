# D089 · Formularios · TimeField: selector de hora propio (Popper con columnas hora, minutos y a. m./p. m.) · Implementado

**Decisión:** `components/ui/TimeField.tsx` reemplaza el `<input type="time">` nativo de la agenda del dashboard. Misma API y estilo que `DateField` (D062); el valor sigue siendo "HH:MM" 24 h (el servidor no cambia). Columnas Hora 1–12, Minutos de 5 en 5 y a. m./p. m., cada una un `listbox` (flechas, Tab entre columnas, Espacio elige, Enter elige y cierra, Escape devuelve el foco al campo). La lógica pura vive en `lib/timeOfDay.ts` con tests.
**Por qué:** el picker nativo rompía el estilo del sitio (petición de César). Sin dependencias nuevas.
**Alternativa descartada:** `@mui/x-date-pickers` (mismo motivo que D062).
