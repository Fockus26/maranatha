#!/usr/bin/env bash
# Prepares César's VPS as the central Postgres for projects migrated off Supabase/Firebase.
# Run ONCE, as root, on the VPS (Ubuntu 22.04/24.04 or Debian 12). Safe to re-run: every
# step checks before it changes anything.
#
# Usage (on the VPS, after copying this folder with scp; see reference/VPS-POSTGRES.md):
#   bash bootstrap.sh --domain db.example.com     # Let's Encrypt cert → sslmode=verify-full
#   bash bootstrap.sh                             # self-signed cert  → sslmode=no-verify
#   bash bootstrap.sh --harden-ssh                # also turns off SSH password login
#   bash bootstrap.sh --webroot                   # the certificate renews through a web server
#                                                 # already on port 80 (see "TLS certificate")
#   bash bootstrap.sh --test                      # inside a Docker container (no systemd,
#                                                 # no firewall): how the kit tests this file
#
# What it leaves:
#   - PostgreSQL 17 listening ONLY on localhost (never exposed).
#   - PgBouncer on :6432 with TLS: the only public door. Transaction pooling, because
#     Vercel's serverless functions open one connection per invocation and would exhaust
#     Postgres' max_connections. It authenticates every project's role against Postgres
#     itself (auth_query), so creating a database never means editing a userlist.
#   - `kit-db` in /usr/local/bin: create/list/show/rotate/backup/restore/drop per project.
#   - Daily pg_dump of every database (03:30, 14 days kept) and, if
#     /etc/kit-vps/backup.env names an rclone remote, a copy off the VPS: the plan has no
#     auto backup, and a backup on the same disk does not survive losing the VPS.
#   - ufw (22, 6432; 80 only with --domain, for the certificate renewal), fail2ban and
#     unattended security upgrades.
set -euo pipefail

PG=17
DOMAIN=""
TEST=0
HARDEN_SSH=0
WEBROOT=0
while [ $# -gt 0 ]; do
  case "$1" in
    --domain) DOMAIN="$2"; shift 2 ;;
    --webroot) WEBROOT=1; shift ;;
    --test) TEST=1; shift ;;
    --harden-ssh) HARDEN_SSH=1; shift ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done

[ "$(id -u)" = 0 ] || { echo "Run it as root." >&2; exit 1; }
HERE="$(cd "$(dirname "$0")" && pwd)"
[ -f "$HERE/kit-db" ] || { echo "kit-db is missing next to bootstrap.sh: copy the whole reference/vps folder." >&2; exit 1; }
. /etc/os-release
case "$ID" in ubuntu|debian) ;; *) echo "Only Ubuntu or Debian (this is $ID)." >&2; exit 1 ;; esac

export DEBIAN_FRONTEND=noninteractive
STATE=/etc/kit-vps
mkdir -p "$STATE/dbs" && chmod 700 "$STATE" "$STATE/dbs"

# A re-run without --domain keeps the domain: it used to fall to the self-signed branch and
# every URL printed afterwards dropped to sslmode=no-verify.
if [ -z "$DOMAIN" ] && [ -f "$STATE/vps.env" ] && grep -q '^KIT_VPS_SSLMODE=verify-full$' "$STATE/vps.env"; then
  DOMAIN=$(sed -n 's/^KIT_VPS_HOST=//p' "$STATE/vps.env")
  echo "== Keeping the domain from the previous run: $DOMAIN"
fi

# Starts or reloads a service with systemd, or by hand inside the test container.
svc() { # svc start|reload postgresql|pgbouncer
  if [ "$TEST" = 1 ]; then
    case "$2" in
      postgresql) pg_ctlcluster "$PG" main "$1" || pg_ctlcluster "$PG" main start ;;
      pgbouncer)
        if [ "$1" = reload ] && pgrep -x pgbouncer >/dev/null; then pkill -HUP -x pgbouncer
        else
          pkill -x pgbouncer && sleep 1 || true
          su postgres -s /bin/sh -c "pgbouncer -d /etc/pgbouncer/pgbouncer.ini"
        fi ;;
    esac
  else
    systemctl enable -q "$2"; systemctl "$1" "$2" 2>/dev/null || systemctl restart "$2"
  fi
}

