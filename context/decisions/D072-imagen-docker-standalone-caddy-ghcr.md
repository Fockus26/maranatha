# D072 · Deploy · Docker standalone + Caddy + GHCR vía Actions, sin token personal · Implementado

**Decisión:** `Dockerfile` multi-etapa con `output: "standalone"` (solo si `NEXT_OUTPUT=standalone`, así Vercel no cambia), `NEXT_PUBLIC_*` como build args, usuario sin root. Caddy delante con HTTPS automático y body de 6 MB. La Action `deploy-vps.yml` sube la imagen a GHCR y la levanta por SSH usando el `GITHUB_TOKEN` del run.
**Por qué:** imagen pequeña (28 MB de app), sin token personal de GitHub en el VPS, y los secretos solo en el `.env` del servidor.
**Alternativa descartada:** Coolify/Dokploy — más cómodo, pero la configuración no queda en el repo.
**Nota de estado:** Implementado; la imagen se probará en el primer run de Actions
