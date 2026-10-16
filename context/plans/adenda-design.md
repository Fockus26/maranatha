# Adenda de diseño — Iglesia Maranatha

Sobre el diseño que ya hiciste para este proyecto, faltan estas piezas. Usa el mismo sistema
(tokens, tipografía, componentes): nada de estilos nuevos salvo que lo justifiques en el
handoff. Mismas restricciones: WCAG 2.1 AA, ningún estado solo por color, sin scroll
horizontal a 320px, claro y oscuro (recuerda las piezas navy fijas que no cambian con el modo).

## Logo provisional

El cliente tiene logo pero aún no lo entrega. Diseña un logo provisional sobrio a partir de la
marca (navy `#101B45`, naranja de acento, tipografía del sistema): logotipo "Iglesia Maranatha"
horizontal y una versión compacta. Que se pueda cambiar por el real sin rehacer el resto:
el icono, el favicon y la imagen OG deben depender de un solo archivo de logo. Versiones para
fondo claro, oscuro y navy. Entrega en SVG.

## Pantallas de estado

Una familia visual: cabecera mínima con el logo, etiqueta, título con la voz de la marca,
una línea que explique qué pasó, y acciones. Desktop 1440 y mobile 390.

- **404** · con sesión de admin (dashboard): "Ir al panel" + "Ir al inicio" · visitante:
  "Ir al inicio" + "Ver reuniones"
- **500 con código**: "Reintentar" + "Ir al inicio", y el código de error visible y copiable
  para escribir a soporte. **500 sin código**: igual, sin el código.
- **Sin conexión**: qué revisar y qué se conserva (p. ej. un reporte de pago a medio llenar);
  "Reintentar".
- **Mantenimiento con hora** ("Volvemos aproximadamente: <fecha y hora local>") y **sin hora**.
  Sin acciones.

Copy: propón uno en español (es-VE), cálido y cercano, con la voz de la iglesia, que se
entienda sin juegos de palabras.

## Selección de texto

Color de fondo y de texto de `::selection` en claro y oscuro, con su ratio (≥ 4.5:1 del texto
seleccionado sobre el fondo de selección) y que se distinga del foco y de los enlaces.

## Barra de scroll

Scrollbar con los colores del sistema en claro y oscuro (y sobre las piezas navy fijas, como
el sidebar del dashboard): grosor, radio, color del thumb en reposo, hover y activo, y del
track. El thumb debe distinguirse del track (≥ 3:1). Indica qué se usa en Firefox
(`scrollbar-color` / `scrollbar-width`) y qué en Chromium/Safari (`::-webkit-scrollbar`), y
que no cambie el ancho del layout al aparecer.

## Icono y favicon

Derivado del logo provisional (y luego del real): icono cuadrado legible a 16 px, en SVG,
con versión para fondo claro y oscuro, su variante para apple touch icon (180×180, fondo
opaco) y maskable (símbolo dentro del 80 % central).

## Imagen Open Graph

Plantilla de 1200×630 para compartir: logo, título de la página (≥ 60 px), fondo del sistema,
margen de seguridad para recortes. Una por defecto del sitio y variante para la página de un
proyecto (`/proyectos/[slug]`).

## Entregable

Las piezas en el diseño y una **sección nueva del HANDOFF.md** con, para cada una: tokens que
usa (o nuevos, con valor y ratio), medidas, comportamiento responsive, estados, notas de
accesibilidad y, para logo, icono y OG, los archivos exportados con sus tamaños.
