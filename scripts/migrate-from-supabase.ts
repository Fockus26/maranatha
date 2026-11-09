#!/usr/bin/env bun
/**
 * Copia final de Supabase al Postgres del VPS (D082, paso 4 del corte). Todo
 * o nada: corre en UNA transacción en el destino y solo hace COMMIT si el
 * contenido de cada tabla coincide en los dos lados (no solo los conteos).
 *
 *   SOURCE_DATABASE_URL=<conexión directa de Supabase, la lee en solo lectura> \
 *   DIRECT_URL=<destino, por el túnel>                                        \
 *   SUPABASE_URL=https://<ref>.supabase.co SUPABASE_SECRET_KEY=sb_secret_…   \
 *     bun scripts/migrate-from-supabase.ts [--dry-run] [--replace] [--skip-receipts]
 *
 *   --dry-run        copia y compara, y al final ROLLBACK: el ensayo.
 *   --replace        vacía las tablas del destino antes de copiar (si no, aborta
 *                    cuando el destino ya tiene datos).
 *   --skip-receipts  no copia los comprobantes de Storage (ensayo sin Storage).
 *
 * Qué copia:
 *   public.payments, paypal_plans, settings, agenda_events → mismas tablas.
 *   auth.users (+ hash bcrypt)  → "user" + account (credential), mismos ids.
 *   storage.objects del bucket `receipts` → payment_receipts (mismo path).
 * Qué no: rate_limit_hits (efímero), sesiones (todos vuelven a iniciar sesión).
 *
 * El destino ya tiene que tener las migraciones (`bun run db:migrate`). Nada
 * de lo que imprime lleva datos personales ni secretos: solo conteos.
 */
import { createHash } from "node:crypto";
import { Client } from "pg";

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has("--dry-run");
const REPLACE = args.has("--replace");
const SKIP_RECEIPTS = args.has("--skip-receipts");

const SOURCE = process.env.SOURCE_DATABASE_URL;
const TARGET = process.env.DIRECT_URL;
const SUPABASE_URL = process.env.SUPABASE_URL?.replace(/\/$/, "");
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY;

function abort(message: string): never {
  console.error(`✗ ${message}`);
  process.exit(1);
}

if (!SOURCE || !TARGET) abort("Faltan SOURCE_DATABASE_URL o DIRECT_URL.");
if (SOURCE === TARGET) abort("Origen y destino son la misma base.");
if (!SKIP_RECEIPTS && (!SUPABASE_URL || !SUPABASE_KEY))
  abort("Faltan SUPABASE_URL / SUPABASE_SECRET_KEY (o usa --skip-receipts).");

// Todo como texto: ni fechas a la zona de la máquina, ni numeric a float, ni
// jsonb a objeto. Postgres vuelve a convertir cada valor al tipo de su columna.
const asText = { getTypeParser: () => (value: string) => value };

/** Tablas de datos: columnas en orden y clave para ordenar la comparación. */
const TABLES: { name: string; columns: string[]; orderBy: string }[] = [
  {
    name: "payments",
    // `reference_norm` es generada: se recalcula sola en el destino.
    columns: [
      "id",
      "created_at",
      "updated_at",
      "purpose",
      "project_slug",
      "frequency",
      "amount_usd",
      "amount_paid",
      "currency",
      "exchange_rate",
      "method",
      "status",
      "donor_name",
      "donor_email",
      "reference",
      "paid_at",
      "receipt_path",
      "provider_order_id",
      "provider_capture_id",
      "provider_subscription_id",
      "confirmed_at",
      "confirmed_by",
      "notes",
    ],
    orderBy: "id",
  },
  {
    name: "paypal_plans",
    columns: ["amount_usd", "plan_id", "created_at"],
    orderBy: "amount_usd",
  },
  { name: "settings", columns: ["key", "value", "updated_at"], orderBy: "key" },
  {
    name: "agenda_events",
    columns: [
      "id",
      "created_at",
      "updated_at",
      "kind",
      "weekday",
      "event_date",
      "start_time",
      "title",
      "location",
    ],
    orderBy: "id",
  },
];

const q = (ident: string) => `"${ident.replaceAll('"', '""')}"`;

