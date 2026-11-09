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

## Leaving it

To move a project to César's VPS, when he asks: `migrate-supabase-vps.md`.
