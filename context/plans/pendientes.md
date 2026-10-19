# Pendientes

Sueltos que no son de la unidad en curso. Uno por bloque: qué, por qué, cuándo.

## Persistir proyectos del dashboard (D045)
- **Qué:** tabla de proyectos en Supabase + Server Actions; `lib/projectsData.ts` deja de ser la fuente.
- **Por qué:** hoy el CRUD del panel se pierde al recargar.

## Contrastes en modo oscuro e `info`
- **Qué:** comprobar dónde se usan `primary.main` oscuro como texto, `secondary.contrastText`
  en oscuro e `info` con blanco (ver `COLORS.md`) y ajustar tokens si hace falta.
- **Por qué:** los ratios calculados no llegan a AA.

## Componentes sin uso
- **Qué:** decidir si se borran `AgendaItem`, `TimelineZigzagItem`, `DashboardSidebar`,
  `sections/Projects.tsx`, `sections/Tithe.tsx`.
- **Por qué:** ruido para quien busca qué componente reutilizar.

## Del kit 3.3.0 (actualización a 3.5.0)

Unidades de diseño + implementación (fase 06 / 02), una por línea. No se hicieron en el PR del kit.

- [ ] Pantalla 404 (`app/not-found.tsx`): con sesión de admin / invitado — `reference/STATUS-SCREENS.md`
- [ ] Pantalla 500 (`app/error.tsx` + `app/global-error.tsx`): con / sin código de error
- [ ] Estado sin conexión y error de red
- [ ] Mantenimiento (con / sin hora) — solo si César lo quiere (`MAINTENANCE_MODE`)
- [ ] Color de selección `::selection` como token, claro y oscuro, con contraste verificado (fase 02)
- [ ] Logo provisional (Claude Design) hasta que el cliente entregue el suyo; luego icono, favicon, apple icon y OG desde ese logo
- [ ] Scrollbar con los colores del sistema, claro y oscuro (fase 02)

## QA funcional de pagos y login (19-10-2026): hallazgos bajos
Los 6 medios se corrigieron en `fix/qa-pagos` (PR #16). Los bajos, uno por línea:

- [ ] Tope de 5 reportes pendientes por correo no atómico: 12 POST en paralelo crean 12 filas (`app/actions/payments.ts:141`).
- [ ] Nombres que se ven en blanco: U+3164, U+115F, U+1160, U+FFA0 y U+2800 pasan `UNSAFE_CHARS` (`lib/payments/schema.ts`).
- [ ] Correos con `<`, `>` o comillas se aceptan (`lib/validation.ts:9-10`).
- [ ] UUID inexistente o doble clic propio → "ya fue procesado por otra persona" (`mapRepoError`, `app/actions/adminPayments.ts`).
- [ ] Rechazar es irreversible; la nota acepta U+202E; nota de solo espacios se guarda como `""` en vez de `NULL`.
- [ ] Checkouts de PayPal abandonados quedan "Pendiente" para siempre en la lista (expirarlos o filtrarlos).
- [ ] Sesión revocada a mitad de una acción: vuelve al login sin mensaje y sin `next=`; un no admin en `/dashboard` no ve "tu cuenta no tiene acceso".
- [ ] Login: con un correo de más de 254 caracteres o una contraseña de 10 000 se marca en rojo el campo equivocado (`components/ui/DashboardLoginForm.tsx:30-47`).
- [ ] Cookie `sb-…-auth-token` no HttpOnly (default de `@supabase/ssr`); endurecimiento opcional.
- [ ] Voseo "Elegí un monto…" → "Elige" (`TitheForm.tsx:203`, `ProjectContributionForm.tsx:239`).
- [ ] `1e3` como **número** en el servidor sigue aceptándose (el cliente ya no lo deja escribir).

Sin verificar en la QA (requiere acciones de César): aprobar en PayPal con cuenta *buyer* de sandbox, webhook real con túnel, suscripción mensual en sandbox, `x-forwarded-for` no falsificable en Vercel y el VPS, y el conflicto de puertos con `world-flags` para `qa:local`.
