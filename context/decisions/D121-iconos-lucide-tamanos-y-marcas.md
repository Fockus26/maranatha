# D121 · Componentes · Íconos: mapa MUI → lucide, tamaños por clase y logos de marca propios · Implementado

**Decisión:**
- **Mapa** `context/plans/mapa-iconos.md` (local): los 63 íconos de `@mui/icons-material` de `app/` y `components/`, cada uno con su `lucide-react` más cercano (nombres comprobados contra `lucide-react` 1.77) y la nota donde cambia de forma (MUI es relleno, lucide es trazo; `fill-current` para igualar los sólidos).
- **Tamaños por clase de Tailwind** (espaciado de 4 px): `fontSize="small"` (20) = `size-5`, `medium` (24) = `size-6`; `sx={{ fontSize: n }}` = `size-n/4` (`size-3` = 12, `size-3.25` = 13, `size-4` = 16, `size-4.5` = 18, `size-10` = 40…). Tabla completa en el mapa.
- **Logos de marca:** lucide 1.x no trae Instagram ni YouTube (7 usos). `components/ui/brand-icons.tsx` exporta `InstagramIcon` y `YoutubeIcon` con los mismos trazos que `@mui/icons-material` (MIT), API de un ícono lucide (`className`, `size-*`, `aria-hidden` por defecto, `fill: currentColor`).
- **Tipografía:** la tabla `Typography variant → clases` va en el mapa; `text-h1`…`text-body-lg`/`text-body`/`text-small` ya cubren los `variant` en uso (solo `h4`, `body1` y `caption` en `StatusScreen`), sin `@utility` nuevo. No se traduce el `letter-spacing` por defecto de MUI en h1–h4.

**Por qué:** las olas 3–4 migran por zona y necesitan una sola respuesta para "¿qué ícono y de qué tamaño?" sin decidirla cada una; el aviso de las marcas evita que un worker se tope con el import roto a mitad de una zona.
**Alternativa descartada:** `react-icons`/`simple-icons` para las marcas (dependencia nueva, la fase no instala más); sustituir Instagram/YouTube por un ícono genérico (pierde el reconocimiento de la marca).
