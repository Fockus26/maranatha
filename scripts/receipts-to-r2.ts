#!/usr/bin/env bun
/**
 * Mueve los comprobantes de la tabla `payment_receipts` (D082) al bucket de R2
 * (D094). Idempotente: lo que ya está en el bucket con el mismo md5 se salta.
 *
 *   bun scripts/receipts-to-r2.ts             # ensayo: cuenta y compara, no escribe
 *   bun scripts/receipts-to-r2.ts --copy      # sube lo que falta y verifica cada md5
 *   bun scripts/receipts-to-r2.ts --copy --delete-rows
 *                                             # además borra de la tabla lo verificado
 *
 * Variables: DATABASE_URL (o DIRECT_URL) de la base del entorno, y las R2_* del
 * mismo entorno (producción → bucket de producción). Se leen del entorno, nunca
 * se imprimen.
 */
import { createHash } from "node:crypto";
import { AwsClient } from "aws4fetch";
import { Client } from "pg";

const args = new Set(process.argv.slice(2));
const copy = args.has("--copy");
const deleteRows = args.has("--delete-rows");
if (deleteRows && !copy) {
  console.error("--delete-rows solo junto con --copy.");
  process.exit(1);
}

const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET } =
  process.env;
if (
  !url ||
  !R2_ACCOUNT_ID ||
  !R2_ACCESS_KEY_ID ||
  !R2_SECRET_ACCESS_KEY ||
  !R2_BUCKET
) {
  console.error(
    "Faltan DATABASE_URL/DIRECT_URL o alguna R2_* (ACCOUNT_ID, ACCESS_KEY_ID, SECRET_ACCESS_KEY, BUCKET).",
  );
  process.exit(1);
}

const aws = new AwsClient({
  accessKeyId: R2_ACCESS_KEY_ID,
  secretAccessKey: R2_SECRET_ACCESS_KEY,
  service: "s3",
  region: "auto",
  retries: 3,
});
const base = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET}`;
const md5 = (b: Uint8Array) => createHash("md5").update(b).digest("hex");

async function remoteMd5(path: string): Promise<string | null> {
  const res = await aws.fetch(`${base}/${path}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GET ${path}: ${res.status}`);
  return md5(new Uint8Array(await res.arrayBuffer()));
}

const db = new Client({ connectionString: url });
await db.connect();
let copied = 0;
let already = 0;
let deleted = 0;
let failed = 0;
try {
  const { rows } = await db.query<{
    path: string;
    mime: string;
    bytes: Buffer;
  }>("select path, mime, bytes from payment_receipts order by path");
  console.log(`${rows.length} comprobantes en la tabla → bucket ${R2_BUCKET}`);

  for (const row of rows) {
    const local = md5(row.bytes);
    try {
      let remote = await remoteMd5(row.path);
      if (remote === local) already++;
      else if (!copy) {
        console.log(`  · falta ${row.path}${remote ? " (distinto)" : ""}`);
        continue;
      } else {
        const put = await aws.fetch(`${base}/${row.path}`, {
          method: "PUT",
          headers: { "Content-Type": row.mime },
          body: new Uint8Array(row.bytes),
        });
        if (!put.ok) throw new Error(`PUT ${row.path}: ${put.status}`);
        remote = await remoteMd5(row.path);
        if (remote !== local) throw new Error(`md5 distinto en ${row.path}`);
        copied++;
      }
      if (deleteRows) {
        await db.query("delete from payment_receipts where path = $1", [
          row.path,
        ]);
        deleted++;
      }
    } catch (error) {
      failed++;
      console.error(`  ! ${(error as Error).message}`);
    }
  }
} finally {
  await db.end();
}

console.log(
  `copiados ${copied} · ya estaban ${already} · borrados de la tabla ${deleted} · fallos ${failed}${copy ? "" : " (ensayo: usa --copy para subir)"}`,
);
process.exit(failed ? 1 : 0);
