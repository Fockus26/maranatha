#!/usr/bin/env bash
# SessionStart hook (.claude/settings.json): prepares a Claude Code CLOUD session.
# On César's machine it does nothing (CLAUDE_CODE_REMOTE is only "true" in the cloud).
#
# Why: a cloud session starts in a fresh container with only the repo cloned. Without
# node_modules nothing builds, and without the gitignored files of context/ (CURRENT_PHASE,
# plans/, CONTENT_CHECKLIST…) the agent starts blind about the phase and the wave. This
# brings both back before the first prompt. It never fails the session: whatever it cannot
# do, it prints, and the cloud-session skill picks it up.
set -uo pipefail

[ "${CLAUDE_CODE_REMOTE:-}" = "true" ] || exit 0
cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0

if command -v bun >/dev/null 2>&1; then
  if [ ! -d node_modules ]; then
    if bun install --frozen-lockfile >/dev/null 2>&1 || bun install >/dev/null 2>&1; then
      echo "cloud-setup: bun install ok"
    else
      echo "cloud-setup: bun install FAILED - run it by hand"
    fi
  fi
else
  echo "cloud-setup: bun is not installed in this environment - add it to the environment's setup script"
fi

if [ ! -e context/CURRENT_PHASE.md ] && [ -f scripts/context-backup.sh ]; then
  bash scripts/context-backup.sh --restore 2>&1 | tail -1 | sed 's/^/cloud-setup: /'
fi
# Environment variables from Vercel (the source, reference/tech/vercel.md §2c) without pasting them
# into the chat: César stores VERCEL_TOKEN (a secret), VERCEL_ORG_ID and VERCEL_PROJECT_ID
# in the cloud environment's settings and allows api.vercel.com in its network access. The
# pull writes the Development environment to VERCEL_ENV_FILE (default .env.local; a monorepo
# whose Next app lives in web/ uses web/.env.local). Never prints a value.
if [ -n "${VERCEL_TOKEN:-}" ] && [ -n "${VERCEL_PROJECT_ID:-}" ] && [ -n "${VERCEL_ORG_ID:-}" ]; then
  env_file="${VERCEL_ENV_FILE:-.env.local}"
  if [ -e "$env_file" ]; then
    echo "cloud-setup: $env_file already exists, left as is"
  elif bunx vercel@latest env pull "$env_file" --yes --environment=development \
      --token="$VERCEL_TOKEN" >/dev/null 2>&1; then
    echo "cloud-setup: env pull ok -> $env_file ($(grep -cE '^[A-Z0-9_]+=' "$env_file") variables)"
  else
    echo "cloud-setup: env pull FAILED - check VERCEL_TOKEN and that api.vercel.com is allowed in the environment's network access"
  fi
else
  echo "cloud-setup: no VERCEL_TOKEN/VERCEL_ORG_ID/VERCEL_PROJECT_ID - no .env pulled (see the cloud-session skill)"
fi
exit 0
