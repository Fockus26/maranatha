# fix/instagram-visor

- PR #31 (patch). D083 proporción real + contain + ancho del diálogo; D084 botón outlined con contraste.
- `components/ui/outlinedActionSx.ts` compartido por Seguir y el CTA del visor.
- `lib/instagram.ts` expone `aspectRatio` (cota 9:16–1.91:1; fallback 4:5 / 9:16); 8 tests en `tests/unit/instagram.test.ts`.
- Rueda horizontal: un gesto = una diapositiva. X 44 px a 10 px del borde.
- No verificado: capturas (el script no abrió el diálogo).
