# D086 · Accesibilidad · En `forced-colors` el foco de campos pinta el fieldset con `Highlight` a 2px · Vigente

**Decisión:** en alto contraste de Windows, `.MuiInputBase-root.Mui-focused .MuiOutlinedInput-notchedOutline` usa `border-color: Highlight` y 2px, sin outline exterior; el anillo de botones y enlaces sigue siendo el `outline` nativo (el sistema lo recolorea).
**Por qué:** mantiene el mismo criterio que D085 (el foco vive en el borde del campo) con colores de sistema, sin volver a cruzar la etiqueta.
**Alternativa descartada:** conservar el outline `Highlight` exterior solo en alto contraste: reintroduce el cruce con la etiqueta.
