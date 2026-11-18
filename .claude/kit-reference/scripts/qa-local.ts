/**
 * QA server against a LOCAL database — never against the real one.
 *
 * Usage (with node; Node ≥ 23.6):
 *   node scripts/qa-local.ts --port 4301            (= bun run qa:local -- --port 4301)
 *   node scripts/qa-local.ts --port 4301 --no-reset (keeps the previous run's data)
 *   node scripts/qa-local.ts --port 4301 --offline  (no Docker or database: guest only)
 *   node scripts/qa-local.ts --port 4301 --preview  (build + preview server instead of dev)
 *
 * The local backend is picked by what the project has:
 *   - `supabase/config.toml` → Supabase stack in Docker (below).
 *   - `firebase.json` with `emulators` → Firebase emulators (needs Java; see "Firebase").
 *   - `drizzle.config.*`, without Firebase and without Supabase in use → Postgres (below).
 *     `--postgres` forces it while a project is migrating off Supabase and still has both.
 *   - neither → the normal server: there is no external database to replace. It still aborts
 *     if a `.env*` variable points at the VPS.
 *
 * Postgres (a project on the VPS Postgres, kit `reference/tech/vps-postgres.md`; built by
 * world-flags in its migration):
 *   1. A Postgres 17 container per project (`qa-<package name>-pg`) and Mailpit
 *      (`qa-<package name>-mailpit`), reused if running, on free ports. They stay up afterwards.
 *   2. One database per QA port (`qa_<port>`, so slots do not collide), owned by a role that is
 *      not a superuser, like the real one. Dropped and recreated unless `--no-reset`. Then
 *      `bun run db:migrate`, `drizzle/seed.sql` and `scripts/seed-db.ts` if the project has it.
 *   3. The server with `DATABASE_URL`/`DIRECT_URL` at the container and `SMTP_*` at Mailpit. Every
 *      Supabase variable goes to a dead address: code not yet migrated cannot reach the real one.
 *   4. Before printing `QA ready`, the `.env.test.local` accounts through Better Auth's sign-up
 *      endpoint, then `email_verified = true` by SQL; the role in `assignRolePostgres`. An app
 *      with `disableSignUp` creates them in `scripts/seed-db.ts` and says so in
 *      `existingAccount` (`scripts/qa-roles.ts`); that hook works for every backend.
 *   `--db-only` stops after step 2 and prints the URLs: for tests against the database, without
 *   a server.
 *
 * Supabase:
 *   1. `supabase start` (Docker Desktop running): the project's local stack, with Auth's
 *      `site_url` = `http://localhost:<port>` and that origin (and 127.0.0.1's) added to the
 *      redirect URLs. Why: config.toml says 127.0.0.1:3000 and the QA server is on another
 *      port, so the confirmation, email-change and recovery links did not come back to it and
 *      wave-qa followed them by hand (melao ×5). If the stack is already running with another
 *      `site_url` (another port), it is stopped first, keeping its data. Up to 3 attempts with a
 *      `supabase stop` between them, and the database container's log if the last one fails:
 *      the first start on a machine failed with `StatusDbNotRunningError` (world-flags ×3) and
 *      storage's "Starting database from backup" twice in a row (melao).
 *      Nothing here waits without a limit: Docker is asked first (`docker version`, 30 s),
 *      every `supabase` command has a cap (20 min; `QA_SUPABASE_TIMEOUT_MIN`), each failed
 *      attempt prints its error, a database still recovering is waited for instead of
 *      stopped, and an `unhealthy` one ends with the recovery command. Why: with Docker
 *      Desktop not answering, a run sat for hours on the restart with nothing printed while
 *      the other workers waited for Docker; the reason of a failed start only showed on the
 *      third attempt, and the `stop` between attempts cut Postgres' recovery (workout ×7).
 *   2. `supabase db reset`: an empty database with the current tree's migrations and seed
 *      (in a pool slot, `main`'s), with its output live (it takes minutes). If it fails
 *      (`DbSetupError`, melao ×2), stop + start + reset once more. The local database is
 *      disposable: keep nothing in it.
 *   3. Creates the `.env.test.local` test accounts in that database (local stack's Auth admin
 *      API, already confirmed):
 *        EMAIL_TEST / PASSWORD_TEST              → role "user"
 *        ADMIN_EMAIL_TEST / ADMIN_PASSWORD_TEST  → role "admin"
 *        <ROLE>_EMAIL_TEST / <ROLE>_PASSWORD_TEST → role "<role>"
 *      The role goes to `app_metadata.role`. If the project decides it some other way, that
 *      is the only project-specific part, and it lives in `scripts/qa-roles.ts` (the kit
 *      never replaces it): a table or a subscription → `assignRole`; a list of emails in a
 *      variable → `ROLE_BY_ENV`.
 *   4. Starts `bun run dev -- --port <port>` with the Supabase variables pointing at the
 *      local stack and `<prefix>SITE_URL` = `http://localhost:<port>` (it was the production
 *      URL of `.env.local`, and `emailRedirectTo` took it: melao). They go through
 *      process.env, which beats the `.env*` files in both Next and Vite (Astro, SvelteKit…):
 *      no file is written and the slot stays clean.
 *   It warns if `config.toml` has `enable_confirmations` or `double_confirm_changes` off:
 *   then local sign-up skips a confirmation the hosted project asks for, and a repro that
 *   passes here may not pass there (melao).
 *
 * Firebase (`firebase.json` with an `emulators` block):
 *   1. Starts the emulators (`bun run emulators` if the project has that script, otherwise
 *      `bunx firebase emulators:start`) with the project `FIREBASE_QA_PROJECT` (`demo-*`:
 *      the emulators then cannot reach real resources) and waits up to 4 minutes: the first
 *      start on a machine took more than 90 s (inversiones-js). If they are already
 *      listening, it uses them. The emulators start empty and go down with this script.
 *   2. `scripts/seed-emulator.ts` if the project has it (skipped with `--no-reset`).
 *   3. The same `.env.test.local` accounts, in the Auth emulator, with the role as a custom
 *      claim (`role`). Role in a Firestore document (`admins/{uid}`) → `assignRoleFirebase` in `scripts/qa-roles.ts`.
 *   4. The server with `FIREBASE_AUTH_EMULATOR_HOST`/`FIRESTORE_EMULATOR_HOST` (the Admin SDK
 *      reads them), `<prefix>USE_EMULATORS=true` and `<prefix>FIREBASE_PROJECT_ID` for the
 *      client. The client code has to honour that flag (`connectAuthEmulator`,
 *      `connectFirestoreEmulator`): `backend-build`, Firebase.
 *
 * With `--offline` (a machine without Docker, or a project still without
 * `supabase/config.toml` or migrations): no database is started. The Supabase variables are
 * pointed at a dead address (127.0.0.1:9) and the server starts: testing is as a guest, and
 * whatever needs data fails instead of touching the real database.
 *
 * With `--preview`: the same backend, but `bun run build` with those variables and then the
 * project's `qa:serve` script if it has one, otherwise `preview` (Astro, Vite) or `start`
 * (Next), on the port and with `NODE_ENV=production`. For Playwright against the build: the
 * service worker and the rate limits only behave as in production there. `qa:serve` is for an
 * adapter with no preview server (`@astrojs/vercel`: kit `tech/astro.md`); it gets
 * `--port <port>` like the others. It was done by hand (world-flags).
 *
 * Before starting it checks the port is free: if not, it aborts (the server would jump to
 * the next one without warning and could land on another pool slot's). To stop it on
 * Windows: `taskkill /PID <this script's pid> /T /F` (with /T the server goes down too; a
 * plain kill leaves the child orphaned on the port).
 *
 * Once the server answers it warms `/` and each `--warm <route,route>` (a first `GET /` in
 * dev took 178 s and Playwright gives up at 30: melao) and then prints one line to wait for:
 *   QA ready: http://localhost:<port>
 * Wait for that line in the log (`.qa/dev.log`), not for a process: `pgrep` does not exist in
 * Git Bash and `until … ! pgrep` returned at once (melao).
 *
 * Astro ≥ 7 detaches `astro dev`/`astro preview` into the background when it detects an
 * agent: the script exited with 0 and the server was left orphaned (world-flags). The server
 * starts with `ASTRO_DEV_BACKGROUND=0` and `ASTRO_PREVIEW_BACKGROUND=0` (foreground, so the
 * kill above reaches it), and on exit, if a lock is left in this folder (`.astro/dev.json`,
 * `.astro/preview.json`), `astro dev stop` / `astro preview stop` here: the lock is per
 * folder, so it only stops this slot's server.
 *
 * Safety: before starting, if any `.env*` variable points to a remote Supabase
 * (`*.supabase.co`) and this script does not override it, it aborts. Better not to start
 * than to test against the real database because of a variable with a different name.
 * With Firebase, it aborts if `FIREBASE_QA_PROJECT` does not start with `demo-`. The same for
 * a variable at the VPS (`:6432`, the tunnel's `:5433`, or `KIT_VPS_HOST`) left without override:
 * a project developing against the VPS has the real URL in its `.env*`, like one on Supabase.
 *
 * Before anything it checks Playwright's Chromium (wave-qa needs it) and installs it if it is
 * missing, with node and the project's own Playwright: `bunx` was not on the PATH and the QA
 * stopped twice for it (world-flags). Not in a cloud session: there the browser comes
 * preinstalled and must not be downloaded.
 *
 * The local Supabase stack starts without Studio and analytics, with 5 minutes of health
 * check and with the email rate limit raised (env overrides; the project's config.toml is not
 * touched): QA needs neither Studio nor analytics, on a slow machine the default 2 minutes
 * ran out on the first start, and the default 2 emails per hour blocked repeating sign-up
 * tests (world-flags). The first start downloads the images and takes minutes.
 *
 * Emails the app sends (sign-up, recovery) do not go out: Mailpit (Supabase, Postgres) or the
 * Auth emulator's UI (Firebase) collects them.
 *
 * Test passwords are never printed. The stack's local keys are public (the same on every
 * install) and are not secrets.
 *
 * (Projects from before kit 3.8.0 have this script in Spanish: MAPEO = ENV_MAP,
 * ROL_POR_ENV = ROLE_BY_ENV, asignarRol = assignRole.)
 */

