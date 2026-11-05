# Backlog Técnico de Backend - AyVino

Este documento recopila deudas técnicas, optimizaciones planificadas y tareas de mantenimiento diferidas identificadas durante el desarrollo de las funcionalidades de la plataforma.

---

## 1. Almacenamiento y Gestión de Imágenes (Supabase Storage)

### 1.1 Limpieza de Imágenes Reemplazadas
- **Contexto**: Cuando el dueño de una bodega o un administrador actualiza el `logo_url` de una bodega (`PUT /api/wineries/{id}`) o el `image_url` de una cosecha (`PUT /api/wines/{wineId}/vintages/{vintageId}`), la URL anterior queda desvinculada en la base de datos pero el archivo físico permanece en el bucket de Supabase Storage.
- **Solución Propuesta**:
  - Incorporar en `IImageStorage` un método `Task<bool> DeleteAsync(string fileUrl, CancellationToken ct)`.
  - Al actualizar exitosamente un logo o imagen de botella con un nuevo valor, invocar el borrado del archivo anterior si pertenecía al bucket oficial.
  - Asegurar que la falla en el borrado físico (por timeouts de red o errores transitorios) se registre en los logs sin interrumpir la transacción ni la respuesta exitosa al cliente.

### 1.2 Limpieza de Imágenes Huérfanas (Subidas sin Asociar)
- **Contexto**: Un usuario autenticado puede subir una imagen mediante `POST /api/images`, obteniendo una URL válida, pero posteriormente abandonar el formulario de creación o edición sin guardar la bodega o añada. Estos archivos quedan "huérfanos" en el bucket consumiendo cuota de almacenamiento.
- **Solución Propuesta**:
  - Implementar un proceso de mantenimiento en segundo plano (ej: `IHostedService` o un Job programado diario) o una Supabase Edge Function / cron job.
  - El job lista los objetos en las carpetas `wineries/` y `vintages/` con fecha de creación superior a un umbral (ej: más de 24 horas).
  - Cruza los nombres de archivo contra las columnas `wineries.logo_url` y `wine_vintages.image_url` en la base de datos PostgreSQL.
  - Si un archivo de más de 24 horas no está referenciado por ninguna entidad activa, se elimina del bucket.

### 1.3 Redimensionamiento y Optimización de Imágenes
- **Contexto**: Actualmente se valida un tamaño máximo de 2 MB y formatos WebP, PNG y JPEG.
- **Solución Propuesta**: Evaluar el uso de Supabase Image Transformation (redimensionamiento al vuelo mediante URLs firmadas o parámetros de query como `width`, `height`, `quality`) o generar miniaturas (thumbnails) optimizadas para listados de catálogo y cards móviles.

