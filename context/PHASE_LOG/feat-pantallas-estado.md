# feat/pantallas-estado

**Qué:** pantallas de estado de la adenda (D079). Apilada sobre `feat/marca-provisional` (usa `Logo`).

- `components/status/StatusScreen.tsx` + `statusCopy.ts`.
- `app/not-found.tsx` (admin/visitante), `app/error.tsx` (500 u offline), `app/global-error.tsx`, `app/mantenimiento/page.tsx`.
- `lib/maintenance.ts` + proxy: `MAINTENANCE_MODE`, `MAINTENANCE_UNTIL` (en `.env.example`).
- Test `tests/unit/status.test.ts`.

**Verificado:** typecheck, Biome en archivos tocados, tests, build.
**No verificado:** en navegador (sin servidor), que el rewrite del proxy responda 503 de verdad, axe, capturas.
**Pendiente:** borradores del reporte de pago (para la caja de "a salvo"); service worker si se quiere "sin conexión" en la primera carga.
