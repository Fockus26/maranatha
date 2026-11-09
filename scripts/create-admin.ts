#!/usr/bin/env bun
/**
 * Crea (o le cambia la contraseña a) una cuenta del dashboard (D082). El
 * sitio no tiene registro: es el reemplazo de "Supabase → Authentication →
 * Add user". La cuenta solo entra si su correo además está en ADMIN_EMAILS.
 *
 *   DIRECT_URL="$(ssh kit-vps kit-db url maranatha --direct)" \
 *     bun scripts/create-admin.ts tesoreria@ejemplo.com "Tesorería"
 *
 * La contraseña se pide por la terminal (no va en la línea de comandos ni en
 * el historial). Con el túnel abierto (`ssh -N -L 5433:127.0.0.1:5432 kit-vps`).
 */
import { Client } from "pg";
import { upsertAccount } from "./lib/accounts";

const [email, name = "Administrador"] = process.argv.slice(2);
const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !url) {
  console.error(
    'Uso: DIRECT_URL=… bun scripts/create-admin.ts <correo> ["Nombre"]',
  );
  process.exit(1);
}

const password = prompt("Contraseña (mínimo 10 caracteres):") ?? "";
if (password.length < 10 || password.length > 128) {
  console.error("La contraseña debe tener entre 10 y 128 caracteres.");
  process.exit(1);
}

const client = new Client({ connectionString: url });
await client.connect();
try {
  await upsertAccount(client, { email, password, name });
  console.log(`Cuenta lista: ${email.toLowerCase()}`);
  if (
    !(process.env.ADMIN_EMAILS ?? "")
      .toLowerCase()
      .includes(email.toLowerCase())
  )
    console.log(
      "Recuerda: el correo tiene que estar en ADMIN_EMAILS para entrar.",
    );
} finally {
  await client.end();
}
