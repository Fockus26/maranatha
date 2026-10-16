# fix/ui-feedback-pagos — Feedback de UI en pagos, login y dashboard (PR #1 · sin changeset, previo a Changesets)

## Estado
mergeada el 2026-09-25

## Qué se hizo
- Login del dashboard con errores específicos + rate limit por IP + función `auth_email_exists` (migración 0004).
- Panel de pagos con tasas de DolarApi y de respaldo por separado.
- Logos de métodos de pago, campos compactos (`theme/fieldStyles.ts`), patrón diagonal sin salto (`theme/patterns.ts`).

## Verificado (y cómo)
- `tsc --noEmit` sin errores.

## No verificado
- Revisión visual y a11y no registradas en esta unidad.

## Decisiones
- D075 (decisions/03-pagos.md)

## Acciones de César
- Aplicar `supabase/migrations/0004_auth_email_exists.sql`.