echo "== Packages"
apt-get update -qq
# cron: minimal images (and some VPS templates) come without it; the daily backup is a cron.d file.
apt-get install -y -qq curl ca-certificates gnupg lsb-release openssl postgresql-common procps cron >/dev/null
# PGDG repo: the distro's Postgres/PgBouncer can be years old; auth_dbname and
# max_prepared_statements need PgBouncer >= 1.21.
[ -f /etc/apt/sources.list.d/pgdg.list ] || [ -f /etc/apt/sources.list.d/pgdg.sources ] ||
  /usr/share/postgresql-common/pgdg/apt.postgresql.org.sh -y >/dev/null
apt-get install -y -qq "postgresql-$PG" pgbouncer >/dev/null
if [ "$TEST" = 0 ]; then
  apt-get install -y -qq ufw fail2ban unattended-upgrades rclone >/dev/null
  [ -n "$DOMAIN" ] && apt-get install -y -qq certbot iproute2 >/dev/null
fi

echo "== PostgreSQL $PG (localhost only)"
# The package creates the `main` cluster; an image or a provider template may not.
[ -d "/etc/postgresql/$PG/main" ] || pg_createcluster "$PG" main >/dev/null
CONF_D="/etc/postgresql/$PG/main/conf.d"
mkdir -p "$CONF_D"
MEM_MB=$(awk '/MemTotal/ {print int($2/1024)}' /proc/meminfo)
cat > "$CONF_D/kit.conf" <<EOF
# Written by web-agent-kit bootstrap.sh. Sized from the VPS RAM (${MEM_MB} MB).
listen_addresses = 'localhost'
password_encryption = 'scram-sha-256'
max_connections = 200
shared_buffers = $((MEM_MB / 4))MB
effective_cache_size = $((MEM_MB * 3 / 4))MB
maintenance_work_mem = $((MEM_MB / 16))MB
work_mem = 16MB
EOF
svc restart postgresql
psql_su() { su postgres -s /bin/sh -c "psql -v ON_ERROR_STOP=1 -qAtX $*"; }

echo "== PgBouncer auth role"
AUTH_PW_FILE="$STATE/pgbouncer_auth.pw"
[ -f "$AUTH_PW_FILE" ] || { openssl rand -hex 24 > "$AUTH_PW_FILE"; chmod 600 "$AUTH_PW_FILE"; }
AUTH_PW=$(cat "$AUTH_PW_FILE")
psql_su "-d postgres" <<SQL
DO \$\$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'pgbouncer_auth') THEN
    CREATE ROLE pgbouncer_auth LOGIN;
  END IF;
END \$\$;
ALTER ROLE pgbouncer_auth PASSWORD '$AUTH_PW';
CREATE SCHEMA IF NOT EXISTS pgbouncer AUTHORIZATION postgres;
-- Only project roles can be looked up: never postgres or the auth role itself.
CREATE OR REPLACE FUNCTION pgbouncer.get_auth(p_usename text)
RETURNS TABLE(usename name, passwd text) LANGUAGE sql SECURITY DEFINER SET search_path = pg_catalog AS
\$f\$ SELECT usename, passwd FROM pg_shadow
     WHERE usename = p_usename AND usename NOT IN ('postgres', 'pgbouncer_auth') \$f\$;
REVOKE ALL ON FUNCTION pgbouncer.get_auth(text) FROM PUBLIC;
GRANT USAGE ON SCHEMA pgbouncer TO pgbouncer_auth;
GRANT EXECUTE ON FUNCTION pgbouncer.get_auth(text) TO pgbouncer_auth;
-- PgBouncer's * entry lets any project role ask for any database, and these two grant CONNECT
-- to PUBLIC by default. A session held on template1 made CREATE DATABASE fail (Docker test,
-- 2026-11-04). Only the auth role needs to enter one of them.
REVOKE CONNECT ON DATABASE template1 FROM PUBLIC;
REVOKE CONNECT ON DATABASE postgres FROM PUBLIC;
GRANT CONNECT ON DATABASE postgres TO pgbouncer_auth;
SQL

