# maranatha

## 0.10.0

### Minor Changes

- 8fac6c8: Panel más rápido: volver a una página o a un filtro de Pagos o Agenda visitado hace poco se muestra al instante, sin recargar. Si los datos cambiaron por fuera (un pago confirmado por PayPal o Binance, otro admin), la página se actualiza sola al volver a la pestaña o a la ventana.
- 262bff4: Interfaz completa sobre shadcn/ui: se retira MUI.
- f8eef9a: Al cambiar de página en el panel, el esqueleto de carga ahora tiene la forma de cada página (Resumen, Proyectos, Pagos y Agenda) en vez de un bloque único a todo el ancho.

### Patch Changes

- f648108: La agenda muestra la hora igual en el sitio y en el panel ("7:00 p. m."), sin que "p. m." se parta entre dos líneas.
- 3516a62: Primitivas y tokens de la interfaz completados
- 85cf9fe: En pantallas táctiles (hasta 900 px) es más fácil tocar los enlaces del pie de página, el cambio de vista en Proyectos, el Instagram del encargado, los enlaces del acceso al panel, Editar y Eliminar de las tablas y los filtros de Pagos.
- 43c7d78: Interfaz migrada a shadcn: estados vacíos y transiciones.
- 93bff0b: Interfaz migrada a shadcn en pagos, agenda y proyectos del panel
- 261d798: En el panel, si la sesión se cerró en otra pestaña, guardar un evento o confirmar un pago ahora avisa "Tu sesión expiró" en vez de "No hubo respuesta del servidor".
- 1b1419a: Interfaz migrada a shadcn en las secciones de la página de inicio.
- 3ed8a51: Si tienes activado "reducir movimiento", los paneles laterales, diálogos y menús desplegables ahora se abren sin deslizarse ni hacer zoom.
- 8830610: Reporte de pago más claro:
  - Si la conexión se corta justo al enviarlo y lo vuelves a enviar, ahora se confirma en vez de decir que la referencia ya fue reportada.
  - El calendario solo deja elegir fechas de los últimos 60 días.
  - Un nombre con emojis compuestos o demasiado largo se avisa en el primer paso.
- b293847: Interfaz migrada a shadcn: selector segmentado y botón de modo
- 4815122: Interfaz migrada a shadcn en los formularios de diezmo y aporte
- 244466d: Con el modal de ofrenda o un panel lateral abierto ya no queda una franja clara sin oscurecer en el borde derecho, y el "Da con propósito" del modal de ofrenda se lee mejor en modo claro.
- 34d0306: Interfaz migrada a shadcn: diálogo de confirmación
- f0d0f17: En el panel, al eliminar un proyecto el foco pasa al proyecto siguiente en vez de perderse. El anillo de foco de "Saltar al contenido" se ve mejor en modo claro.
- 4947eed: Interfaz migrada a shadcn en el marco del sitio y las páginas de proyectos.
- 5dd74b3: Interfaz migrada a shadcn: campos de fecha y hora
- b7c04b5: Si el comprobante que adjuntas está vacío, ahora se avisa en vez de enviar el reporte sin él. En el panel, una tasa de respaldo con solo espacios se guarda como "sin respaldo".
- d28aecc: Interfaz migrada a shadcn en el acceso y el marco del panel
- b553e6e: Después de usar "Saltar al contenido" o un enlace del menú a una sección (como Agenda), ir a otra página y pulsar Atrás vuelve a mostrar la página anterior.

## 0.9.0

### Minor Changes

- 21526ac: Los formularios de crear y editar proyectos y eventos del panel se abren en un panel lateral más ordenado.
- 23e522d: Nueva sección para ofrendar en el inicio, con el formulario completo; el botón del menú ahora dice «Ofrendar».
- 79d3844: Zinli y Wally ya no aparecen como métodos de pago.
- f901c96: El ingreso al panel y el cambio de contraseña tienen un botón con un ojo para ver lo que escribes, y la barra del panel muestra las iniciales de quien inició sesión.
- 3b53363: Al hacer clic en un enlace aparece una barra de carga arriba y un esqueleto mientras llega la página.

### Patch Changes

- b8bf62c: La barra de carga ya no se queda pegada al ir a un ancla o con atrás/adelante, y también aparece al abrir un proyecto desde su tarjeta.
- 2c6b626: La sección Ofrendar del inicio acerca el texto y el formulario, con la misma separación que el modal.

## 0.8.0

### Minor Changes

- 6027664: El sitio puede publicarse en kit-deploy (VPS de César): producción desde `main` y un preview por cada PR, con `/api/health` para el cambio sin corte. Se enciende con la variable `KIT_DEPLOY_ENABLED` del repo; hasta entonces solo publica Vercel.

