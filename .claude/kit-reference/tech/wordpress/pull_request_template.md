## Qué cambia

<!-- 2-5 bullets concretos. Una unidad de trabajo por PR. -->

-

## Por qué

<!-- El problema o el pedido (cita literal si vino de César). Closes #N si hay issue. -->

## Cómo probarlo

<!-- En la copia local (bun run local:up): URL, usuario de prueba, pasos. -->

1.

## Capturas

<!-- Si cambió algo visible: `bun run shots` + `bun run shots:publish` y pega aquí el markdown.
     Móvil (375) y escritorio (1280). Si no se pudieron tomar: dilo y por qué. -->

## Verificación

- **Hecho:** <!-- qué flujos se recorrieron en la copia local, teclado, axe, debug.log -->
- **No verificado:** <!-- qué no y por qué -->

## Decisiones

<!-- "Decisión tomada / alternativa" en 2 líneas cada una. IDs de decisions/. -->

## Despliegue

- **Migraciones:** <!-- migrations/NNN-*.php que trae, o "ninguna". Sin SSH corren al abrir wp-admin -->
- **Acciones manuales:** <!-- ajustes en el admin, plugins que activar o desactivar, secretos. "Ninguna" si no hay -->
- **Smoke en staging y producción:** <!-- los flujos a recorrer tras el deploy -->

## Checklist

- [ ] `bun run lint:php` en verde (y `build:css` con el CSS compilado commiteado, si cambió el SCSS)
- [ ] Cada formulario, AJAX y REST: nonce, `current_user_can`, sanitizar al entrar, escapar al salir, `$wpdb->prepare`
- [ ] Sin sintaxis más nueva que el `Requires PHP` del plugin
- [ ] Cambios de datos como migración en `migrations/` (idempotente, con `$remember`), no en el admin
- [ ] Campos ACF nuevos o cambiados en `acf-json/`
- [ ] Assets con `asset_version()` (`filemtime`), no con la versión fija
- [ ] UI: WCAG 2.1 AA (teclado, foco visible, 4.5:1, ningún estado solo por color, sin scroll horizontal a 320 px)
- [ ] `context/` actualizado (un `decisions/D0NN-*.md` por decisión) y respaldado (`bun run context:backup`)