echo "== TLS certificate"
TLS=/etc/pgbouncer/tls
mkdir -p "$TLS"
if [ -n "$DOMAIN" ] && [ "$TEST" = 0 ]; then
  ufw allow 80/tcp >/dev/null
  # Standalone needs port 80 for itself at every renewal. On a VPS that only serves databases
  # that is fine; once a web server (Caddy, nginx) listens there, the renewal fails without
  # anyone noticing, and when the certificate expires every project with sslmode=verify-full
  # loses its database at once (kit-deploy). --webroot moves the renewal to that web server:
  # it must serve http://<domain>/.well-known/acme-challenge/ from $ACME.
  #   Caddy:  http://<domain> { root * /var/www/acme
  #                             file_server }
  ACME=/var/www/acme
  RENEWAL="/etc/letsencrypt/renewal/$DOMAIN.conf"
  port80_taken() { ss -ltnH 'sport = :80' 2>/dev/null | grep -q .; }
  if [ "$WEBROOT" = 1 ]; then
    mkdir -p "$ACME/.well-known/acme-challenge"
    probe="kit-$(openssl rand -hex 8)"
    echo ok > "$ACME/.well-known/acme-challenge/$probe"
    served=$(curl -fsS --max-time 10 "http://$DOMAIN/.well-known/acme-challenge/$probe" 2>/dev/null || true)
    rm -f "$ACME/.well-known/acme-challenge/$probe"
    if [ "$served" != ok ]; then
      echo "--webroot: http://$DOMAIN/.well-known/acme-challenge/ is not served from $ACME." >&2
      echo "Point the web server there first (comment above), then run this again. Nothing changed." >&2
      exit 1
    fi
    if [ ! -d "/etc/letsencrypt/live/$DOMAIN" ]; then
      certbot certonly --webroot -w "$ACME" -n --agree-tos --register-unsafely-without-email -d "$DOMAIN"
    elif ! grep -q '^authenticator = webroot' "$RENEWAL" 2>/dev/null; then
      # An existing certificate keeps its renewal options unless they are saved again
      # (Certbot docs, "Modifying the Renewal Configuration of Existing Certificates").
      if certbot help reconfigure >/dev/null 2>&1; then   # Certbot >= 2.3: tests, then saves
        certbot reconfigure --cert-name "$DOMAIN" -a webroot --webroot-path "$ACME" -n
      else                                                # older: dry run, then one forced renewal
        certbot renew --cert-name "$DOMAIN" -a webroot --webroot-path "$ACME" --dry-run -n
        certbot renew --cert-name "$DOMAIN" -a webroot --webroot-path "$ACME" --force-renewal -n
      fi
    fi
    certbot renew --cert-name "$DOMAIN" --dry-run -n
    echo "Certificate of $DOMAIN: renews through webroot ($ACME)."
  elif [ ! -d "/etc/letsencrypt/live/$DOMAIN" ]; then
    if port80_taken; then
      echo "Port 80 is in use: certbot standalone cannot answer there." >&2
      echo "Serve http://$DOMAIN/.well-known/acme-challenge/ from $ACME and run this with --webroot." >&2
      exit 1
    fi
    certbot certonly --standalone -n --agree-tos --register-unsafely-without-email -d "$DOMAIN"
  fi
  if grep -q '^authenticator = standalone' "$RENEWAL" 2>/dev/null && port80_taken; then
    CERT_WARNING="The certificate of $DOMAIN renews in standalone mode and port 80 is in use: its renewal will fail. Run: bash bootstrap.sh --webroot"
  fi
  # Every renewal copies the cert where PgBouncer (user postgres) can read it, and reloads.
  mkdir -p /etc/letsencrypt/renewal-hooks/deploy
  cat > /etc/letsencrypt/renewal-hooks/deploy/kit-pgbouncer.sh <<EOF
#!/bin/sh
cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem $TLS/server.crt
cp /etc/letsencrypt/live/$DOMAIN/privkey.pem $TLS/server.key
chown postgres:postgres $TLS/server.*; chmod 600 $TLS/server.key
systemctl reload pgbouncer 2>/dev/null || true
EOF
  chmod 755 /etc/letsencrypt/renewal-hooks/deploy/kit-pgbouncer.sh
  /etc/letsencrypt/renewal-hooks/deploy/kit-pgbouncer.sh
  HOST="$DOMAIN"; SSLMODE=verify-full
