# feat/animaciones-listas (W3, D087–D088)

- `components/ui/StepTransition.tsx` nuevo: transición horizontal + fade entre formulario y `PaymentStep`, formulario montado, paso inactivo `inert`, alto animado, reduced motion.
- Usado en `TitheModal` y `ProjectDetailClient`.
- `DashboardPayments`: `AnimatePresence mode="popLayout"` + `motion.li layout`, escalonado 30 ms (tope 200 ms), estado vacío con fade, lista siempre montada (D088).
- `DashboardTable`: `popLayout` en los dos `AnimatePresence`, fade + 8 px en vez de scale; página de proyectos: estado vacío de búsqueda con fade.
- Pendiente para wave-qa (sesión admin): cambiar filtros en Pagos y buscar en Proyectos.
