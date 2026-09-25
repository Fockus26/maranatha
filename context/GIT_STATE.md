# Git State

## Rama madre activa
`ninguna — las unidades salen directo de main`

## Rama base de la próxima unidad
`main`

## Ramas de trabajo abiertas
| Rama | Base | Unidad | Estado |
|---|---|---|---|
| `feat/payments` | `main` | Bloque: pasarela de pagos híbrida | mergeada (sin push) |
| `feat/payments-db` | `feat/payments` | 1 · Supabase, migración y repositorio | mergeada |
| `feat/payments-manual` | `feat/payments` | 2 · Pagos manuales: selector, instrucciones y reporte | mergeada |
| `a11y/error-token-contrast` | `feat/payments` | Contraste AA del token error | mergeada |
| `feat/dashboard-auth-payments` | `feat/payments` | 3 · Login del dashboard y aprobación de pagos | mergeada |
| `feat/payments-paypal` | `feat/payments` | 4 · PayPal pago único (orden, retorno, webhook) | mergeada |
| `feat/payments-paypal-monthly` | `feat/payments` | 5 · Aportes mensuales con PayPal Subscriptions | mergeada |
| `feat/payments-project-raised` | `feat/payments` | 6 · Recaudado real en proyectos | mergeada |
| `fix/payments-qa` | `feat/payments` | Hallazgos de QA funcional (rate limit, A1, webhook, reembolsos, validaciones) | mergeada |
| `chore/deploy-setup` | `main` | Deploy doble: Vercel (staging) + VPS Docker (producción) | mergeada |

## Ramas de deploy (permanentes)
Mismo código que `main`; solo se avanzan, nunca se commitea directo en ellas. Ver `deploy/README.md`.
| Rama | Publica en | Cómo avanzarla |
|---|---|---|
| `vercel` | Vercel (pruebas) | `git push origin main:vercel` |
| `vps` | VPS Hetzner (producción) | `git push origin vercel:vps` |
