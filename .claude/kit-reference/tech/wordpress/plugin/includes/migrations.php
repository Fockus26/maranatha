<?php
/**
 * Data migrations by version: migrations/NNN-<what>.php, run once each, in order.
 *
 * Why by version and not on activation: a deploy that replaces the plugin's files (FTPS,
 * rsync) does not fire the activation hook, so InspecChile's data fix needed a manual
 * deactivate/activate. Here the pending ones run:
 *   - with SSH: `wp acme-site migrate` (the deploy workflow runs it);
 *   - without SSH: on the first wp-admin visit of an administrator after the deploy.
 *
 * A migration file returns a callable that receives $remember( string $key, $previous ):
 * call it with every value it replaces, before replacing it. The values are stored in the
 * option acme_site_migration_<NNN>, so undoing a migration is writing them back. Each
 * migration is idempotent: it checks before it writes.
 */

defined( 'ABSPATH' ) || exit;

const ACME_SITE_DB_VERSION = 'acme_site_db_version';

/**
 * Migration files by number, ascending.
 *
 * @return array<int, string>
 */
function acme_site_migrations(): array {
	$found = array();
	foreach ( glob( ACME_SITE_DIR . 'migrations/*.php' ) ?: array() as $file ) {
		if ( preg_match( '/^(\d{3})-[a-z0-9-]+\.php$/', basename( $file ), $m ) ) {
			$found[ (int) $m[1] ] = $file;
		}
	}
	ksort( $found );
	return $found;
}

/**
 * Runs the pending migrations. Stops at the first failure without advancing the version.
 *
 * @return array{ran: int[], error: string}
 */
function acme_site_run_migrations(): array {
	$result = array( 'ran' => array(), 'error' => '' );
	$done   = (int) get_option( ACME_SITE_DB_VERSION, 0 );
	$todo   = array_filter(
		acme_site_migrations(),
		static function ( $n ) use ( $done ) {
			return $n > $done;
		},
		ARRAY_FILTER_USE_KEY
	);
	if ( ! $todo ) {
		return $result;
	}
	// Two admin tabs at once must not run the same migration twice.
	if ( get_transient( 'acme_site_migrating' ) ) {
		return $result;
	}
	set_transient( 'acme_site_migrating', 1, 5 * MINUTE_IN_SECONDS );

	foreach ( $todo as $n => $file ) {
		$previous = array();
		$remember = static function ( string $key, $value ) use ( &$previous ) {
			if ( ! array_key_exists( $key, $previous ) ) {
				$previous[ $key ] = $value;
			}
		};
		try {
			$migration = require $file;
			if ( ! is_callable( $migration ) ) {
				throw new RuntimeException( basename( $file ) . ' does not return a callable' );
			}
			$migration( $remember );
		} catch ( Throwable $e ) {
			$result['error'] = sprintf( '%s: %s', basename( $file ), $e->getMessage() );
			break;
		}
		update_option(
			'acme_site_migration_' . sprintf( '%03d', $n ),
			array( 'ran_at' => gmdate( 'c' ), 'previous' => $previous ),
			false
		);
		update_option( ACME_SITE_DB_VERSION, $n, false );
		$result['ran'][] = $n;
	}

	delete_transient( 'acme_site_migrating' );
	return $result;
}

add_action(
	'admin_init',
	static function () {
		if ( wp_doing_ajax() || ! current_user_can( 'manage_options' ) ) {
			return;
		}
		$result = acme_site_run_migrations();
		if ( ! $result['ran'] && ! $result['error'] ) {
			return;
		}
		add_action(
			'admin_notices',
			static function () use ( $result ) {
				if ( $result['ran'] ) {
					printf(
						'<div class="notice notice-success"><p>%s</p></div>',
						esc_html( 'Acme Site: migrations run: ' . implode( ', ', $result['ran'] ) )
					);
				}
				if ( $result['error'] ) {
					printf(
						'<div class="notice notice-error"><p>%s</p></div>',
						esc_html( 'Acme Site: migration failed, nothing after it ran. ' . $result['error'] )
					);
				}
			}
		);
	}
);

if ( defined( 'WP_CLI' ) && WP_CLI ) {
	WP_CLI::add_command(
		'acme-site migrate',
		static function () {
			$result = acme_site_run_migrations();
			foreach ( $result['ran'] as $n ) {
				WP_CLI::log( sprintf( 'ran %03d', $n ) );
			}
			if ( $result['error'] ) {
				WP_CLI::error( $result['error'] );
			}
			WP_CLI::success( $result['ran'] ? 'migrations done' : 'nothing pending' );
		}
	);
}
