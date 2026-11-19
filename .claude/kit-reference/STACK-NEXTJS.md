# The kit's default stack

The default for every new project. The orchestrator confirms or adjusts it in the
interview; if it is adjusted, it is written in `context/PROJECT_CONTEXT.md` and **that file
overrides this one**.

---

## Base

| Piece | Choice | Why |
|---|---|---|
| Framework | **Next.js** (App Router) | Server Components, native metadata, API routes in the same repo |
| Language | Strict **TypeScript** | — |
| Components | **decided per project** | shadcn/ui · Hero UI · MUI — see `UI-LIBRARIES.md`. The orchestrator always asks. |
| Styling | **per the library** | Tailwind with shadcn/ui and Hero UI; `sx`/`styled` with MUI (and there Tailwind is **not** used) |
| Manager / runner | **bun** | Never npm, yarn or pnpm in the same project |
| Linter / format | **Biome** (`create-next-app --biome`) | One binary for lint and format; no ESLint + Prettier |
| Compiler | **React Compiler** (`--react-compiler`, `reactCompiler: true`) | Automatic memoization; no hand-written `useMemo`/`useCallback` |
| Icons | **lucide-react** | One set, one stroke width |
| Forms | **react-hook-form** + **zod** | The same schema validates client and server |
| Dates | **date-fns** | — |
| Animation | **CSS/Tailwind** first; **framer-motion** only if really needed |

### When to deviate

- **Astro** — a content site, almost all static, with no interactivity beyond a form. Less
  JavaScript shipped: `tech/astro.md`.
- **Vite + React** — an app behind a login, with no need for SEO or SSR.
- **Next.js anyway** — for everything else. When in doubt, Next.js.

## Backend

Three are covered, and QA runs against a local copy of each (`qa:local`):

| | Supabase | Firebase (Auth + Firestore) | Postgres on the VPS |
|---|---|---|---|
| Local backend | stack in **Docker** | **emulators** (**Java**, no Docker) | Postgres and Mailpit in **Docker** |
| Schema in git | `supabase/migrations/` | `firestore.rules`, `firebase.json` | `drizzle/` |
| Auth | Supabase Auth | Firebase Auth | Better Auth, in the app |
| Monthly cost | paid tier past the free one | paid tier past the free one | none beyond the VPS |
| Guide | `tech/supabase.md` | `tech/firebase.md` | `tech/vps-postgres.md` |

The choice goes in `PROJECT_CONTEXT.md`, in the QA line of `CLAUDE.md`, and in its `Tech refs`
line (`tech/README.md`).

---

## bun

```bash
bun install
bun add <package>
bun add -d <dev-package>
bun remove <package>
bun dev
bun run build
bun run start
bunx shadcn@latest add button card dialog
bunx tsc --noEmit
bunx playwright install chromium
```

Rules:

- **A single lockfile.** `bun.lock` goes in the repo; if a `package-lock.json` or a
  `pnpm-lock.yaml` shows up, delete it — two lockfiles produce different installs on
  different machines.
- `package.json` scripts run with `bun run <script>`.
- **CLIs:** the global ones César has installed (`vercel`, `supabase`, `gh`) are called by
  their name, never through `bunx`: it downloads a copy each time and may run a different
  version from the one that has the session. The project's own (`biome`, `tsc`,
  `playwright`) through `bun run` or `bunx`, which finds them in `node_modules`. `bunx`
  only for what is installed nowhere (`bunx shadcn@latest`). If a global CLI is missing
  (a cloud session), `bunx <cli>@latest`. `bunx` and `bun x` are the same command; the
  kit writes `bunx` (César, 2026-10-30, once `bunx` was on the PATH of pwsh and the slots'
  Git Bash). If a shell answers `bunx: command not found`, `bun x` works the same.
- If a tool does not work under bun (an occasional bundler or native binary), use `npx`
  **only for that tool**, and note it in the project's README with the reason. Do not switch
  the whole project's manager for one exception.
- On Windows with several workers: the full suite runs alone, in the background and to a
  file (`bun run test > .qa/test.log 2>&1`), never at the same time as the build — Bun hangs
  with piped output or PGlite runs out of memory.

---

## Context7 — always up-to-date documentation

**Before using any library's API, check its current documentation through Context7.**

```
1. resolve-library-id  → get the library's id
2. query-docs          → bring the documentation of the part you will use
```

Applies to: Next.js, React, Tailwind, shadcn/ui, Radix, react-hook-form, zod, Prisma or
Drizzle, the payments SDK, the auth provider, TanStack Query, framer-motion, and any new
dependency.

Why it is mandatory and not a recommendation: these libraries move fast. Next.js went from
Pages to App Router, Tailwind changed its configuration in v4, payment SDKs rename methods
between major versions. Writing against an API you remember from an earlier version
produces code that **compiles and fails at runtime** — the worst kind of error, because
neither the build nor the typecheck catches it.

