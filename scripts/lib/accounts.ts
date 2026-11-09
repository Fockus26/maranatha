/**
 * Alta de una cuenta del dashboard directo en la base (Better Auth tiene
 * `disableSignUp`). La usan `scripts/create-admin.ts` y `scripts/seed-db.ts`.
 * El hash es el scrypt de Better Auth, el mismo que usaría su sign-up.
 */
import { hashPassword } from "better-auth/crypto";
import type { Client } from "pg";

export async function upsertAccount(
  client: Client,
  { email, password, name }: { email: string; password: string; name: string },
): Promise<string> {
  const normalized = email.trim().toLowerCase();
  const hash = await hashPassword(password);
  await client.query("begin");
  try {
    const { rows } = await client.query<{ id: string }>(
      `insert into public."user" (name, email, email_verified)
       values ($1, $2, true)
       on conflict (email) do update set email_verified = true, updated_at = now()
       returning id`,
      [name, normalized],
    );
    const id = rows[0].id;
    const updated = await client.query(
      `update public.account set password = $2, updated_at = now()
       where user_id = $1 and provider_id = 'credential'`,
      [id, hash],
    );
    if (updated.rowCount === 0) {
      await client.query(
        `insert into public.account (account_id, provider_id, user_id, password)
         values ($1::text, 'credential', $1::uuid, $2)`,
        [id, hash],
      );
    }
    await client.query("commit");
    return id;
  } catch (error) {
    await client.query("rollback");
    throw error;
  }
}
