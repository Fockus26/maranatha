<?php
/**
 * Example migration, harmless on purpose (it only records when the plugin's migrations first
 * ran). Model the real ones on it. Name: NNN-<what>.php, three digits, never renumbered once
 * deployed.
 *
 * A real one, e.g. fixing an option:
 *   $now = get_option( 'some_option' );
 *   if ( $now === $wanted ) { return; }         // idempotent
 *   $remember( 'option:some_option', $now );    // before writing
 *   update_option( 'some_option', $wanted );
 */

defined( 'ABSPATH' ) || exit;

return static function ( callable $remember ) {
	if ( false !== get_option( 'acme_site_first_migration_at' ) ) {
		return;
	}
	$remember( 'option:acme_site_first_migration_at', false );
	add_option( 'acme_site_first_migration_at', gmdate( 'c' ), '', false );
};
