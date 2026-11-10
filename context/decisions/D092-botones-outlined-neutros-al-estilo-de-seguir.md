# D092 · UI · Todo botón outlined neutro usa `outlinedActionSx` (estilo de "Seguir") · Implementado

**Decisión:** los botones outlined con el estilo neutro anterior (borde `divider`, texto gris, acento solo al hover) y los outlined `color="inherit"` pasan a `components/ui/outlinedActionSx.ts` (D084): borde y texto `primary[700]`/`primary[200]`, hover con relleno sólido. Aplica a "Ver proyecto" (ProjectCard, ProjectSidebar), "Ver canal de YouTube" (Sermons, que antes tenía acento naranja), "Tasas de cambio" y "Ver comprobante" (DashboardPayments), "Comprobante" (PaymentStep) y "Elegir imagen" (ImageUploadField).
**Por qué:** César aprobó el nuevo "Seguir" y pidió llevar todos los botones del estilo antiguo a él (2026-11-10); el borde `divider` no llegaba a 3:1.
**Fuera de alcance:** el CTA outlined del Hero (va sobre foto oscura, blanco translúcido), los outlined con color semántico ("Rechazar" en `error`, "Cancelar"/"Siguiente" en `primary`/`secondary`), las píldoras del Navbar y los iconos sociales del Footer (no son botones de texto).
**Nota de estado:** Implementado.
