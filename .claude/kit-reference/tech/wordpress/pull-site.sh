#!/usr/bin/env bash
# pull-site.sh — bring a WordPress site down to a local copy (web-agent-kit,
# reference/tech/wordpress-adopt.md §3). Everything lands in .site-pull/ (gitignored).
#
#   bash scripts/pull-site.sh ssh     [--no-uploads]        rsync of wp-content + wp db export over SSH
#   bash scripts/pull-site.sh ftps    [--no-uploads]        lftp mirror of wp-content, TLS forced
#   bash scripts/pull-site.sh archive --file <backup>       cPanel full backup (.tar.gz) or .zip
#   bash scripts/pull-site.sh dbs     --dump <file.sql[.gz]>   split a multi-database dump, find the live one
#   bash scripts/pull-site.sh import  --dump <file.sql[.gz]> [--env compose|wp-env] [--no-backup]
#
# Access and URLs come from .env.local (keys in .env.example). ssh and ftps resume when run
# again, and finish with a dry run that must find nothing left to transfer.
# Without rsync or lftp installed (Windows), they run in a small Alpine image built once.
set -euo pipefail

OUT=.site-pull
mkdir -p "$OUT/files" "$OUT/db" "$OUT/backups"
[ -f .env.local ] && { set -a; . ./.env.local; set +a; }

log() { printf '[pull-site] %s\n' "$*" | tee -a "$OUT/pull.log" >&2; }
die() { log "ERROR: $*"; exit 1; }
need() { [ -n "${!1:-}" ] || die "$1 is not set (.env.local, see .env.example)"; }

MODE=${1:-}; [ $# -gt 0 ] && shift
NO_UPLOADS=0; FILE=; DUMP=; ENV_KIND=compose; NO_BACKUP=0
while [ $# -gt 0 ]; do
  case $1 in
    --no-uploads) NO_UPLOADS=1 ;;
    --file) FILE=$2; shift ;;
    --dump) DUMP=$2; shift ;;
    --env) ENV_KIND=$2; shift ;;
    --no-backup) NO_BACKUP=1 ;;
    *) die "unknown option $1" ;;
  esac
  shift
done

# --- tools: native if installed, otherwise in a container ------------------------------------
IMAGE=kit-transfer:1
host_dir() { if command -v cygpath >/dev/null 2>&1; then cygpath -w "$1"; else printf '%s' "$1"; fi; }
run_tool() {
  if [ -z "${IN_CONTAINER:-}" ] && command -v "$1" >/dev/null 2>&1; then
    "$@"; return
  fi
  command -v docker >/dev/null 2>&1 || die "$1 is not installed and there is no Docker to run it"
  docker image inspect "$IMAGE" >/dev/null 2>&1 || {
    log "building $IMAGE (rsync, lftp, openssh) once"
    printf 'FROM alpine:3.20\nRUN apk add --no-cache rsync lftp openssh-client ca-certificates\n' |
      docker build -q -t "$IMAGE" - >/dev/null
  }
  local ssh_mount=()
  [ -n "${PULL_SSH_KEY:-}" ] && ssh_mount=(-v "$(host_dir "$(cd "$(dirname "$PULL_SSH_KEY")" && pwd)/$(basename "$PULL_SSH_KEY")"):/key-src:ro")
  # MSYS_NO_PATHCONV: Git Bash would rewrite /work into a Windows path.
  MSYS_NO_PATHCONV=1 docker run --rm -i -v "$(host_dir "$PWD"):/work" -w /work "${ssh_mount[@]}" \
    -e LFTP_PASSWORD --add-host=host.docker.internal:host-gateway "$IMAGE" \
    sh -c '[ -f /key-src ] && install -m 600 /key-src /tmp/key; exec "$@"' -- "$@"
}

# wc-logs/ and litespeed/: live logs and cache, different on every run, so the verification
# below never reached zero differences (InversionesJL22).
EXCLUDES=(cache/ upgrade/ ai1wm-backups/ updraft/ backups-dup-lite/ wflogs/ et-cache/ wc-logs/ litespeed/)
[ "$NO_UPLOADS" = 1 ] && EXCLUDES+=(uploads/)

