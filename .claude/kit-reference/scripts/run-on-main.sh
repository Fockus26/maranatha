#!/usr/bin/env bash
# Runs a command on origin/main's code without leaving your branch.
#
#   bash scripts/run-on-main.sh -- node .qa/repro/finding-3.mjs
#   bash scripts/run-on-main.sh --keep -- bun run test tests/unit/ranking.test.ts
#
# For the FAIL half of a fix's FAIL → PASS (orchestrate §8): the repro has to fail on main and
# pass on the branch. Proving it from the slot meant patching the logic back by hand, and that
# patch could end up in the PR (melao). This creates a temporary, detached worktree of
# origin/main under .qa/, copies into it your .env* files and your .qa/repro/, installs from
# the lockfile (bun's cache: seconds), runs the command there and removes the worktree.
# Nothing in your branch changes. The command's exit code is this script's.
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
dir=".qa/main-$(git rev-parse --short origin/main)-$$"
mkdir -p .qa
git worktree add --detach --quiet "$dir" origin/main
cleanup() {
  if [[ "$keep" == 1 ]]; then echo "= worktree kept: $root/$dir"; else git worktree remove --force "$dir"; fi
}
trap cleanup EXIT

for f in .env*; do [[ -f "$f" ]] && cp "$f" "$dir/"; done
if [[ -d .qa/repro ]]; then mkdir -p "$dir/.qa" && cp -r .qa/repro "$dir/.qa/"; fi
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
