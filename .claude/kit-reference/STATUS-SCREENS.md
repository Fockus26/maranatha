# Status screens — 404, error, offline and maintenance

The screens seen when something does not go as in the mockup. They are designed with the
rest of the site (Claude Design, brief §7) and implemented in phase 06. A default Next.js
404 on a site with its own identity shows as much as a pixelated logo.

Visual reference of them done well (project `melao`):
`https://melao-two.vercel.app/layouts/status?screen=<variant>` with `not-found`,
`not-found-guest`, `error`, `error-no-code`, `offline`, `live`, `maintenance` and
`maintenance-no-time`.

Copy examples below are in Spanish, the language of the kit's sites.

---

## The catalog

| Variant | When it shows | Content | Actions |
|---|---|---|---|
| **404 · logged in** | Non-existent route, authenticated user | Label "Error 404", a title in the brand's voice, one line on what happened | "Ir al inicio" + the user's main destination (e.g. "Ver mi curso", "Mi cuenta") |
| **404 · guest** | Non-existent route, no session | Same | "Ir al inicio" + "Entrar" |
| **500 · with a code** | Server error with `error.digest` | Label "Error 500", title, "inténtalo de nuevo; si sigue pasando, escríbenos con este código" + the code visible and copyable | "Reintentar" + "Ir al inicio" |
| **500 · without a code** | Error without `digest` (typically client-side) | Same, without the code sentence or the code | "Reintentar" + "Ir al inicio" |
| **Offline** | The error happened and `navigator.onLine === false` | "Sin conexión", what to check (wifi, data), and what is kept if it applies ("al volver retomas desde la lección") | "Reintentar" (and automatic retry when the `online` event comes back) |
| **Error by network** | Not a screen: it is the **rule** that picks between "Offline" and "500" in the same `error.tsx` | — | — |
| **Maintenance · with a time** | Maintenance mode on with a known return time | Title, what is happening, what is kept ("tu progreso queda guardado"), "Volvemos aproximadamente: <date and time>" **in the visitor's time zone** | None (or a link to social/status if the client has it) |
| **Maintenance · without a time** | Maintenance mode without a known time | Same, without the time line | None |

**Logged in vs. guest only exists if the site has user authentication.** Without auth there
is a single 404, with "Ir al inicio" and, if it makes sense, the site's main action
("Agendar cita", "Ver productos").

Content rules (they apply to all):

- **What happened + what to do.** Never just a code. The 500's code is data for support,
  not the explanation.