# --- ssh ---------------------------------------------------------------------------------------
pull_ssh() {
  need PULL_SSH; need PULL_PATH
  local port=${PULL_SSH_PORT:-22} key_opt=
  # rsync and ssh run in the same place: natively if both are installed, otherwise both in the
  # container (Windows has ssh but no rsync, and the two saw different hosts and known_hosts).
  if command -v rsync >/dev/null 2>&1 && command -v ssh >/dev/null 2>&1; then
    key_opt=${PULL_SSH_KEY:+-i $PULL_SSH_KEY}
  else
    IN_CONTAINER=1; key_opt=${PULL_SSH_KEY:+-i /tmp/key}
  fi
  # First run trusts the host key and stores it in .site-pull/known_hosts; later runs verify it.
  local sshcmd="ssh -p $port $key_opt -o StrictHostKeyChecking=accept-new -o UserKnownHostsFile=$OUT/known_hosts -o BatchMode=yes"
  local args=(-az --partial --delete -e "$sshcmd")
  for e in "${EXCLUDES[@]}"; do args+=(--exclude "$e"); done
  local src="$PULL_SSH:$PULL_PATH/wp-content/" dst="$OUT/files/wp-content/"
  log "rsync $src -> $dst"
  run_tool rsync "${args[@]}" --info=stats1 "$src" "$dst"
  log "verifying (dry run)"
  local left
  local plan
  plan=$(run_tool rsync "${args[@]}" -n --out-format='%i %n' "$src" "$dst") ||
    die "the verification could not reach the server: run it again"
  left=$(printf '%s\n' "$plan" | grep -c '^[<>c]' || true)
  [ "$left" = 0 ] || die "$left files still differ: run it again (it resumes)"
  log "files complete"

  log "database: wp db export on the server"
  local dump="$OUT/db/live-$(date +%Y%m%d-%H%M%S).sql"
  if run_tool ssh -p "$port" $key_opt -o StrictHostKeyChecking=accept-new -o UserKnownHostsFile="$OUT/known_hosts" -o BatchMode=yes \
    "$PULL_SSH" "cd '$PULL_PATH' && wp db export - --single-transaction" > "$dump"; then
    grep -q 'CREATE TABLE' "$dump" || die "the export in $dump has no tables"
    log "database -> $dump  (next: pull-site.sh import --dump $dump)"
  else
    rm -f "$dump"
    log "no WP-CLI on the server: export the site's database from the panel and run: pull-site.sh dbs --dump <file>"
  fi
}

# --- ftps --------------------------------------------------------------------------------------
pull_ftps() {
  need PULL_FTP_HOST; need PULL_FTP_USER; need PULL_FTP_PASSWORD; need PULL_PATH
  export LFTP_PASSWORD=$PULL_FTP_PASSWORD
  local ex='' e
  for e in "${EXCLUDES[@]}"; do ex+=" --exclude-glob ${e%/}/"; done
  # TLS forced on control and data, certificate verified: never plain FTP.
  # PULL_FTP_CA_FILE only for a host whose CA is not public (or a test server).
  local setup="set ftp:ssl-force true; set ftp:ssl-protect-data true; set ssl:verify-certificate yes;
    ${PULL_FTP_CA_FILE:+set ssl:ca-file $PULL_FTP_CA_FILE;}
    set net:max-retries 5; set net:reconnect-interval-base 5; set net:timeout 30;
    set mirror:parallel-transfer-count 4;
    open --env-password -u $PULL_FTP_USER ftp://$PULL_FTP_HOST"
  local src="$PULL_PATH/wp-content" dst="$OUT/files/wp-content"
  log "lftp mirror $src -> $dst (resumes)"
  run_tool lftp -c "set cmd:fail-exit true; $setup; mirror --continue --delete --verbose=1 $ex $src $dst" ||
    die "the transfer stopped: run it again (it resumes)"
  log "verifying (dry run)"
  local left
  # A dry run that could not connect proves nothing: its failure stops here (it said
  # "complete" with the server down, kit test 2026-11-07).
  local plan
  plan=$(run_tool lftp -c "set cmd:fail-exit true; $setup; mirror --dry-run --delete $ex $src $dst") ||
    die "the verification could not reach the server: run it again"
  left=$(printf '%s\n' "$plan" | grep -cE '^(get|rm) ' || true)
  [ "$left" = 0 ] || die "$left files still differ: run it again (it resumes)"
  log "files complete. Database: export the site's one from phpMyAdmin, then: pull-site.sh dbs --dump <file>"
}

