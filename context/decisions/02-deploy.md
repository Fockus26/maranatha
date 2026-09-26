# Decisiones — Deploy

## D071 — Vercel para pruebas, VPS para producción, con ramas que solo se avanzan
**Decisión:** rama `vercel` → Vercel (staging); rama `vps` → VPS Hetzner (producción). Las dos tienen el mismo código que `main` y todos los archivos de deploy; cambian solo las variables de entorno. Se avanzan `main → vercel → vps`.
**Por qué:** una rama con archivos distintos por servicio obligaría a pasar cada cambio a mano y resolver conflictos.
**Alternativa descartada:** dos "mains" con archivos propios cada una.
**Estado:** Implementado (el VPS aún no está configurado: `deploy/README.md`)

## D072 — Imagen Docker standalone + Caddy + GHCR
**Decisión:** `Dockerfile` multi-etapa con `output: "standalone"` (solo si `NEXT_OUTPUT=standalone`, así Vercel no cambia), `NEXT_PUBLIC_*` como build args, usuario sin root. Caddy delante con HTTPS automático y body de 6 MB. La Action `deploy-vps.yml` sube la imagen a GHCR y la levanta por SSH usando el `GITHUB_TOKEN` del run.
**Por qué:** imagen pequeña (28 MB de app), sin token personal de GitHub en el VPS, y los secretos solo en el `.env` del servidor.
**Alternativa descartada:** Coolify/Dokploy — más cómodo, pero la configuración no queda en el repo.
**Estado:** Implementado; la imagen se probará en el primer run de Actions

## D073 — Staging no indexable
**Decisión:** con `VERCEL=1` el sitio sirve `robots.txt` con `Disallow: /` y meta `noindex` (`SITE_INDEXABLE` en `lib/siteConfig.ts`).
**Por qué:** que Google solo indexe el dominio de producción.
**Estado:** Implementado