import { type ChildProcess, spawn, spawnSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { connect } from 'node:net'
import { pathToFileURL } from 'node:url'

// The project's part (scripts/qa-roles.ts). Without the file, the defaults: role in
// app_metadata / the custom claim, nothing else. Typed here, not imported: a project without
// the file must still typecheck.
type Headers = Record<string, string>
interface QaRoles {
  ROLE_BY_ENV: Record<string, string>
  EXTRA_ENV_MAP: Record<string, string>
  assignRole(id: string, role: string, ctx: { api: string; headers: Headers }): Promise<void>
  assignRoleFirebase(
    uid: string,
    email: string,
    role: string,
    ctx: { firestore: string; project: string; headers: Headers },
  ): Promise<void>
  assignRolePostgres(id: string, role: string, ctx: { sql: (statement: string) => string }): Promise<void>
  existingAccount(account: { email: string; role: string }): boolean | Promise<boolean>
}
const roles: Partial<QaRoles> = existsSync('scripts/qa-roles.ts')
  ? await import(pathToFileURL('scripts/qa-roles.ts').href)
  : {}

// An account the project's own seed already creates (`existingAccount` in qa-roles.ts) is not
// created again nor given its role here. Without the hook, KREA re-applied by hand a block
// inside this file after every kit update.
async function seeded(a: { email?: string; role: string }): Promise<boolean> {
  if (!a.email || !(await roles.existingAccount?.({ email: a.email, role: a.role }))) return false
  console.log(`  = test account: role ${a.role} (created by the project's seed)`)
  return true
}

// App variable ← field of `supabase status -o json`, for Next (NEXT_PUBLIC_*), Vite (VITE_*)
// and Astro (PUBLIC_*). Add the one your project uses here if it has another name (the
// safety check will tell you if one is missing).
const ENV_MAP: Record<string, string> = {}
for (const prefix of ['', 'NEXT_PUBLIC_', 'PUBLIC_', 'VITE_']) {
  ENV_MAP[`${prefix}SUPABASE_URL`] = 'API_URL'
  ENV_MAP[`${prefix}SUPABASE_ANON_KEY`] = 'ANON_KEY'
  ENV_MAP[`${prefix}SUPABASE_PUBLISHABLE_KEY`] = 'PUBLISHABLE_KEY'
}
Object.assign(ENV_MAP, {
  SUPABASE_SERVICE_ROLE_KEY: 'SERVICE_ROLE_KEY',
  SUPABASE_SECRET_KEY: 'SECRET_KEY',
  DATABASE_URL: 'DB_URL',
  DIRECT_URL: 'DB_URL',
  ...roles.EXTRA_ENV_MAP,
})

// Role by a list of emails in a variable: in scripts/qa-roles.ts.
const ROLE_BY_ENV: Record<string, string> = roles.ROLE_BY_ENV ?? {}

const pkg = existsSync('package.json') ? JSON.parse(readFileSync('package.json', 'utf8')) : {}
const pkgScripts: Record<string, string> = pkg.scripts ?? {}

// Firebase: always a `demo-*` project (the emulators refuse to reach real resources with it).
// The one the `emulators` script already passes, if any; otherwise demo-<package name>.
const FIREBASE_QA_PROJECT =
  pkgScripts.emulators?.match(/--project[ =](\S+)/)?.[1] ??
  `demo-${String(pkg.name ?? 'app').replace(/^@[^/]+\//, '').replace(/^demo-/, '').toLowerCase()}`

const args = process.argv.slice(2)
const port = args[args.indexOf('--port') + 1]
if (!args.includes('--port') || !/^\d+$/.test(port ?? '')) {
  console.error(
    'Usage: node scripts/qa-local.ts --port <port> [--no-reset] [--offline] [--preview] [--warm /a,/b] [--postgres] [--db-only]',
  )
  process.exit(2)
}
const reset = !args.includes('--no-reset')
const offline = args.includes('--offline')
const preview = args.includes('--preview')
const dbOnly = args.includes('--db-only')
// Git Bash turns `/login` into `C:/Program Files/Git/login` (melao ×4): undone here.
const unMsys = (p: string) => p.replace(/^[A-Za-z]:[\\/]Program Files[\\/]Git(?=[\\/])/, '').replaceAll('\\', '/')
const warm = args.includes('--warm')
  ? (args[args.indexOf('--warm') + 1] ?? '').split(',').filter(Boolean).map(unMsys)
  : []
// localhost and not 127.0.0.1: it is what config.toml's redirects and the app's cookies get.
const SITE = `http://localhost:${port}`

// Processes this script starts (emulators, build, server): they go down with it.
const children: ChildProcess[] = []
function stopAll(): void {
  for (const c of children) {
    if (c.pid === undefined || c.exitCode !== null) continue
    // On Windows, with shell: true, `c` is the shell: kill() kills it and leaves the server
    // (or the emulators' Java) orphaned. taskkill /T takes down the whole tree.
    if (process.platform === 'win32') {
      spawnSync('taskkill', ['/PID', String(c.pid), '/T', '/F'], { stdio: 'ignore' })
    } else c.kill('SIGTERM')
  }
  // Astro ≥ 7 in the background: its lock is per folder, so this stops only this slot's.
  for (const mode of ['dev', 'preview']) {
    if (existsSync(`.astro/${mode}.json`)) {
      spawnSync('bun', ['x', 'astro', mode, 'stop'], { stdio: 'ignore', shell: process.platform === 'win32' })
    }
  }
}
for (const s of ['SIGINT', 'SIGTERM'] as const) {
  process.on(s, () => {
    stopAll()
    process.exit(0)
  })
}

// An error at any step ends the process with a message, instead of leaving it hanging.
function abort(message: string): never {
  console.error(message)
  if (!offline) console.error('→ Without Docker or a local database, you can test as a guest with --offline.')
  stopAll()
  process.exit(1)
}

// Taken = something answers on IPv4 or IPv6: some servers (Astro) listen only on [::1], and
// then binding 127.0.0.1 would succeed even though the port is in use.
function answers(host: string, p: number): Promise<boolean> {
  return new Promise((done) => {
    const s = connect({ host, port: p })
    s.setTimeout(1000)
    s.once('connect', () => {
      s.destroy()
      done(true)
    })
    s.once('timeout', () => {
      s.destroy()
      done(false)
    })
    s.once('error', () => done(false))
  })
}
const taken = (await answers('127.0.0.1', Number(port))) || (await answers('::1', Number(port)))
if (taken) {
  console.error(
    `Port ${port} is taken (a previous server of this slot?). Not starting on another one:\n` +
      'the server would jump to the next free port, which may be another slot\'s. Stop the process using it.',
  )
  process.exit(1)
}

// 0. Playwright's Chromium.
try {
  const { chromium } = await import('@playwright/test')
  if (!existsSync(chromium.executablePath())) {
    if (process.env.CLAUDE_CODE_REMOTE === 'true') {
      console.warn('! Playwright\'s Chromium is not where this Playwright expects it (cloud: do not download it).')
    } else {
      console.log('… Playwright\'s Chromium is missing: installing it (once per machine)')
      const r = spawnSync(process.execPath, ['node_modules/@playwright/test/cli.js', 'install', 'chromium'], {
        stdio: 'inherit',
      })
      if (r.status !== 0) console.warn('! It failed: node node_modules/@playwright/test/cli.js install chromium')
    }
  }
} catch {
  console.warn('! The project has no @playwright/test: wave-qa will not be able to open a browser.')
}

function readEnv(file: string): Record<string, string> {
  if (!existsSync(file)) return {}
  const out: Record<string, string> = {}
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
    if (m) out[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2')
  }
  return out
}

const SUPABASE_ENV = {
  SUPABASE_STUDIO_ENABLED: 'false',
  SUPABASE_ANALYTICS_ENABLED: 'false',
  SUPABASE_DB_HEALTH_TIMEOUT: '5m',
  SUPABASE_AUTH_RATE_LIMIT_EMAIL_SENT: '1000',
  // Email links back to this server, not to config.toml's 127.0.0.1:3000 (melao ×5).
  SUPABASE_AUTH_SITE_URL: SITE,
  SUPABASE_AUTH_ADDITIONAL_REDIRECT_URLS: `${SITE}/**,http://127.0.0.1:${port}/**`,
  ...process.env, // whatever César set wins
}

// Docker Desktop can stop answering without exiting. `docker version` and not `docker info`:
// info hung while version and ps answered (workout).
function dockerAnswers(): boolean {
  const r = spawnSync('docker', ['version', '--format', '{{.Server.Version}}'], { encoding: 'utf8', timeout: 30_000 })
  return r.status === 0
}

function requireDocker(): void {
  if (dockerAnswers()) return
  abort('Docker does not answer (docker version, 30 s). Open Docker Desktop — or restart it if it is open and stuck — and run this again.')
}

const SUPABASE_CAP_MIN = Number(process.env.QA_SUPABASE_TIMEOUT_MIN) || 20

type Run = ReturnType<typeof spawnSync>
// `live`: output straight to the terminal (long steps). Returns the result; never aborts.
// Capped: a command that outlives the cap comes back as a failure instead of hanging.
function supabaseRun(a: string[], live = false): Run {
  return spawnSync('supabase', a, {
    encoding: 'utf8',
    stdio: live ? 'inherit' : 'pipe',
    shell: process.platform === 'win32',
    env: SUPABASE_ENV,
    timeout: SUPABASE_CAP_MIN * 60_000,
  })
}

function failure(r: Run): string {
  if (r.error && (r.error as NodeJS.ErrnoException).code === 'ETIMEDOUT') {
    return `no answer in ${SUPABASE_CAP_MIN} min (cap: QA_SUPABASE_TIMEOUT_MIN)`
  }
  return String(r.stderr || r.stdout || r.error?.message || '').trim()
}

function supabaseFail(a: string[], r: Run, extra = ''): never {
  const detail = failure(r)
  // Only when it really does not answer: every Supabase error names Docker, and the hint
  // sent people to restart a Docker that was fine (kit test, 2026-11-18).
  const docker = /docker|daemon|pipe/i.test(detail) && !dockerAnswers() ? '\n→ Is Docker Desktop running?' : ''
  abort(`supabase ${a.join(' ')} failed:\n${detail}${docker}${extra}`)
}

function supabase(a: string[]): string {
  const r = supabaseRun(a)
  if (r.status !== 0) supabaseFail(a, r)
  return String(r.stdout ?? '')
}

// config.toml's project_id names the containers (supabase_db_<id>, supabase_auth_<id>).
const configToml = existsSync('supabase/config.toml') ? readFileSync('supabase/config.toml', 'utf8') : ''
const projectId = configToml.match(/^\s*project_id\s*=\s*"([^"]+)"/m)?.[1] ?? ''

