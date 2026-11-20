# Backlog

- (tanda 2026-11-10, visto por W1) Botones outlined grises con el mismo problema de contraste que "Seguir": `components/sections/Projects.tsx:178` "Ver proyecto", `Sermons.tsx:162`, `Hero.tsx:390`. Aplicar `components/ui/outlinedActionSx.ts` (PR #31) una vez mergeado.
- (W1) En móvil la X del visor de Instagram queda debajo de la imagen (el header va tras el escenario).
- (W1) Behold declara `full` = 1511x2000 pero entrega 1088x1440: el descriptor `w` del srcSet es inexacto.
- (W2) La tarjeta "Reproducir" de Sermons y la grilla de Instagram definen su propio outline `secondary[700]` por `sx`: unificar con `--focus-ring` (PR #30).
- (W4) `DateField` usa `secondary.contrastText` (blanco) sobre el naranja del día elegido: ~2,8:1 en oscuro. Aplicar `getContrastText(secondary.main)` como en `TimeField` (PR #33).
- (W4) La agenda pública formatea "p.m." (`formatStartTime`) y el panel ahora "p. m.": unificar.
- (kit 3.25.0, 2026-11-18) `app/globals.css` importa Tailwind v4 sin `source(none)`: escanea todo el repo, `.claude/` y `context/` incluidos. Unidad: `@import "tailwindcss" source(none);` + `@source` explícitos a `app/`, `components/`, `lib/`; comparar el CSS construido antes y después (solo pueden desaparecer clases que venían de `context/` o `.claude/`). Ver `.claude/kit-reference/STACK-NEXTJS.md` › Tailwind v4.
- (QA tanda 2026-11-19 #3, Medio) `proxy.ts:49-53` redirige con 307 también los POST de Server Actions: con la sesión cerrada, Agenda y Pagos dicen "No hubo respuesta del servidor" en vez de "Tu sesión expiró". El proxy solo debe redirigir GET/HEAD. Script: `plans/qa-tanda-2026-11-19/4-sesion-cerrada-mensaje.mjs`.
- (QA tanda 2026-11-19 #4, Medio) Con el panel lateral abierto el Snackbar de error queda bajo `aria-hidden` (WCAG 4.1.3): mostrar el error dentro del `DashboardFormDrawer` (Alert) mientras esté abierto. Script: `5-aviso-oculto-con-panel.mjs`.
- (QA tanda 2026-11-19 #5, Bajo) Franja de 12 px a la derecha con Drawer/Dialog abiertos: `scrollbar-gutter: stable` (`theme/globalStyles.ts:79`) + `body{overflow:hidden}`. Script: `3-riel-scroll-overlay.mjs`.
- (fix #51, visto de paso) Tras un ancla nativa ("Saltar al contenido", `#agenda` con `<a>` nativo), ir a otra página y pulsar Atrás cambia la URL a `/#main-content` pero no navega: Next ignora el `popstate` sin `state`. Arreglo: que esos enlaces pasen por `Link`/router o que el skip-link mueva el foco sin crear entrada de historial.
