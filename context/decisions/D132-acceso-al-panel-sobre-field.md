# D132 · Componentes · Acceso al panel sobre `Field` + `Input`: `PasswordField` con el ojo dentro de la caja · Implementado

**Decisión:**
- `DashboardAuthShell` (marco de login, olvido y restablecer), `DashboardLoginForm`, `DashboardForgotForm` y `DashboardResetForm` pasan a `Field` + `Input` + `Alert` + `Button` + `Link` de `components/ui/`. Los errores específicos de D075 y su `Alert` (`login-error`, `forgot-error`, `reset-error`, `role="alert"`) no cambian; el campo en falta se marca con `error={true}` (borde y `aria-invalid`, el texto lo lleva el `Alert`) y mantiene `aria-describedby` hacia el aviso.
- `PasswordField` (D106): API nueva = props de `<input>` (sin `type`) + `label`, `description`, `error` (texto o `true`), `fieldClassName`; ya no recibe `slotProps`/`helperText`/`fullWidth`. El botón de ojo es `Button variant="plain" size="icon"` de 36 px dentro de la caja (`absolute right-0.5`), con `aria-label` que dice la acción ("Mostrar/Ocultar contraseña"), `aria-controls` hacia el campo y sin `aria-pressed` (decirlo dos veces confunde). `onMouseDown` con `preventDefault` conserva el foco del campo.
- El trazo del patrón de `DashboardAuthShell` depende del modo: dos `PatternLayer` (claro `gray[900]`, oscuro `gray[50]` al 7 %), una por modo, porque el tile es un SVG con el color incrustado.
- Subtítulo y `h1` en clases (`text-28 md:text-h1`); `md:text-h1` sube a 72 px desde 1920 px (antes 60 px fijos).

**Por qué:** mismos textos y flujo; cambia la caja del campo (D114): etiqueta fija encima y 40 px de caja en vez de la etiqueta flotante de 56 px. Medido en `/dashboard/login`: el formulario pasa de 188 a 194,6 px (+6,6) a 360 y 1280 px; el `Alert` de error de 48,8 a 38 px (padding del `Alert` de la ola 2); los campos de contraseña ocupan todo el ancho (antes 270 px por el adorno).
**Alternativa descartada:** conservar la etiqueta flotante: la primitiva `Field` no la tiene y no se editan primitivas en esta ola.
