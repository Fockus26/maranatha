# Components Inventory — Iglesia Maranatha

> Qué componentes existen, dónde viven y qué los usa. Revisa esta tabla antes de crear uno
> nuevo. "Usado en" se sacó de los imports (2026-09-26).

| Componente | Ruta | Usado en | Notas |
|---|---|---|---|
| AmountSelector | `components/ui/AmountSelector.tsx` | TitheForm, ProjectContributionForm | montos rápidos + libre |
| ConfirmDialog | `components/ui/ConfirmDialog.tsx` | DashboardPayments, DashboardTable | confirmación con texto en negrita |
| DateField | `components/ui/DateField.tsx` | DashboardProjectForm, PaymentStep | calendario propio (D062) |
| TimeField | `components/ui/TimeField.tsx` | DashboardAgenda | selector de hora propio (D089) |
| DonationFormCard | `components/ui/DonationFormCard.tsx` | TitheForm, ProjectContributionForm, PaymentStep | contenedor de formularios de aporte |
| EmptyState | `components/ui/EmptyState.tsx` | dashboard, /proyectos, DashboardTable, DashboardPayments | D067 |
| ImageUploadField | `components/ui/ImageUploadField.tsx` | DashboardProjectForm | |
| PaymentStep | `components/ui/PaymentStep.tsx` | TitheModal, ProjectDetailClient | paso de método de pago y reporte (D074) |
| PhotoAnchorBand | `components/ui/PhotoAnchorBand.tsx` | Home | banda de foto con parallax |
| PhotoOverlayCard | `components/ui/PhotoOverlayCard.tsx` | LeaderCard, ServiceAreaCard | overlay navy (D012) |
| ProjectCard | `components/ui/ProjectCard.tsx` | /proyectos, ProjectSidebar, DashboardTable | layouts vertical/horizontal (D016) |
| Reveal | `components/ui/Reveal.tsx` | todas las secciones de Home | aparición al scroll, reduced-motion |
| SegmentedToggle | `components/ui/SegmentedToggle.tsx` | TitheForm | único / mensual |
| ThemeToggle | `components/ui/ThemeToggle.tsx` | Navbar, PageNavbar, MobileMenuOverlay, DashboardTopbar | cookie (D053) |
| TitheForm | `components/ui/TitheForm.tsx` | TitheModal | |
| TitheModal | `components/ui/TitheModal.tsx` | `app/layout.tsx` | modal global con store (D049) |
| Dashboard* | `components/ui/Dashboard{LoginForm,Payments,ProjectForm,ProjectModal,StatBand,Table}.tsx` | páginas del dashboard | una por pantalla/bloque |
| Cards de sección | `components/ui/{LeaderCard,ServiceAreaCard,SocialLinkCard,YoutubeEmbedCard,TimelineItem}.tsx` | su sección de Home | SocialLinkCard tiene `bare` (D036) |
| Navbar / PageNavbar | `components/layout/` | Home / resto de páginas públicas | D023 |
| MobileMenuOverlay | `components/layout/MobileMenuOverlay.tsx` | Navbar, PageNavbar | navy fijo (D025) |
| Footer | `components/layout/Footer.tsx` | páginas públicas | |
| DashboardShell / Topbar | `components/layout/Dashboard{Shell,Topbar}.tsx` | páginas del panel | |
| PageTransition | `components/layout/PageTransition.tsx` | `app/template.tsx` | |
| JsonLd | `components/seo/JsonLd.tsx` | Home, /proyectos, detalle | datos en `lib/jsonLd.ts` |

**Sin uso** (señalados, no borrar sin decisión de César): `AgendaItem` (D014),
`TimelineZigzagItem` (D043), `DashboardSidebar` (D024), `components/sections/Projects.tsx`,
`components/sections/Tithe.tsx` (reemplazada por TitheModal).
