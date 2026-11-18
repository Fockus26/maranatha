# kit-deploy · Dockerfile for a Next.js project (bun + `output: 'standalone'`).
# Copied into the project's root by the kit; built by templates/deploy-vps.yml with
#   docker build --build-arg GIT_SHA=<commit> -t ghcr.io/<owner>/<repo>:<commit> .
# The project's next.config must have `output: "standalone"`; deploymentId comes from GIT_SHA.
# maranatha: next.config turns standalone on only with NEXT_OUTPUT=standalone (D072), so Vercel's
# build stays as it was. That ENV is the only change from kit-deploy's template.

ARG BUN_VERSION=1.4.4
ARG NODE_VERSION=22-alpine

# ── dependencies ─────────────────────────────────────────────────────────────
FROM oven/bun:${BUN_VERSION} AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# ── build ────────────────────────────────────────────────────────────────────
FROM oven/bun:${BUN_VERSION} AS build
WORKDIR /app
ARG GIT_SHA
# deploymentId (version skew protection) = the commit; Next reads NEXT_DEPLOYMENT_ID at build.
ENV NEXT_DEPLOYMENT_ID=${GIT_SHA} \
    NEXT_TELEMETRY_DISABLED=1 \
    NEXT_OUTPUT=standalone
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN if [ -z "$GIT_SHA" ]; then echo "GIT_SHA build arg is required" >&2; exit 1; fi
# The environment's NEXT_PUBLIC_* and Server Actions key (deploy-vps.yml › Build variables), for
# this command only: the mounted file is in no layer (the key itself goes into .next, as Next
# needs it at runtime). Without it (a build by hand) Next builds with
# none of them. BUILD_ENV_HASH (sha256 of that file) makes new values miss the cache, which
# ignores a secret's content.
ARG BUILD_ENV_HASH
RUN --mount=type=secret,id=build_env,target=/app/.env.production.local,required=false \
    bun run build
RUN if [ ! -f .next/standalone/server.js ]; then \
      echo "no .next/standalone/server.js: set output: \"standalone\" in next.config" >&2; exit 1; \
    fi
RUN mkdir -p public

# ── runtime ──────────────────────────────────────────────────────────────────
FROM node:${NODE_VERSION} AS run
WORKDIR /app
ARG GIT_SHA
# kit-agent passes NODE_OPTIONS with ~75 % of the container's memory limit; this default fits
# 512 MB (D017) for a `docker run` by hand.
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    NODE_OPTIONS=--max-old-space-size=384 \
    GIT_SHA=${GIT_SHA}
# uid/gid 1001 = kit-agent's `--user=1001:1001`. The app's files stay root-owned (read-only for
# the process); only Next's cache directory is writable.
RUN addgroup -S -g 1001 nextjs && adduser -S -u 1001 -G nextjs -H -D nextjs
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
RUN mkdir -p .next/cache && chown 1001:1001 .next/cache
USER 1001:1001
EXPOSE 3000
# Next handles SIGTERM itself and finishes in-flight requests; kit-agent stops with a 10 s drain.
CMD ["node", "server.js"]
