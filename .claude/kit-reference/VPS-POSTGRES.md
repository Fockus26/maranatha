# VPS Postgres — César's central database server

**This file is the server**, set up once: how it is installed, and how an agent works with it
without ever handling a password. What a project does on it, from its first unit or migrated
later, is [`tech/vps-postgres.md`](./tech/vps-postgres.md) and the `tech/migrate-*-vps.md` files.

Why one central Postgres (decided by César, 2026-10-29) and not Supabase self-hosted or one
container per project: one Postgres with one database and one role per project isolates
the projects (a role cannot even connect to another's database) at the cost of a single
server to maintain. Supabase self-hosted is ~10 containers per instance; a container per
project multiplies the RAM and the moving parts. Auth does not need a server: Better Auth
is a library that runs inside each app and keeps its tables in that app's database.

The VPS: 4 cores, 8 GB RAM, 100 GB disk, EU, no auto-backup add-on. Postgres + PgBouncer
for a dozen small projects use well under half of it.

---

## The shape

```
 Vercel (each project)                 VPS
 DATABASE_URL ──TLS──►  PgBouncer :6432  ──►  Postgres 17 (localhost only)
                        transaction pool       ├─ db melao       (role melao)
                                               ├─ db world_flags (role world_flags)
 César's PC / agent                            └─ …
 ssh kit-vps kit-db …  ── SSH key ──►  kit-db (root)  ·  daily pg_dump → disk + rclone
 migrations: ssh -L 5433 → Postgres directly (DIRECT_URL)
```

- **Postgres never listens on the internet.** The only public door is PgBouncer, with TLS
  required. Vercel has no fixed IPs on its normal plans, so an IP allowlist is impossible:
  the protection is TLS + a 48-hex-character password per project + fail2ban on SSH.
- **PgBouncer in transaction mode**, because every serverless invocation opens its own
  connection and a traffic peak would exhaust `max_connections`. Consequence for the code:
  no session state between queries (`SET`, advisory locks, `LISTEN`); prepared statements
  do work (`max_prepared_statements`).
- **Migrations go direct**, not through the pool: `drizzle-kit migrate` with `DIRECT_URL`
  through an SSH tunnel. A migration holds locks and DDL across statements; the transaction
  pool may hand each statement a different server connection.

## Credentials: nothing to type, nothing in the kit

César asked for the kit to "have the VPS's data" so this is not tedious. It does, but no
secret goes into the kit, a project, or a chat:

| What | Where it lives | Who uses it |
|---|---|---|
| Access to the VPS | César's SSH key (`~/.ssh/id_ed25519`) + the `kit-vps` alias in `~/.ssh/config` | The agent runs `ssh kit-vps …`; the key unlocks it without a password |
| The VPS address | Only in `~/.ssh/config` (`HostName`) | Nobody writes the IP anywhere else: the kit and the projects say `kit-vps` |
| Each project's DB password | On the VPS, `/etc/kit-vps/dbs/<project>.env` (root only) | `kit-db url <project>` prints it into a pipe, never on screen |
| Root password of the VPS | César's password manager. With `--harden-ssh`, SSH no longer accepts it (only the provider's VNC console) | César, only for the console |

**The agent never reads or types a password.** It pipes the URL to where it goes:

```bash
ssh kit-vps kit-db url melao | vercel env add DATABASE_URL production
ssh kit-vps kit-db url melao_preview | vercel env add DATABASE_URL preview
```

and for the machine, `bun run vps:env melao` (`reference/scripts/vps-env.ts`, copied to the
project) writes `DATABASE_URL` and `DIRECT_URL` into `.env.development.local` without printing
them. Previews have their own database: with the same URL, a PR's preview writes real data
(world-flags).

## One-time setup (César, ~20 minutes)

1. **SSH key on the PC** (PowerShell), if `~/.ssh/id_ed25519.pub` does not exist yet:
   ```powershell
   ssh-keygen -t ed25519 -C "cesar@pc"
   ```
