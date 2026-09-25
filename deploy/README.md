# Deploy

| Rama     | Dónde se publica           | Para qué                  | Cómo se dispara                         |
|----------|----------------------------|---------------------------|-----------------------------------------|
| `main`   | —                          | Integración de features   | Merge de las ramas de trabajo           |
| `vercel` | Vercel                     | Pruebas (staging)         | Push → Vercel lo publica solo           |
| `vps`    | VPS de Hetzner (Docker)    | Producción                | Push → `.github/workflows/deploy-vps.yml` |

Las tres ramas tienen **el mismo código y los mismos archivos**; lo que cambia
entre Vercel y el VPS son las variables de entorno. Así nunca hay que
resolver conflictos entre ellas: solo se avanzan.

```bash
# Publicar en pruebas lo que está en main
git push origin main:vercel

# Pasar a producción lo que ya se probó en Vercel
git push origin vercel:vps
```

Cada archivo se usa solo en un lado:

- `vercel.json`: solo Vercel. Le dice que no publique la rama `vps`.
- `Dockerfile`, `.dockerignore`, `deploy/`, `.github/workflows/deploy-vps.yml`: solo el VPS.

En Vercel el sitio no se indexa (`SITE_INDEXABLE` en `lib/siteConfig.ts`), así
Google solo ve el dominio real.

---

## Configuración inicial (una sola vez)

### 1. Vercel

- Settings → Environments → Production → **Branch Tracking**: cambiar `main` por `vercel`.
- Variables: las de siempre, pero con **PayPal Sandbox** (`PAYPAL_ENV=sandbox`).
  `NEXT_PUBLIC_SITE_URL` puede quedar vacía o con la URL `*.vercel.app`.

### 2. VPS (Ubuntu 24.04)

```bash
# Como root, recién creado el servidor
adduser deploy && usermod -aG sudo deploy
curl -fsSL https://get.docker.com | sh && usermod -aG docker deploy
ufw allow OpenSSH && ufw allow 80 && ufw allow 443 && ufw enable
mkdir -p /opt/maranatha && chown deploy:deploy /opt/maranatha
```

Después, en `/etc/ssh/sshd_config`: `PasswordAuthentication no` y
`PermitRootLogin no`, y `systemctl restart ssh` (primero comprobar que entrás
como `deploy` con tu llave).

Crear `/opt/maranatha/.env` con las variables de producción (la lista está en
`.env.example`) más estas dos para Caddy:

```bash
SITE_DOMAIN=tudominio.com
ADMIN_HOST=admin.tudominio.com   # opcional; debe coincidir con la de la app
NEXT_PUBLIC_SITE_URL=https://tudominio.com
PAYPAL_ENV=live
# ... resto de variables de .env.example
```

`chmod 600 /opt/maranatha/.env`. Este archivo nunca va al repo.

### 3. Llave SSH para GitHub Actions

En tu PC:

```bash
ssh-keygen -t ed25519 -f maranatha-deploy -N "" -C "github-actions"
```

- El contenido de `maranatha-deploy.pub` va en `/home/deploy/.ssh/authorized_keys` del VPS.
- El contenido de `maranatha-deploy` (la privada) va en el secret `VPS_SSH_KEY` (paso 4).

### 4. GitHub → repo → Settings → Secrets and variables → Actions

**Secrets:**

| Nombre                | Valor                                   |
|-----------------------|-----------------------------------------|
| `VPS_HOST`            | IP del VPS                              |
| `VPS_USER`            | `deploy`                                |
| `VPS_SSH_KEY`         | llave privada del paso 3                |

**Variables** (pestaña *Variables*, no son secretas):

| Nombre                                 | Valor                        |
|----------------------------------------|------------------------------|
| `NEXT_PUBLIC_SITE_URL`                 | `https://tudominio.com`      |
| `NEXT_PUBLIC_SUPABASE_URL`             | URL del proyecto Supabase    |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_…`           |

No hace falta ningún token personal de GitHub: el workflow usa el
`GITHUB_TOKEN` automático para subir la imagen y para bajarla en el VPS.

### 5. El día del cambio a producción

1. DNS: registros A de `tudominio.com`, `www` y `admin` (si se usa) → IP del VPS.
2. `git push origin vercel:vps` y mirar la pestaña Actions.
3. Supabase → Authentication → URL Configuration: Site URL y Redirect URLs con el dominio nuevo.
4. PayPal Live: crear el webhook a `https://tudominio.com/api/payments/paypal/webhook`
   y poner su id en `PAYPAL_WEBHOOK_ID` del `.env` del VPS (luego `docker compose up -d`).

---

## Operación

```bash
cd /opt/maranatha
docker compose logs -f web           # logs de la app
docker compose restart web           # reiniciar
```

Volver a una versión anterior: GitHub → Actions → el run de esa versión →
**Re-run all jobs**. Reconstruye ese commit y lo vuelve a publicar.

Tras cambiar el `.env` del VPS basta con `docker compose up -d`. Si cambia una
`NEXT_PUBLIC_*`, hay que cambiarla también en las Variables de GitHub y volver a
desplegar, porque esas quedan dentro de la imagen.
