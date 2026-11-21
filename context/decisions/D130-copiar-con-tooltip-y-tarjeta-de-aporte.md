# D130 · Pagos · Copiar con `Tooltip` controlado + aviso `aria-live`; `DonationFormCard` con ancho por variable y `className` · Implementado

**Decisión:**
- **Copiar (paso 2, métodos manuales):** `Button variant="plain" size="icon"` a 28 px (`size-7 p-1.25`, ícono `Copy`/`Check` de 18) dentro de `Tooltip`. Radix cierra el tooltip al pulsar, así que queda abierto (`open`) mientras dura el "Copiado" (1,8 s) y se abre también con el foco por teclado. El "Copiado" se anuncia en una región `aria-live="polite"` propia del botón: el tooltip solo se lee al enfocar.
- **`DonationFormCard`:** `div` con `bg-card`, borde `border`, radio `lg`, `p-4`/`sm:p-5.5`. El `width` en px (440 en diezmo, 320 por defecto en proyectos) llega como variable CSS (`--donation-card-width`) que lee `sm:w-(--donation-card-width)`: la API (`width?: number`) no cambia. Acepta `className`. La regla de poca altura (`max-height: 500px`: sin borde, fondo ni padding dentro de un diálogo) pasa de `.MuiDialog-paper &` a `in-data-[slot=dialog-content]` (el `DialogContent` de Radix, el de proyectos y el de diezmo).
- **Spinner de métodos:** `LoaderCircle animate-spin` (24 px, `text-secondary`) dentro de `role="status"` con texto `sr-only` "Cargando métodos de pago".

**Por qué:** el `Tooltip` de MUI mostraba "Copiado" tras el clic; el de Radix no, sin estado propio. Un valor de ancho por clase obligaría a una clase por consumidor.
**Alternativa descartada:** `toast()` para "Copiado" (un aviso global por un gesto local, y taparía el paso); `w-110`/`w-80` según el número (se rompe con otro ancho).
