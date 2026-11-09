#!/usr/bin/env bash
# Publishes a PR's screenshots to the repo's `pr-shots` branch, prints the markdown to paste
# into the "Capturas" section of the PR body (`gh pr edit --body-file`) and also leaves it
# in <folder>/README.md.
#
# Usage:  bash scripts/publish-pr-shots.sh [folder] [target-subfolder]
#         folder            default .pr-shots
#         target-subfolder  default the current branch name (feat/x → feat-x)
#
# Why a separate branch: the images do not enter `main`'s history (the PR is squash-merged
# without them) and GitHub shows them in the PR with a stable URL (the commit is linked, not
# the branch). On private repos only people with access see them.
#
# It creates no local branches and does not touch the working branch or the working tree:
# it builds the commit in a temporary worktree and pushes only `pr-shots`. Deleting that
# branch when it gets heavy is the owner's call (`git push origin --delete pr-shots`), never
# the agent's. The commit carries a vercel.json with deployments disabled, so pushing this
# branch does not trigger a (failing) Vercel deploy.
set -euo pipefail

SRC="${1:-.pr-shots}"
DEST="${2:-$(git branch --show-current | tr '/' '-')}"
BRANCH="pr-shots"
REPO="${PR_SHOTS_REPO:-$(gh repo view --json nameWithOwner -q .nameWithOwner)}"

shopt -s nullglob
files=("$SRC"/*.png)
if [ ${#files[@]} -eq 0 ]; then
  echo "No PNG files in $SRC" >&2
  exit 1
fi

# The temporary worktree goes inside .git, not in mktemp's /tmp: with MSYS_NO_PATHCONV=1,
# Windows git could not resolve /tmp (melao).
TMP="$(git rev-parse --path-format=absolute --git-common-dir)/pr-shots-tmp.$$"
cleanup() { git worktree remove --force "$TMP" >/dev/null 2>&1 || true; }
trap cleanup EXIT

# Two units publishing at once collided on the branch (melao): the push is retried on top of
# the other one's commit (each unit writes only its own subfolder, so nothing is lost).
COMMIT=""
for attempt in 1 2 3 4 5; do
  PARENT=""
  if git ls-remote --exit-code --heads origin "$BRANCH" >/dev/null 2>&1; then
    git fetch -q origin "$BRANCH"
    PARENT="$(git rev-parse FETCH_HEAD)"
  fi
  cleanup
  if [ -n "$PARENT" ]; then
    git worktree add -q --detach "$TMP" "$PARENT"
  else
    # First time: an orphan commit (no history), starting from an empty tree.
    git worktree add -q --detach "$TMP" HEAD
    git -C "$TMP" rm -rq --cached --ignore-unmatch . >/dev/null
  fi

  mkdir -p "$TMP/$DEST"
  cp "${files[@]}" "$TMP/$DEST/"
  printf '{ "git": { "deploymentEnabled": false } }\n' > "$TMP/vercel.json"
  git -C "$TMP" add -f "$DEST" vercel.json
  TREE="$(git -C "$TMP" write-tree)"
  if [ -n "$PARENT" ]; then
    COMMIT="$(git -C "$TMP" commit-tree "$TREE" -p "$PARENT" -m "capturas: $DEST")"
  else
    COMMIT="$(git -C "$TMP" commit-tree "$TREE" -m "capturas: $DEST")"
  fi
  if git push -q origin "$COMMIT:refs/heads/$BRANCH" 2>/dev/null; then break; fi
  [ "$attempt" = 5 ] && { echo "Could not push $BRANCH after 5 attempts" >&2; exit 1; }
  echo "… $BRANCH moved (another publish?); retrying on top of it ($attempt/5)" >&2
  sleep $((attempt * 2))
done

# The markdown also goes to $SRC/README.md: with many screenshots, a `tail` on the output
# cut it off and the PR was left with half.
{
  echo "<!-- Capturas en $BRANCH@${COMMIT:0:7} -->"
  for f in "${files[@]}"; do
    name="$(basename "$f" .png)"
    echo "**$name**"
    echo ""
    echo "![$name](https://github.com/$REPO/blob/$COMMIT/$DEST/$(basename "$f")?raw=true)"
    echo ""
  done
} | tee "$SRC/README.md"
echo "→ markdown in $SRC/README.md" >&2
