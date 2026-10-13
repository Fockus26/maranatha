# D069 · Git · Versión con Changesets; PR de versión lo abre la Action y lo mergea César · Implementado

**Decisión:** versión con Changesets; PR de versión lo abre la Action y lo mergea César. Ningún PR toca `version` ni `CHANGELOG.md`; cada cambio visible trae `.changeset/<desc>.md`.
**Por qué:** subir `version`/CHANGELOG en cada PR choca cuando hay PRs en paralelo. El proyecto no llevaba versión (0.1.0 desde el arranque); se adopta ahora que hay producción.
**Alternativa descartada:** sin versión — no quedaría registro de qué salió en cada release.
**Nota de estado:** Implementado (falta el permiso de Actions en GitHub)