function dockerLogs(container: string): string {
  const r = spawnSync('docker', ['logs', '--tail', '40', container], { encoding: 'utf8' })
  const out = `${r.stdout ?? ''}${r.stderr ?? ''}`.trim()
  return out ? `\n── docker logs --tail 40 ${container}\n${out}` : ''
}

// Auth reads site_url only when its container starts: a stack already up for another port
// keeps sending links there.
function runningSiteUrl(): string | null {
  if (!projectId) return null
  const r = spawnSync('docker', ['inspect', '-f', '{{range .Config.Env}}{{println .}}{{end}}', `supabase_auth_${projectId}`], {
    encoding: 'utf8',
  })
  if (r.status !== 0) return null
  return r.stdout.match(/^GOTRUE_SITE_URL=(.*)$/m)?.[1]?.trim() ?? null
}

// '' when the container does not exist or has no health check.
function dbHealth(): string {
  if (!projectId) return ''
  const r = spawnSync('docker', ['inspect', '-f', '{{if .State.Health}}{{.State.Health.Status}}{{end}}', `supabase_db_${projectId}`], {
    encoding: 'utf8',
    timeout: 30_000,
  })
  return r.status === 0 ? r.stdout.trim() : ''
}

const sleepSync = (ms: number) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms)

// After Docker hangs, Postgres can stay in its recovery fsync and fail every start.
const UNHEALTHY_HINT =
  '\n→ The local database is unhealthy. Recovery: `supabase stop --no-backup` (it deletes the local' +
  "\n  database's data; the next run recreates it from the migrations and the seed) and run this again."