# --- archive -----------------------------------------------------------------------------------
pull_archive() {
  [ -n "$FILE" ] || die "archive needs --file <backup>"
  [ -f "$FILE" ] || die "$FILE does not exist"
  local tmp="$OUT/.extract"; rm -rf "$tmp"; mkdir -p "$tmp"
  case $FILE in
    *.tar.gz|*.tgz)
      log "testing $FILE"
      gzip -t "$FILE" 2>/dev/null && tar -tzf "$FILE" >/dev/null || die "$FILE is truncated or damaged: download it again"
      tar -xzf "$FILE" -C "$tmp" --wildcards '*wp-content/*' '*.sql' '*.sql.gz' 2>/dev/null || true ;;
    *.zip)
      log "testing $FILE"
      unzip -tq "$FILE" >/dev/null || die "$FILE is truncated or damaged: download it again"
      # Everything, then pick: Git Bash's unzip matches no wildcard, not even '*' (kit test).
      unzip -q "$FILE" -d "$tmp" || die "could not extract $FILE" ;;
    *.wpress) die ".wpress is not extracted here: restore it with All-in-One WP Migration inside the local copy" ;;
    *) die "unknown archive type: $FILE (.tar.gz, .tgz or .zip)" ;;
  esac
  # The live install's wp-content is the shallowest one; the others are old installs.
  local all main
  all=$(find "$tmp" -type d -name wp-content -prune | awk '{ print gsub("/", "/"), $0 }' | sort -n | cut -d' ' -f2-)
  [ -n "$all" ] || die "no wp-content in $FILE"
  main=$(printf '%s\n' "$all" | head -1)
  if [ "$(printf '%s\n' "$all" | wc -l)" -gt 1 ]; then
    log "several installs in the backup; taking ${main#"$tmp"/}. Others (report them to César, do not delete):"
    printf '%s\n' "$all" | tail -n +2 | sed "s|^$tmp/|    |" | tee -a "$OUT/pull.log" >&2
  fi
  rm -rf "$OUT/files/wp-content"; mv "$main" "$OUT/files/wp-content"
  [ "$NO_UPLOADS" = 1 ] && rm -rf "$OUT/files/wp-content/uploads"
  local n=0 f
  while IFS= read -r f; do mv "$f" "$OUT/db/"; n=$((n + 1)); done < <(find "$tmp" -type f \( -name '*.sql' -o -name '*.sql.gz' \))
  rm -rf "$tmp"
  log "wp-content -> $OUT/files/wp-content; $n dump(s) -> $OUT/db/ (next: pull-site.sh dbs --dump <each>)"
}

