# D101 · UI · La CTA de `ProjectCard` es un enlace real y la barra ignora `popstate` sin navegación · Implementado

**Decisión:** `ProjectCard` recibe `ctaHref`: el botón se renderiza como `<a>` (MUI `Button` con `component={Link}`) en `/proyectos` y en la sección de la home, en vez de `onCtaClick` + `router.push`. `NavigationProgress` (D095) ya detecta cualquier `<a>` interno, así que la barra aparece. `onCtaClick` sigue existiendo para usos sin navegación. En `popstate` la barra solo se abre si el evento trae `state` (Next ignora las entradas sin estado, p. ej. un ancla nativa) y la URL del navegador difiere de la ruta ya renderizada. La llegada se marca con un ref (`pendingRef`) y no con el estado `phase`, porque en atrás/adelante la ruta puede comprometerse antes de pintar el `loading`.
**Por qué:** la QA de la tanda 2026-11-19 halló la barra pegada 10 s con anclas y atrás/adelante, y sin barra en `router.push`. Un enlace es además semántica correcta para navegar.
**Alternativas:** helper que abra la barra antes de `router.push` (deja la clase abierta para cada nuevo `push`); `useLinkStatus` (D095 ya lo descartó).
**Accesibilidad:** el CTA pasa de rol `button` a `link`; mismo nombre accesible y foco.
**Nota de estado:** Implementado.