function supabaseStart(): void {
  requireDocker()
  const current = runningSiteUrl()
  if (current && current !== SITE) {
    console.log(`… the local stack sends links to ${current}: restarting it for ${SITE} (data kept)`)
    const stop = supabaseRun(['stop'])
    if (stop.status !== 0) supabaseFail(['stop'], stop)
  }
  const attempts = 3
  for (let i = 1; i <= attempts; i++) {
    const r = supabaseRun(['start'])
    if (r.status === 0) return
    let health = dbHealth()
    if (i === attempts) {
      supabaseFail(['start'], r, dockerLogs(`supabase_db_${projectId}`) + (health === 'unhealthy' ? UNHEALTHY_HINT : ''))
    }
    console.log(`… supabase start failed (attempt ${i}/${attempts}):\n${failure(r).split('\n').slice(-8).join('\n')}`)
    requireDocker()
    if (health === 'starting') {
      // Stopping it now cuts the recovery and the next start begins it again (~20 min: workout).
      console.log('… the database is still starting (recovery?): waiting for it, up to 10 min, instead of stopping it')
      for (let s = 0; s < 120 && health === 'starting'; s++) {
        sleepSync(5000)
        health = dbHealth()
      }
      if (health === 'healthy') continue
    }
    console.log('… supabase stop and again')
    supabaseRun(['stop'])
  }
}

