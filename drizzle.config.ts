import { existsSync } from "node:fs";
import { defineConfig } from "drizzle-kit";

// bun run no le pasa los .env a drizzle-kit. `DIRECT_URL` (la de qa:local o
// la del túnel) gana sobre el archivo.
if (!process.env.DIRECT_URL && existsSync(".env.development.local")) {
  process.loadEnvFile(".env.development.local");
}

// Sin throw si falta: db:generate no necesita base y debe funcionar en un
// clon limpio.
export default defineConfig({
  dialect: "postgresql",
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url: process.env.DIRECT_URL ?? "" },
});
