# D068 · Git · Modo `pr`: rama por unidad, PR que César revisa y mergea · Implementado

**Decisión:** cada unidad sale de `main` en su rama, se empuja y abre un PR que César revisa y mergea. Reemplaza el modo `local` (merge `--no-ff` sin push) usado hasta los pagos.
**Por qué:** el repo ya está en GitHub, hay deploy desde ramas y el primer PR (#1) ya siguió este flujo.
**Alternativa descartada:** seguir en `local` — el trabajo quedaba sin subir (origin/main iba 20 commits atrás).
**Nota de estado:** Implementado (falta proteger `main` en GitHub)