function supabaseReset(): void {
  let r = supabaseRun(['db', 'reset'], true)
  if (r.status === 0) return
  console.log('… supabase db reset failed; supabase stop + start and once more')
  supabaseRun(['stop'])
  supabaseStart()
  r = supabaseRun(['db', 'reset'], true)
  if (r.status !== 0) abort(`supabase db reset failed twice (output above).${dockerLogs(`supabase_db_${projectId}`)}`)
}

// Local sign-up without the confirmations the hosted project asks for: a repro passes here
// and not there, and it hid the double confirmation of an email change (melao).
// Only inside [auth.email]: `[auth.sms] enable_confirmations = false` (its default) raised
// this warning in a project whose email confirmations were on (workout).
const authEmail = configToml.match(/^\[auth\.email\][^\n]*\n([\s\S]*?)(?=^\[|$(?![\s\S]))/m)?.[1] ?? ''
for (const key of ['enable_confirmations', 'double_confirm_changes']) {
  if (new RegExp(`^\\s*${key}\\s*=\\s*false`, 'm').test(authEmail)) {
    console.warn(`! supabase/config.toml: ${key} = false. If the hosted project has it on, local QA skips that step.`)
  }
}

function launch(cmd: string, a: string[], env: NodeJS.ProcessEnv): ChildProcess {
  const child = spawn(cmd, a, { stdio: 'inherit', env, shell: process.platform === 'win32' })
  children.push(child)
  return child
}

// Waits for the server to answer, then requests `/` and the --warm routes once each (a cold
// first compile took 178 s: melao), and prints the line to wait for.
async function warmUp(beforeReady?: () => Promise<void>): Promise<void> {
  const deadline = Date.now() + 10 * 60_000
  while (Date.now() < deadline) {
    // IPv4 or IPv6, like `taken`: Astro 7 listens only on [::1] and this loop ran its whole 10
    // minutes before warming (world-flags).
    if ((await answers('127.0.0.1', Number(port))) || (await answers('::1', Number(port)))) break
    await new Promise((r) => setTimeout(r, 1000))
  }
  for (const route of ['/', ...warm]) {
    const started = Date.now()
    try {
      const r = await fetch(`${SITE}${route.startsWith('/') ? route : `/${route}`}`, {
        redirect: 'manual',
        signal: AbortSignal.timeout(5 * 60_000),
      })
      console.log(`  ~ warmed ${route} (${r.status}, ${Math.round((Date.now() - started) / 1000)} s)`)
    } catch (e) {
      console.warn(`! warming ${route} failed: ${(e as Error).message}`)
    }
  }
  // Caught: a throw here left the server orphaned with no message (world-flags).
  await beforeReady?.().catch((e: Error) => abort(`Before QA ready: ${e.message}`))
  console.log(`QA ready: ${SITE}`)
}

// Never returns: the script lives as long as the server does.
async function startServer(base: NodeJS.ProcessEnv, beforeReady?: () => Promise<void>): Promise<never> {
  const env: NodeJS.ProcessEnv = { ...base, ASTRO_DEV_BACKGROUND: '0', ASTRO_PREVIEW_BACKGROUND: '0' }
  // The app's own URL (emailRedirectTo, absolute links) is this server, not production's.
  for (const prefix of ['', 'NEXT_PUBLIC_', 'PUBLIC_', 'VITE_']) env[`${prefix}SITE_URL`] = SITE
  env.BETTER_AUTH_URL = SITE
  let script = 'dev'
  if (preview) {
    script = ['qa:serve', 'preview', 'start'].find((s) => pkgScripts[s]) ?? ''
    if (!script) abort('--preview: the project has no "qa:serve", "preview" or "start" script.')
    // Not `env.NODE_ENV = …`: Next 16's types declare it read-only and a new project's
    // typecheck failed on this file (kit-deploy).
    Object.assign(env, { NODE_ENV: 'production' })
    console.log('… bun run build (with the local backend\'s variables)')
    const build = launch('bun', ['run', 'build'], env)
    const code = await new Promise<number | null>((done) => build.on('exit', done))
    if (code !== 0) abort('The build failed.')
  }
  console.log(`… bun run ${script} on port ${port}`)
  const server = launch('bun', ['run', script, '--', '--port', port], env)
  server.on('exit', (code) => {
    stopAll()
    process.exit(code ?? 0)
  })
  await warmUp(beforeReady)
  return new Promise<never>(() => {})
}

// .env.test.local accounts: EMAIL_TEST → user, <ROLE>_EMAIL_TEST → <role>.
const testEnv = readEnv('.env.test.local')
const accounts = Object.keys(testEnv)
  .map((k) => k.match(/^(?:([A-Z0-9_]+)_)?EMAIL_TEST$/))
  .filter((m): m is RegExpMatchArray => m !== null)
  .map((m) => {
    const prefix = m[1] ? `${m[1]}_` : ''
    return {
      role: m[1] ? m[1].toLowerCase() : 'user',
      email: testEnv[`${prefix}EMAIL_TEST`],
      password: testEnv[`${prefix}PASSWORD_TEST`],
    }
  })
if (!accounts.length) console.warn('! .env.test.local without *_EMAIL_TEST: QA can only test what is public.')

// 1. Does anything point to a remote Supabase?
const envFiles = readdirSync('.').filter((f) => /^\.env/.test(f) && f !== '.env.example')
const remote = envFiles.flatMap((f) =>
  Object.entries(readEnv(f))
    .filter(([, v]) => /\.supabase\.(co|com)/i.test(v))
    .map(([k]) => ({ file: f, key: k })),
)

// …or to the VPS? (`:5433` is the migrations tunnel.)
const vpsHost = process.env.KIT_VPS_HOST
const pointsAtVps = (v: string) => /:(6432|5433)\b/.test(v) || (vpsHost ? v.includes(vpsHost) : false)
const atVps = envFiles.flatMap((f) =>
  Object.entries(readEnv(f))
    .filter(([, v]) => pointsAtVps(v))
    .map(([k]) => ({ file: f, key: k })),
)
const listVars = (vars: { file: string; key: string }[]) => vars.map((r) => `  ${r.file}: ${r.key}`).join('\n')

// Everything that could reach a database goes to an address where nobody listens.
const dead = (k: string) =>
  ENV_MAP[k] === 'DB_URL'
    ? 'postgresql://offline@127.0.0.1:9/offline'
    : /URL$/.test(k)
      ? 'http://127.0.0.1:9'
      : 'offline'

if (offline) {
  // ENV_MAP and any variable pointing to a remote database.
  const env: NodeJS.ProcessEnv = { ...process.env, QA_LOCAL: '1', QA_OFFLINE: '1' }
  for (const k of [...Object.keys(ENV_MAP), ...remote.map((r) => r.key), ...atVps.map((r) => r.key)]) env[k] = dead(k)
  console.log('--offline: no database. The database variables point to 127.0.0.1:9; guest testing only.')
  await startServer(env)
}

// ── Postgres ────────────────────────────────────────────────────────────────────────────
const hasDrizzle = ['ts', 'js', 'mjs'].some((e) => existsSync(`drizzle.config.${e}`))
const usesSupabase = existsSync('supabase/config.toml') && Boolean(pkg.dependencies?.['@supabase/supabase-js'])
if (args.includes('--postgres') || (hasDrizzle && !usesSupabase && !existsSync('firebase.json'))) {
  // Same rule as *.supabase.co, and before anything starts: better not to start than to test
  // against the real database.
  const uncoveredVps = atVps.filter((r) => !(r.key in ENV_MAP))
  if (uncoveredVps.length) {
    abort(`These variables point at the VPS and the script does not override them (add them to ENV_MAP):\n${listVars(uncoveredVps)}`)
  }

  const slug = String(pkg.name ?? 'app').replace(/^@[^/]+\//, '').replace(/[^a-z0-9-]/gi, '-').toLowerCase()
  const PG = `qa-${slug}-pg`
  const MAILPIT = `qa-${slug}-mailpit`
  const DB = `qa_${port}`
  const ROLE = 'qa_app'

  const docker = (a: string[], input?: string) => spawnSync('docker', a, { encoding: 'utf8', input })

  requireDocker()

  async function freePort(from: number): Promise<number> {
    for (let p = from; p < from + 200; p++) {
      if (!(await answers('127.0.0.1', p)) && !(await answers('::1', p))) return p
    }
    abort(`No free port from ${from}.`)
  }

  function mappedPort(container: string, internal: number): number {
    const found = docker(['port', container, String(internal)]).stdout?.match(/:(\d+)\s*$/m)?.[1]
    if (!found) abort(`${container} does not publish port ${internal}.`)
    return Number(found)
  }

  function ensureRunning(container: string, runArgs: string[]): void {
    const state = docker(['inspect', '-f', '{{.State.Running}}', container])
    if (state.status === 0 && state.stdout.trim() === 'true') {
      console.log(`= ${container} already running`)
      return
    }
    const r = state.status === 0 ? docker(['start', container]) : docker(['run', '-d', '--name', container, ...runArgs])
    if (r.status !== 0) abort(`Could not start ${container}:\n${r.stderr}${dockerLogs(container)}`)
    console.log(`+ ${container} started`)
  }

  console.log('… Postgres and Mailpit in Docker (the first time: image downloads)')
  ensureRunning(PG, ['-e', 'POSTGRES_PASSWORD=postgres', '-p', `127.0.0.1:${await freePort(54329)}:5432`, 'postgres:17'])
  const smtpFree = await freePort(54325)
  ensureRunning(MAILPIT, [
    '-p',
    `127.0.0.1:${smtpFree}:1025`,
    '-p',
    `127.0.0.1:${await freePort(Math.max(54326, smtpFree + 1))}:8025`,
    'axllent/mailpit',
  ])
  const pgPort = mappedPort(PG, 5432)
  const smtpPort = mappedPort(MAILPIT, 1025)
  const mailUi = mappedPort(MAILPIT, 8025)

  // TCP, not the socket: during the image's init Postgres only listens on the socket.
  let ready = false
  // 5 minutes: the container's first initdb on a hard disk passed the 2 it had (kit-deploy).
  for (let i = 0; i < 300 && !ready; i++) {
    ready = docker(['exec', PG, 'psql', '-h', '127.0.0.1', '-U', 'postgres', '-c', 'select 1']).status === 0
    if (!ready) await new Promise((r) => setTimeout(r, 1000))
  }
  if (!ready) abort(`Postgres did not answer in 5 minutes.${dockerLogs(PG)}`)

  const sqlIn = (db: string, statement: string): string => {
    const r = docker(['exec', '-i', PG, 'psql', '-U', 'postgres', '-d', db, '-v', 'ON_ERROR_STOP=1', '-qAt'], statement)
    if (r.status !== 0) abort(`SQL failed on ${db}:\n${r.stderr}`)
    return r.stdout.trim()
  }

  sqlIn(
    'postgres',
    `do $$ begin
      if not exists (select from pg_roles where rolname = '${ROLE}') then
        create role ${ROLE} login password '${ROLE}';
      end if;
    end $$;`,
  )
  const dbExists = sqlIn('postgres', `select 1 from pg_database where datname = '${DB}'`) === '1'
  if (reset && dbExists) sqlIn('postgres', `drop database ${DB} with (force);`)
  if (reset || !dbExists) sqlIn('postgres', `create database ${DB} owner ${ROLE};`)

  const databaseUrl = `postgresql://${ROLE}:${ROLE}@127.0.0.1:${pgPort}/${DB}`

  if (!pkgScripts['db:migrate']) {
    abort(
      'package.json has no "db:migrate" script, which applies the migrations to the QA database.\n' +
        'Add it — Drizzle: "db:migrate": "drizzle-kit migrate" (the kit\'s reference/tech/vps-postgres.md).',
    )
  }
  console.log('… bun run db:migrate')
  const migrate = spawnSync('bun', ['run', 'db:migrate'], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: { ...process.env, DATABASE_URL: databaseUrl, DIRECT_URL: databaseUrl },
  })
  if (migrate.status !== 0) abort('bun run db:migrate failed.')
  if (reset && existsSync('drizzle/seed.sql')) {
    console.log('… drizzle/seed.sql')
    sqlIn(DB, readFileSync('drizzle/seed.sql', 'utf8'))
  }
  // A seed that needs code (Better Auth's hashes, accounts in an app with `disableSignUp`,
  // where the sign-up route below does not exist): the project's own, against this database.
  if (reset && existsSync('scripts/seed-db.ts')) {
    console.log('… scripts/seed-db.ts')
    const seed = spawnSync('bun', ['scripts/seed-db.ts'], {
      stdio: 'inherit',
      shell: process.platform === 'win32',
      env: { ...process.env, DATABASE_URL: databaseUrl, DIRECT_URL: databaseUrl },
    })
    if (seed.status !== 0) abort('scripts/seed-db.ts failed.')
  }

  console.log(`Local database: ${databaseUrl} · emails at http://127.0.0.1:${mailUi}`)
  if (dbOnly) process.exit(0)

  const env: NodeJS.ProcessEnv = { ...process.env, QA_LOCAL: '1' }
  for (const k of [...Object.keys(ENV_MAP), ...remote.map((r) => r.key)]) env[k] = dead(k)
  Object.assign(env, {
    DATABASE_URL: databaseUrl,
    DIRECT_URL: databaseUrl,
    BETTER_AUTH_SECRET: 'qa-local-secret-qa-local-secret-qa-local',
    CRON_SECRET: 'qa-local-cron',
    SMTP_HOST: '127.0.0.1',
    SMTP_PORT: String(smtpPort),
    SMTP_USER: '',
    SMTP_PASS: '',
    SMTP_FROM: 'QA <qa@example.test>',
    EMAIL_FROM: 'QA <qa@example.test>', // projects that copied the guide before 3.24.0 read this name
  })

  await startServer(env, async () => {
    for (const a of accounts) {
      if (!a.email || !a.password) {
        console.warn(`! role ${a.role}: email or password missing in .env.test.local; skipped`)
        continue
      }
      if (await seeded(a)) continue
      const r = await fetch(`${SITE}/api/auth/sign-up/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Origin: SITE },
        body: JSON.stringify({ email: a.email, password: a.password, name: a.role }),
      })
      if (r.status === 404) {
        console.warn('! The app has no Better Auth sign-up route (not yet, or `disableSignUp`): test accounts skipped. Create them in scripts/seed-db.ts and mark them in existingAccount (scripts/qa-roles.ts).')
        return
      }
      const email = a.email.replaceAll("'", "''")
      const id = sqlIn(DB, `update public."user" set email_verified = true where email = '${email}' returning id;`)
      if (!id) abort(`Could not create the account for role ${a.role}: ${r.status} ${await r.text()}`)
      await roles.assignRolePostgres?.(id, a.role, { sql: (statement) => sqlIn(DB, statement) })
      console.log(`  + test account: role ${a.role}`)
    }
  })
}

// ── Firebase ────────────────────────────────────────────────────────────────────────────
const firebaseJson = existsSync('firebase.json') ? JSON.parse(readFileSync('firebase.json', 'utf8')) : null
if (firebaseJson?.emulators && !existsSync('supabase/config.toml')) {
  if (!FIREBASE_QA_PROJECT.startsWith('demo-')) abort('Firebase QA runs only against a demo-* project.')
  const emu = firebaseJson.emulators
  const AUTH = `127.0.0.1:${emu.auth?.port ?? 9099}`
  const FIRESTORE = `127.0.0.1:${emu.firestore?.port ?? 8080}`
  const up = (hostPort: string) => answers('127.0.0.1', Number(hostPort.split(':')[1]))

  // Waits up to `seconds`, printing progress every 15 s so a slow first start does not look hung.
  // Returns false if the CLI exited first: on a cold HDD Firestore took 71 s, firebase-tools
  // gave up at 60, and the old message blamed Java (KREA).
  async function waitFor(hostPort: string, seconds: number, cli?: ChildProcess): Promise<boolean> {
    for (let i = 1; i <= seconds; i++) {
      if (await up(hostPort)) return true
      if (cli && cli.exitCode !== null) return false
      if (i % 15 === 0) console.log(`  … waiting for the emulator on ${hostPort} (${i} s)`)
      await new Promise((r) => setTimeout(r, 1000))
    }
    abort(
      `The emulator on ${hostPort} did not answer in ${seconds} s. Look at the firebase output above;` +
        ' if it never started, check `java -version` and that the port is free.',
    )
  }

  // Without it, firebase-tools can sit silently on its update check (KREA).
  process.env.NO_UPDATE_NOTIFIER = '1'
  const emulatorEnv = {
    ...process.env,
    FIREBASE_AUTH_EMULATOR_HOST: AUTH,
    FIRESTORE_EMULATOR_HOST: FIRESTORE,
    GCLOUD_PROJECT: FIREBASE_QA_PROJECT,
  }
  if ((await up(AUTH)) && (await up(FIRESTORE))) {
    console.log('= emulators already running')
  } else {
    console.log('… firebase emulators:start (the first time on a machine: minutes)')
    const start = () =>
      pkgScripts.emulators?.includes('--project')
        ? launch('bun', ['run', 'emulators'], process.env)
        : pkgScripts.emulators
          ? launch('bun', ['run', 'emulators', '--', '--project', FIREBASE_QA_PROJECT], process.env)
          : launch('bun', ['x', 'firebase', 'emulators:start', '--project', FIREBASE_QA_PROJECT], process.env)
    let cli = start()
    let ready = (await waitFor(AUTH, 240, cli)) && (await waitFor(FIRESTORE, 240, cli))
    if (!ready) {
      // The second start is warm (the emulator's JAR and the JVM are cached): once, not a loop.
      console.log('… firebase exited before the emulators were ready (a cold start over its 60 s?): retrying once')
      cli = start()
      ready = (await waitFor(AUTH, 240, cli)) && (await waitFor(FIRESTORE, 240, cli))
    }
    if (!ready) abort('firebase emulators:start exited twice before the emulators were ready: see its output above.')
  }

  if (reset && existsSync('scripts/seed-emulator.ts')) {
    console.log('… scripts/seed-emulator.ts')
    const seed = launch('bun', ['scripts/seed-emulator.ts'], emulatorEnv)
    if ((await new Promise<number | null>((done) => seed.on('exit', done))) !== 0) abort('seed-emulator failed')
  }

  // `Bearer owner` is the emulator's admin credential (it only works against the emulator).
  const owner = { Authorization: 'Bearer owner', 'Content-Type': 'application/json' }
  const authApi = `http://${AUTH}/identitytoolkit.googleapis.com/v1/projects/${FIREBASE_QA_PROJECT}`

  for (const a of accounts) {
    if (!a.email || !a.password) {
      console.warn(`! role ${a.role}: email or password missing in .env.test.local; skipped`)
      continue
    }
    if (await seeded(a)) continue
    const r = await fetch(`${authApi}/accounts`, {
      method: 'POST',
      headers: owner,
      body: JSON.stringify({ email: a.email, password: a.password, emailVerified: true }),
    })
    const body = (await r.json()) as { localId?: string; error?: { message: string } }
    if (r.ok && body.localId) {
      await fetch(`${authApi}/accounts:update`, {
        method: 'POST',
        headers: owner,
        body: JSON.stringify({ localId: body.localId, customAttributes: JSON.stringify({ role: a.role }) }),
      })
      // The role already goes as a custom claim; a Firestore document → scripts/qa-roles.ts.
      await roles.assignRoleFirebase?.(body.localId, a.email, a.role, {
        firestore: FIRESTORE,
        project: FIREBASE_QA_PROJECT,
        headers: owner,
      })
      console.log(`  + test account: role ${a.role}`)
    } else if (body.error?.message === 'EMAIL_EXISTS') {
      console.log(`  = test account: role ${a.role} (already existed)`)
    } else {
      abort(`Could not create the account for role ${a.role}: ${r.status} ${body.error?.message}`)
    }
  }

  const env: NodeJS.ProcessEnv = { ...emulatorEnv, QA_LOCAL: '1' }
  for (const prefix of ['', 'NEXT_PUBLIC_', 'PUBLIC_', 'VITE_']) {
    env[`${prefix}USE_EMULATORS`] = 'true'
    env[`${prefix}FIREBASE_PROJECT_ID`] = FIREBASE_QA_PROJECT
    // The SDK demands an apiKey even though the emulator does not check it.
    env[`${prefix}FIREBASE_API_KEY`] = 'demo-qa-local'
  }
  console.log(`Emulators: Auth ${AUTH} · Firestore ${FIRESTORE}${emu.ui?.port ? ` · UI http://127.0.0.1:${emu.ui.port}` : ''}`)
  await startServer(env)
}

// ── Supabase ────────────────────────────────────────────────────────────────────────────
if (!existsSync('supabase/config.toml')) {
  if (remote.length) {
    abort(
      'Some variables point to a remote Supabase but the project has no local supabase/:\n' +
        remote.map((r) => `  ${r.file}: ${r.key}`).join('\n') +
        '\nQA does not run against the real database. It needs `supabase init` and the migrations in the repo (backend-build).',
    )
  }
  if (atVps.length) {
    abort(
      `Some variables point at the VPS but the project has no drizzle.config.*:\n${listVars(atVps)}\nQA does not run against the real database. It needs the migrations in the repo (kit reference/tech/vps-postgres.md).`,
    )
  }
  console.log('No supabase/config.toml nor Firebase emulators: no external database to replace. Normal server.')
  await startServer(process.env)
}

const uncovered = remote.filter((r) => !(r.key in ENV_MAP))
if (uncovered.length) {
  abort(
    'These variables point to a remote Supabase and the script does not override them (add them to ENV_MAP):\n' +
      uncovered.map((r) => `  ${r.file}: ${r.key}`).join('\n'),
  )
}

// 2. Local stack and a clean database.
console.log('… supabase start (the first time it downloads the images: minutes)')
supabaseStart()
if (reset) {
  console.log('… supabase db reset (migrations + seed; minutes)')
  supabaseReset()
}
const status = JSON.parse(supabase(['status', '-o', 'json'])) as Record<string, string>
const api = status.API_URL
const serviceKey = status.SERVICE_ROLE_KEY
if (!api || !serviceKey) abort('supabase status did not return API_URL / SERVICE_ROLE_KEY')

// 3. Test accounts, through the admin API and already confirmed: a repro that signs up and
// expects a session at once depends on enable_confirmations = false (melao).
const headers = {
  apikey: serviceKey,
  Authorization: `Bearer ${serviceKey}`,
  'Content-Type': 'application/json',
}
for (const a of accounts) {
  if (!a.email || !a.password) {
    console.warn(`! role ${a.role}: email or password missing in .env.test.local; skipped`)
    continue
  }
  if (await seeded(a)) continue
  const r = await fetch(`${api}/auth/v1/admin/users`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      email: a.email,
      password: a.password,
      email_confirm: true,
      app_metadata: { role: a.role },
    }),
  })
  if (r.ok) {
    const { id } = (await r.json()) as { id: string }
    // The role already goes in app_metadata; a table or a subscription → scripts/qa-roles.ts.
    await roles.assignRole?.(id, a.role, { api, headers })
    console.log(`  + test account: role ${a.role}`)
  } else if (r.status === 422 && !reset) {
    console.log(`  = test account: role ${a.role} (already existed)`)
  } else {
    abort(`Could not create the account for role ${a.role}: ${r.status} ${await r.text()}`)
  }
}

// 4. Server pointing at the local stack.
const env: NodeJS.ProcessEnv = { ...process.env, QA_LOCAL: '1' }
for (const [variable, field] of Object.entries(ENV_MAP)) {
  if (status[field]) env[variable] = status[field]
}
for (const [role, variable] of Object.entries(ROLE_BY_ENV)) {
  env[variable] = accounts.filter((a) => a.role === role && a.email).map((a) => a.email).join(',')
}
console.log(`Local database: ${api}${status.MAILPIT_URL ? ` · emails at ${status.MAILPIT_URL}` : ''}`)
await startServer(env)
