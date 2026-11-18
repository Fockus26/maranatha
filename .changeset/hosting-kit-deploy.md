---
"maranatha": minor
---

El sitio puede publicarse en kit-deploy (VPS de César): producción desde `main` y un preview por cada PR, con `/api/health` para el cambio sin corte. Se enciende con la variable `KIT_DEPLOY_ENABLED` del repo; hasta entonces solo publica Vercel.
