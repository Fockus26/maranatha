# Migrate a project from Supabase to the VPS

**Only when César asks for it**, for a project already in production. A new project does not
migrate: it starts on the VPS. While migrating, `Tech refs` has this file and `vps-postgres`, which
holds the setup, environments and code rules; at the end, this one and `supabase` come out. The
first one was **world-flags** (2026-11-04).

The result: **Drizzle** on Postgres, **Better Auth** inside the app, **emails from the app** through
Brevo's SMTP. Check Context7 for each before writing their code: these steps fix the order and the
traps, not the exact API.

It is done like any big unit: a plan in `context/plans/migrate-vps.md`, a `feat/migrate-vps` branch,
and a **draft PR until the cutover**. Why draft: the merge deploys, and on world-flags a PR merged
before the cutover, with only a warning in its description, gave 500s in production for about 40
minutes.

## Before touching anything, César prepares

1. Backblaze or R2 for the VPS's copies, if not done (`VPS-POSTGRES.md`, step 6).
2. Brevo: verified sender and SMTP key.
3. The OAuth client again for the new callback URL (`/api/auth/callback/<provider>`), if there is
   social login. Google needs a privacy URL to publish.
4. Read access to the old database, and permission for secrets and deploys in Vercel. Automatic
   permission modes block these without an explicit yes.

## 1. Inventory: what the project really uses

Read the real database, read-only, as well as the code: policies, columns, cron jobs, applied
migrations.

| Supabase | On the VPS | Effort |
|---|---|---|
| Tables | Same tables, same SQL. `drizzle-kit pull` generates the schema from the new database | Low |
| RLS policies | Authorization in server code: one check per policy, called by every query of that table, with a test per policy (owner sees, stranger gets 404) | Medium. Every policy is a rule that must not be lost: `select * from pg_policies` |
| Supabase Auth | Better Auth + user import (§3) | Medium |
| Auth emails | The app's own (`EMAIL-TEMPLATES.md` § Better Auth) | Low: the React Email templates already exist |
| Storage | Cloudflare R2 (10 GB free, S3 API) or the VPS disk behind a route handler. Decide in a decision | Medium |
| Edge Functions | Route handlers or server actions | Low–medium per function |
| Realtime | Polling with SWR/React Query, or SSE from a route handler | Medium; often polling is enough |
| `pg_cron` | A timer on the VPS calling a route protected with `CRON_SECRET` (`vps-postgres.md`) | Low. Check `cron.job`: on world-flags it was empty |
| RPC (`supabase.rpc`) | The same SQL function (it moves with the schema) through Drizzle `sql`, or rewritten as a query | Low |

If it shows heavy Realtime, **say so to César before starting**, with the estimate: maybe that
project should stay. A static site with no server has one more step: `astro.md` › A static site
that gains an API.

## 2. Database and schema

1. `vps-postgres.md` › Setting it up: the databases, `vps:env`, `drizzle.config.ts`.
2. The schema comes from the repo's migrations (`supabase/migrations/`), not from a dump of the
   dashboard. Drop what only exists in Supabase: `auth.uid()` in defaults and policies, grants to
   `anon`/`authenticated`, `storage.*`. FKs to `auth.users(id)` point to Better Auth's `user` table.
   Then `drizzle-kit pull` against the new database, so the Drizzle schema matches what is there.
3. `qa:local` with `--postgres`, while the project still has `supabase/`. The tests that ran against
   Supabase local run against it.

## 3. Auth: users keep their password

- Better Auth with `drizzleAdapter(db, { provider: 'pg' })` and `advanced.database.generateId:
  'uuid'`, so the imported ids (Supabase's are UUIDs) stay the same and every FK keeps pointing at
  the same person. Its tables: `bunx auth@latest generate` into the Drizzle schema, then a migration.
- `auth.users` + `auth.identities` → `user` + `account` (`providerId: 'credential'`, `password` =
  `encrypted_password`). Supabase hashes with bcrypt and Better Auth with scrypt by default, so
  `emailAndPassword.password.verify` checks bcrypt hashes (`$2a$`/`$2b$` prefix) with
  `bcrypt.compare` and the rest with Better Auth's default; `hash` stays the default, so each user
  moves to scrypt the next time they change their password. Better Auth's docs have a "Supabase to
  Better Auth" migration guide: start from it.
- OAuth users: an `account` with the provider and its `sub`.
- **Every session is lost**: users log in again once. It goes in the cutover message if the client
  wants to warn them.
- Roles: whatever lived in `app_metadata` or a `profiles` table becomes a column or Better Auth's
  admin plugin, decided in the plan.
- The kit's auth rules still apply (`backend-build` §2): httpOnly cookies, rate limiting (Better Auth
  has it: turn it on), messages that do not reveal whether the email exists.

## 4. The rest of the code

Replace each `supabase.from(…)` through a single data layer (`lib/data/<entity>.ts`), each function
with its authorization check from §1. Grep must end at zero: `@supabase/` imports left in the code
are the migration not finished. `functional-qa` runs over every flow before the cutover, on the real
build and not only in dev (it is the version QA of a new backend).

An import script, all or nothing, that compares content and not only counts: rehearse it on a
temporary database.

## 5. Cutover, in this order, with César

1. A low-traffic window. Writes frozen (maintenance banner, or the app in read-only).
2. Production variables in Vercel: `ssh kit-vps kit-db url <project> | vercel env add DATABASE_URL
   production`, and the SMTP and `BETTER_AUTH_*` ones.
3. `db:migrate` through the tunnel (`vps-postgres.md` › Migrations).
4. Final data copy: `pg_dump --data-only --schema=public` from the direct connection,
   `pg_restore`/`psql` into the new database through the tunnel, then the auth import.
5. Row counts per table equal at both ends.
6. Mark the PR ready and merge: it deploys. Check the API and errors in Vercel; log in with a test
   account of each role; one flow of each kind (create, edit, pay if there are payments). César
   tests login, social login and email. Unfreeze.
7. **The old project stays alive, without writes, 30 days, not deleted**: it is the rollback, and
   clients with an old bundle may still read a minimum version from it. Compare the data before
   deleting. Deleting it is César's action. (World-flags deleted its project the same day, so its
   only way back is the backups.)
8. `context/decisions/D0NN-migracion-vps.md` with the date, what moved where and the rollback path;
   `PROJECT_CONTEXT.md` § Stack updated; `Tech refs` left with `vps-postgres`.