/** md5 del contenido de una consulta, ordenado: el mismo SQL en los dos lados. */
async function digest(client: Client, select: string, orderBy: string) {
  const { rows } = await client.query<{ n: string; md5: string }>(
    `select count(*) as n, md5(coalesce(string_agg(t::text, '|' order by ${orderBy}), '')) as md5
     from (${select}) t`,
  );
  return rows[0];
}

async function copyTable(
  source: Client,
  target: Client,
  table: (typeof TABLES)[number],
) {
  const cols = table.columns.map(q).join(", ");
  const { rows } = await source.query(
    `select ${cols} from public.${q(table.name)}`,
  );
  // Por tandas, para no pasar el límite de parámetros de Postgres.
  const perBatch = Math.floor(60_000 / table.columns.length);
  for (let i = 0; i < rows.length; i += perBatch) {
    const batch = rows.slice(i, i + perBatch);
    const values: unknown[] = [];
    const tuples = batch.map((row) => {
      const slots = table.columns.map((c) => {
        values.push(row[c]);
        return `$${values.length}`;
      });
      return `(${slots.join(", ")})`;
    });
    await target.query(
      `insert into public.${q(table.name)} (${cols}) values ${tuples.join(", ")}`,
      values,
    );
  }
  const select = `select ${cols} from public.${q(table.name)}`;
  const [a, b] = await Promise.all([
    digest(source, select, table.orderBy),
    digest(target, select, table.orderBy),
  ]);
  if (a.n !== b.n || a.md5 !== b.md5)
    throw new Error(
      `${table.name}: el contenido no coincide (origen ${a.n} filas, destino ${b.n}).`,
    );
  console.log(`✓ ${table.name}: ${b.n} filas, contenido idéntico`);
}

/** auth.users → "user" + account. Los ids se conservan (uuid). */
async function copyUsers(source: Client, target: Client) {
  const { rows: providers } = await source.query<{ provider: string }>(
    "select distinct provider from auth.identities",
  );
  const social = providers.map((p) => p.provider).filter((p) => p !== "email");
  if (social.length)
    throw new Error(
      `Hay identidades sociales (${social.join(", ")}): la app no tiene login social. Revisar antes de migrar.`,
    );

  const { rows } = await source.query(`
    select id, lower(email) as email,
      coalesce(nullif(raw_user_meta_data->>'name', ''), split_part(email, '@', 1)) as name,
      (email_confirmed_at is not null) as email_verified,
      nullif(encrypted_password, '') as password,
      created_at, updated_at
    from auth.users
    where deleted_at is null and email is not null`);

  for (const u of rows) {
    await target.query(
      `insert into public."user" (id, name, email, email_verified, created_at, updated_at)
       values ($1, $2, $3, $4, $5::timestamptz, coalesce($6::timestamptz, $5::timestamptz))`,
      [u.id, u.name, u.email, u.email_verified, u.created_at, u.updated_at],
    );
    if (u.password)
      await target.query(
        `insert into public.account (account_id, provider_id, user_id, password, created_at, updated_at)
         values ($1::text, 'credential', $1::uuid, $2, $3::timestamptz, coalesce($4::timestamptz, $3::timestamptz))`,
        [u.id, u.password, u.created_at, u.updated_at],
      );
  }

  const [a, b] = await Promise.all([
    digest(
      source,
      `select id, lower(email), (email_confirmed_at is not null), nullif(encrypted_password, '')
       from auth.users where deleted_at is null and email is not null`,
      "id",
    ),
    digest(
      target,
      `select u.id, u.email, u.email_verified, a.password
       from public."user" u
       left join public.account a on a.user_id = u.id and a.provider_id = 'credential'`,
      "id",
    ),
  ]);
  if (a.n !== b.n || a.md5 !== b.md5)
    throw new Error(
      `usuarios: el contenido no coincide (origen ${a.n}, destino ${b.n}).`,
    );
  console.log(`✓ usuarios: ${b.n} cuentas, con su contraseña (bcrypt)`);
}

