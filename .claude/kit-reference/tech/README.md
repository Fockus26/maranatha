# Technology references

What only applies when a project uses a given technology lives here, one file per technology,
so a project that does not use it never reads it. Why (César, 2026-11-04): "Supabase" was in 48
lines across 14 pieces and "Astro" in 13 across 8, inside skills and guides every project
reads, and each round of feedback added more.

## How a project uses them

The project's `CLAUDE.md` has one line:

```
**Tech refs:** astro, vps-postgres → the kit's `reference/tech/<name>.md`, only these.
```

- The agent opens a file **when its task touches that technology**, not at the start of the
  session. It does not open the others, and does not list this folder.
- `project-kickoff` writes the line. A project that adopts a technology later adds the word;
  one that leaves it removes the word.
- A file that says something contradicting a general piece wins over it, for that project.

## The files

| Name | When | How to detect it in an existing project |
|---|---|---|
| [`astro`](./astro.md) | Astro instead of Next.js | `astro.config.*` |
| [`supabase`](./supabase.md) | Supabase for data or auth | `supabase/config.toml` |
| [`firebase`](./firebase.md) | Firebase Auth + Firestore | `firebase.json` |
| [`vps-postgres`](./vps-postgres.md) | Postgres on César's VPS, from the start or migrated | `drizzle.config.*` and a `vps:env` script |
| [`wordpress`](./wordpress.md) | The site is a WordPress. Adopting or starting one: [`wordpress-adopt`](./wordpress-adopt.md), once; templates in [`wordpress/`](./wordpress/) | `wp-content/`, `wp-config.php`, `.wp-env.json` or a `docker-compose.yml` with a `wordpress` image |
| [`vercel`](./vercel.md) | It deploys on Vercel | `.vercel/project.json` or `vercel.json` |
| [`vps-hosting`](./vps-hosting.md) | It deploys on César's VPS through kit-deploy (only once kit-deploy is live) | a `deploy-vps.yml` workflow |
| [`other-hosting`](./other-hosting.md) | It deploys on anything else. The first project on a host adds `tech/<host>.md` | `PROJECT_CONTEXT.md` › Repo and deployment |
| [`migrate-supabase-vps`](./migrate-supabase-vps.md) | Only while moving from Supabase to the VPS, when César asks | César asked; `feat/migrate-vps` open |
| [`migrate-firebase-vps`](./migrate-firebase-vps.md) | Only while moving from Firebase to the VPS, when César asks | César asked; `feat/migrate-vps` open |

The two migration files repeat what they share on purpose, so each project reads only its own: a
change to the cutover goes in both.

## Where a new rule goes (the kit's maintainer)

| It applies to… | It goes to… |
|---|---|
| every project | the general piece (skill, template, `QA-PREVENTION`…) |
| every project using one technology | that technology's file here |
| one project | nowhere: it stays in that project |

Each file is short and written the same way: what changes from the default, then the traps,
each with the incident that found it. A skill may keep **one line** that sends here (`Firebase:
reference/tech/firebase.md`); the detail lives here. What the general stack needs goes in
[`STACK-NEXTJS.md`](../STACK-NEXTJS.md), not here.
