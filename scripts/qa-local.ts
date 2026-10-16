/**
 * QA server against a LOCAL database — never against the real one.
 *
 * Usage (with node; Node ≥ 23.6):
 *   node scripts/qa-local.ts --port 4301            (= bun run qa:local -- --port 4301)
 *   node scripts/qa-local.ts --port 4301 --no-reset (keeps the previous run's data)
 *   node scripts/qa-local.ts --port 4301 --offline  (no Docker or database: guest only)
 *
 * What it does:
 *   1. `supabase start` (Docker Desktop running): the project's local stack.
 *   2. `supabase db reset`: an empty database with the current tree's migrations and seed
 *      (in a pool slot, `main`'s). The local database is disposable: keep nothing in it.
 *   3. Creates the `.env.test.local` test accounts in that database (local stack's Auth):
 *        EMAIL_TEST / PASSWORD_TEST              → role "user"
 *        ADMIN_EMAIL_TEST / ADMIN_PASSWORD_TEST  → role "admin"
 *        <ROLE>_EMAIL_TEST / <ROLE>_PASSWORD_TEST → role "<role>"
 *      The role goes to `app_metadata.role`. If the project decides it some other way, that
 *      is the only project-specific part:
 *        - role in a table (`profiles`) or access through a subscription/plan → `assignRole`;
 *        - role by a list of emails in a variable (`ADMIN_EMAILS`) → `ROLE_BY_ENV`.
 *   4. Starts `bun run dev -- --port <port>` with the Supabase variables pointing at the
 *      local stack. They go through process.env, which beats the `.env*` files in both Next
 *      and Vite (Astro, SvelteKit…): no file is written and the slot stays clean.
 *
 * With `--offline` (a machine without Docker, or a project still without
 * `supabase/config.toml` or migrations): no database is started. The Supabase variables are
 * pointed at a dead address (127.0.0.1:9) and the server starts: testing is as a guest, and
 * whatever needs data fails instead of touching the real database.
 *
 * Before starting it checks the port is free: if not, it aborts (the server would jump to
 * the next one without warning and could land on another pool slot's). To stop it on
 * Windows: `taskkill /PID <this script's pid> /T /F` (with /T the server goes down too; a
 * plain kill leaves the child orphaned on the port).
 *
 * Safety: before starting, if any `.env*` variable points to a remote Supabase
 * (`*.supabase.co`) and this script does not override it, it aborts. Better not to start
 * than to test against the real database because of a variable with a different name.
 *
 * Emails the app sends (sign-up, recovery) do not go out: Mailpit collects them (the URL is
 * printed at startup).
 *
 * Without `supabase/config.toml` (the project does not use Supabase): the normal server starts.
 *
 * Test passwords are never printed. The stack's local keys are public (the same on every
 * install) and are not secrets.
 *
 * (Projects from before kit 3.8.0 have this script in Spanish: MAPEO = ENV_MAP,
 * ROL_POR_ENV = ROLE_BY_ENV, asignarRol = assignRole.)
 */

