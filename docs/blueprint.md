# **App Name**: TiempoJuntos

## Core Features:

- Disponibilidad Personalizada: Los usuarios pueden agregar y gestionar su lista de 'amigos' (participantes), asignando un nombre único a cada uno.
- Definición de Horarios: Permite a cada participante añadir rangos horarios específicos para cada día de la semana. El sistema los normaliza automáticamente a bloques de 30 minutos y fusiona rangos superpuestos.
- Cálculo de Mejor Opción: Identifica y presenta el bloque horario óptimo donde la mayoría (o todos) los participantes tienen disponibilidad, priorizando el número máximo de asistentes.
- Alternativas de Horario: Muestra un listado de bloques horarios alternativos clasificados por la cantidad de participantes disponibles, útil cuando no hay un momento que funcione para todos.
- Persistencia de Datos Local: Guarda automáticamente toda la configuración de participantes y sus disponibilidades directamente en el navegador del usuario (sin necesidad de cuentas de usuario).
- Compartir y Reanudar (JSON): Funcionalidad para exportar el estado actual del calendario como un archivo JSON y la capacidad de importar un JSON, facilitando compartir la configuración entre usuarios o dispositivos.

## Style Guidelines:

- Esquema de color oscuro: Predomina un fondo muy oscuro (RGB: 16, 17, 21 - #101115) que transmite una sensación moderna y nítida.
- Color primario: Un índigo profundo y vibrante (RGB: 82, 64, 224 - #5240E0) para elementos clave como botones de acción y énfasis visual, creando un contraste dinámico con el fondo oscuro.
- Color de acento: Un azul brillante y enérgico (RGB: 25, 170, 240 - #19AAF0) para resaltados secundarios, enlaces o indicadores interactivos.
- Headline font: 'Space Grotesk' (sans-serif) para títulos y elementos de gran impacto, aportando un toque tecnológico y distintivo.
- Body font: 'Inter' (sans-serif) para todo el texto de contenido, asegurando una legibilidad excelente y un aspecto contemporáneo y objetivo.
- Data and Monospace font: 'Source Code Pro' (monospace sans-serif) para la visualización de horas, fechas y chips, ofreciendo claridad en datos estructurados.
- Utilizar un conjunto de iconos vectoriales minimalistas y consistentes que refuercen la funcionalidad, además de mantener emojis expresivos para estados y chips informativos.
- Diseño adaptable de dos columnas que se ajusta a una sola columna en pantallas pequeñas. La información principal se organiza en 'tarjetas' distintivas con bordes sutiles y efectos de sombra.
- Implementar microinteracciones como sutiles transiciones de 'hover' en botones y animaciones ligeras para la adición o eliminación de elementos, mejorando la respuesta visual.