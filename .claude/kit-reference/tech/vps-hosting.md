# Hosting on César's VPS (kit-deploy)

A project deployed on César's VPS instead of Vercel, through **kit-deploy**: our own platform with
a preview per PR, deploy on merge, variables per environment and a dashboard. Its design and
requirements are [`prompts/VPS-PLATFORM-BRIEF.md`](../../prompts/VPS-PLATFORM-BRIEF.md).

**State: kit-deploy is not built yet** (2026-11-09). Until `ssh kit-vps kit-deploy version`
answers, a project deploys on Vercel (`tech/vercel.md`) and does not use this file. What follows is
the **contract** a project must meet to deploy there: the platform's project keeps it true, and
its last phase replaces each "will" with the real command and adds the templates to
`tech/vps-hosting/`.

Why the VPS (César, 2026-11-09): a fixed cost instead of a bill per use, the database on the same
machine, and a client's commercial site does not need Vercel Pro.

## What changes from Vercel

| Vercel | kit-deploy |
|---|---|
| Preview per PR, linked by the bot | `<project>-pr-<n>.preview.<domain>`, linked in a PR comment and a commit status. Behind César's login, `noindex` |
| Builds on Vercel | Builds in GitHub Actions (`deploy-vps.yml` from the kit), the image goes to GHCR |
| `vercel env pull .env.local --yes` | `ssh kit-vps kit-deploy env pull <project> > .env.local` (Development set; nothing printed) |
| `vercel env add <NAME> <env>` | `ssh kit-vps kit-deploy env set <project> <env> <NAME>`: César types the value in his terminal (stdin), never in the chat |
| `ssh kit-vps kit-db url … \| vercel env add DATABASE_URL …` | Nothing: kit-deploy puts `DATABASE_URL` into Production and Preview by itself |
| Vercel Cron | kit-deploy's cron calling a route with `CRON_SECRET` |
| `vercel.json` `regions: ["fra1"]` | Not needed: the app and the database are on the same machine |
| Instant rollback | The same, over the last 5 production images |
| Blob, Analytics, Edge Config | Not offered. Files: Cloudflare R2 (a decision). Analytics: a decision |

## What the project needs

1. **`next.config.ts`:** `output: 'standalone'` (the image carries only `.next/standalone`, no
   `node_modules`) and `deploymentId: process.env.GIT_SHA`. Why the second: during a deploy the
   old and the new container both answer for a few seconds, and the ID keeps a browser on the old
   build from loading the new build's chunks (Next.js self-hosting guide).
2. **`/api/health`:** answers `200` without touching the database. kit-deploy waits for it before
   switching traffic and checks it to raise alerts. A health check that queries the database makes
   every site look down, and restart, when the database blips.
3. **`Dockerfile`** and **`.github/workflows/deploy-vps.yml`** copied from the kit's
   `tech/vps-hosting/` (they will come with kit-deploy), plus the repo secret `KIT_DEPLOY_TOKEN`
   (`gh secret set KIT_DEPLOY_TOKEN`, César pastes it from the dashboard). Do not write your own:
   the workflow is where the per-environment build variables come from.
4. **The variables, split by when they are read:**
   - `NEXT_PUBLIC_*` are **inlined at build**: changing one needs a rebuild of that environment,
     not a restart. A preview image is never promoted to production, because it carries the
     preview's public values.
   - Server variables are read at runtime: a change takes a redeploy of the same image.
   - `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` is set by kit-deploy. Do not add it to `.env.example`.
5. **`next/image`:** Vercel optimized images on its side; here the container does it. Check one
   page with images in the first preview, and that the image's memory limit holds it.

## Moving a project from Vercel

Once kit-deploy is live, and only when César asks:

1. A branch: the contract above, and the variables copied into kit-deploy, environment by
   environment (César, from Vercel's dashboard). `DATABASE_URL` is not copied: kit-deploy
   creates it.
2. A PR: its VPS preview must work, side by side with Vercel's.
3. **The day before:** the domain's DNS TTL down to 300 s, so the switch and a rollback take
   minutes and not hours.
4. Merge, production on kit-deploy at its temporary URL, the `DEPLOY.md` §3 checks there.
5. The domain in kit-deploy, the `A` record to the VPS. The checks again on the real domain.
6. **Vercel stays a week** without its domain, as a way back. Then `vercel.json`, `.vercel/` and
   the Vercel steps of `PROJECT_CONTEXT.md` › Repo and deployment go; `Tech refs` changes
   `vercel` for `vps-hosting`, and the project's `CLAUDE.md` line about `vercel env pull` says
   `kit-deploy env pull`.

## Traps

- **`.env.local` is overwritten by `env pull`**, as with Vercel: this machine's overrides stay in
  `.env.development.local`.
- **A variable only in the Preview set** is not in Development: `env pull` does not bring it, and
  `next dev` fails the same way it did with Vercel. Compare names with `kit-deploy env ls`.
