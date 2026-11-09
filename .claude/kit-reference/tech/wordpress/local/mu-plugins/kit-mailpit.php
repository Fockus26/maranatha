<?php
/**
 * Local copy only (mounted by docker-compose.yml, never deployed): every email through
 * PHPMailer goes to Mailpit. An SMTP plugin that sends through an API (not PHPMailer) is not
 * caught: deactivate it in the copy (reference/tech/wordpress.md §6).
 */

if ( 'local' !== wp_get_environment_type() ) {
	return;
}

add_action(
	'phpmailer_init',
	static function ( $mailer ) {
		$mailer->isSMTP();
		$mailer->Host       = 'mailpit';
		$mailer->Port       = 1025;
		$mailer->SMTPAuth   = false;
		$mailer->SMTPSecure = '';
		$mailer->SMTPAutoTLS = false;
	},
	PHP_INT_MAX
);

// WordPress builds the default sender from the site's host: on localhost it is
// wordpress@localhost, which PHPMailer rejects ("Invalid address"), so no mail was sent.
add_filter(
	'wp_mail_from',
	static function ( $from ) {
		return false === strpos( (string) substr( strrchr( $from, '@' ), 1 ), '.' ) ? 'wordpress@localhost.test' : $from;
	},
	PHP_INT_MAX
);
