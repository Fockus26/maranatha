# D095 · UI · Barra de progreso al navegar y `loading.tsx` con esqueletos · Implementado

**Decisión:** `components/layout/NavigationProgress.tsx` (montado en `app/layout.tsx`) muestra una barra de 3 px `secondary.main` arriba al instante al navegar. Detección: clic en captura sobre un `<a>` interno (mismo origen, sin `target`/`download`/modificadores, distinto pathname o search; el ancla y el mismo URL se ignoran) más `popstate`; termina cuando cambia `usePathname()`/`useSearchParams()`; a los 10 s se oculta sola. Se añaden `loading.tsx` con `Skeleton` en `app/proyectos/`, `app/proyectos/[slug]/` y `app/dashboard/(panel)/` (este repite `DashboardShell`, porque cada página lo monta y así el topbar no parpadea). La home no lleva: no hace fetch.
**Por qué:** César: al hacer clic la página se quedaba quieta hasta que llegaba; `PageTransition` (D055) solo anima la entrada. Se mantiene tal cual.
**Alternativas:** `useLinkStatus` (solo por enlace, no global), `onNavigate` de `Link` (obligaría a tocar cada enlace), nprogress (dependencia nueva).
**Accesibilidad:** `role="progressbar"` con `aria-label="Cargando página"`; con `prefers-reduced-motion` la barra aparece llena y sin animación.
**Nota de estado:** Implementado.

**Actualización (D102):** el esqueleto del panel ya no es uno genérico: cada página trae el suyo.
