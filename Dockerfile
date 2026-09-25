# syntax=docker/dockerfile:1
#
# Imagen de producción para el VPS (rama `vps`). Vercel no usa este archivo.
# La construye `.github/workflows/deploy-vps.yml`; ver `deploy/README.md`.

# ─── Base: Node (runtime oficial de Next) + bun para instalar y correr scripts
FROM node:22-slim AS base
COPY --from=oven/bun:1.3.14 /usr/local/bin/bun /usr/local/bin/bun
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# ─── Dependencias (capa cacheada mientras no cambie el lockfile)
FROM base AS deps
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# ─── Build
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Las NEXT_PUBLIC_* se copian dentro del JS del navegador durante el build:
# si no llegan aquí, quedan vacías aunque el contenedor las tenga después.
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY \
    NODE_ENV=production \
    NEXT_OUTPUT=standalone

# Las variables secretas (Supabase, PayPal, PAY_*) no entran al build: las
# páginas que las usan son dinámicas y las leen del `.env` del VPS al correr.
RUN bun run build

# ─── Runtime: solo el servidor standalone, sin node_modules completo
FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/robots.txt').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