### Patch Changes

- 024b1ba: El panel tiene la misma transición suave entre pantallas que el sitio público.

## 0.7.1

### Patch Changes

- a842003: Los botones secundarios ("Ver proyecto", "Ver canal de YouTube", "Tasas de cambio", "Ver comprobante", "Comprobante" y "Elegir imagen") usan ahora el mismo estilo con contraste que "Seguir".
- 87113e6: La hora y el día elegidos en los selectores del panel muestran el texto en blanco sobre un naranja más oscuro, legible en modo claro y oscuro.

## 0.7.0

### Minor Changes

- f6815ce: Selector de hora propio en la agenda del panel, con el mismo estilo que el calendario.
- 13c1600: Transiciones suaves al pasar al paso de pago y animación de las listas de pagos y proyectos del panel al filtrar o buscar.

## 0.6.1

### Patch Changes

- 0fce957: Foco de teclado más limpio: el anillo naranja sigue la forma de cada botón y los campos de texto marcan el foco en su borde sin tapar la etiqueta.
- dcdcb62: Visor de Instagram: las fotos se ven completas y nítidas, el modal se adapta a cada imagen, se puede pasar de foto con el scroll horizontal y los botones Seguir y Dar like o comentar tienen mejor contraste.

## 0.6.0

### Minor Changes

- 753b60d: El panel administrativo permite recuperar la contraseña por correo ("¿Olvidaste tu contraseña?"). La base de datos, las sesiones y los comprobantes pasan de Supabase al servidor propio.

### Patch Changes

- fdbde95: Sin red, abrir otra página del sitio muestra la pantalla "Sin conexión" en vez del error del navegador.

## 0.5.2

### Patch Changes

- 179fbe4: Correcciones de la QA de diseño de la fase 09: estado seleccionado visible en alto contraste, botón primario con contraste AA en oscuro, logo en las páginas internas, menú del panel en móvil, objetivos táctiles de 44px, galería `/estados` y colores, radios, sombras, íconos y tamaños de letra pasados a tokens.

## 0.5.1

### Patch Changes

- 92e8094: En el panel de agenda, un corte de red al guardar o eliminar un evento ya no tumba el panel: aparece un aviso y lo escrito se conserva. La agenda rechaza fechas que no existen. En pagos, una página fuera de rango ya no muestra un error de conexión, y las tasas de respaldo muestran el rango aceptado. Mejora el contraste de la sección Agenda.
- ffbb53b: Los diálogos de confirmación del panel (confirmar pago, eliminar evento) quedan abiertos si la acción falla, para reintentar, y se bloquean mientras se procesa. La página de inicio ya no da error de hidratación con "reducir movimiento" activo.

## 0.5.0

### Minor Changes

- ecfbd8e: Los aportes con Binance pueden pagarse en la página de Binance Pay y se confirman solos, sin esperar la aprobación de un administrador (se activa cuando la iglesia tenga su cuenta de comercio en Binance; mientras tanto sigue el reporte manual).

## 0.4.0

### Minor Changes

- e5e1038: La agenda del inicio ahora se edita desde el panel: nueva sección «Agenda» en el dashboard para crear, editar y eliminar reuniones semanales y eventos especiales.

### Patch Changes

- 8e07283: El monto personalizado solo admite hasta 2 decimales, así el reporte del pago ya no falla después de transferir. En el panel, un corte de red al confirmar o rechazar muestra un aviso en lugar de la pantalla de error, y el listado de pagos se pagina mostrando el total.

## 0.3.0

### Minor Changes

- c09d5c7: Nuevas pantallas para cuando una página no existe, algo falla, no hay conexión o el sitio está en mantenimiento: explican qué pasó y cómo seguir, y en los errores muestran un código para escribir a soporte.
- 2dbc7ba: Nuevo logo provisional de la iglesia en el menú, el pie de página y el panel, con su icono para el navegador y el teléfono. Al compartir el sitio o un proyecto en redes ahora se ve una imagen con el logo y el título.

### Patch Changes

- 7f34786: La selección de texto y la barra de scroll usan los colores de la iglesia en modo claro y oscuro, con mejor contraste, y la página ya no se mueve de lado cuando aparece la barra.

## 0.2.0

### Minor Changes

- 7d36648: Las publicaciones de Instagram se ven en alta resolución y se abren dentro del sitio: álbumes completos, reels reproducibles, me gusta, comentarios y enlace para interactuar en Instagram. Cada cuenta muestra su foto de perfil y sus seguidores.

## 0.1.1

### Patch Changes

- b1902e7: Login del panel más amplio en desktop (título grande, campos de tamaño normal y patrón diagonal de fondo) y el campo "Motivo" al rechazar un pago ahora arranca en una línea con el texto centrado.
