# D098 · Home · La sección "Ofrendar" vuelve a la home con el formulario completo dentro · Aprobada

**Decisión:** `components/sections/Tithe.tsx` se monta en la home (`id="ofrendar"`, entre Agenda y la banda de Historia) con `TitheForm` + `PaymentStep` completos (propuesta B de César). El botón "Diezmo" del menú pasa a "Ofrendar" (Navbar, PageNavbar, menú móvil) y sigue abriendo `TitheModal`; los títulos dicen "Tu ofrenda sostiene esta obra". Dentro del formulario se sigue eligiendo Diezmo u Ofrenda (`ContributionType` y la base no cambian).
**Por qué:** César pidió una sección para aportar en el inicio, además del modal, para incentivar la donación, y cambiar el texto "diezmo" por "ofrendar" en botones y títulos. Revierte lo de "sección removida" de fase 07 (D049 sigue: el modal es global y el botón lo abre).
**Alternativa descartada:** sección con solo un botón que abre el modal (propuesta A): menos fricción visual pero un clic más.
