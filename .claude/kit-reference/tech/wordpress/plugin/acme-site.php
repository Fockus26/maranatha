<?php
/**
 * Plugin Name: Acme Site
 * Description: All of the site's code (web-agent-kit). Code lives here, in git, never in snippets.
 * Version:     0.1.0
 * Requires PHP: 7.4
 * Text Domain: acme-site
 *
 * new-project.ps1 -Stack wordpress -Client <client> renames "acme" in this folder. By hand:
 * folder and file `<client>-site`, functions `<client>_site_`, constants `<CLIENT>_SITE_`.
 */

defined( 'ABSPATH' ) || exit;

define( 'ACME_SITE_VERSION', '0.1.0' );
define( 'ACME_SITE_FILE', __FILE__ );
define( 'ACME_SITE_DIR', plugin_dir_path( __FILE__ ) );
define( 'ACME_SITE_URL', plugin_dir_url( __FILE__ ) );

// One file per feature. Listed by hand, not globbed: the order is explicit and a stray file
// left on the server by a deploy is never loaded.
require_once ACME_SITE_DIR . 'includes/assets.php';
require_once ACME_SITE_DIR . 'includes/acf-json.php';
require_once ACME_SITE_DIR . 'includes/migrations.php';