# --- dbs: split a multi-database dump ----------------------------------------------------------
plain_dump() { # prints the path of an uncompressed copy
  case $1 in
    *.gz) local p="$OUT/db/$(basename "${1%.gz}")"; [ -f "$p" ] || gzip -dc "$1" > "$p"; printf '%s' "$p" ;;
    *) printf '%s' "$1" ;;
  esac
}
report_db() {
  local f=$1 prefixes siteurl plugins live=no p
  # `|| true`: a database with no WordPress (Moodle) matches nothing, and pipefail would stop here.
  prefixes=$(grep -oE 'CREATE TABLE (IF NOT EXISTS )?`[^`]*options`' "$f" | sed -E 's/.*`(.*)options`/\1/' | sort -u | tr '\n' ' ' || true)
  siteurl=$(grep -oE "'siteurl', ?'[^']*'" "$f" | head -1 | sed -E "s/.*, ?'(.*)'/\1/" || true)
  plugins=$(grep -oE "'active_plugins', ?'[^']*'" "$f" | head -1 || true)
  if [ -n "${SITE_PLUGIN:-}" ] && printf '%s' "$plugins" | grep -q "$SITE_PLUGIN/"; then live=yes; fi
  if [ -n "${SITE_URL:-}" ] && [ -n "$siteurl" ]; then
    # Same host (www or not), not a subdomain: old.<domain> is an old install, not the live one.
    p=${SITE_URL#*://}; p=${p#www.}; p=${p%%/*}
    local h=${siteurl#*://}; h=${h#www.}; h=${h%%/*}
    [ "$h" = "$p" ] && live="$live, url"
  fi
  printf '| %s | %s | %s | %s | %s |\n' "$(basename "$f")" "$(grep -c '^CREATE TABLE' "$f" || true)" "${prefixes:--}" "${siteurl:--}" "$live"
}
split_dbs() {
  [ -n "$DUMP" ] && [ -f "$DUMP" ] || die "dbs needs --dump <file.sql[.gz]>"
  local src; src=$(plain_dump "$DUMP")
  local base; base=$(basename "${src%.sql}")
  local n; n=$(grep -cE '^USE `[^`]+`;' "$src" || true)
  local files=()
  if [ "$n" -le 1 ]; then
    files=("$src")
  else
    log "$n databases in $(basename "$src"): splitting"
    # The prelude (SET … before the first database) goes into each part; CREATE DATABASE and
    # USE are dropped, so each part imports into whatever database the local copy uses.
    awk -v dir="$OUT/db" -v base="$base" '
      /^USE `[^`]+`;/ { name = $0; sub(/^USE `/, "", name); sub(/`;.*/, "", name)
                        out = dir "/" base "--" name ".sql"; printf "%s", prelude > out; next }
      /^CREATE DATABASE/ { next }
      out == "" { prelude = prelude $0 "\n"; next }
      { print > out }' "$src"
    while IFS= read -r f; do files+=("$f"); done < <(ls "$OUT/db/$base--"*.sql)
  fi
  printf '\n| dump | tables | WP prefixes | siteurl | live? (site plugin active, url) |\n|---|---|---|---|---|\n'
  for f in "${files[@]}"; do report_db "$f"; done
  printf '\nThe live one has the site plugin active and the production siteurl. If two match, ask César.\n'
  printf 'The others are old installs on the host: report them, do not delete them.\nNext: pull-site.sh import --dump <live>\n'
}

# --- import into the local copy ----------------------------------------------------------------
wp_cli() {
  if [ "$ENV_KIND" = wp-env ]; then bunx @wordpress/env run cli wp "$@"
  else docker compose --env-file .env.local --profile cli run --rm -T wpcli wp "$@"; fi
}
# The db commands skip the MySQL option files by default; the compose copy needs
# local/mysql-client.cnf (skip-ssl: the MariaDB 11 client demands TLS the local database lacks).
DBF=(); [ "$ENV_KIND" = compose ] && DBF=(--defaults)
import_db() {
  [ -n "$DUMP" ] && [ -f "$DUMP" ] || die "import needs --dump <file.sql[.gz]>"
  need SITE_URL; need LOCAL_URL
  local src; src=$(plain_dump "$DUMP")
  local prefix; prefix=$(grep -oE 'CREATE TABLE (IF NOT EXISTS )?`[^`]*options`' "$src" | head -1 | sed -E 's/.*`(.*)options`/\1/' || true)
  [ -n "$prefix" ] || die "$src has no options table: is it a WordPress database? (pull-site.sh dbs)"
  if [ "$prefix" != "${TABLE_PREFIX:-wp_}" ]; then
    die "the dump's prefix is '$prefix' and TABLE_PREFIX is '${TABLE_PREFIX:-wp_}': set TABLE_PREFIX=$prefix in .env.local (and restart the copy) first"
  fi
  if [ "$NO_BACKUP" = 0 ]; then
    local bk="$OUT/backups/local-$(date +%Y%m%d-%H%M%S).sql"
    log "backing up the local database -> $bk"
    wp_cli db export - "${DBF[@]}" > "$bk" || die "could not back up the local database (is the copy up? bun run local:up). --no-backup to skip"
  fi
  log "importing $(basename "$src")"
  wp_cli db reset --yes "${DBF[@]}"
  if [ "$ENV_KIND" = wp-env ]; then
    need SITE_PLUGIN
    # wp-env mounts only the plugin: the dump goes through its folder and is removed after.
    cp "$src" "wp-content/plugins/$SITE_PLUGIN/.import.sql"
    wp_cli db import "wp-content/plugins/$SITE_PLUGIN/.import.sql"; rm -f "wp-content/plugins/$SITE_PLUGIN/.import.sql"
  else
    wp_cli db import - "${DBF[@]}" < "$src"
  fi
  local from=${SITE_URL%/} to=${LOCAL_URL%/} alt
  case $from in https://*) alt="http://${from#https://}" ;; *) alt="https://${from#http://}" ;; esac
  local sr=(--all-tables --precise --skip-columns=guid --report-changed-only)
  for f in "$from" "$alt"; do
    log "search-replace $f -> $to (plain and JSON-escaped)"
    wp_cli search-replace "$f" "$to" "${sr[@]}"
    wp_cli search-replace "${f//\//\\/}" "${to//\//\\/}" "${sr[@]}"
  done
  wp_cli cache flush || true
  wp_cli rewrite flush || true
  if wp_cli plugin is-active elementor >/dev/null 2>&1; then wp_cli elementor flush-css || true; fi
  local risky
  risky=$(wp_cli plugin list --status=active --field=name 2>/dev/null | grep -Ei 'smtp|mail|sendgrid|brevo|mailgun|cache|rocket|litespeed|autoptimize' || true)
  if [ -n "$risky" ]; then
    log "active email/cache plugins (deactivate the email ones in the copy: bun run local:wp -- plugin deactivate <name>):"
    printf '    %s\n' $risky | tee -a "$OUT/pull.log" >&2
  fi
  log "done: $to"
}

case $MODE in
  ssh) pull_ssh ;;
  ftps) pull_ftps ;;
  archive) pull_archive ;;
  dbs) split_dbs ;;
  import) import_db ;;
  *) sed -n '2,13p' "$0" | sed 's/^# \{0,1\}//'; exit 1 ;;
esac