import { spawn, spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { connect } from "node:net";

// App variable ← field of `supabase status -o json`, for Next (NEXT_PUBLIC_*), Vite (VITE_*)
// and Astro (PUBLIC_*). Add the one your project uses here if it has another name (the
// safety check will tell you if one is missing).
const ENV_MAP: Record<string, string> = {};
for (const prefix of ["", "NEXT_PUBLIC_", "PUBLIC_", "VITE_"]) {
  ENV_MAP[`${prefix}SUPABASE_URL`] = "API_URL";
  ENV_MAP[`${prefix}SUPABASE_ANON_KEY`] = "ANON_KEY";
  ENV_MAP[`${prefix}SUPABASE_PUBLISHABLE_KEY`] = "PUBLISHABLE_KEY";
}
Object.assign(ENV_MAP, {
  SUPABASE_SERVICE_ROLE_KEY: "SERVICE_ROLE_KEY",
  SUPABASE_SECRET_KEY: "SECRET_KEY",
  DATABASE_URL: "DB_URL",
  DIRECT_URL: "DB_URL",
});

// Role decided by a list of emails in an environment variable (e.g. the app treats an email
// in ADMIN_EMAILS as admin): role → variable. The script fills it with that role's test
// emails when starting the server. Empty if the role lives in the database.
const ROLE_BY_ENV: Record<string, string> = {
  admin: "ADMIN_EMAILS", // Maranatha: el admin va por la lista ADMIN_EMAILS (lib/auth/admin.ts)
};

const args = process.argv.slice(2);
const port = args[args.indexOf("--port") + 1];
if (!args.includes("--port") || !/^\d+$/.test(port ?? "")) {
  console.error(
    "Usage: node scripts/qa-local.ts --port <port> [--no-reset] [--offline]",
  );
  process.exit(2);
}
const reset = !args.includes("--no-reset");
const offline = args.includes("--offline");

// An error at any step ends the process with a message, instead of leaving it hanging.
function abort(message: string): never {
  console.error(message);
  if (!offline)
    console.error(
      "→ Without Docker or a local database, you can test as a guest with --offline.",
    );
  process.exit(1);
}

// Taken = something answers on IPv4 or IPv6: some servers (Astro) listen only on [::1], and
// then binding 127.0.0.1 would succeed even though the port is in use.
function answers(host: string, p: number): Promise<boolean> {
  return new Promise((done) => {
    const s = connect({ host, port: p });
    s.setTimeout(1000);
    s.once("connect", () => (s.destroy(), done(true)));
    s.once("timeout", () => (s.destroy(), done(false)));
    s.once("error", () => done(false));
  });
}
const taken =
  (await answers("127.0.0.1", Number(port))) ||
  (await answers("::1", Number(port)));
if (taken) {
  console.error(
    `Port ${port} is taken (a previous server of this slot?). Not starting on another one:\n` +
      "the server would jump to the next free port, which may be another slot's. Stop the process using it.",
  );
  process.exit(1);
}

function readEnv(file: string): Record<string, string> {
  if (!existsSync(file)) return {};
  const out: Record<string, string> = {};
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(
      /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/,
    );
    if (m) out[m[1]] = m[2].replace(/^(['"])(.*)\1$/, "$2");
  }
  return out;
}

function supabase(...a: string[]): string {
  const r = spawnSync("supabase", a, {
    encoding: "utf8",
    shell: process.platform === "win32",
  });
  if (r.status !== 0) {
    const detail = (r.stderr || r.stdout || "").trim();
    const docker = /docker|daemon|pipe/i.test(detail)
      ? "\n→ Is Docker Desktop running?"
      : "";
    abort(`supabase ${a.join(" ")} failed:\n${detail}${docker}`);
  }
  return r.stdout;
}

// Never returns: the script lives as long as the server does.
function startDev(env: NodeJS.ProcessEnv): Promise<never> {
  const child = spawn("bun", ["run", "dev", "--", "--port", port], {
    stdio: "inherit",
    env,
    shell: process.platform === "win32",
  });
  // On Windows, with shell: true, `child` is the shell: kill() kills it and the server is
  // left orphaned on the port. taskkill /T takes down the whole tree.
  const stop = () => {
    if (process.platform === "win32" && child.pid) {
      spawnSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], {
        stdio: "ignore",
      });
    } else child.kill("SIGTERM");
  };
  for (const s of ["SIGINT", "SIGTERM"] as const) process.on(s, stop);
  child.on("exit", (code) => process.exit(code ?? 0));
  return new Promise<never>(() => {});
}

// 1. Does anything point to a remote Supabase?
const envFiles = readdirSync(".").filter(
  (f) => /^\.env/.test(f) && f !== ".env.example",
);
const remote = envFiles.flatMap((f) =>
  Object.entries(readEnv(f))
    .filter(([, v]) => /\.supabase\.(co|com)/i.test(v))
    .map(([k]) => ({ file: f, key: k })),
);

if (offline) {
  // Everything that could reach a database (ENV_MAP and any variable pointing to a remote
  // Supabase) goes to an address where nobody listens.
  const dead = (k: string) =>
    ENV_MAP[k] === "DB_URL"
      ? "postgresql://offline@127.0.0.1:9/offline"
      : /URL$/.test(k)
        ? "http://127.0.0.1:9"
        : "offline";
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    QA_LOCAL: "1",
    QA_OFFLINE: "1",
  };
  for (const k of [...Object.keys(ENV_MAP), ...remote.map((r) => r.key)])
    env[k] = dead(k);
  console.log(
    "--offline: no database. The database variables point to 127.0.0.1:9; guest testing only.",
  );
  console.log(`… bun run dev on port ${port}`);
  await startDev(env);
}

