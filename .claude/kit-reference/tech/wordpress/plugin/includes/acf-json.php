<?php
/**
 * ACF field groups, post types and taxonomies are saved to and loaded from this plugin's
 * acf-json/, so they are reviewed and deployed with the code instead of living only in the
 * database. Inert if ACF is not active.
 */

defined( 'ABSPATH' ) || exit;

add_filter(
	'acf/settings/save_json',
	static function () {
		return ACME_SITE_DIR . 'acf-json';
	}
);

add_filter(
	'acf/settings/load_json',
	static function ( $paths ) {
		$paths[] = ACME_SITE_DIR . 'acf-json';
		return $paths;
	}
);
