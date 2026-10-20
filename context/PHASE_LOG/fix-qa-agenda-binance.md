# fix/qa-agenda-binance — hallazgos de la QA de main (PR #20)

**Qué:**
- 1 alto: agenda con red caída.
- 4 medios: aprobar un Binance de pasarela, página fuera de rango y 2 contrastes de la sección Agenda.
- 4 bajos: fechas reales en la agenda, checkouts fallidos que se borran, ventana de timestamp con tope al certificado en el webhook de Binance, e inputs de tasas como texto.

**Decisiones:**
- Sin registro de nonces, porque Binance reintenta con las mismas cabeceras tras un 500.
- Ventana de timestamp de 24 h.

**Verificado:** 59 tests, typecheck, lint completo (0 errores) y build.
**No verificado:** navegador y axe (puertos de `world-flags`); la API real de Binance.
**Riesgo abierto:** HTTP 451 de Binance desde la máquina de QA (región de Vercel).
