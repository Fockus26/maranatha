# Stack — WordPress

For projects whose site **is** a WordPress: the client already has one, or needs to edit
content in the WordPress admin, or WooCommerce is the shop. The kit's default stack is still
Next.js (`STACK-NEXTJS.md`); WordPress is chosen at kickoff (question 13, `project-kickoff`)
and recorded in `PROJECT_CONTEXT.md` § Stack and a decision.

Why this file: César used to write WordPress code with snippet plugins (WPCodeBox 2: code
stored in the database, edited in the admin). An agent cannot review, version, test or roll
back what lives in a production database. The flow below moves all the code into a plugin in
git, runs a local copy of the site, and ships by SSH or FTPS, so Claude Code edits, tests with
Playwright and deploys it like any other project (César, 2026-10-29; made the official flow
after InspecChile, 2026-11-07).

**Starting or adopting a site** (bringing it down, the two entries, the adoption checklist,
the first deploy): [`wordpress-adopt.md`](./wordpress-adopt.md). This file is the day-to-day.
The templates (scripts, compose, workflows, plugin skeleton) are in
[`wordpress/`](./wordpress/); `new-project.ps1 -Stack wordpress` copies them.

---

## The shape

```
 production ──(pull-site: SSH / FTPS / backup archive)──► .site-pull/ (gitignored)
                                                              │
 local copy: docker compose (sites with premium plugins) or wp-env (sites without them)
                                                              │  the repo's plugin is mounted into it
 repo (git): wp-content/plugins/<client>-site/  ◄── Claude Code edits, WP-CLI, Playwright
             wp-content/themes/<client>-child/   (only if there is one)
             docker-compose.yml | .wp-env.json · scripts/ · tests/ · .env.example
                 │
                 └──► PR → merge → deploy (SSH, else FTPS) to staging → César checks → production
```

**Only code goes into git**: the site plugin, the child theme, the environment config and
the scripts. Never WordPress core, third-party plugins (they are listed with their versions),
the uploads or a database dump (it carries customers' personal data: orders, users, form
entries).

## 1. Where the code lives

- **`<client>-site` plugin**: **all** the code the site needs (custom post types, ACF field
  groups, shortcodes, hooks, Elementor widgets and form actions, WooCommerce tweaks,
  integrations, REST endpoints). One file per feature in `includes/`, loaded from the main
  file. A plugin and not `functions.php` because it survives a theme change. Skeleton:
  [`wordpress/plugin/`](./wordpress/plugin/) (asset versions by `filemtime()`, migrations by
  version).
- **Snippet plugins are retired** (WPCodeBox, Code Snippets, WPCode…), with no exception for
  one-offs: every snippet moves to the plugin once and the snippet plugin is deactivated, then
  removed. Why: a "one-off" snippet is code the agent does not see; in InspecChile the
  snippets were the bugs the local copy did not reproduce (César, 2026-11-07). How to move
  them: `wordpress-adopt.md` § Entry A.
- **ACF field groups and post types in `acf-json/` inside the plugin** (the plugin sets
  `acf/settings/save_json` and `load_json` to its folder): they are code that ACF keeps in
  the database by default, and without the JSON a field change cannot be reviewed or deployed.
- **Child theme** (`<client>-child`): only presentation, if the site uses a classic or block
  theme. In a block theme, the design tokens go to `theme.json` (colors, type scale with
  fluid sizes, spacing), which is this stack's `DESIGN_TOKENS`.
- A page builder (Elementor, Bricks…) stays the content and layout tool if the site uses
  one; the agent does not generate builder JSON, it adds widgets, styles and logic through
  the plugin.

## 2. Local copy

Two environments, by what the site needs. Both run on Docker, which the kit already requires.

| The site… | Environment | Why |
|---|---|---|
| has premium plugins (ACF Pro, Elementor Pro…) or needs its real data | **Docker copy from the backup**: [`wordpress/docker-compose.yml`](./wordpress/docker-compose.yml) + `pull-site` | wp-env cannot install premium plugins it cannot download, and a site without its data and plugins hides the bugs. In InspecChile it was the only useful environment |
| starts from scratch or uses only wordpress.org plugins | **wp-env** (`.wp-env.json`) | Scriptable, one command, separate tests instance |

**Docker copy** (`docker compose --env-file .env.local …`; the `package.json` scripts
`local:up`, `local:down`, `local:wp`): WordPress at the production versions, MariaDB,
**Mailpit** (every email the copy sends lands at `http://localhost:8025`, never at a real
customer), phpMyAdmin with `--profile tools`. The `wp-content` of the backup
(`.site-pull/files/wp-content`) is mounted, and the repo's plugin on top of its copy, so an
edit in the repo is live. Building it: `wordpress-adopt.md` § 3. WP-CLI's `db` commands
there take `--defaults` (`bun run local:wp -- db export - --defaults`): they skip the option
files by default, and without `local/mysql-client.cnf` the MariaDB 11 client of the CLI image
demands TLS the local database does not have ("SSL is required"; found testing the kit).

