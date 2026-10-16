# chore/deploy-setup — Deploy doble Vercel + VPS (merge local · sin changeset, previo a Changesets)

## Estado
mergeada a `main` el 2026-09-25 (merge local, antes del modo pr)

## Qué se hizo
- Dockerfile multi-etapa standalone, `deploy/` (compose + Caddy + guía), workflow `deploy-vps.yml`.
- `vercel.json` que no publica la rama `vps`; staging no indexable (`SITE_INDEXABLE`).
- Ramas permanentes `vercel` y `vps`.

## Verificado (y cómo)
- `next build` normal y con `NEXT_OUTPUT=standalone`; servidor standalone: `/`, `/proyectos`, `/robots.txt` en 200.

## No verificado
- Build de la imagen Docker (no hay Docker local): se prueba en el primer run de Actions.
- Optimización de imágenes con sharp en Linux.

## Decisiones
- D071, D072, D073 (decisions/02-deploy.md)

## Acciones de César
- Configurar Vercel (rama `vercel`) y el VPS según `deploy/README.md`.
