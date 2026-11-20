# style/anillo-foco

- PR #30 (patch). D085 criterio del foco, D086 alto contraste.
- Anillo 2px offset 2px sin radio forzado (`--focus-ring`): secondary[600] en claro (3.70:1), secondary[500] en oscuro/navy.
- Sin ripple de foco de MUI; inputs con borde 2px al enfocar (rojo con error), sin outline exterior.
- Medido: border-radius cambiaba al enfocar en 63/66 elementos en main, 0/65 en la rama.
- No verificado: página de proyecto (sin DATABASE_URL), recorrido completo en oscuro, axe/320 px.
