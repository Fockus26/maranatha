# D091 · Deploy · Una sola rama: Vercel publica `main`, sin ramas `vercel`/`vps` · Implementado

**Decisión:** se quitan las ramas de deploy. Vercel publica `main` en cada merge (Production Branch = `main`); el workflow del VPS (`deploy-vps.yml`) queda solo manual (`workflow_dispatch`) hasta que se defina el cambio de hosting. Reemplaza a D071.
**Por qué:** avanzar `main → vercel` a mano hacía que los merges no llegaran al sitio (2026-11-10: 19 commits sin publicar). Hoy Vercel es el único sitio en vivo, así que la rama intermedia no aportaba nada (César, 2026-11-10).
**Alternativa descartada:** mantener `vercel`/`vps` y automatizar el avance con una Action; se retoma al decidir el hosting.
**Nota de estado:** Implementado en el repo; el Production Branch de Vercel se cambia en su panel. Las ramas `vercel` y `vps` siguen en GitHub sin uso: borrarlas lo decide César.