**wp-env:**

```json
// .wp-env.json
{
  "core": "https://wordpress.org/wordpress-6.8.3.zip",
  "phpVersion": "8.2",
  "plugins": [
    "./wp-content/plugins/<client>-site",
    "https://downloads.wordpress.org/plugin/woocommerce.9.8.5.zip"
  ],
  "themes": ["./wp-content/themes/<client>-child"],
  "port": 8888,
  "config": { "WP_DEBUG": true, "WP_DEBUG_LOG": true, "SCRIPT_DEBUG": true }
}
```

- `bunx @wordpress/env start` → `http://localhost:8888` (user `admin` / `password`, local
  only). `--update` after changing the config. WP-CLI:
  `bunx @wordpress/env run cli wp <command>`.

**In both — versions pinned:** core, PHP and every plugin at production's versions
(`wp core version`, `wp plugin list --fields=name,version`, the host's PHP). In wp-env a
plugin is pinned with the versioned zip (`downloads.wordpress.org/plugin/<slug>.<version>.zip`),
never the bare slug (it installs the latest). In the Docker copy the plugins come from the
backup, so they are production's; the image tag pins core and PHP (`WP_IMAGE_TAG`). Why: a
copy on other versions hides the bugs that matter, and ACF and Elementor change their markup
and hooks between versions (InspecChile had no rule for it and the agent had to decide).

## 3. Production's data

Once at adoption (`wordpress-adopt.md`), and again only when a task needs recent content:
`bash scripts/pull-site.sh <ssh|ftps|archive> …` then `pull-site.sh import`.

- **Personal data:** `.site-pull/` and every dump stay outside the repo (`.gitignore`:
  `.site-pull/`, `*.sql`, `*.sql.gz`, `*.wpress`) and are deleted when the project ends. For
  QA, anonymize users and orders (`wp user update`, or a `bin/anonymize.sh`) before an agent
  walks the flows.
- **Uploads**: only if the task needs them (`--no-uploads` skips them; they weigh
  gigabytes). Without them images 404 locally, and that is acceptable.

**Content changes the code needs** (a page, an option, a menu, a data fix) are **migrations
in the plugin**, not clicks in the local admin: the database is not in git, so a click is
lost and cannot be repeated on staging or production. A migration is a file
`migrations/NNN-<what>.php`; the plugin runs the pending ones in order, records the values it
replaced and the last number in `<client>_site_db_version` (skeleton:
[`wordpress/plugin/includes/migrations.php`](./wordpress/plugin/includes/migrations.php)).

- **With SSH:** the deploy runs `wp <client>-site migrate` after uploading.
- **Without SSH** (FTPS): they run by themselves on the first wp-admin visit of an
  administrator after the deploy (`admin_init`), with a notice that says what ran. César
  opens wp-admin after each deploy; it is in the PR's "Acciones manuales". Why not the
  activation hook: **it does not fire when a deploy replaces the plugin's files**, so
  InspecChile's data fix needed a deactivate/activate by hand.
- Each migration is idempotent (it checks before it writes) and calls `$remember()` with what
  it replaces: undoing one is reading `<client>_site_migration_<NNN>` and writing it back.
- A failed migration stops there, does not advance the version, and shows its error in the
  notice; it is retried on the next visit after the fix is deployed.

## 4. How the kit's rules translate

The skills are written for Next.js; this table is what changes for WordPress. The skills have
no WordPress sections on purpose (`tech/README.md`).

| Kit piece | In WordPress |
|---|---|
| `frontend-build` | The unit is a template part, a block, a builder widget or the plugin's CSS/JS. Styles in SCSS compiled by the project's `build:css`, and **the compiled CSS is committed** (the host has no build step, and FTPS uploads what is in git): CI fails if the compiled file differs from the source. Assets enqueued with `wp_enqueue_*` and the version from `<client>_site_asset_version()` (`filemtime()`), never the plugin's fixed version: browsers that came back kept the old JS after a deploy (InspecChile). No inline `<script>` in templates: `wp_add_inline_script` or a file |
| `backend-build` §2 security | Nonce on every form and AJAX/REST call (`wp_nonce_field` / `check_admin_referer`, `permission_callback` on REST routes); capability check (`current_user_can`) before every action; **sanitize on input** (`sanitize_text_field`, `absint`…) and **escape on output** (`esc_html`, `esc_attr`, `esc_url`, `wp_kses_post`); `$wpdb->prepare` for every query with a variable |
| `backend-build` data | ACF fields and post types in `acf-json/` (§1). Data changes are migrations (§3), never `bin/` scripts that need SSH the host may not give |
| `QA-PREVENTION.md` | Same classes: `trim` → `sanitize_text_field` + an empty check after it; double submit → the button disabled + a nonce that is single-use or a server-side duplicate check |
| `PATTERNS.md` | The behaviours (validation modes, list states, auth criteria) apply; the registry's TS code does not, unless the plugin ships a JS build |
| `a11y` | axe-core and Playwright work on any HTML: the theme and every builder widget are checked. **Page builders**: what the plugin can fix is fixed there (a dialog's role, returning focus, `autocomplete` on form fields, labels), with a hook or a small script; what is the builder's own markup with no hook goes to the PR as a known limitation with its WCAG criterion; what is content (alt text, heading order, link text) goes to `CONTENT_CHECKLIST.md` for whoever edits it. Elementor popups declare `aria-modal` without `role="dialog"` and do not return focus, and its forms have no `autocomplete`: axe flagged only part of it (InspecChile) — check them by keyboard |
| `seo` | Through the SEO plugin the site uses (Yoast, Rank Math): titles, OG, schema and sitemap are its settings; the skill's checks still apply to the output. The plugin only adds what the SEO plugin cannot (a JSON-LD type it lacks), through its filters |
| `git-flow` | Unchanged (`pr` mode fitted WordPress as is). No Changesets: the plugin's `Version:` header and its constant are bumped in the PR that ships a release |
| QA agents | `functional-qa` and `design-qa` run against the local copy (`http://localhost:8080`, or 8888 with wp-env) or staging, with Playwright, as for Next. `qa:local` does not apply |
| Lint | `bun run lint:php` (`php -l` on every PHP file, with Docker if PHP is not installed) always; PHPCS with WordPress Coding Standards if the project installs it (`composer`) |
| CI | [`wordpress/ci.yml`](./wordpress/ci.yml): `php -l` in a matrix of PHP versions and the compiled-CSS check. Not the kit's bun CI |

## 5. Shipping

- **Never edit production directly** (neither files nor snippets): what is not in git
  cannot be rolled back.
- **SSH first, FTPS if the host gives no SSH, never plain FTP** (the password and the code
  travel in clear text). Both are a GitHub Action, so a merge deploys with nobody uploading by
  hand (César, 2026-11-07): [`wordpress/deploy-ssh.yml`](./wordpress/deploy-ssh.yml) (rsync,
  then `wp <client>-site migrate`) or [`wordpress/deploy-ftps.yml`](./wordpress/deploy-ftps.yml)
  (lftp with TLS forced and the certificate verified; uploads to `<folder>.new` and swaps by
  rename, so a request never meets a half-uploaded plugin). The host's credentials are GitHub
  environment secrets (an action for César); the `production` environment has César as a
  required reviewer.
- Staging first: the host's staging or a `staging.<domain>` copy, on each merge to `main`.
  Production is the same workflow run by hand (`workflow_dispatch`, target `production`)
  after César checks staging.
- Before production: a backup from the host's panel (an action for César) — WordPress
  updates and deploys are the usual way a site breaks.
- After a deploy without SSH: César opens wp-admin (pending migrations run, §3) and the PR's
  smoke list is walked on the real site.

## 6. Traps

Each with the incident that found it.

**PHP versions.** The plugin's `Requires PHP` is the oldest PHP of any host it may run on, and
CI lints it on that version and on the newest the host offers: shared hosts move PHP under
you, and syntax from a newer PHP is a fatal error on the old one. Avoid on the oldest
version: typed properties (< 7.4), `match`, named arguments, nullsafe `?->` (< 8.0), enums,
`readonly` (< 8.1). Production's PHP goes in `PROJECT_CONTEXT.md` § Stack, next to the access
type.

**Shared hosting (cPanel without support).**
- Changing the PHP version in MultiPHP can drop extensions (`zip` disappeared and could not be
  re-enabled): never depend on `ZipArchive`; WordPress brings PclZip (`unzip_file()` falls back
  to it).
- `uploads/` can end up owned by root after a host operation, and the upload fails with a bare
  "critical error". Check `wp_upload_dir()['error']` and `wp_is_writable()` before writing, and
  show a real message. Fix without support: rename the root-owned folder, create a new one
  from FTPS, copy the contents in (InspecChile, issues 11 and 12).
- An old host often keeps other installs (old WordPress copies, Moodle) next to the live
  site: `pull-site` lists them; the agent says so and does not touch them.

**Elementor.**
- Popups are **cloned** when shown: `data-*` marks and listeners bound to the original
  element are not on the clone. Bind with delegation from `document` (or Elementor's
  `elementor/popup/show` event), never to the popup's nodes at load.
- The form's submit handler ignores a `preventDefault()` that bubbles from your listener:
  validation in JS does not stop the send. Server-side validation goes in a form action with
  `$ajax_handler->add_error( $field_id, $message )` (and `add_error_message`), which is what
  stops it and shows the error by the field.
- After a search-replace of URLs, regenerate its CSS (`wp elementor flush-css`): the files
  keep the old domain.

**Email in the local copy.** A production database brings its SMTP plugin with real
credentials; an API mailer (WP Mail SMTP with Brevo, SendGrid…) does not go through PHPMailer,
so Mailpit does not catch it. Deactivate email plugins in the copy right after the import
(`pull-site.sh import` lists the active ones).
