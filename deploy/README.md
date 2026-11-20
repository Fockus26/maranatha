# Deploy

Una sola rama: **`main`** (D091). Dos lugares la publican mientras dure la transición (D093):

| Dónde | Qué publica | Cómo se dispara |
|---|---|---|
| **kit-deploy** (VPS de César) | `main` → `https://maranathasancristobal.com` (D108; `www` y `maranatha.fockus.dev` también responden); cada PR → `https://maranatha-pr-<n>.preview.fockus.dev` | `.github/workflows/deploy-vps.yml`, solo con la variable del repo `KIT_DEPLOY_ENABLED=true` |
| Vercel (respaldo, una semana) | `main` y sus previews | Merge a `main` → Vercel lo publica solo |

Archivos de cada lado:

- kit-deploy: `Dockerfile`, `.dockerignore`, `.github/workflows/deploy-vps.yml`, `app/api/health/route.ts`
  (plantillas de `kit-deploy/templates/`; el Dockerfile agrega `NEXT_OUTPUT=standalone`, D072).
- Vercel: `vercel.json` y `@vercel/analytics` (solo se monta con `VERCEL=1`). Se van cuando César apague Vercel.

---

## Pasar el sitio a kit-deploy (una sola vez, César)

> Hecho en 2026-11-18 con `maranatha.fockus.dev`; el dominio propio entró el 2026-11-20 (sección siguiente).
> Las URLs de abajo quedan como estaban en ese paso.

Todo por `ssh kit-vps` desde la terminal de César. Ningún secreto pasa por el chat ni por un archivo.

1. **Registrar el proyecto** (como root también fija el repositorio de sus imágenes):
   ```bash
   ssh kit-vps kit-deploy project add maranatha Fockus26/maranatha --memory 512
   ```
2. **Adoptar las bases que ya existen** (`maranatha`, `maranatha_preview`, del corte de D082):
   ```bash
   ssh kit-vps kit-deploy db adopt maranatha          # muestra cuáles
   ssh kit-vps kit-deploy db adopt maranatha --yes
   ```
   Desde ahí kit-deploy pone `DATABASE_URL` en producción y previews. No se copia a mano.
3. **Token del workflow** (nunca en pantalla):
   ```bash
   ssh kit-vps kit-deploy token create maranatha | gh secret set KIT_DEPLOY_TOKEN -R Fockus26/maranatha
   ```
   Y sumar `Fockus26/maranatha` al token de estados de GitHub de kit-deploy (Repository access).
4. **Variables**, entorno por entorno, copiando de Vercel (la lista está en `.env.example`). Cada valor se
   escribe en la terminal (stdin); son secretas salvo `--plain`:
   ```bash
   ssh -t kit-vps kit-deploy env set maranatha production BETTER_AUTH_SECRET
   ssh -t kit-vps kit-deploy env set maranatha production NEXT_PUBLIC_SITE_URL --plain
   ```
   - **production:** `NEXT_PUBLIC_SITE_URL` y `BETTER_AUTH_URL` = `https://maranatha.fockus.dev`,
     `BETTER_AUTH_SECRET` (uno nuevo: `openssl rand -base64 32`), `ADMIN_EMAILS`, `SMTP_*`, `PAY_*`, `PAYPAL_*`,
     `BEHOLD_FEED_*`, y `BINANCE_PAY_*` si ya hay. **Sin** `ADMIN_HOST` (el panel vive en `/dashboard`) y **sin**
     `DATABASE_URL`/`DIRECT_URL`.
   - **preview:** lo mismo con PayPal en sandbox; sin `BETTER_AUTH_URL` ni `NEXT_PUBLIC_SITE_URL` (el login acepta el
     origen de cada preview por `KIT_DEPLOY_PREVIEW_URL`, que pone kit-deploy).
   - **R2 (D094), en los dos:** `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` y `R2_BUCKET`, con el
     bucket y el token de cada entorno (`maranatha-receipts` / `maranatha-receipts-preview`).
   - Comparar nombres: `ssh kit-vps kit-deploy env ls maranatha production` (y `preview`).
5. **DNS:** `maranatha.fockus.dev` ya lo cubre el comodín `*.fockus.dev` (DNS-only). Nada que hacer en Cloudflare.
6. **Encender:**
   ```bash
   gh variable set KIT_DEPLOY_ENABLED --body true -R Fockus26/maranatha
   gh workflow run deploy-vps.yml -R Fockus26/maranatha --ref main
   ```
7. **Comprobar** en `https://maranatha.fockus.dev`: el inicio con sus imágenes, `/api/health` →
   `{"ok":true,"sha":…}`, el login del panel, y en el preview de un PR un reporte de pago con comprobante de
   ~4 MB. PayPal Live: webhook a `https://maranatha.fockus.dev/api/payments/paypal/webhook` y su id en
   `PAYPAL_WEBHOOK_ID` (production).

## Dominio propio: maranathasancristobal.com (D108)

- **DNS:** en la cuenta de Cloudflare de César (nameservers `andronicus` / `cortney`). El dominio sigue registrado
  en Namecheap a nombre de un tercero, que lo renueva. Todo DNS-only (nube gris), sin AAAA:
  `A @` y `A www` → IP del VPS.
- **kit-deploy:** `domain add maranatha maranathasancristobal.com` y
  `domain add maranatha www.maranathasancristobal.com --redirect to-apex` (308 al dominio sin `www`).
  `maranatha.fockus.dev` sigue respondiendo.
- **production:** `NEXT_PUBLIC_SITE_URL` y `BETTER_AUTH_URL` = `https://maranathasancristobal.com`.
- **Correo:** dominio autenticado en Brevo (TXT `brevo-code`, CNAME `brevo1._domainkey` / `brevo2._domainkey`,
  TXT `_dmarc`). Remitente `"Iglesia Maranatha" <maranatha@maranathasancristobal.com>` en `SMTP_FROM`
  (production y preview). Sin MX: el dominio no recibe correo.
- **PayPal Live:** webhook a `https://maranathasancristobal.com/api/payments/paypal/webhook`; si cambia su id,
  va en `PAYPAL_WEBHOOK_ID` (production).

## Operación

```bash
ssh kit-vps kit-deploy status maranatha          # qué está en vivo y su salud
ssh kit-vps kit-deploy logs maranatha -f         # logs (--pr <n> para un preview)
ssh kit-vps kit-deploy rollback maranatha        # a la imagen anterior, sin build
```

- Cambiar una variable de servidor: `env set` y `kit-deploy redeploy maranatha` (misma imagen).
- Cambiar una `NEXT_PUBLIC_*`: queda dentro de la imagen, hace falta `kit-deploy rebuild maranatha`.
- Apagar kit-deploy sin tocar el código: `gh variable set KIT_DEPLOY_ENABLED --body false -R Fockus26/maranatha`.
