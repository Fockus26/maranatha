# GitHub repo and deployment

Decided at kickoff (`project-kickoff`, Block B) and run by the agent **only if César said
yes in the interview**: creating a repo, changing GitHub settings and connecting Vercel are
outward-facing actions. The interview's answer is the authorization; if it was not asked,
ask before running anything.

Questions (one round, with options):

1. **Do I create the GitHub repo?** No / yes, private / yes, public — on your account or in
   an organization (which)? If the repo already exists: its URL. Recommend **private** for a
   client's site: the local `context/` backup (branch `context-state`) only runs on private
   repos, because the checklist may hold client data.
2. **Do I deploy on Vercel?** No / yes, on your account / yes, on the client's account (they
   create it or invite you). Vercel's Hobby plan is for personal non-commercial use: a
   client's site goes on Pro or on the client's account. If there is a domain: which, and
   who manages its DNS.
3. If not Vercel (VPS, the client's hosting): where, and it stays as a phase 09 unit, following
   `tech/other-hosting.md`.

---

## 1. GitHub

Requirements: `gh auth status` green. If not, César is asked to run `gh auth login` (the
agent never types credentials).

```bash
git add -A && git commit -m "chore: inicializa proyecto con web-agent-kit"   # if there are no commits
gh repo create <owner>/<repo> --private --source . --push                    # or --public
```

Repo settings (they used to be "manual actions for César"; with his yes, the agent does them):

```bash
# Delete the remote branch when the PR is merged
gh api -X PATCH repos/<owner>/<repo> -F delete_branch_on_merge=true

# Let the Changesets Action open the version PR
gh api -X PUT repos/<owner>/<repo>/actions/permissions/workflow \
  -f default_workflow_permissions=read -F can_approve_pull_request_reviews=true

# Protect main (pr mode). On private repos of the free plan it answers 403: see GUIDE §3
gh api -X PUT repos/<owner>/<repo>/branches/main/protection --input - <<'EOF'
{"required_status_checks":{"strict":false,"contexts":["ci"]},"enforce_admins":false,
 "required_pull_request_reviews":{"required_approving_review_count":0},
 "restrictions":null,"allow_force_pushes":false,"allow_deletions":false}
EOF
```

Check each one by reading it back (`gh api repos/<owner>/<repo> -q .delete_branch_on_merge`,
etc.) and leave `context/GIT_STATE.md` in `pr` mode. If protection gives 403, say so and
carry on: the rules in `CLAUDE.md` still forbid pushing to `main`.

Then the first `bun run context:backup` (private repo): from here on the local `context/`
survives losing the folder.

## 2. Hosting

Each host has its own file, and the project names it in `Tech refs`:

- **Vercel** (the default): [`tech/vercel.md`](./tech/vercel.md). Sections §2, §2b, §2c and §2d
  moved there with their numbers, so a citation of `DEPLOY.md` §2c means that file.
- **César's VPS**, through kit-deploy: [`tech/vps-hosting.md`](./tech/vps-hosting.md), only once
  kit-deploy is live (until then, Vercel).
- **Anything else** (the client's hosting): [`tech/other-hosting.md`](./tech/other-hosting.md).
- **WordPress:** its deploy is in [`tech/wordpress.md`](./tech/wordpress.md).

## 3. After the first deployment

- [ ] Production answers 200 on `/`, 404 on an invented route (with the site's screen), and
      `robots.txt` / `sitemap.xml` with the right domain.
- [ ] OG card checked on the deployed URL (`reference/BRAND-ASSETS.md`).
- [ ] Maintenance variables (`MAINTENANCE_MODE`, `MAINTENANCE_UNTIL`) defined as off or
      absent (`reference/STATUS-SCREENS.md`).
- [ ] `PROJECT_CONTEXT.md` › Repo and deployment with: Vercel project, production URL,
      domain and who manages the DNS.
