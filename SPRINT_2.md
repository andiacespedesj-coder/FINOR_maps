# Sprint 2: ubicación, rutas y detalles

## Historias y demostración

| Historia | Resultado verificable en el teléfono |
| --- | --- |
| HU-04 · Ver ubicación actual | El botón GPS solicita permiso, centra el mapa en el punto azul y muestra la precisión aproximada. En interiores no identifica el piso. |
| HU-05 · Generar ruta paso a paso | Desde la búsqueda, la ficha de un lugar en el mapa o el detalle de un ambiente, «Cómo llegar» abre ese lugar como destino. Intenta ubicar el inicio exterior con GPS; si la persona está dentro o la lectura es imprecisa, permite elegir un punto de referencia. Si existe un camino conectado, presenta pasos y fotografías vinculadas al sentido correcto. Si no existe, explica por qué. |
| HU-06 · Consultar detalle de ambiente | Desde la búsqueda o el mapa, el detalle muestra edificio, piso, código, descripción, horario, fotos, acceso y datos de la carrera cuando existen. |

La pantalla de ruta muestra primero un resumen. Al pulsar **Iniciar ruta guiada**, abre la fotografía de cada punto con su flecha, indicación, progreso y controles para avanzar o retroceder. Si falta una fotografía, conserva la indicación escrita y lo informa claramente. El inicio por GPS elige un nodo exterior cercano que tenga conexión con el destino.

## Datos necesarios para HU-05

1. Registrar y publicar los lugares de destino. Cada lugar debe pertenecer al piso y edificio correctos.
2. Registrar un **nodo de navegación** para cada entrada, cruce, escalera, ascensor y lugar al que se quiera llegar. Vincular el nodo final con el lugar. Dar a cada nodo un nombre que un usuario pueda reconocer. Para iniciar con GPS, situar nodos exteriores sobre el mapa.
3. Crear **conexiones** entre nodos transitables. Indicar la distancia real aproximada y si el paso permite volver. Para cambiar de piso, conectar los nodos mediante una conexión de tipo grada o ascensor.
4. Cargar una fotografía en el nodo **desde el cual sale el usuario**. Después de guardarla, abrirla de nuevo en el panel y añadir una fila por cada flecha. Elegir una conexión que salga de ese nodo, seleccionar la dirección y hacer clic sobre la foto para colocar la flecha. Se pueden poner varias flechas en una foto, una por conexión. Para mostrar la vuelta se necesita una foto tomada desde el nodo opuesto y una conexión bidireccional.
5. Comprobar en el campus rutas desde al menos dos orígenes distintos hacia el mismo destino, una ruta en sentido contrario y un caso sin conexión. Verificar que la foto y la flecha correspondan al sentido real antes de presentar el recorrido.

La app calcula una ruta solamente sobre los puntos y conexiones registrados. El GPS exterior elige una entrada o salida próxima hasta 120 m cuando la precisión es de 35 m o mejor; en un edificio el usuario selecciona manualmente el lugar o punto de referencia. No se atribuye una posición de piso a una lectura GPS. La ruta se abre desde el destino seleccionado; ya no aparece como opción independiente en Información.

Para probar «Cómo llegar» con un aula del Módulo 1, registra el aula como **Lugar** publicado en el piso correcto. Crea un nodo en su puerta con el campo **Lugar** apuntando a esa aula y conéctalo al último nodo del pasillo o escalera. Los nodos de paso mantienen **Lugar** vacío. La ficha y la búsqueda abren entonces esa aula como destino; sin el nodo vinculado, la app informa que todavía no existe un recorrido hasta ella.

Cuando un lugar representa el piso completo (por ejemplo, «Planta Baja»), la app puede usar un punto de referencia cercano del mismo piso, hasta 60 m, y lo anuncia como llegada aproximada. Esta ayuda no se aplica a aulas u oficinas: cada ambiente concreto necesita un nodo vinculado a su puerta.

## Publicación de la versión de prueba

Las flechas colocadas sobre fotos requieren las migraciones `0015` y `0016`, además del código y archivos estáticos nuevos en el VPS. La base de datos guarda la conexión, dirección, etiqueta y posición proporcional de cada flecha; la foto queda en `media/`. Después de actualizar el backend, ejecutar `manage.py migrate`, `collectstatic` y reiniciar `finor.service`. La app Android también necesita una compilación nueva para mostrar flechas interactivas.