Checking costs seconds. Debugging costs a session.

If Context7 does not have the library or is unavailable, say so explicitly and flag that
part of the code as written without checking current documentation, so it gets reviewed.

---

## Folder structure

```
app/
  (marketing)/              public routes group
    page.tsx
    precios/page.tsx
  (app)/                    authenticated routes group
    dashboard/page.tsx
  api/
    webhooks/<provider>/route.ts
  layout.tsx
  globals.css
  sitemap.ts
  robots.ts
  opengraph-image.tsx
components/
  ui/                       primitives (shadcn + custom)
  sections/                 page sections
  <domain>/                 grouped by domain as they grow
lib/
  utils.ts                  cn(), helpers
  validations/              zod schemas
  db/                       client and queries
hooks/
types/
context/                    the project's living documentation (from the kit)
design/                     Claude Design's BRIEF and HANDOFF
phases/                     the chosen track's phases
supabase/                   migrations, seed, auth templates (in git)
.qa/                        measuring scripts and logs (gitignored)
```

---

## Conventions

### Server vs. Client

- Server Components by default.
- `'use client'` only with state, effects, listeners or browser APIs.
- Put it **as low in the tree as possible**: in a layout it drags the whole subtree into the
  client bundle and the benefit of Server Components disappears.
- Data is fetched on the server; Client Components receive it through props.
- A `'use client'` module exports only components: a constant imported from it into a
  Server Component arrives as a client reference, not a value (`undefined`, 500). What is
  shared goes in `lib/`.
- A Server Component passes a client one only serializable props: never a function (a
  `href` builder, a formatter). It fails at render, not in `typecheck`. Pass the data
  (a map of hrefs) or move the function into the client module (KREA).

- A module with `import 'server-only'` does not load in `bun test` (KREA). Split it: the logic
  in a pure module that takes its dependencies as arguments (tested), and a thin `server-only`
  wrapper that injects them (not tested).

### Cache Components (`cacheComponents: true`)

What KREA hit (Next 16), each one a broken build or a 500 found late:

- **A dynamic route keeps `generateStaticParams`, returning at least one real param.** An
  empty array is a build error, and removing it under a layout that reads the path broke the
  build.
- **Variants of an internal view** (a reference page, a state gallery) go as a route
  `[state]` with `generateStaticParams`, not `?state=`: reading `searchParams` outside
  `<Suspense>` fails the prerender ("uncached or runtime data during prerendering").
- **`opengraph-image.tsx`:** no `await fetch` of fonts at module level (it hung the build).
  The TTF in the repo, read inside the function (`readFile`), or loaded lazily there.
- **The build passes with errors that only show in dev with a session** (`Date.now()`,
  uncached data). So: a test that lists every `page.tsx` and fails if its segment has no
  `loading.tsx` (a hand-made list missed 6 subroutes), and, when the backend closes, a pass
  over every route in dev with the test accounts that counts console errors.

### Dev server (Turbopack)

- With several servers at once (pool workers), Turbopack may time out its subprocesses
  ("Node.js subprocess crashed … deadline has elapsed") and leave a 500 in the `.next/dev`
  cache. A restart is not enough: shut down, delete `.next/dev` and restart.
- `typecheck` (`next typegen`) with errors about routes that no longer exist: stale types in
  `.next/dev/types` or `.next/types` from another branch. Delete both and run it again;
  `wt take` already does it when it puts a new branch in a slot (KREA ×5).

- `next build` dying on Windows with exit code `0xc0000142` while PostCSS runs (Turbopack,
  several slots building): retry once; if it dies the same way, the PR's CI build is the one
  that counts, and say so in the report (workout ×2).

### Migrating an app from Vite

What tripped workout's move from Vite + React to Next 16, with both living together for a
while:

- **`src/pages/` is the Pages Router for Next.** Vite's screens folder with that name breaks
  `next build`. Rename it before the first build (`src/screens/`), or keep Next's code out of
  `src/` with an empty `pages/` at the root.
- **A root `postcss.config.*` is read by Vite too.** While both builds live, Vite's PostCSS
  goes inline in `vite.config` (`css.postcss`) and Next keeps the file; each with its own
  `tsconfig`.
- **`public/` wins over `app/`.** Vite's `public/manifest.webmanifest` and `icon.svg` were
  served instead of Next's `app/manifest.ts` and `app/icon.svg`, with no warning. Move
  Vite's `public/` aside (`publicDir`) before the brand unit, and check with `curl` which one
  answers.