/** storage.objects (bucket receipts) → payment_receipts. */
async function copyReceipts(source: Client, target: Client) {
  const { rows } = await source.query<{ name: string; mime: string | null }>(
    `select name, metadata->>'mimetype' as mime
     from storage.objects where bucket_id = 'receipts' order by name`,
  );
  const auth: Record<string, string> = { apikey: String(SUPABASE_KEY) };
  // Las claves antiguas (JWT) también van en Authorization.
  if (SUPABASE_KEY?.startsWith("eyJ"))
    auth.Authorization = `Bearer ${SUPABASE_KEY}`;

  let copied = 0;
  for (const object of rows) {
    const path = object.name.split("/").map(encodeURIComponent).join("/");
    const res = await fetch(
      `${SUPABASE_URL}/storage/v1/object/authenticated/receipts/${path}`,
      { headers: auth, signal: AbortSignal.timeout(30_000) },
    );
    if (!res.ok)
      throw new Error(
        `comprobante ${copied + 1}/${rows.length}: HTTP ${res.status}`,
      );
    const bytes = Buffer.from(await res.arrayBuffer());
    const mime = object.mime ?? res.headers.get("content-type") ?? "";
    await target.query(
      `insert into public.payment_receipts (path, mime, size, bytes) values ($1, $2, $3, $4)`,
      [object.name, mime.split(";")[0].trim(), bytes.byteLength, bytes],
    );
    const { rows: check } = await target.query<{ md5: string }>(
      "select md5(bytes) as md5 from public.payment_receipts where path = $1",
      [object.name],
    );
    if (check[0]?.md5 !== createHash("md5").update(bytes).digest("hex"))
      throw new Error(`comprobante ${copied + 1}: los bytes no coinciden`);
    copied++;
  }

  // Cada pago con comprobante tiene que encontrarlo.
  const { rows: orphans } = await target.query<{ n: string }>(
    `select count(*) as n from public.payments p
     where p.receipt_path is not null
       and not exists (select 1 from public.payment_receipts r where r.path = p.receipt_path)`,
  );
  console.log(`✓ comprobantes: ${copied} archivos, bytes verificados`);
  if (Number(orphans[0].n) > 0)
    console.warn(
      `! ${orphans[0].n} pagos apuntan a un comprobante que no estaba en Storage (ya faltaba en Supabase).`,
    );
}

const DESTINATION_TABLES = [
  "payment_receipts",
  "payments",
  "paypal_plans",
  "settings",
  "agenda_events",
  "account",
  "session",
  "verification",
  "user",
  "rate_limit_hits",
];

const source = new Client({ connectionString: SOURCE, types: asText });
const target = new Client({ connectionString: TARGET, types: asText });
await source.connect();
await target.connect();
try {
  // El origen solo se lee; los dos en UTC para que las fechas se comparen igual.
  await source.query("set session characteristics as transaction read only");
  await source.query("set timezone = 'UTC'");
  await target.query("set timezone = 'UTC'");
  // Una sola foto del origen para todas las tablas.
  await source.query("begin isolation level repeatable read read only");
  await target.query("begin");

  const { rows: counts } = await target.query<{ n: string }>(
    `select (select count(*) from public.payments) + (select count(*) from public.agenda_events)
          + (select count(*) from public."user") + (select count(*) from public.settings) as n`,
  );
  if (Number(counts[0].n) > 0) {
    if (!REPLACE)
      throw new Error(
        "El destino ya tiene datos. Usa --replace para vaciarlo primero.",
      );
    await target.query(
      `truncate ${DESTINATION_TABLES.map((t) => `public.${q(t)}`).join(", ")}`,
    );
    console.log("· destino vaciado (--replace)");
  }

  for (const table of TABLES) await copyTable(source, target, table);
  await copyUsers(source, target);
  if (SKIP_RECEIPTS) console.log("· comprobantes: omitidos (--skip-receipts)");
  else await copyReceipts(source, target);

  if (DRY_RUN) {
    await target.query("rollback");
    console.log(
      "✓ Ensayo completo: todo coincide. ROLLBACK (--dry-run), el destino quedó como estaba.",
    );
  } else {
    await target.query("commit");
    console.log("✓ Copia completa y verificada. COMMIT.");
  }
} catch (error) {
  await target.query("rollback").catch(() => {});
  abort(
    `${error instanceof Error ? error.message : String(error)} — ROLLBACK, el destino quedó como estaba.`,
  );
} finally {
  await source.query("rollback").catch(() => {});
  await source.end();
  await target.end();
}
