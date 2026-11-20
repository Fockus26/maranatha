# feat/selector-hora

- PR #33 (minor). D089 TimeField propio; D090 formato "7:30 p. m." y minutos fuera de grilla sin redondear.
- Lógica pura en `lib/timeOfDay.ts` (5 tests). Valor sigue "HH:MM" 24 h.
- Verificado en ruta temporal: axe claro/oscuro, 320 px, teclado completo. No verificado dentro del dashboard (sesión).
