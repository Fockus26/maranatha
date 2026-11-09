#!/usr/bin/env bash
# Backs up the LOCAL working state of context/ (the gitignored files: CURRENT_PHASE,
# CONTENT_CHECKLIST, KIT_FEEDBACK, PHASE_LOG/, plans/, inventories) to the orphan branch
# `context-state`, and restores it.
#
# Usage:  bash scripts/context-backup.sh             (= bun run context:backup)
#         bash scripts/context-backup.sh --restore   (= bun run context:restore)
#
# Why: those files are local on purpose (parallel workers would collide on them in every
# PR), but they are the only record of which phase and wave the project is in, what client
# content is still missing and what the plans are. Losing the local folder meant a new
# session started blind. The fixed documents of context/ (PROJECT_CONTEXT, DESIGN_RULES,
# COLORS, decisions/…) are not backed up here: they belong in git, on main.
#
# How: like publish-pr-shots.sh, it builds the commit in a temporary worktree and pushes only
# `context-state`. It never touches the working branch, the working tree or main. A commit is
# only made when something changed.
#
# --restore copies from `context-state` only the files that do NOT exist locally. It never
# overwrites: if a local file differs from the backup, it lists it and leaves it alone.
#
# The branch has the same visibility as the repo, and CONTENT_CHECKLIST may hold client
# data: on a PUBLIC repo it refuses (CONTEXT_BACKUP_PUBLIC=1 to force it, only with César's OK).
set -euo pipefail

BRANCH="context-state"
MODE="${1:-backup}"

if ! git remote get-url origin >/dev/null 2>&1; then
  echo "No 'origin' remote: there is nowhere to back up to. Keep a copy of context/ elsewhere." >&2
  exit 1
fi

if [ "$MODE" = "--restore" ]; then
  if ! git ls-remote --exit-code --heads origin "$BRANCH" >/dev/null 2>&1; then
    echo "There is no $BRANCH branch on origin: nothing to restore." >&2
    exit 1
  fi
  git fetch -q origin "$BRANCH"
  restored=0; kept=0
  while IFS= read -r f; do
    case "$f" in context/*) ;; *) continue ;; esac
    if [ -e "$f" ]; then
      if ! git show "FETCH_HEAD:$f" | cmp -s - "$f"; then
        echo "  = $f exists and differs from the backup: left as is"
        kept=$((kept + 1))
      fi
      continue
    fi
    mkdir -p "$(dirname "$f")"
    git show "FETCH_HEAD:$f" > "$f"
    echo "  + $f"
    restored=$((restored + 1))
  done < <(git ls-tree -r --name-only FETCH_HEAD)
  echo "Restored $restored file(s) from $BRANCH@$(git rev-parse --short FETCH_HEAD); $kept local file(s) kept."
  exit 0
fi

if [ "$MODE" != "backup" ]; then
  echo "Usage: bash scripts/context-backup.sh [--restore]" >&2
  exit 2
fi

if [ "${CONTEXT_BACKUP_PUBLIC:-}" != "1" ] && command -v gh >/dev/null 2>&1; then
  visibility="$(gh repo view --json visibility -q .visibility 2>/dev/null || echo unknown)"
  if [ "$visibility" = "PUBLIC" ]; then
    echo "The repo is public: context-state would expose CONTENT_CHECKLIST and the plans." >&2
    echo "Make the repo private, or set CONTEXT_BACKUP_PUBLIC=1 if César agrees." >&2
    exit 1
  fi
fi

# The local files of context/: the ones git ignores (the tracked ones are already in git).
mapfile -t files < <(git ls-files --others --ignored --exclude-standard -- context/)
if [ ${#files[@]} -eq 0 ]; then
  echo "No local (gitignored) files in context/: nothing to back up."
  exit 0
fi

TMP="$(mktemp -d)"
cleanup() { git worktree remove --force "$TMP" >/dev/null 2>&1 || true; }
trap cleanup EXIT

PARENT=""
if git ls-remote --exit-code --heads origin "$BRANCH" >/dev/null 2>&1; then
  git fetch -q origin "$BRANCH"
  PARENT="$(git rev-parse FETCH_HEAD)"
  git worktree add -q --detach "$TMP" "$PARENT"
  # The backup is a snapshot: files deleted locally disappear from it too.
  git -C "$TMP" rm -rq --cached --ignore-unmatch context >/dev/null
else
  git worktree add -q --detach "$TMP" HEAD
  git -C "$TMP" rm -rq --cached . >/dev/null
fi
# Only the local files go in: the checkout may carry the tracked ones (decisions/…).
rm -rf "$TMP/context"

for f in "${files[@]}"; do
  mkdir -p "$TMP/$(dirname "$f")"
  cp "$f" "$TMP/$f"
done
# Without this, Vercel tries to deploy every push to this branch (it has no app) and fails.
printf '{ "git": { "deploymentEnabled": false } }\n' > "$TMP/vercel.json"
git -C "$TMP" add -f context vercel.json
TREE="$(git -C "$TMP" write-tree)"

if [ -n "$PARENT" ] && [ "$TREE" = "$(git rev-parse "$PARENT^{tree}")" ]; then
  echo "context/ unchanged since the last backup ($BRANCH@${PARENT:0:7})."
  exit 0
fi

MSG="context: $(date +%F) from $(git branch --show-current || echo detached)"
if [ -n "$PARENT" ]; then
  COMMIT="$(git -C "$TMP" commit-tree "$TREE" -p "$PARENT" -m "$MSG")"
else
  COMMIT="$(git -C "$TMP" commit-tree "$TREE" -m "$MSG")"
fi
git push -q origin "$COMMIT:refs/heads/$BRANCH"
echo "Backed up ${#files[@]} file(s) of context/ to $BRANCH@${COMMIT:0:7}."
