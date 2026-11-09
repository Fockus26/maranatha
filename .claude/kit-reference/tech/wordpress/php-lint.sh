#!/usr/bin/env bash
# php-lint.sh — `php -l` on every PHP file of the project's own code (web-agent-kit,
# reference/tech/wordpress.md §4). With PHP_VERSIONS="7.4 8.3" it lints on each one in Docker:
# the oldest PHP a host may run and the newest it offers (§6).
#
#   bash scripts/php-lint.sh                 # wp-content/plugins and wp-content/themes of the repo
#   bash scripts/php-lint.sh <dir|file>...
set -euo pipefail

paths=("$@")
[ ${#paths[@]} -gt 0 ] || for d in wp-content/plugins wp-content/themes; do [ -d "$d" ] && paths+=("$d"); done
[ ${#paths[@]} -gt 0 ] || { echo "php-lint: nothing to lint" >&2; exit 0; }

mapfile -t files < <(find "${paths[@]}" -name '*.php' -not -path '*/vendor/*' -not -path '*/node_modules/*' | sort)
[ ${#files[@]} -gt 0 ] || { echo "php-lint: no PHP files" >&2; exit 0; }

lint_with() { # <command prefix...>: lints every file, prints only failures
  local failed=0 f out
  for f in "${files[@]}"; do
    out=$("$@" php -l "$f" 2>&1) || { printf '%s\n' "$out" >&2; failed=1; }
  done
  return $failed
}

status=0
if [ -n "${PHP_VERSIONS:-}" ] || ! command -v php >/dev/null 2>&1; then
  host=$PWD; command -v cygpath >/dev/null 2>&1 && host=$(cygpath -w "$PWD")
  for v in ${PHP_VERSIONS:-8.2}; do
    echo "php-lint: PHP $v (Docker), ${#files[@]} files" >&2
    # One container per version, not per file.
    MSYS_NO_PATHCONV=1 docker run --rm -i -v "$host:/app" -w /app "php:$v-cli" sh -c '
      failed=0
      while IFS= read -r f; do out=$(php -l "$f" 2>&1) || { echo "$out"; failed=1; }; done
      exit $failed' < <(printf '%s\n' "${files[@]}") || status=1
  done
else
  echo "php-lint: $(php -r 'echo PHP_VERSION;'), ${#files[@]} files" >&2
  lint_with || status=1
fi
[ $status = 0 ] && echo "php-lint: OK" >&2
exit $status
