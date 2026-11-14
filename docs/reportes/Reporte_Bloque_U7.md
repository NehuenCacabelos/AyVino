# Reporte de Implementación — Bloque U7: Botellas sin fondo blanco (solo imágenes de vinos)

**Fecha:** 14 de Noviembre de 2026  
**Rama:** `fix/usuario-imagen-botella` (fusionada en `fix/usuario-reparaciones`)  
**Autor:** Antigravity AI Agent  
**Estado:** Finalizado con éxito — 100% verificado y listo para revisión por Kevin

---

## 1. Resumen Ejecutivo
El Bloque U7 soluciona la visualización de fotos de botellas con fondo blanco sobre el tema oscuro de la aplicación:
1. **Transformación Cloudinary Atómica**:
   - Para la variante `bottle`, se incorporó el efecto `make_transparent` (`e_make_transparent:{tolerancia}`) como primera transformación de la cadena, encadenado antes del relleno `pad` (`c_pad`) preexistente.
   - Tolerancia parametrizada con valor por defecto 10 (`BottleBackgroundTolerance`), configurable dinámicamente desde `Cloudinary:BottleBackgroundTolerance` sin recompilar.
   - Las variantes `avatar`, `logo`, `banner` y por defecto (sin variante) permanecen **100% inalteradas**.
2. **Invalidación de Caché en Frontend**:
   - En `src/frontend/src/lib/image.ts`, la variante `bottle` ahora incluye el parámetro de versión `&v=2` (`BOTTLE_IMAGE_VERSION = 2`), forzando a los navegadores a invalidar su caché de 7 días (`Cache-Control: public, max-age=604800`) y descargar la nueva entrega transparente.
   - Las demás variantes no llevan parámetro de versión.
   - El endpoint `GET /api/images/{id}` ignora de forma nativa los parámetros de consulta extra sin producir error.

---

## 2. Comparativa de URLs de Entrega en Cloudinary

### Variante `bottle` (Vinos)
- **URL Antes:**
  `https://res.cloudinary.com/test-cloud/image/upload/b_transparent,c_pad,f_auto,h_1200,q_auto,w_600/v1/vinos/cosecha-2021`
- **URL Después:**
  `https://res.cloudinary.com/test-cloud/image/upload/e_make_transparent:10/b_transparent,c_pad,f_auto,h_1200,q_auto,w_600/v1/vinos/cosecha-2021`

### Confirmación de Variantes Inalteradas
- **`avatar`**:
  `https://res.cloudinary.com/test-cloud/image/upload/c_thumb,f_auto,g_face,h_256,q_auto,w_256/sample-image-id` *(Idéntica, sin `e_make_transparent`)*
- **`logo`**:
  `https://res.cloudinary.com/test-cloud/image/upload/b_transparent,c_pad,f_auto,h_400,q_auto,w_400/sample-image-id` *(Idéntica, sin `e_make_transparent`)*
- **`banner`**:
  `https://res.cloudinary.com/test-cloud/image/upload/c_fill,f_auto,g_auto,h_640,q_auto,w_1920/sample-image-id` *(Idéntica, sin `e_make_transparent`)*
- **Sin variante (`null`)**:
  `https://res.cloudinary.com/test-cloud/image/upload/f_auto,q_auto/sample-image-id` *(Idéntica, sin `e_make_transparent`)*

---

## 3. Archivos Modificados y Creados
- **Modificados Backend:**
  - `src/backend/AyVino.Api/Features/Images/Configuration/CloudinaryOptions.cs`: incorporación de `BottleBackgroundTolerance = 10`.
  - `src/backend/AyVino.Api/Features/Images/Services/CloudinaryImageStorage.cs`: constante `BottleBackgroundTolerance = 10`, cadena `.Effect($"make_transparent:{tolerance}").Chain()` previa a `pad`.
  - `src/backend/AyVino.Api/appsettings.json`: configuración de la opción no secreta `Cloudinary:BottleBackgroundTolerance = 10`.
- **Modificados Frontend:**
  - `src/frontend/src/lib/image.ts`: constante `BOTTLE_IMAGE_VERSION = 2` y concatenación de `&v=2` exclusivo para `bottle`.
  - `src/frontend/tests/lib/image.test.ts`: actualización de pruebas para validar versión exclusiva en `bottle`.
- **Creados Backend:**
  - `tests/AyVino.UnitTests/UsuarioBloqueU7Tests.cs`: 4 pruebas unitarias que validan la transformación de `bottle`, las cadenas exactas de las otras variantes, la tolerancia configurada y el soporte de parámetros extra en el endpoint de entrega.

---

## 4. Resultado de Verificaciones
- **Backend .NET (`dotnet build`)**: 0 errores, 0 advertencias.
- **Pruebas Unitarias .NET (`dotnet test`)**: 758/758 pruebas superadas (4 nuevas en `UsuarioBloqueU7Tests`).
- **Compilación Frontend (`npm run build`)**: Exitosa en 823 ms.
- **Pruebas Frontend Vitest (`npm test`)**: 290/290 pruebas superadas (4 pruebas en `tests/lib/image.test.ts`).
- **Linter Frontend (`npm run lint`)**: 0 errores en código creado/modificado.
