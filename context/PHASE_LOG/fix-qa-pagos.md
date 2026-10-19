# fix/qa-pagos — 6 hallazgos medios de la QA funcional (PR #16)

**Qué:** monto con hasta 2 decimales (AmountSelector + `toFixed(2)`); aviso ante red caída en las acciones del panel; listado paginado (50 por página, con total); `approvePayment` rechaza PayPal; referencia con al menos una letra o número; tasas de respaldo con decimal estricto y rango por moneda.
**Verificado:** suite completa (30 tests, nuevo `tests/unit/payments-qa.test.ts`), typecheck, build y Biome en los archivos tocados.
**No verificado:** navegador, axe y capturas (`qa:local` choca con los puertos de `world-flags`); lint completo (formato heredado, D076).
**Hecho en:** worktree `..\maranatha-wt\qa-pagos`, porque la carpeta principal estaba en `feat/agenda-dashboard` con trabajo de otra sesión.
