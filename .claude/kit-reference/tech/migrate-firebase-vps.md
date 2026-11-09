# Migrate a project from Firebase to the VPS

**Only when César asks for it**, for a project already in production. A new project does not
migrate: it starts on the VPS. While migrating, `Tech refs` has this file and `vps-postgres`, which
holds the setup, environments and code rules; at the end, this one and `firebase` come out. **No
project has done this yet** (the only one so far came from Supabase): whoever goes first reports what
it found with `/kit-feedback`.

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
4. The password hash parameters: console → Authentication → ⋮ → Password hash parameters.
5. Permission for secrets and deploys in Vercel, and to read the old data. Automatic permission modes
   block these without an explicit yes.

## 1. Inventory: what the project really uses

| Firebase | On the VPS | Effort |
|---|---|---|
| Firestore | **A relational model designed from the documents**: collections → tables, subcollections → tables with FK, embedded maps → columns or `jsonb`. It is a redesign, with its own decision | **High** |
| Security rules | Authorization in server code: one check per rule, called by every query of that table, with a test per rule (owner sees, stranger gets 404) | Medium. Every rule must not be lost: list them from `firestore.rules` |
| Firebase Auth | Better Auth + user import (§3) | Medium |
| Auth emails | The app's own (`EMAIL-TEMPLATES.md` § Better Auth) | Low |
| Storage | Cloudflare R2 (10 GB free, S3 API) or the VPS disk behind a route handler. Decide in a decision | Medium |
| Cloud Functions | Route handlers or server actions | Low–medium per function |
| `onSnapshot` | Polling with SWR/React Query, or SSE from a route handler | Medium; often polling is enough |
| Scheduled functions | A timer on the VPS calling a route protected with `CRON_SECRET` (`vps-postgres.md`) | Low |
| `runTransaction` (retried on conflict) | No automatic retry: a `db.transaction` that reads with `SELECT … FOR UPDATE` (Drizzle: `.for('update')`) the row it derives from, so two concurrent writes queue instead of one overwriting the other (KREA lost writes without it) | Low per transaction, but each one must be found |

If it shows deep subcollections or heavy `onSnapshot`, **say so to César before starting**, with the
estimate: maybe that project should stay. A static site with no server has one more step: `astro.md`
› A static site that gains an API.

## 2. Database and schema

1. `vps-postgres.md` › Setting it up: the databases, `vps:env`, `drizzle.config.ts`.
2. The new schema from the redesign, as Drizzle migrations.
3. `qa:local` with `--postgres`, while the project still has `firebase.json`. The rules tests become
   tests of the authorization checks.

## 3. Auth: users keep their password

- Better Auth with `drizzleAdapter(db, { provider: 'pg' })`. Its tables: `bunx auth@latest generate`
  into the Drizzle schema, then a migration. Firebase's uids are not UUIDs: keep them as the `user`
  id (text) so every reference keeps pointing at the same person, and do not set `generateId: 'uuid'`
  without deciding what maps the old ones.
- `firebase auth:export users.json --format=json` gives the hashes in Firebase's modified scrypt.
  `emailAndPassword.password.verify` checks them with a library for that format (`firebase-scrypt`)
  and the project's hash parameters, and the rest with Better Auth's default; `hash` stays the
  default, so each user moves to Better Auth's format the next time they change their password.
- OAuth users: an `account` with the provider and its `sub`.
- **Every session is lost**: users log in again once. It goes in the cutover message if the client
  wants to warn them.
- Roles: whatever lived in custom claims or a document becomes a column or Better Auth's admin
  plugin, decided in the plan.
- The kit's auth rules still apply (`backend-build` §2): httpOnly cookies, rate limiting (Better Auth
  has it: turn it on), messages that do not reveal whether the email exists.

## 4. The rest of the code

Replace each Firestore call through a single data layer (`lib/data/<entity>.ts`), each function with
its authorization check from §1. Grep must end at zero: `firebase` imports left in the code are the
migration not finished. `functional-qa` runs over every flow before the cutover, on the real build
and not only in dev (it is the version QA of a new backend).

**The emulator tests become PGlite tests**, without Docker or the VPS: `@electric-sql/pglite`
with `drizzle-orm/pglite`, applying the migrations of `drizzle/` (`migrate` from
`drizzle-orm/pglite/migrator`) to an in-memory database per file. A small shim with the shape
of a `DocumentSnapshot` (`exists`, `id`, `data()`) over the rows let KREA port ~3,900 lines of
tests almost line by line; once ported, the shim goes away test by test.

The export script, all or nothing, that compares content and not only counts: rehearse it on a
temporary database. Documents without a field the new column requires are found here, not later.

## 5. Cutover, in this order, with César

1. A low-traffic window. Writes frozen (maintenance banner, or the app in read-only).
2. Production variables in Vercel: `ssh kit-vps kit-db url <project> | vercel env add DATABASE_URL
   production`, and the SMTP and `BETTER_AUTH_*` ones.
3. `db:migrate` through the tunnel (`vps-postgres.md` › Migrations).
4. Final data copy with the export script, then the auth import.
5. Counts per collection against rows per table, at both ends.
6. Mark the PR ready and merge: it deploys. Check the API and errors in Vercel; log in with a test
   account of each role; one flow of each kind (create, edit, pay if there are payments). César
   tests login, social login and email. Unfreeze.
7. **The old project stays alive, without writes, 30 days, not deleted**: it is the rollback, and
   clients with an old bundle may still read from it. Rules set to deny writes. Compare the data
   before deleting. Deleting it is César's action.
8. `context/decisions/D0NN-migracion-vps.md` with the date, what moved where and the rollback path;
   `PROJECT_CONTEXT.md` § Stack updated; `Tech refs` left with `vps-postgres`.
