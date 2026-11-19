# Supabase

Postgres, Auth, Storage and emails in one service, with a local stack in Docker for QA.

## Local database for QA

`bun run qa:local` starts Supabase in Docker, applies migrations + seed, creates the accounts
and points the app at the local stack. For it to work, from the first unit with a database:

- `supabase init` and **every schema change as a migration** in `supabase/migrations/`
  (`supabase migration new <name>`). A change made only in the dashboard does not exist in
  the local database: QA would test another schema.
- **`supabase/` goes in git** (except `.temp/`, `.branches/` and any `.env`, which the
  `.gitignore` that `supabase init` creates already covers). It is the schema's history:
  ignoring it leaves the pool slots and `wave-qa` without migrations, and losing the folder
  loses them. If the reason was "the SQL is private", the answer is a private repo:
  security comes from RLS and permissions, not from hiding the policies.
- `supabase/seed.sql` with the minimum to walk through the flows (catalog, settings), no
  personal data.
- If the role does not live in `app_metadata.role`: a table (`profiles`) or access through a
  subscription → `assignRole` in `scripts/qa-roles.ts`; a list of emails in a variable
  (`ADMIN_EMAILS`) → `ROLE_BY_ENV`. If the app uses a Supabase variable with another name,
  add it to `EXTRA_ENV_MAP` there (the script aborts if any is left pointing at
  `*.supabase.co`). (Projects from before 3.8.0 have these as `asignarRol`, `ROL_POR_ENV` and
  `MAPEO`.)

Test accounts' role: `app_metadata.role`. Policies are tested with SQL/RLS tests.

## Emails

Without custom SMTP, Supabase only sends to the project team: it goes in before the first real
user. Templates and `config.toml`: `EMAIL-TEMPLATES.md`.

## RLS does not check whose the parent is

`with check (user_id = auth.uid())` validates the row's own column, not its foreign keys: a
user can insert a child row pointing at another account's parent, and the policy passes
(workout's QA: an entry created inside someone else's session). For every child table, one of:
a composite foreign key that carries the owner (`(parent_id, user_id) references parent (id,
user_id)`), a `with check` that also reads the parent (`exists (select 1 from parent p where
p.id = parent_id and p.user_id = auth.uid())`), or a trigger. And a test per table that tries
it with two accounts.

## Leaving it

To move a project to César's VPS, when he asks: `migrate-supabase-vps.md`.
