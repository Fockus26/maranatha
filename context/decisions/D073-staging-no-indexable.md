# D073 · SEO · Staging (Vercel) no indexable · Implementado

**Decisión:** con `VERCEL=1` el sitio sirve `robots.txt` con `Disallow: /` y meta `noindex` (`SITE_INDEXABLE` en `lib/siteConfig.ts`).
**Por qué:** que Google solo indexe el dominio de producción.
