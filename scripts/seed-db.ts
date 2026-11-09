#!/usr/bin/env bun
/**
 * Seed con código para la base de QA (lo corre `qa:local` tras las
 * migraciones y `drizzle/seed.sql`, con DATABASE_URL al contenedor). Crea las
 * cuentas de `.env.test.local`, porque la app no tiene ruta de registro
 * (`disableSignUp`): `existingAccount` en `scripts/qa-roles.ts` le dice a
 * qa-local que ya existen.
 *
 *   ADMIN_EMAIL_TEST / ADMIN_PASSWORD_TEST → admin (qa-local lo pone en ADMIN_EMAILS)
 *   EMAIL_TEST / PASSWORD_TEST             → cuenta sin acceso (el panel la rechaza)
 */
import { existsSync } from "node:fs";
import { Client } from "pg";
import { upsertAccount } from "./lib/accounts";

const url = process.env.DATABASE_URL ?? "";
// Nunca contra el VPS: solo una base local (qa-local usa 127.0.0.1).
if (!/@(127\.0\.0\.1|localhost):\d+\//.test(url)) {
  console.error("seed-db: DATABASE_URL no es local; no se siembra nada.");
  process.exit(1);
}
if (existsSync(".env.test.local")) process.loadEnvFile(".env.test.local");

const SEEDED: { email?: string; password?: string; name: string }[] = [
  {
    email: process.env.ADMIN_EMAIL_TEST,
    password: process.env.ADMIN_PASSWORD_TEST,
    name: "QA admin",
  },
  {
    email: process.env.EMAIL_TEST,
    password: process.env.PASSWORD_TEST,
    name: "QA sin acceso",
  },
];

const client = new Client({ connectionString: url });
await client.connect();
try {
  for (const account of SEEDED) {
    if (!account.email || !account.password) continue;
    await upsertAccount(client, {
      email: account.email,
      password: account.password,
      name: account.name,
    });
    console.log(`  + cuenta de prueba: ${account.name}`);
  }
} finally {
  await client.end();
}
