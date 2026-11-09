# Astro

Chosen for a content site, almost all static, with little interactivity: less JavaScript
shipped. Everything else stays Next.js (`STACK-NEXTJS.md`). What changes (world-flags, Astro 7
with a React island):

- **Variables:** client ones are `PUBLIC_*`, and `qa-local.ts` already maps them.
- **Typecheck:** `bunx astro check`. `new-project.ps1` does not add a `typecheck` script here;
  CI's comment says so.
- **Status screens:** `404.astro`, and the gallery as a page excluded in production
  (`STATUS-SCREENS.md`, "Other stacks").
- **React Aria in islands:** focus rings show only after keyboard input, so measure focus with
  real keys (`a11y`).

## Traps

- **Astro ≥ 7 detaches `astro dev` and `astro preview` into the background** when it detects an
  agent: the command exits with 0 and the server stays. `qa:local` starts it with
  `ASTRO_DEV_BACKGROUND=0` / `ASTRO_PREVIEW_BACKGROUND=0` and runs `astro dev stop` on exit; a
  worker starting its own server does the same (brief, rule 6). `astro dev stop` acts on the
  folder's lock (`.astro/dev.json`), so inside a pool slot it only stops that slot's.
- **Astro 7 listens only on `[::1]`.** A check on `127.0.0.1` says the server is down: `qa:local`
  waited its whole 10 minutes before warming until it looked at both. Do the same in any script.
- **A POST without `Content-Type` gets a 403** (Astro's origin check). A cron or a timer calling
  an API route has to send it (world-flags, its reminders timer).

## A static site that gains an API

Going from a static site to routes in the same origin is not only adding an adapter
(world-flags, moving off Supabase):

- It needs `@astrojs/vercel` (or another server adapter). Fix the functions' region next to the
  database.
- **A service worker that caches every same-origin GET starts intercepting `/api/*`** the moment
  the API stops being another origin. Exclude `/api/` from it, and plan for the clients that
  already have the old worker installed: test with it installed, not only with a clean browser.
- **An httpOnly session cookie cannot be read from the browser**, so a PWA that must know who
  is playing offline keeps that identity apart, and announces session changes between tabs.
- **QA on the real build, not only in dev:** the service worker and the rate limits only behave
  as in production there. `@astrojs/vercel` brings no `astro preview`, so the project adds a
  `qa:serve` script that serves `.vercel/output` on `--port <port>` (static files plus the
  functions), and `qa:local -- --preview` uses it with `NODE_ENV=production`. World-flags
  tested the migration in dev only and wrote that server by hand (`.qa/fqa-prod.mjs`).