if (!existsSync("supabase/config.toml")) {
  if (remote.length) {
    abort(
      "Some variables point to a remote Supabase but the project has no local supabase/:\n" +
        remote.map((r) => `  ${r.file}: ${r.key}`).join("\n") +
        "\nQA does not run against the real database. It needs `supabase init` and the migrations in the repo (backend-build).",
    );
  }
  console.log(
    "No supabase/config.toml: no external database to replace. Normal server.",
  );
  await startDev(process.env);
}

const uncovered = remote.filter((r) => !(r.key in ENV_MAP));
if (uncovered.length) {
  abort(
    "These variables point to a remote Supabase and the script does not override them (add them to ENV_MAP):\n" +
      uncovered.map((r) => `  ${r.file}: ${r.key}`).join("\n"),
  );
}

// 2. Local stack and a clean database.
console.log("… supabase start");
supabase("start");
if (reset) {
  console.log("… supabase db reset (migrations + seed)");
  supabase("db", "reset");
}
const status = JSON.parse(supabase("status", "-o", "json")) as Record<
  string,
  string
>;
const api = status.API_URL;
const serviceKey = status.SERVICE_ROLE_KEY;
if (!api || !serviceKey)
  abort("supabase status did not return API_URL / SERVICE_ROLE_KEY");

// 3. Test accounts.
async function assignRole(id: string, role: string): Promise<void> {
  // By default the role already goes into app_metadata when the account is created. If your
  // project keeps it in a table, upsert it here with the local REST API, e.g.:
  //   await fetch(`${api}/rest/v1/profiles`, { method: 'POST', headers: { ...headers,
  //     Prefer: 'resolution=merge-duplicates' }, body: JSON.stringify({ id, role }) })
  // If access depends on a subscription or a plan (without it, the user only sees the
  // paywall), give the test account of the role that needs it access here, e.g.:
  //   if (role === 'user') await fetch(`${api}/rest/v1/subscriptions`, { method: 'POST',
  //     headers, body: JSON.stringify({ user_id: id, plan: 'pro', status: 'active' }) })
  // If the role is decided by a list of emails in a variable, it is not here: ROLE_BY_ENV.
  void id;
  void role;
}

const headers = {
  apikey: serviceKey,
  Authorization: `Bearer ${serviceKey}`,
  "Content-Type": "application/json",
};
const testEnv = readEnv(".env.test.local");
const accounts = Object.keys(testEnv)
  .map((k) => k.match(/^(?:([A-Z0-9_]+)_)?EMAIL_TEST$/))
  .filter((m): m is RegExpMatchArray => m !== null)
  .map((m) => {
    const prefix = m[1] ? `${m[1]}_` : "";
    return {
      role: m[1] ? m[1].toLowerCase() : "user",
      email: testEnv[`${prefix}EMAIL_TEST`],
      password: testEnv[`${prefix}PASSWORD_TEST`],
    };
  });

if (!accounts.length)
  console.warn(
    "! .env.test.local without *_EMAIL_TEST: QA can only test what is public.",
  );
for (const a of accounts) {
  if (!a.email || !a.password) {
    console.warn(
      `! role ${a.role}: email or password missing in .env.test.local; skipped`,
    );
    continue;
  }
  const r = await fetch(`${api}/auth/v1/admin/users`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      email: a.email,
      password: a.password,
      email_confirm: true,
      app_metadata: { role: a.role },
    }),
  });
  if (r.ok) {
    const { id } = (await r.json()) as { id: string };
    await assignRole(id, a.role);
    console.log(`  + test account: role ${a.role}`);
  } else if (r.status === 422 && !reset) {
    console.log(`  = test account: role ${a.role} (already existed)`);
  } else {
    abort(
      `Could not create the account for role ${a.role}: ${r.status} ${await r.text()}`,
    );
  }
}

// 4. Server pointing at the local stack.
const env: NodeJS.ProcessEnv = { ...process.env, QA_LOCAL: "1" };
for (const [variable, field] of Object.entries(ENV_MAP)) {
  if (status[field]) env[variable] = status[field];
}
for (const [role, variable] of Object.entries(ROLE_BY_ENV)) {
  env[variable] = accounts
    .filter((a) => a.role === role && a.email)
    .map((a) => a.email)
    .join(",");
}
console.log(
  `Local database: ${api}${status.MAILPIT_URL ? ` · emails at ${status.MAILPIT_URL}` : ""}`,
);
console.log(`… bun run dev on port ${port}`);
await startDev(env);
