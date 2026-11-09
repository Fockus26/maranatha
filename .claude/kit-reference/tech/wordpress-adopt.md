# WordPress — starting or adopting a site

Read once per project: when the kit is adopted on a WordPress site, or one is started from
scratch. The day-to-day is in [`wordpress.md`](./wordpress.md). Why it is apart: InspecChile
(cPanel without SSH, snippets, ACF Pro and Elementor Pro, 2026-11-07) was adopted with no
written path, and the agent improvised the order, the access and the checks; other projects
start from scratch on other hosts. Both share the base; only step 4 changes.

```
 1. access  →  2. repo + kit  →  3. local copy  →  4A. migrate snippets   →  5. deploy  →  6. walk-through  →  first deploy
                                                   4B. from scratch
```

---

## 1. Access, by host type

Ask César for it first: everything else depends on it. Record it in
`context/PROJECT_CONTEXT.md` § Stack (the lines at the end of this file).

| Host | Files | Database | Deploy | WP-CLI on the server |
|---|---|---|---|---|
| VPS or managed host with SSH (Kinsta, WP Engine, SiteGround, a cPanel that enables SSH) | `pull-site.sh ssh` (rsync) | `wp db export` over SSH (inside `pull-site.sh ssh`) | `deploy-ssh.yml` | yes |
| cPanel without SSH | `pull-site.sh ftps` (lftp, TLS) | phpMyAdmin → Export → the site's database only, SQL (an action for César) | `deploy-ftps.yml` | no: migrations run on `admin_init` |
| Only wp-admin (no panel, no FTP) | a migration plugin's backup (All-in-One WP Migration, Duplicator, UpdraftPlus) → `pull-site.sh archive` | inside the backup | ask for FTPS or SSH before the first deploy: without them there is no automated deploy | no |

- **Never plain FTP**, not even to bring the site down: the password travels in clear text.
  If the host offers only FTP, it is a finding for César (ask the host for FTPS or SFTP).
- The credentials go in `.env.local` (gitignored, keys in `.env.example`), never in the repo
  or in a message; for the deploy, in GitHub environment secrets (an action for César).
- cPanel's **full backup** (Backup → Download a Full Account Backup) is the `archive` path when
  FTPS is too slow for a big `uploads/`: one file, resumable over FTPS, with every database.

## 2. Repo and kit

In the project's folder (empty, or the repo the site already has):

```powershell
& "<kit>\new-project.ps1" -Path . -Stack wordpress -Client <client>
```

It copies `context/`, `phases/`, the WordPress `CLAUDE.md`, the PR template, the PHP CI, the
compose, `scripts/pull-site.sh` and `php-lint.sh`, `.env.example`, the `.gitignore` lines,
and the plugin skeleton as `wp-content/plugins/<client>-site/` (only if that folder does not
exist). It overwrites nothing. Then copy the deploy workflow that matches the access
(`<kit>/reference/tech/wordpress/deploy-ssh.yml` or `deploy-ftps.yml` to
`.github/workflows/deploy.yml`) and fill its `env:` block.

A site whose code already lives in a plugin of its own: `-Client` with that plugin's slug
prefix, and the skeleton is not copied (the folder exists). Take from the skeleton what the
plugin lacks (`asset_version`, `migrations.php`, the `acf-json` filters).

## 3. Local copy

```bash
cp .env.example .env.local        # fill the access, SITE_URL, versions
bash scripts/pull-site.sh ftps    # or ssh / archive --file <backup>
bash scripts/pull-site.sh import --dump .site-pull/db/<live>.sql
```

What `pull-site.sh` does, by mode:

- **`ssh`**: rsync of `wp-content/` (`--partial`, so a cut transfer resumes) and `wp db
  export` on the server, downloaded and removed there. Then a second rsync in dry-run: if it
  would still transfer something, the download is not complete and it says so.
- **`ftps`**: lftp `mirror --continue` of `wp-content/` with TLS forced and the certificate
  verified; then the same dry-run check (a mirror that would transfer nothing). Interrupted
  (InspecChile's backup transfer stayed partial): run it again, it continues.
- **`archive --file <f>`**: a cPanel full backup (`.tar.gz`), or a `.zip` with `wp-content/`
  and `.sql` files. It tests the archive's integrity before extracting (a truncated download
  fails here, not halfway through the import), and takes `wp-content/` and every `.sql`.
  `.wpress` (All-in-One) is not extracted: restore it with that plugin inside the local copy.
- Without `rsync` or `lftp` installed (Windows), it runs them in a small Alpine container.
- Everything lands in `.site-pull/` (gitignored), with `pull.log`.

**A dump with several databases** (a full phpMyAdmin export or a cPanel backup brought four:
two Moodle and two old WordPress installs with random plugin names, InspecChile):
`bash scripts/pull-site.sh dbs --dump <file>` splits it into one `.sql` per database in
`.site-pull/db/` and prints a table per database: tables, WordPress prefixes, `siteurl`, and
whether the site plugin is in `active_plugins`. **The live one** is the database whose
`siteurl` is the production domain and whose `active_plugins` has the site plugin (or the
plugins César named). If two match, ask. The others are reported to César as old installs on
the host (a finding, not something to delete).

**`import`** (against the compose copy; `--env wp-env` for wp-env):

