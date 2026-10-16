# Page Inventory — Iglesia Maranatha

| Página | Ruta | Secciones / componentes | Estado | Notas |
|---|---|---|---|---|
| Home | `/` | Navbar, Hero, ServiceAreas, PhotoAnchorBand, Leaders, Sermons, SocialLinks, Agenda, PhotoAnchorBand, History, Footer | Cerrada | contenido parcial provisional |
| Proyectos | `/proyectos` | PageNavbar, tabs Todos/Activos/Completados, ProjectCard lista/cuadrícula, Footer | Cerrada | datos de `lib/projectsData.ts` + recaudado real |
| Detalle de proyecto | `/proyectos/[slug]` | ProjectDetailContent, ProjectSidebar, ProjectContributionForm → PaymentStep | Cerrada | |
| Resultado de pago | `/pago/resultado` | estados éxito / pendiente / cancelado / fallido | Cerrada | noindex |
| Retornos de PayPal | `/pago/paypal/{retorno,cancelado}`, `/pago/paypal/suscripcion/{retorno,cancelado}` | route handlers | Cerrada | redirigen a `/pago/resultado` |
| Webhook de PayPal | `/api/payments/paypal/webhook` | route handler | Cerrada | requiere `PAYPAL_WEBHOOK_ID` |
| Dashboard: login | `/dashboard/login` | DashboardLoginForm | Cerrada | D075 |
| Dashboard: resumen | `/dashboard` | DashboardStatBand, proyectos recientes | Cerrada | |
| Dashboard: proyectos | `/dashboard/proyectos` | DashboardTable, DashboardProjectModal | Cerrada | en memoria (D045) |
| Dashboard: pagos | `/dashboard/pagos` | DashboardPayments, tasas | Cerrada | aprobación de reportes manuales |
| Historia | `/historia` | — | Retirada | redirige a `/` |
| Preview temporal | `/zz-preview-form` | — | Local, sin commitear | borrar cuando no se use |