else
  [ -f "$TLS/server.crt" ] || openssl req -x509 -newkey rsa:2048 -nodes -days 3650 -subj "/CN=kit-vps" \
    -keyout "$TLS/server.key" -out "$TLS/server.crt" 2>/dev/null
  chown postgres:postgres "$TLS"/server.*; chmod 600 "$TLS/server.key"
  HOST=$(curl -fsS4 --max-time 5 https://api.ipify.org 2>/dev/null || hostname -I | awk '{print $1}')
  # Encrypted but not authenticated: a man in the middle could impersonate the server.
  # That is why --domain is the recommended path.
  SSLMODE=no-verify
fi

echo "== PgBouncer :6432"
# The auth role's password in clear (the file is postgres-only, 600): PgBouncer logs in to
# Postgres as it to run auth_query, and with its SCRAM secret here instead the login failed
# with "server login failed: wrong password type" (found in the Docker test, 2026-10-30). The
# project roles' SCRAM secrets come from auth_query and only ever authenticate clients.
cat > /etc/pgbouncer/userlist.txt <<EOF
"pgbouncer_auth" "$AUTH_PW"
EOF
chown postgres:postgres /etc/pgbouncer/userlist.txt; chmod 600 /etc/pgbouncer/userlist.txt
cat > /etc/pgbouncer/pgbouncer.ini <<EOF
; Written by web-agent-kit bootstrap.sh
[databases]
* = host=127.0.0.1 port=5432 auth_user=pgbouncer_auth

[pgbouncer]
listen_addr = *
listen_port = 6432
unix_socket_dir = /var/run/postgresql
auth_type = scram-sha-256
auth_file = /etc/pgbouncer/userlist.txt
auth_query = SELECT usename, passwd FROM pgbouncer.get_auth(\$1)
auth_dbname = postgres
pool_mode = transaction
max_prepared_statements = 200
max_client_conn = 1000
default_pool_size = 10
ignore_startup_parameters = extra_float_digits,options
client_tls_sslmode = require
client_tls_cert_file = $TLS/server.crt
client_tls_key_file = $TLS/server.key
logfile = /var/log/postgresql/pgbouncer.log
pidfile = /var/run/postgresql/pgbouncer.pid
admin_users = postgres
EOF
mkdir -p /var/run/postgresql && chown postgres:postgres /var/run/postgresql
svc restart pgbouncer

echo "== kit-db and backups"
install -m 755 "$HERE/kit-db" /usr/local/bin/kit-db
cat > "$STATE/vps.env" <<EOF
KIT_VPS_HOST=$HOST
KIT_VPS_PORT=6432
KIT_VPS_SSLMODE=$SSLMODE
EOF
chmod 600 "$STATE/vps.env"
[ -f "$STATE/backup.env" ] || cat > "$STATE/backup.env" <<'EOF'
# Off-VPS copy of the daily backups. Configure a remote with `rclone config` (Cloudflare R2,
# Backblaze B2, Google Drive…) and put its name and folder here, e.g. KIT_BACKUP_REMOTE=r2:kit-backups
KIT_BACKUP_REMOTE=
KIT_BACKUP_DAYS=14
EOF
mkdir -p /var/backups/kit-pg && chmod 700 /var/backups/kit-pg
echo "30 3 * * * root /usr/local/bin/kit-db backup --all >> /var/log/kit-db-backup.log 2>&1" > /etc/cron.d/kit-db-backup

if [ "$TEST" = 0 ]; then
  echo "== Firewall and hardening"
  ufw allow OpenSSH >/dev/null; ufw allow 6432/tcp >/dev/null; ufw --force enable >/dev/null
  systemctl enable -q --now fail2ban
  dpkg-reconfigure -f noninteractive unattended-upgrades >/dev/null
  if [ "$HARDEN_SSH" = 1 ]; then
    # Refuses without a key: turning off passwords with no key locks César out (VNC remains).
    if [ -s /root/.ssh/authorized_keys ]; then
      # 00-: sshd keeps the FIRST value it reads, and cloud images ship 50-cloud-init.conf with
      # PasswordAuthentication yes, so a 60- file changed nothing while this script said "off"
      # (César's VPS, 2026-11-04). What is reported is what sshd says, not what was written.
      rm -f /etc/ssh/sshd_config.d/60-kit.conf
      printf 'PasswordAuthentication no\nPermitRootLogin prohibit-password\n' > /etc/ssh/sshd_config.d/00-kit.conf
      sshd -t
      systemctl reload ssh 2>/dev/null || systemctl reload sshd
      if sshd -T | grep -qi '^passwordauthentication no$'; then
        echo "SSH: password login off (keys only)."
      else
        echo "SSH: password login is STILL ON: check 'sshd -T' and /etc/ssh/sshd_config." >&2
      fi
    else
      echo "SSH: NOT hardened, /root/.ssh/authorized_keys is empty. Add your key first." >&2
    fi
  fi
fi

echo
echo "Ready. Public door: $HOST:6432 (sslmode=$SSLMODE)."
echo "Next: kit-db create <project>   (from your PC: ssh kit-vps kit-db create <project>)"
[ -z "${CERT_WARNING:-}" ] || { echo; echo "WARNING: $CERT_WARNING" >&2; }