- **In the brand's voice**, but the title and the explanation line are understandable
  without the wordplay ("Este paso no está en la coreografía" + "La página que buscas no
  existe o cambió de lugar").
- **The copy is the client's content.** If they did not give it, a realistic placeholder + a
  row in `CONTENT_CHECKLIST.md`, like any text.
- Same visual structure in all of them (minimal header with the logo, label, title, text,
  actions): they read as one family.

---

## Implementation (Next.js App Router)

Check Context7 before writing them: the props of `error.tsx` and the name of `proxy.ts`
changed between versions.

### 404 — `app/not-found.tsx`

- Server Component. Reads the session on the server to pick the variant (logged in / guest)
  — no flicker from one to the other on the client.
- Next answers with status **404** and adds `noindex` on its own. Do not set `robots` by hand.
- Dynamic routes call `notFound()` when the entity does not exist: that way they get this
  same screen and not an indexable empty page.
- **Under a `loading.tsx` the status is 200**, with the 404 screen and `noindex`: the stream
  already started when `notFound()` runs. It is expected and harmless for search engines
  (KREA accepted it). A real 404 costs a check before rendering (in the proxy); do it only if
  a client or an integration reads the status.
- If there are route groups with different layouts, one `not-found.tsx` per group only if
  the design asks for it; otherwise, one at the root.

### Error — `app/error.tsx` and `app/global-error.tsx`

- Client Components (`'use client'`). They receive `error` (with `digest?: string`) and the
  retry function (`retry` in Next 16; `reset` in earlier versions — check it).
- **"With a code"** = `error.digest` exists: it is the identifier Next gives server errors
  and that shows in Vercel's logs next to the real error. It is what the user sends to
  support and what you look up in the logs. **Never** show `error.message`: in production
  Next hides it on server errors and on client ones it may leak internal details.
- **"Error by network"** — in the same `error.tsx`:

  ```tsx
  const online = useSyncExternalStore(
    (cb) => {
      window.addEventListener('online', cb)
      window.addEventListener('offline', cb)
      return () => {
        window.removeEventListener('online', cb)
        window.removeEventListener('offline', cb)
      }
    },
    () => navigator.onLine,
    () => true, // on the server, connection is assumed
  )
  // !online → <OfflineScreen onRetry={retry} />  ·  online → <ErrorScreen code={error.digest} onRetry={retry} />
  ```

  When the `online` event comes back, it retries on its own (once) and announces the change.
- `global-error.tsx` covers errors in the root layout: it replaces the layout, so it brings
  its own `<html lang>` and `<body>`, imports the global styles and fonts, and reuses the
  same screen component. Without it, an error in the layout shows the default screen.
- The screens are components (`components/status/StatusScreen.tsx` and its variants) shared
  by `not-found.tsx`, `error.tsx`, `global-error.tsx` and the maintenance page.

### Offline outside an error

The "Offline" variant also serves:

- as the **service worker fallback** if the site is a PWA (a precached `/offline` page);
- as a **non-blocking notice** (a banner with `role="status"`) if the product must stay
  usable without a network. That is a design decision: ask, do not assume.

### Maintenance

- Turned on with environment variables, not with a code deploy:
  `MAINTENANCE_MODE=on` and, optionally, `MAINTENANCE_UNTIL=<ISO 8601 in UTC>`
  (`2026-10-01T23:30:00Z`). Both in `.env.example`.
- `proxy.ts` (Next 16; `middleware.ts` before) rewrites every route — except `/_next`,
  assets, `robots.txt` and, if it applies, a health route — to `/mantenimiento`, with status
  **503** and a `Retry-After` header (seconds until `MAINTENANCE_UNTIL`, or 3600 if there is
  no time). How to set the status and headers on the rewrite: Context7, and check it with
  `curl -I` against the production build. The 503 tells Google "come back later" without
  deindexing; a 200 with the maintenance page may get indexed.
- The time is formatted **on the client**, with the visitor's zone:
  `new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeStyle: 'short', timeZoneName: 'short' })`.
  Formatting it on the server shows the server region's time (UTC on Vercel). Without
  `MAINTENANCE_UNTIL`, or if it has passed, the variant without a time shows.
- On Vercel, changing an environment variable needs a redeploy to apply. If the client needs
  to turn it on instantly and without a redeploy, Edge Config — it is a decision, ask.
- `/mantenimiento` with `robots: { index: false }` and out of the sitemap.

### Status gallery (to review and capture)

A development route that renders each variant without having to trigger it:
`app/(dev)/estados/page.tsx` with `?screen=not-found | not-found-guest | error |
error-no-code | offline | live | maintenance | maintenance-no-time`.

- In production it returns `notFound()` (`process.env.NODE_ENV === 'production'` or a
  variable of its own) and does not enter the sitemap.
- It is the route `design-qa`, the PR screenshots (`.pr-shots.json`) and César use to review.
  Without it, the 500 and maintenance never get reviewed.

### Other stacks (Astro, Vite SPA)

The catalog and the content rules are the same; the mechanism changes: a `404.astro` (or the
SPA router's catch-all) for the 404, an error boundary in the island/app root for the 500
and offline variants, and maintenance through the host's rewrites with a 503. Check the
framework's docs in Context7.

---

## Accessibility and SEO

- A single `<h1>` (the title), the label "Error 404" as text, not an image.
- Focus goes to the `<h1>` when `error.tsx` mounts (the user came from another screen).
- Switching to "Offline" or the network coming back: announced (`role="status"` / `aria-live`).
- The 500's code is selectable text, with a copy button with an accessible name.
- Decorative illustrations (melao's 404 numbers) with `aria-hidden`.
- Correct HTTP statuses: 404, 500, 503 — not 200 with an error screen.

## Closing criteria (phase 06)

- [ ] The variants that apply exist and share a base component.
- [ ] Logged in/guest only if there is auth; otherwise, a single 404.
- [ ] `error.tsx` picks between "Offline" and "500" by the network, and between with/without
      a code by `digest`.
- [ ] `global-error.tsx` with html/body, styles and fonts.
- [ ] Maintenance through an environment variable, 503 + `Retry-After`, time in the
      visitor's zone, variant without a time.
- [ ] `/estados` gallery in development, blocked in production.
- [ ] Real copy or in `CONTENT_CHECKLIST.md`.
- [ ] `a11y` gate green on every variant, light and dark.
