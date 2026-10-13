# D071 · Deploy · Vercel = staging (rama vercel), VPS = producción (rama vps), mismo código · Implementado

**Decisión:** rama `vercel` → Vercel (staging); rama `vps` → VPS Hetzner (producción). Las dos tienen el mismo código que `main` y todos los archivos de deploy; cambian solo las variables de entorno. Se avanzan `main → vercel → vps`.
**Por qué:** una rama con archivos distintos por servicio obligaría a pasar cada cambio a mano y resolver conflictos.
**Alternativa descartada:** dos "mains" con archivos propios cada una.
**Nota de estado:** Implementado (el VPS aún no está configurado: `deploy/README.md`)
