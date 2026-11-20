# fix/ofrendar-separacion — PR #53 (tanda 2026-11-20, W3)

- `components/ui/TitheLayout.tsx` compartido por la sección Ofrendar y el modal (960 centrado, gap md 10). D105. Changeset patch.
- Medido: 40 px texto-formulario en sección y modal a 1280/1440/1920; sin scroll horizontal a 320.
- Token que faltó: ancho de contenido 960 (constante local).
