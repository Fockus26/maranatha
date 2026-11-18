# D093 · Deploy · Hosting en kit-deploy (VPS de César): `main` → producción, cada PR → su preview; Vercel una semana de respaldo · Implementado (sin encender)

**Decisión:** el sitio pasa a **kit-deploy**, la plataforma de César en su VPS (fase 07 de kit-deploy, su D004).
`Dockerfile`, `.dockerignore`, `.github/workflows/deploy-vps.yml` y `app/api/health/route.ts` son las plantillas de
`kit-deploy/templates/`, con dos cambios propios: `NEXT_OUTPUT=standalone` en el Dockerfile (D072 deja `output:
"standalone"` condicionado para no tocar el build de Vercel) y el interruptor `KIT_DEPLOY_ENABLED` (variable del
repo): sin él en `true` el workflow no corre y solo publica Vercel. Al encenderlo, cada push a `main` publica
producción en `https://maranatha.fockus.dev` y cada PR su preview en `https://maranatha-pr-<n>.preview.fockus.dev`
(detrás del login de César, `noindex`).
- **Rama de producción:** `main` (D091). Las ramas `vercel` y `vps` no vuelven.
- **Base:** la misma `maranatha` (producción) y `maranatha_preview` (previews) de kit-db (D082). kit-deploy pone
  `DATABASE_URL` solo, una vez que César adopta las bases (`kit-deploy db adopt maranatha --yes`). `DIRECT_URL` no hace
  falta en el contenedor (solo migraciones, desde la máquina de César).
- **Login del panel en el preview:** `trustedOrigins` suma `KIT_DEPLOY_PREVIEW_URL`, que kit-deploy pone en cada
  preview (el equivalente de `VERCEL_BRANCH_URL`).
- **`@vercel/analytics`:** se queda mientras Vercel sea el respaldo; ya solo se monta con `VERCEL=1`, así que en el
  VPS no carga nada. Se quita junto con `vercel.json` cuando César apague Vercel. Analítica propia: decisión aparte.
- **Vercel:** sigue publicando `main` una semana como vuelta atrás; después decide César.
- **Dominio propio:** cuando su DNS sea de César (CONTENT_CHECKLIST de kit-deploy #9), con el TTL bajado el día antes.

**Por qué:** César (kickoff de kit-deploy, D004): costo fijo, la base en la misma máquina, sin plan Pro de Vercel. El
interruptor deja mergear el código antes de que César haga los pasos del VPS (registrar, token, variables) sin que
cada push falle por falta de `KIT_DEPLOY_TOKEN`.

**Reemplaza** el deploy por SSH + `docker compose` de D072 (se borran `deploy/Caddyfile` y `deploy/docker-compose.yml`
y los secretos `VPS_HOST`/`VPS_USER`/`VPS_SSH_KEY` quedan sin uso).

**Alternativa descartada:** workflow propio (el de kit-deploy es el que trae las variables de build por entorno);
`output: "standalone"` siempre (cambia el build de Vercel mientras es el sitio en vivo).
