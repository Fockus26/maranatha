# Decisiones — Histórico (D001–D067, reconstruido)

El registro original de estas decisiones no se conservó. Lo que sigue sale **solo** de los
comentarios del código que las citan (el archivo donde se cita va entre paréntesis). No
tiene el "por qué" ni las alternativas: si hace falta, el comentario citado suele explicarlo.
IDs que el código no cita (D001–D006, D008–D010, D017, D021, D027, D033, D034, D040, D046,
D063, D066) no se pueden reconstruir. No se reutilizan.

## D007 — Historia y Proyectos como páginas propias
**Decisión:** Historia y Proyectos viven en rutas propias, no como secciones de Home (`sections/Tithe.tsx`).
**Estado:** Proyectos implementado. Historia retirada en fase 07 a pedido del cliente (`/historia` redirige a Home).

## D011 — Naranja `contained` reservado a CTAs de alta prioridad
**Decisión:** el botón relleno `secondary` solo para la acción más importante (aportar) (`ProjectCard.tsx`, `DashboardSidebar.tsx`).
**Estado:** Implementado

## D012 — Overlay navy en degradado sobre fotos
**Decisión:** texto sobre foto con degradado horizontal navy para legibilidad (`Hero.tsx`, `PhotoOverlayCard`).
**Estado:** Implementado

## D013 — SocialLinkCard base
**Decisión:** comportamiento por defecto de `SocialLinkCard` (con borde y fondo propios) (`SocialLinkCard.tsx`).
**Estado:** Implementado; D036 añade la variante `bare`

## D014 — AgendaItem pensado para un dashboard
**Decisión:** `AgendaItem` es un ítem de lista para un futuro panel; la sección Agenda usa otro layout (`Agenda.tsx`).
**Estado:** Implementado (hoy `AgendaItem` no se usa)

## D015 — TimelineItem para la línea de tiempo de Historia
**Decisión:** componente de hito reutilizable (`History.tsx`, `TimelineZigzagItem.tsx`).
**Estado:** Implementado

## D016 — ProjectCard con dos layouts
**Decisión:** `ProjectCard` tiene layout vertical y horizontal; `/proyectos` alterna lista/cuadrícula con él (`ProyectosClient.tsx`).
**Estado:** Implementado

## D018 / D019 — TitheForm solo recolecta datos
**Decisión:** el formulario de diezmo entrega los datos por `onSubmit` sin pasarela real (`sections/Tithe.tsx`).
**Estado:** Obsoleta → D074 (pasarela de pagos)

## D020 — Aporte a proyecto en modal
**Decisión:** en el detalle de proyecto el aporte abre un modal con `ProjectContributionForm` precargado (`ProjectDetailClient.tsx`).
**Estado:** Implementado

## D022 — DashboardTable para la lista de proyectos del panel
**Estado:** Implementado (`dashboard/(panel)/proyectos/page.tsx`)

## D023 — Navegación pública
**Decisión:** `navItems.ts` es la fuente única; Navbar de Home con anclas + scroll-spy; `PageNavbar` en las demás páginas; píldora activa (`Navbar.tsx`, `PageNavbar.tsx`).
**Estado:** Implementado

## D024 — Shell del dashboard con sidebar navy fijo
**Estado:** Reemplazado por el topbar (`DashboardTopbar.tsx`, D055/D056); `DashboardSidebar` quedó sin uso

## D025 / D026 — Piezas navy fijas que no siguen el modo claro/oscuro
**Decisión:** sidebar/topbar del dashboard y overlay del menú móvil son navy permanente (`MobileMenuOverlay.tsx`, `ThemeToggle.tsx`).
**Estado:** Implementado

## D028 — Parallax del Hero
**Estado:** Implementado; lo reutiliza `PhotoAnchorBand`

## D029 — Heading de Áreas de Servicio: simple centrado
**Estado:** Implementado (`ServiceAreas.tsx`)

## D030 — Una sección = un archivo (componente + datos)
**Estado:** Implementado (todas las secciones de Home)

## D031 — Foto de Carlos Medina reutilizada en la card "Jóvenes"
**Estado:** Implementado (`Leaders.tsx`, `ServiceAreas.tsx`)

## D032 — Heading izquierda/centrado común a las secciones de Home
**Estado:** Implementado

## D035 / D036 — Tres cuentas de Instagram con selector
**Decisión:** Maranatha, Evangelio y JEF; selector con panel de la cuenta activa y `SocialLinkCard bare` (`SocialLinks.tsx`).
**Estado:** Implementado

## D037 / D038 / D039 — Agenda en mosaico
**Decisión:** en vez de lista uniforme, mosaico con eventos destacados; D039 reemplaza el hover de D038 por el de D037 (`Agenda.tsx`).
**Estado:** Implementado (D038 obsoleta → D039)

## D041 — Proyectos de Home y de /proyectos comparten datos
**Estado:** Implementado (`lib/projectsData.ts`)

## D043 — TimelineZigzagItem para la página Historia
**Estado:** Obsoleta: la página se retiró (fase 07); el componente quedó sin uso

## D044 — Páginas /proyectos y /proyectos/[slug]
**Estado:** Implementado

## D045 — Proyectos del dashboard en memoria
**Decisión:** el CRUD de proyectos vive en un store en memoria, sin backend todavía (`lib/dashboardProjectsStore.tsx`).
**Estado:** Implementado (pendiente persistir en Supabase)

## D048 — Fondo con patrón geométrico en pan continuo ("efecto wow")
**Estado:** Implementado (TitheModal, DashboardStatBand, login; sin salto desde `theme/patterns.ts`)

## D049 / D059 — Modales globales con store
**Decisión:** TitheModal y el modal de proyecto del dashboard se montan una vez en el layout y se abren con un store.
**Estado:** Implementado

## D051 / D054 — Activo en `secondary[700]` / píldora del navbar
**Estado:** Implementado (tab de Proyectos, `AmountSelector`, topbar)

## D052 — No animar filas `<tr>` de DashboardTable
**Estado:** Implementado

## D053 — Modo claro/oscuro con toggle + cookie
**Estado:** Implementado (`app/layout.tsx`, `ThemeRegistry`)

## D055 / D056 — Transición de página y layout del dashboard
**Estado:** Implementado (`PageTransition.tsx`, `DashboardTopbar.tsx`)

## D057 / D058 — Sin el overlay blanco de MUI en modales oscuros
**Estado:** Implementado (TitheModal, ConfirmDialog, DashboardProjectModal)

## D060 / D061 / D064 / D065 — Modal de proyecto: pantalla completa en móvil, dialog acotado en desktop
**Estado:** Implementado (`DashboardProjectModal.tsx`)

## D062 — DateField con calendario propio
**Decisión:** calendario propio en vez de `@mui/x-date-pickers` (`DateField.tsx`).
**Estado:** Implementado

## D067 — Estados de carga y vacíos (fase 09)
**Decisión:** skeletons en tabla y KPIs, `EmptyState` genérico, errores bajo el campo y transición suave del cambio de tema; patrón elegido por el cliente.
**Estado:** Implementado

Citados sin contexto suficiente para resumirlos: D042, D047, D050.
