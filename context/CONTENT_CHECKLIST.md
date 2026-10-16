# Content Checklist — Iglesia Maranatha

> Todo el contenido real que hoy está como placeholder en el código, pendiente de que el
> cliente lo confirme o lo mande. Ningún agente lo inventa como final.

| # | Qué falta | Dónde (archivo/componente) | Quién lo marcó | Fase | Estado |
|---|---|---|---|---|---|
| 1 | Proyectos reales (nombres, montos, fotos) | `lib/projectsData.ts` | frontend-build (D041) | 05 | Pendiente |
| 2 | Agenda real (eventos, horarios, ubicaciones) | `components/sections/Agenda.tsx` | frontend-build | 04 | Pendiente |
| 3 | Foto real de un servicio / noche de oración (card Oración) | `components/sections/ServiceAreas.tsx` | frontend-build | 04 | Pendiente |
| 4 | Fotos y cifras de las anclas fotográficas | `app/page.tsx` › `PhotoAnchorBand` | frontend-build | 05 | Pendiente |
| 5 | Imágenes de Unsplash como marcadores (31 referencias) | componentes y `lib/` | reconstrucción del context | — | Pendiente de revisar cuáles son finales |
| 6 | IDs de feed de Behold para las 3 cuentas de Instagram | `.env` › `BEHOLD_FEED_*` | backend-build | 07 | Pendiente |
| 7 | Datos de las cuentas de pago manual | `.env` › `PAY_*` | backend-build (D074) | 07 | Pendiente de confirmar en producción |
| 8 | Dominio de producción | `NEXT_PUBLIC_SITE_URL`, DNS, `deploy/README.md` | chore/deploy-setup | — | Pendiente |
| 9 | Logo definitivo (hoy provisional, D078): reemplazar `public/brand/*.svg` y correr `bun run brand:icons`; el texto del logotipo pasarlo a curvas para usos fuera del sitio | `public/brand/`, `components/brand/Logo.tsx` | feat/marca-provisional | — | Pendiente |
| 10 | Tono de marca, "no debe parecer" y referencias visuales | `PROJECT_CONTEXT.md` | reconstrucción del context | — | Pendiente |
| 11 | Copy de las pantallas de estado (404, 500, sin conexión, mantenimiento) y correo de soporte (`SITE_CONTACT_EMAIL` sigue siendo de relleno) | `components/status/statusCopy.ts`, `lib/siteConfig.ts` | feat/pantallas-estado (D079) | — | Pendiente de confirmar |

<!-- Marca "Resuelto" (no borres la fila) cuando el cliente confirme el contenido real y se
     actualice el código. -->
| — | Copy de las pantallas 404 / 500 / sin conexión | Pantallas de estado | pendiente (kit 3.3.0) |
| — | Logo del cliente (SVG) | Assets de marca | lo tiene el cliente, pendiente de entrega; se usa uno provisional |