- **What moves from one app to the other, besides the screens:** the auth session
  (`localStorage` in the SPA, cookies with a server: every user logs in again unless it is
  migrated), the URLs users saved (hash routes `/#/x` need a redirect), the service worker
  and whatever it cached, and the stored keys of local state.
- **Removing Vite:** `vitest` asks for `vite` as a peer. Keep it in devDependencies while the
  tests run on Vitest.
- **A service worker over the App Router:** the cache key is the exact URL, `_rsc` query
  included — in Next 16 it is a hash of the router tree, not noise to strip. And a cached
  HTML served under another URL makes `useParams()` return the param of the cached tree
  (seen on 16.4): read the URL from `window.location` in that case.
- `qa:local` starts the `dev` / `build` scripts of `package.json`: while both apps live, make
  sure those are Next's, or QA tests the old app.

### Biome

- Two `// biome-ignore` in a row on one JSX node do not chain: only the first applies. For
  several rules or lines, a range: `// biome-ignore-start lint/<group>/<rule>: <reason>` …
  `// biome-ignore-end lint/<group>/<rule>: <reason>` (in JSX, inside `{/* */}`) (KREA,
  Biome 2.4).

### TypeScript

- `strict: true`. Zero `any` — use `unknown` and validate.
- Explicitly typed props; no `React.FC`.
- Shared types in `types/`; local ones next to the component.

### Tailwind (if the project uses it)

- Every token lives in `tailwind.config` (or in CSS variables with `@theme` in v4).
- With MUI, this section does not apply: tokens live in `createTheme()`.

- Conditional classes with `cn()` (`clsx` + `tailwind-merge`).
- **`cn` only resolves the conflicts it knows.** A utility of the project's own
  (`@utility text-small-b`, `shadow-done`, `rounded-done`) next to Tailwind's (`text-xs`,
  `shadow-1`, `rounded-md`) keeps both, and the one the CSS emits last wins — with `dark:`
  the winner changed (KREA ×3). Each one is registered once, in the `cn` file, and checked
  with a `cn(...)` in the unit's test:

  ```ts
  import { extendTailwindMerge } from 'tailwind-merge'
  const twMerge = extendTailwindMerge({
    extend: {
      // a token in @theme (--text-small-b, --shadow-done) → its theme key
      theme: { text: ['small-b'], shadow: ['done'], radius: ['done'] },
      // a hand-written @utility → its class group
      classGroups: { 'font-size': ['text-small-b'] },
    },
  })
  ```
- **Tailwind v4 scans everything git does not ignore**, not only the code: `context/`,
  `.claude/` and the handoff are tracked, and a `mt-[13px]` quoted in a kit rule ended up in
  the CSS (workout). The global stylesheet names its sources:

  ```css
  @import "tailwindcss" source(none);
  @source "../app";
  @source "../components";
  @source "../lib";
  ```
  (paths relative to the stylesheet; add each folder that holds class names.)
- **`cn` reads a font-size token as a color.** `text-small` next to `text-text-2`: with the
  default `tailwind-merge`, the second removed the first with no error (workout). Every
  `--text-*` size of the theme goes in `extendTailwindMerge` (the block above), with a test
  that walks the `--text-*` variables of the CSS and checks each survives a `cn()` with a
  color.
- **A theme variable that depends on a per-element variable goes in `@theme inline`.** In
  plain `@theme` it resolves where it is defined (`:root`), so overriding the inner variable
  on an element does nothing: an `--animate-*` built on `var(--duration)` ignored the
  override (workout; Tailwind docs, "Referencing other variables").
- Mobile first: base classes are mobile, the `md:`/`lg:` prefixes widen.
- **Zero arbitrary values** (`w-[347px]`, `text-[#3a7bd5]`). If one is needed, either a token
  is missing or it is a decision to record.

### Environment variables

- `.env.example` in the repo, with every variable and **no real values**.
- `.env.local` in `.gitignore`.
- `NEXT_PUBLIC_` **only** for what is really public — that prefix puts the value in the
  browser bundle.
- Validate the variables at startup, with zod. A failure from a missing variable should
  happen on startup, not on the first user's request.

### Images

- `next/image` always.
- `width`/`height`, or `fill` + `sizes`. Without it, CLS is guaranteed.
- The hero image with `priority`; the rest lazy by default.
- Modern formats (AVIF/WebP) with a fallback.

### Fonts

- `next/font` — self-hosts, removes the external request and avoids the flash.
- `display: 'swap'`.

---

## Dependencies: judgment before installing

Before `bun add`, ask yourself:

1. Does the platform or something already installed solve it? (Many date and formatting
   utilities are already in `Intl`.)
2. How much does it weigh in the client bundle?
3. Is it maintained? Last commit, open issues.
4. Does it have documentation in Context7? If not, it will cost more to maintain.

One dependency less is one decision you do not have to revisit in a year.