2. **The key on the VPS.** This is the only time you type the root password (in the
   prompt, not in the chat):
   ```powershell
   type $env:USERPROFILE\.ssh\id_ed25519.pub | ssh root@<VPS-IP> "mkdir -p ~/.ssh && chmod 700 ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"
   ```
3. **The alias**, in `~/.ssh/config` (create it if missing):
   ```
   Host kit-vps
     HostName <VPS-IP>
     User root
     IdentityFile ~/.ssh/id_ed25519
   ```
   Check it: `ssh kit-vps hostname` answers without asking for a password.
4. **A domain for the database (recommended):** an `A` record `db.<your-domain>` → the VPS
   IP, in the DNS of any domain you own. With it, the certificate is Let's Encrypt and the
   apps connect with `sslmode=verify-full` (they check they are talking to your server).
   Without it, the certificate is self-signed and the apps use `sslmode=no-verify`:
   encrypted, but a man in the middle could impersonate the server.
5. **Bootstrap** (from the kit's folder):
   ```powershell
   scp -r reference/vps kit-vps:/root/kit-vps
   ssh kit-vps "bash /root/kit-vps/bootstrap.sh --domain db.<your-domain> --harden-ssh"
   ```
   Re-running it is safe (it is how you apply a newer version of the script).
6. **Off-VPS backups** (strongly recommended: the plan has no auto-backup, and a dump on the
   same disk dies with the disk). On the VPS, `rclone config` with a free remote (Cloudflare
   R2 10 GB, Backblaze B2 10 GB, or Google Drive), then put its name in
   `/etc/kit-vps/backup.env` (`KIT_BACKUP_REMOTE=r2:kit-backups`). Test it:
   `ssh kit-vps kit-db backup --all`, then `kit-db status`. In the bucket: private, encrypted,
   and a lifecycle rule (the VPS only deletes its own copies). Its key lives only in rclone on
   the VPS, limited to that bucket and, if you can, without `deleteFiles`: whoever gets into
   the server should not be able to erase the copies too.

## Operations

All from the PC, through the alias:

| Need | Command |
|---|---|
| Database for a project | `ssh kit-vps kit-db create <project> >/dev/null` (lowercase, digits, `_`; it prints the URLs with the password, so an agent never lets them reach the screen) |
| Its URLs | `ssh kit-vps kit-db url <project>` · `--direct` for migrations |
| Tunnel for migrations / `drizzle-kit studio` | `ssh -N -L 5433:127.0.0.1:5432 kit-vps` (leave it open) |
| What is there and how big | `ssh kit-vps kit-db list` |
| Leaked password | `ssh kit-vps kit-db rotate <project>`, then the two `vercel env add` above and redeploy |
| Backup now | `ssh kit-vps kit-db backup <project>` (daily one is automatic at 03:30) |
| Are the backups working? | `ssh kit-vps kit-db status`: last dump per database and last failures. Nobody is alerted otherwise |
| Restore | `ssh kit-vps kit-db restore <project> /var/backups/kit-pg/<file>.dump` |
| Retire a project | `ssh kit-vps kit-db drop <project> --yes` (final backup first) |
| PgBouncer pools | `ssh kit-vps "psql -h /var/run/postgresql -p 6432 -U postgres pgbouncer -c 'SHOW POOLS'"` |

**Restoring is tested, not assumed:** once a quarter (or after setting up rclone), restore
the latest dump of one project into a scratch database
(`kit-db create scratch && kit-db restore scratch <file>`) and drop it. A backup nobody has
restored is a hope.

**Updates:** unattended-upgrades applies the security ones. A Postgres major (17 → 18) is
a planned operation with `pg_upgradecluster`, never automatic.

## Local QA without the VPS

`wave-qa` and the QA scripts never touch the VPS, the same as they never touch the real
Supabase. `qa-local.ts` detects `drizzle.config.*` and starts a Postgres 17 and a Mailpit in
Docker, a database per QA port, then the project's migrations and seed. It aborts if a `.env*`
variable it does not override points at the VPS (`:6432`, the tunnel's `:5433`, or
`KIT_VPS_HOST`). World-flags built it in its migration, and the header of the script has the
detail.
