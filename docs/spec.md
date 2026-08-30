# Especificación de Requerimientos - AyVino

Este documento detalla el alcance funcional, el valor de negocio (El porqué) y los criterios de aceptación para la plataforma AyVino, una red social para catalogar, reseñar y organizar vinos.

---

## Requisitos Funcionales (EARS Syntax)

### 1. Gestión del Catálogo de Vinos y Bodegas

* **RF-1.1 (Event-driven)**: Cuando una bodega registrada publique un vino, el sistema deberá agregarlo al catálogo oficial de la bodega.
  * **Por qué**: Para que las bodegas tengan el control de la información oficial de sus productos.
* **RF-1.2 (Event-driven)**: Cuando un usuario tome la foto de una botella y esta no exista en el catálogo oficial, el sistema deberá extraer los datos mediante reconocimiento de imagen o permitir que el usuario los ingrese manualmente.
  * **Por qué**: Para facilitar la catalogación rápida de vinos sin bloquear la interacción del usuario.
* **RF-1.3 (State-driven)**: Mientras un vino sea creado por un usuario y no por una bodega oficial, el sistema deberá marcar el producto con la etiqueta "Agregado por la comunidad".
  * **Por qué**: Para que el resto de los usuarios puedan distinguir el contenido verificado del contenido generado por usuarios.
* **RF-1.4 (State-driven)**: Mientras una bodega mencionada por la comunidad no esté registrada en la plataforma, el sistema deberá limitar la visualización de la bodega únicamente a los datos aportados por los usuarios.
  * **Por qué**: Para evitar mostrar perfiles de bodegas vacíos o incompletos antes de que se unan oficialmente.
* **RF-1.5 (Event-driven)**: Cuando una bodega nueva se registre en el sistema y suba su catálogo oficial, el sistema deberá dar de baja los vinos duplicados de la comunidad y reasociar todas sus reseñas e historial de calificaciones a los nuevos vinos oficiales de la bodega.
  * **Por qué**: Para unificar y limpiar el catálogo sin perder las interacciones y opiniones de los usuarios históricos.
* **RF-1.6 (Unwanted Behavior)**: Si un usuario intenta crear un vino de la comunidad sin completar los datos obligatorios (nombre y bodega), el sistema deberá denegar la creación e indicar los campos faltantes.
  * **Por qué**: Para mantener un estándar mínimo de calidad y legibilidad en los datos del catálogo.

### 2. Reseñas e Interacciones

* **RF-2.1 (Ubiquitous)**: El sistema deberá permitir a los usuarios calificar cualquier vino utilizando una escala numérica y una reseña en formato de texto.
  * **Por qué**: Para que la comunidad pueda compartir opiniones detalladas y cuantificables que sirvan de guía a otros usuarios.
* **RF-2.2 (Ubiquitous)**: El sistema deberá permitir a los usuarios marcar que un vino "les gustó" (interacción rápida de me gusta).
  * **Por qué**: Para proporcionar una métrica ágil de popularidad del vino.

### 3. Colecciones Personales

* **RF-3.1 (Ubiquitous)**: El sistema deberá permitir a los usuarios agregar vinos a colecciones personales con estados fijos (como "Favoritos" o "Por Probar").
  * **Por qué**: Para que los usuarios puedan llevar un registro organizado y rápido de su experiencia y deseos vinícolas.

---

## Fuera de Alcance (Out of Scope)

* **Creación de Colecciones Personalizadas**: El usuario no podrá crear listas con nombres dinámicos (ej: "Vinos para Navidad"); las listas son fijas en esta primera fase.
* **Mensajería Interna**: No se contempla la comunicación directa por chat entre usuarios ni entre usuarios y bodegas.
* **Pasarela de Compra**: No se gestionarán ventas directas de vinos ni reservas a través de la aplicación.
* **Verificación Legal de Identidad de Bodega**: El proceso administrativo/legal de verificar si una bodega es real queda fuera de la automatización del software en esta etapa.

---

## Criterios de Finalización (Completion Criteria)

1. **Catálogo Operativo**: Capacidad de registrar bodegas oficiales, subir sus catálogos, y permitir a los usuarios comunes cargar botellas inexistentes.
2. **Migración de Reseñas**: El proceso de deduplicación y traspaso de reseñas de vinos comunitarios a vinos oficiales funciona de manera consistente y sin pérdida de datos.
3. **Organización del Usuario**: Los usuarios pueden guardar vinos en sus listas fijas y calificarlos numéricamente.
