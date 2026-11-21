# refactor/shadcn-pagos — ola 3 fase shadcn (W3) · PR #63

- 8 archivos de diezmo/aporte sin MUI: Tithe, TitheModal (dialog Radix), TitheForm, TitheLayout, PaymentStep, AmountSelector, DonationFormCard, ProjectContributionForm. Lógica intacta.
- Decisiones D128 (Field, alturas), D129 (TitheModal sobre dialog), D130 (copiar con Tooltip + aria-live, DonationFormCard). Changeset patch.
- Medido: alturas antes/después, ids sin duplicar con el modal abierto, foco/trampa/Escape, calendario dentro del modal, axe 0 en 1280/320 claro y oscuro, suite 194/194.
- No verificado: envío de reporte y errores del servidor (métodos ficticios interceptados; el slot no tiene base).
- Bug heredado (main): modal de diezmo a 800×400 en claro, tarjeta transparente con texto oscuro sobre navy.