1. exports the copy's current database to `.site-pull/backups/` (re-importing never loses the
   previous state);
2. resets it and imports the dump. Before touching anything it checks the dump's table prefix
   against `TABLE_PREFIX` in `.env.local`: if they differ it stops and says which to set (then
   `bun run local:down` and `local:up`, so the copy's `wp-config` takes it);
3. `search-replace` of the production URL to the local one, **twice**: plain and
   JSON-escaped (`https:\/\/domain`), because Elementor and block data store it escaped and a
   single pass leaves them pointing at production; with `--all-tables --precise
   --skip-columns=guid`;
4. flushes caches and Elementor's CSS, and lists the active email/SMTP and cache plugins:
   deactivate the email ones in the copy (`wordpress.md` § 6).

Then `bun run local:up` → `http://localhost:8080`. Log in with a production admin user (its
password works locally) or create a local one: `bun run local:wp -- user create dev dev@example.test --role=administrator`.

## 4A. Entry — migrate snippets (an existing site)

**Inventory first, changing nothing** — everything that is code and lives in the database, in
`context/plans/adoption.md` (a table: what, where, moves to, status):

- [ ] Snippet plugins and each active snippet (WPCodeBox, Code Snippets, WPCode, "Insert
      Headers and Footers"): `wp post list --post_type=…` or the plugin's own table.
- [ ] ACF field groups, post types and taxonomies defined in the admin
      (`wp post list --post_type=acf-field-group,acf-post-type,acf-taxonomy`).
- [ ] Custom code in the theme's `functions.php` or an unversioned child theme.
- [ ] Elementor custom code (Custom Code, Custom CSS per page) and its form actions.
- [ ] Premium plugins and their versions (`wp plugin list --fields=name,status,version`): they
      are why the copy is Docker and not wp-env.
- [ ] Cron events of plugins that no longer exist (`wp cron event list`).

**Then, one snippet per commit:** copy its code to `includes/<feature>.php`, deactivate the
snippet in the local copy, test that flow, next. When all are moved: export the ACF groups to
the plugin's `acf-json/` (ACF → Tools → Sync, or saving each group once with the plugin's
`save_json` filter active), the snippet plugin deactivated in the copy, and the full
walk-through (step 6). In production the snippet plugin is deactivated **in the same deploy**
that brings the plugin with the moved code, never before (the site would lose the code) or
after (it would run twice).

## 4B. Entry — from scratch

- wp-env if every plugin is from wordpress.org (`wordpress.md` § 2), the Docker copy if a
  premium plugin is needed (with an empty database: `bun run local:wp -- core install …`).
- The plugin skeleton is the starting point; ACF groups are created in the copy with the
  `save_json` filter active, so they land in `acf-json/` from the first one.
- There is no snippet plugin to install, ever.

## 5. Deploy

The workflow from step 2 with the environments `staging` and `production` and their secrets
(an action for César, step by step in the PR):

- SSH: `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_PATH` (the WordPress root), `DEPLOY_SSH_KEY`,
  `DEPLOY_KNOWN_HOSTS` (the host's line from `ssh-keyscan`, checked once by César: not scanned
  in CI, which would trust whatever answers).
- FTPS: `DEPLOY_HOST` (the server name **on the certificate**: on shared hosts often the
  server's, not the domain's), `DEPLOY_USER`, `DEPLOY_PASSWORD`, `DEPLOY_PATH`.

A first `workflow_dispatch` against staging (or, without staging, to a folder
`<client>-site-check` that is deleted afterwards) proves the credentials before the real
deploy.

## 6. Full walk-through before the first deploy

In the local copy, **with the snippets deactivated**, every flow of the site, as a user, end to
end, with the result recorded in the migration PR ("Verificación": what was walked, what
failed, what was not). Why: InspecChile's migration PR said "no verificado" until César asked,
and the walk-through then found a broken contact form.

- [ ] Every form: send it valid and invalid; the email arrives in Mailpit with the right
      recipient and content.
- [ ] Every page template and post type: open one of each (front and, if it has one, archive).
- [ ] Popups: open, use, close by keyboard, focus returns.
- [ ] Search, menus, language switcher, 404.
- [ ] Logged-in flows the site has (account, shop: cart, checkout with the gateway in test
      mode, order email).
- [ ] wp-admin: the screens the client uses (edit a page with the builder, ACF fields show
      and save).
- [ ] `debug.log` with no new notices or fatals after the walk.

The list goes in the PR as the **smoke list** that is walked again on staging and on
production after the deploy.

## Recorded in the project

`context/PROJECT_CONTEXT.md` § Stack (Spanish `context/`: the same lines under its "Stack"):

```markdown
- **WordPress** <core> · PHP <production's> · page builder: <Elementor Pro x.y | none>
- **Premium plugins:** <ACF Pro x.y, …> (local copy: Docker from the backup | wp-env)
- **Hosting access:** <SSH | FTPS (cPanel, no SSH) | wp-admin only> · panel: <cPanel | …>
- **Deploy:** <deploy-ssh | deploy-ftps> → staging <url | none> → production
- **Site plugin:** `wp-content/plugins/<client>-site` · ACF in its `acf-json/`
```

And in git from the first commit: `.env.example` (keys, no values), the plugin with its
`acf-json/`, the compose or `.wp-env.json`, the deploy workflow.
