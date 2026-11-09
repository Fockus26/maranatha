/**
 * The project's part of `qa:local`: how a test account gets its role. `scripts/qa-local.ts`
 * imports this file if it exists.
 *
 * Why a file of its own: the role logic (a `profiles` row, an active subscription) lived
 * inside qa-local.ts, and every kit update that replaced the script erased it; it was re-ported
 * by hand twice (melao, 3.7.0 and 3.13.0). The kit copies this file once and never replaces it.
 *
 * By default nothing is needed: the role already goes to `app_metadata.role` (Supabase) or to
 * the `role` custom claim (Firebase) when the account is created.
 *
 * (Projects whose qa-local.ts already has its own `assignRole` inside: move it here and take
 * the kit's qa-local.ts as it comes.)
 */

/** What qa-local passes to `assignRole` (Supabase). */
export interface SupabaseCtx {
  /** Local stack's API (`http://127.0.0.1:54321`). */
  api: string
  /** `apikey` + `Authorization` with the local service key, and `Content-Type: application/json`. */
  headers: Record<string, string>
}

/** What qa-local passes to `assignRoleFirebase`. */
export interface FirebaseCtx {
  /** Firestore emulator (`127.0.0.1:8080`). */
  firestore: string
  /** The `demo-*` project. */
  project: string
  /** The emulator's admin credential (`Bearer owner`) and `Content-Type`. */
  headers: Record<string, string>
}

// Role decided by a list of emails in an environment variable (e.g. the app treats an email
// in ADMIN_EMAILS as admin): role → variable. qa-local fills it with that role's test emails
// when starting the server. Empty if the role lives in the database.
export const ROLE_BY_ENV: Record<string, string> = {
  // admin: 'ADMIN_EMAILS',
}

// App variables with a name qa-local's ENV_MAP does not know: variable → field of
// `supabase status -o json` (API_URL, ANON_KEY, PUBLISHABLE_KEY, SERVICE_ROLE_KEY, SECRET_KEY,
// DB_URL). qa-local aborts naming the variable if one points to a remote Supabase and is not
// covered.
export const EXTRA_ENV_MAP: Record<string, string> = {
  // SUPABASE_ADMIN_KEY: 'SERVICE_ROLE_KEY',
}

export async function assignRole(id: string, role: string, { api, headers }: SupabaseCtx): Promise<void> {
  // If your project keeps the role in a table, upsert it here with the local REST API, e.g.:
  //   await fetch(`${api}/rest/v1/profiles`, { method: 'POST', headers: { ...headers,
  //     Prefer: 'resolution=merge-duplicates' }, body: JSON.stringify({ id, role }) })
  // If access depends on a subscription or a plan (without it, the user only sees the
  // paywall), give the test account of the role that needs it access here, e.g.:
  //   if (role === 'user') await fetch(`${api}/rest/v1/subscriptions`, { method: 'POST',
  //     headers, body: JSON.stringify({ user_id: id, plan: 'pro', status: 'active' }) })
  void id
  void role
  void api
  void headers
}

// An account the project's own seed already creates (`scripts/seed-emulator.ts`,
// `scripts/seed-db.ts`, `drizzle/seed.sql`): return true and qa-local neither creates it nor
// assigns its role. Needed when the app has no sign-up (`disableSignUp`) or the seed gives the
// accounts data the role alone does not (KREA). Any backend.
export async function existingAccount({ email, role }: { email: string; role: string }): Promise<boolean> {
  // e.g. return email.endsWith('@seed.test')
  void email
  void role
  return false
}

/** The Postgres backend: `sql` runs a statement in the QA database and returns its output. */
export async function assignRolePostgres(
  id: string,
  role: string,
  { sql }: { sql: (statement: string) => string },
): Promise<void> {
  // If your project keeps the role in a column or a table, set it here, e.g.:
  //   sql(`update public."user" set role = '${role}' where id = '${id}'`)
  void id
  void role
  void sql
}

export async function assignRoleFirebase(
  uid: string,
  email: string,
  role: string,
  { firestore, project, headers }: FirebaseCtx,
): Promise<void> {
  // If your project keeps the role in a Firestore document, write it here, e.g.:
  //   if (role === 'admin') await fetch(`http://${firestore}/v1/projects/${project}` +
  //     `/databases/(default)/documents/admins/${uid}`, { method: 'PATCH', headers,
  //     body: JSON.stringify({ fields: { email: { stringValue: email } } }) })
  void uid
  void email
  void role
  void firestore
  void project
  void headers
}
