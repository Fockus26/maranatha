#!/usr/bin/env bash
# Runs a command on origin/main's code without leaving your branch.
#
#   bash scripts/run-on-main.sh -- node .qa/repro/finding-3.mjs
#   bash scripts/run-on-main.sh --keep -- bun run test tests/unit/ranking.test.ts
#
# For the FAIL half of a fix's FAIL → PASS (orchestrate §8): the repro has to fail on main and
# pass on the branch. Proving it from the slot meant patching the logic back by hand, and that
# patch could end up in the PR (melao). This creates a temporary, detached worktree of
# origin/main in the system's temp folder, copies into it your .env* files, your .qa/ scripts
# (its files and .qa/repro/) and the scripts/qa/ files main does not have yet, installs from
# the lockfile (bun's cache: seconds), runs the command there and removes the worktree.
# Nothing in your branch changes. The command's exit code is this script's.
#
# Outside the slot, and removed with a limit: under .qa/ a failed removal left .qa/main-*
# inside the slot, where Vitest collected its tests as duplicates, and on Windows `git
# worktree remove --force` took more than 30 min with node_modules and .next locked by a
# process still alive (workout ×4).
#
# A repro that needs a server: start it inside the command, on a port that is not your slot's
# (e.g. -- bash -c 'bun run qa:local -- --port 4399 > .qa/dev.log 2>&1 & … node .qa/repro/x.mjs').
# --keep leaves the worktree (its path is printed) to look at it; remove it with
# `git worktree remove --force <path>`.
set -euo pipefail

keep=0
while [[ $# -gt 0 && "$1" != "--" ]]; do
  case "$1" in
    --keep) keep=1 ;;
    *) echo "Unknown option: $1 (the command goes after --)" >&2; exit 2 ;;
  esac
  shift
done
[[ "${1:-}" == "--" ]] && shift
[[ $# -gt 0 ]] || { echo "Usage: bash scripts/run-on-main.sh [--keep] -- <command…>" >&2; exit 2; }

root="$(git rev-parse --show-toplevel)"
cd "$root"
git fetch origin main --quiet
dir="${TMPDIR:-/tmp}/main-$(basename "$root")-$(git rev-parse --short origin/main)-$$"
git worktree add --detach --quiet "$dir" origin/main
cleanup() {
  if [[ "$keep" == 1 ]]; then echo "= worktree kept: $dir"; return; fi
  cd "$root"
  timeout 60 git worktree remove --force "$dir" >/dev/null 2>&1 && return
  # Something still holds files there (a server the command left running). Delete what can
  # be deleted, drop git's record of it, and say what is left instead of waiting.
  timeout 120 rm -rf "$dir" >/dev/null 2>&1 || true
  git worktree prune
  if [[ -e "$dir" ]]; then
    echo "! could not remove $dir (a process still uses it: stop it, then rm -rf that folder)" >&2
  fi
}
trap cleanup EXIT

for f in .env*; do [[ -f "$f" ]] && cp "$f" "$dir/"; done
# Your .qa/ scripts (not its logs or reports) and .qa/repro/. scripts/qa/: only the files
# main does not have (-n), so a helper that exists on main runs as main has it.
mkdir -p "$dir/.qa"
for f in .qa/*.sh .qa/*.mjs .qa/*.js .qa/*.ts .qa/*.json; do [[ -f "$f" ]] && cp "$f" "$dir/.qa/"; done
if [[ -d .qa/repro ]]; then cp -r .qa/repro "$dir/.qa/"; fi
if [[ -d scripts/qa ]]; then mkdir -p "$dir/scripts" && cp -rn scripts/qa "$dir/scripts/"; fi
if [[ -f package.json ]]; then
  (cd "$dir" && bun install --frozen-lockfile >/dev/null) || { echo "bun install failed in $dir" >&2; exit 1; }
fi

echo "… on origin/main @ $(git rev-parse --short origin/main): $*"
set +e
(cd "$dir" && "$@")
code=$?
set -e
echo "= exit $code on main"
exit "$code"
