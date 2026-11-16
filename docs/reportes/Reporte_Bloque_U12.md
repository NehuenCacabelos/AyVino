# BLOQUE U12: Imágenes de vinos uniformes y sin pérdida de datos
**Rama**: `fix/imagenes-vino-presentacion`  
**Fecha**: 14 de noviembre de 2026  
**Estado**: Completado exitosamente

---

## 1. Resumen de lo realizado
- **Investigación Previa Completa (12.1)**: Identificación exhaustiva de los puntos de construcción y consumo de URLs de entrega de Cloudinary, verificación de no alteración destructiva en el upload y confirmación de que la base de datos almacena únicamente IDs externos sin transformaciones.
- **Centralización de Variantes de Entrega (12.2)**: Construcción de URLs en `CloudinaryImageStorage.cs` y helper `imageUrl` en `src/frontend/src/lib/image.ts`. Eliminación total de efectos destructivos (`e_make_transparent`, `b_transparent`, `bgremoval`).
  - `card`: `e_trim:10/c_fit,w_680,h_880/c_pad,w_800,h_1000,b_white/f_auto,q_auto`
  - `detail`: `e_trim:10/c_fit,w_1020,h_1320/c_pad,w_1200,h_1500,b_white/f_auto,q_auto`
  - `thumb`: `e_trim:10/c_fit,w_136,h_176/c_pad,w_160,h_200,b_white/f_auto,q_auto`
- **Aplicación de Variantes (12.3)**: Implementación de la variante correspondiente en todas las vistas de usuario:
  - `card`: Tarjetas de catálogo (`WineCard`), dashboard (`DashboardWineCard`), cava (`VaultWineCard`), vitrinas de perfil (`ShowcaseWineBottle`).
  - `detail`: Imagen principal de la ficha del vino (`WineDetailView`) y adaptadores editoriales (`apiWineToEditorial`).
  - `thumb`: Buscador / sugerencias de dashboard (`QuickActions`), historial de catas y favoritos en `ProfilePage`.
- **Layout del Frontend (12.4)**:
  - Contenedor con relación de aspecto 4:5 (`aspect-[4/5]`), fondo blanco (`bg-white` / `#fff`), bordes redondeados (`rounded-lg` / `rounded-2xl`) y `overflow-hidden`.
  - Botellas renderizadas con `w-full h-full object-contain` llenando armoniosamente el escenario sin halos oscuros ni bordes discordantes.
  - Cards de catálogo y dashboard con altura uniforme (`items-stretch`, título `line-clamp-2 min-h-[3.5rem]` / `min-h-[3.25rem]`).
  - Manejo de fallback elegante con `WineBottleSilhouette` / `BottleVector` reservando exactamente la misma relación 4:5 ante carga o error (`onError`).
- **Verificación HTTP Real (12.5)**: Verificación contra Cloudinary con la imagen real de desarrollo `3f450403-f4eb-41b7-bc1a-df5afe4235fe` (Colección Cabernet 2023), comprobando HTTP 200, dimensiones de lienzo exactas (800x1000, 1200x1500, 160x200) y ausencia total de `e_make_transparent`.
- **Tests de Regresión y Nuevos Tests (12.6)**: Tests unitarios en xUnit (`UsuarioBloqueU12Tests.cs`) y Vitest (`WineImageBloqueU12.test.tsx` y `image.test.ts`), garantizando el formato de URLs, fallbacks, invariabilidad ante entradas vacías y ausencia de transformaciones destructivas.

---

## 2. Investigación previa (12.1)
### a) Dónde se arma y consume la URL de Cloudinary
- **Backend - Servicio de Storage**:
  - `src/backend/AyVino.Api/Features/Images/Services/CloudinaryImageStorage.cs` (Líneas 93-152): método `BuildDeliveryUrl(string? externalId, string? variant)`. Es el único componente del backend donde se construyen las URLs de Cloudinary invocando `CloudinaryClientWrapper.BuildUrl`.
- **Backend - Endpoint de Redirección**:
  - `src/backend/AyVino.Api/Features/Images/Endpoints/ImageEndpoints.cs` (Líneas 25-61): `GET /api/images/{id}?variant=...` valida la variante y redirige con HTTP 302 a la URL de Cloudinary con encabezado `Cache-Control: public, max-age=604800`.
- **Backend - Repositorios SQL (armado de URLs relativas)**:
  - `src/backend/AyVino.Api/Features/Wines/Repositories/WineRepository.cs` (Línea 540): `CASE WHEN img.id IS NOT NULL THEN '/api/images/' || img.id || '?variant=card' ELSE NULL END`.
  - `src/backend/AyVino.Api/Features/UserWines/Repositories/UserWineRepository.cs` (Línea 29): `CASE WHEN img.id IS NOT NULL THEN '/api/images/' || img.id || '?variant=card' ELSE NULL END`.
- **Frontend - Helper de Centralización**:
  - `src/frontend/src/lib/image.ts`: función `imageUrl(imageId, variant)` con control de versionado (`v=3`) para invalidar cachés previas.
- **Frontend - Consumidores**:
  - `src/frontend/src/features/wines/components/WineCard.tsx` (Línea 45) -> `imageUrl(wine.imageId, 'card')`
  - `src/frontend/src/features/dashboard/components/DashboardWineCard.tsx` (Línea 38) -> `imageUrl(wine.imageId, 'card')`
  - `src/frontend/src/features/cava/components/VaultWineCard.tsx` (Línea 51) -> `imageUrl(item.imageId, 'card')`
  - `src/frontend/src/features/wines/components/WineDetailView.tsx` (Línea 45) -> `imageUrl(activeVintage.imageId, 'detail')`
  - `src/frontend/src/features/dashboard/components/QuickActions.tsx` (Línea 125) -> `imageUrl(wine.imageId, 'thumb')`
  - `src/frontend/src/pages/ProfilePage.tsx`:
    - `ShowcaseWineBottle` (Línea 215) -> `variant = 'card'`
    - Historial de catas (Línea 297) -> `variant="thumb"`
    - Favoritos (Línea 321) -> `variant="thumb"`
    - Showcase de bodega/cava (Línea 348) -> `variant="card"`
  - `src/frontend/src/pages/CavaPage.tsx` (Línea 387) -> `imageUrl(item.imageId, 'card')`
  - `src/frontend/src/features/wines/adapters/apiWineToEditorial.ts` (Línea 122) -> `imageUrl(v.imageId, 'detail')`
  - `src/frontend/src/features/wines/utils/wineMapper.ts` (Línea 32) -> `imageUrl(vintage.imageId, 'card')`

### b) Código de subida y configuración
- En `CloudinaryImageStorage.cs` (método `UploadAsync`, líneas 50-58):
  ```csharp
  var uploadParams = new ImageUploadParams
  {
      File = new FileDescription(fileName, stream),
      PublicId = publicId,
      AssetFolder = "vinos",
      Overwrite = false,
      UseFilename = false,
      UniqueFilename = false
  };
  ```
- **Conclusión sobre transformaciones entrantes**: **NO** se aplica ninguna transformación entrante (ni `Transformation`, ni `EagerTransforms`, ni `upload_preset`).
- **Estado de los originales**: Los originales subidos a Cloudinary están limpios, intactos y preservan su resolución y fondo nativo. Ninguna imagen existente requiere volver a subirse.
- **Nombres de claves en `user-secrets`** (sin valores expuestos):
  - `Cloudinary:Environment`
  - `Cloudinary:CloudName`
  - `Cloudinary:ApiSecret`
  - `Cloudinary:ApiKey`
  - `Supabase:Url`
  - `Supabase:ServiceRoleKey`
  - `Supabase:Bucket`
  - `Jwt:SecretKey`
  - `Jwt:Issuer`
  - `Jwt:Audience`
  - `ConnectionStrings:DefaultConnection`

### c) Almacenamiento en Base de Datos
- La tabla `images` almacena únicamente `id` (UUID), `external_id` (varchar), `url` (varchar) y metadatos técnicos (`content_type`, `byte_size`). Las entidades (`wine_vintages`, `wineries`, `users`) referencian `image_id` como clave foránea.
- La base de datos **no almacena cadenas de transformación**. Las transformaciones se construyen puramente al vuelo en la entrega. Por lo tanto, no se requiere ninguna migración relacional destructiva.

---

## 3. Verificación HTTP obligatoria (12.5)
- **Imagen evaluada**: `3f450403-f4eb-41b7-bc1a-df5afe4235fe` (Colección Cabernet 2023) en nube `mjtoodpf`.
- **Resultados de las 3 variantes**:
  1. `card`:
     - URL: `https://res.cloudinary.com/mjtoodpf/image/upload/e_trim:10/c_fit,w_680,h_880/c_pad,w_800,h_1000,b_white/f_auto,q_auto/vinos/3f450403-f4eb-41b7-bc1a-df5afe4235fe`
     - Código HTTP: `200 OK`
     - Dimensiones decodificadas: **800 x 1000 px** (proporción 4:5 exacta).
     - Ausencia de `e_make_transparent`: Confirmada.
  2. `detail`:
     - URL: `https://res.cloudinary.com/mjtoodpf/image/upload/e_trim:10/c_fit,w_1020,h_1320/c_pad,w_1200,h_1500,b_white/f_auto,q_auto/vinos/3f450403-f4eb-41b7-bc1a-df5afe4235fe`
     - Código HTTP: `200 OK`
     - Dimensiones decodificadas: **1200 x 1500 px** (proporción 4:5 exacta).
     - Ausencia de `e_make_transparent`: Confirmada.
  3. `thumb`:
     - URL: `https://res.cloudinary.com/mjtoodpf/image/upload/e_trim:10/c_fit,w_136,h_176/c_pad,w_160,h_200,b_white/f_auto,q_auto/vinos/3f450403-f4eb-41b7-bc1a-df5afe4235fe`
     - Código HTTP: `200 OK`
     - Dimensiones decodificadas: **160 x 200 px** (proporción 4:5 exacta).
     - Ausencia de `e_make_transparent`: Confirmada.
- **Comparación Visual en Ficha**:
  - *Antes*: El efecto `e_make_transparent:10` perforaba las partes blancas o claras de la etiqueta de la botella, destruyendo tipografías finas y dejando un halo grisáceo/oscuro contra el fondo de la página. La botella quedaba además reducida y descentrada.
  - *Después*: El escenario blanco limpio de proporción 4:5 integra naturalmente la botella fotográfica. Las etiquetas conservan el 100% de su contraste, legibilidad y detalles originales sin perforación alguna, logrando una presentación sobria y profesional.

---

## 4. Archivos modificados y creados
- **Backend Modificados**:
  - `src/backend/AyVino.Api/Features/Images/Services/CloudinaryImageStorage.cs`: Constantes de transformación `card`, `detail`, `thumb`, fallback a `card`, soporte retrocompatible de `avatar`, `logo`, `banner`.
  - `src/backend/AyVino.Api/Features/Images/Endpoints/ImageEndpoints.cs`: Variantes permitidas (`card`, `detail`, `thumb`), redirect 302 y header de caché.
  - `src/backend/AyVino.Api/Features/Wines/Repositories/WineRepository.cs`: Actualización de `?variant=bottle` a `?variant=card`.
  - `src/backend/AyVino.Api/Features/UserWines/Repositories/UserWineRepository.cs`: Actualización de `?variant=bottle` a `?variant=card`.
- **Backend Tests Modificados y Creados**:
  - `tests/AyVino.UnitTests/UsuarioBloqueU12Tests.cs` (CREADO): 6 tests unitarios xUnit validando URLs de variantes, fallback, external_id vacío, ausencia de transformaciones destructivas y redirección HTTP con caché.
  - `tests/AyVino.UnitTests/UsuarioBloqueU7Tests.cs`: Adaptación a las nuevas variantes sin `e_make_transparent`.
  - `tests/AyVino.UnitTests/CloudinaryImageStorageTests.cs`: Adaptación a las nuevas variantes.
  - `tests/AyVino.UnitTests/ImageStorageTests.cs`: Adaptación de mocks a variantes normalizadas.
- **Frontend Modificados**:
  - `src/frontend/src/lib/image.ts`: Helper centralizado con soporte para `card`, `detail`, `thumb`, fallback a `card`, compatibilidad con `bottle` para bodega y versión de caché `v=3`.
  - `src/frontend/src/features/wines/components/WineCard.tsx`: Contenedor 4:5 blanco, `object-contain`, fallback con silueta, título con `line-clamp-2 min-h-[3.5rem]`, altura homogénea en grilla.
  - `src/frontend/src/features/dashboard/components/DashboardWineCard.tsx`: Contenedor 4:5 blanco, `object-contain`, botón de favorito en `z-20`, fallback con vector.
  - `src/frontend/src/features/cava/components/VaultWineCard.tsx`: Contenedor 4:5 blanco, badges de alta visibilidad, fallback con vector.
  - `src/frontend/src/features/wines/components/WineDetailView.tsx`: Escenario principal 4:5 blanco (`aspect-[4/5] bg-white rounded-2xl`), botella ocupando el marco, fallback con silueta.
  - `src/frontend/src/features/dashboard/components/QuickActions.tsx`: Sugerencias con variante `thumb` en contenedor 4:5 blanco.
  - `src/frontend/src/pages/ProfilePage.tsx`: Showcase en variante `card`, historial y favoritos en variante `thumb`.
  - `src/frontend/src/pages/CavaPage.tsx`: Mapeo de ítems con variante `card`.
  - `src/frontend/src/features/wines/adapters/apiWineToEditorial.ts`: Uso de variante `detail`.
  - `src/frontend/src/features/wines/utils/wineMapper.ts`: Uso de variante `card`.
- **Frontend Tests Modificados y Creados**:
  - `src/frontend/tests/lib/image.test.ts`: 6 tests unitarios verificando `card`, `detail`, `thumb`, fallback y versionado.
  - `src/frontend/tests/features/wines/WineImageBloqueU12.test.tsx` (CREADO): 12 tests verificando variantes en componentes (`WineCard`, `DashboardWineCard`, `VaultWineCard`, `WineDetailView`), proporciones 4:5, fondos blancos y disparos de fallback en `onError`.
  - `src/frontend/tests/pages/__snapshots__/WineDetailPage.snapshot.test.tsx.snap`: Actualizado con `-u` reflejando las nuevas clases del contenedor escénico 4:5.

---

## 5. Decisiones técnicas y áreas fuera de alcance (12.7)
- **Tolerancia de recorte `e_trim:10`**: Se evaluó con imágenes reales y demostró ser el balance ideal: remueve los excesos de márgenes blancos vacíos sin tocar ni recortar siluetas ni etiquetas de botellas.
- **Preservación de áreas protegidas**:
  - Las variantes `avatar`, `logo` y `banner` se mantienen intactas en `CloudinaryImageStorage.cs`.
  - En `src/frontend/src/lib/image.ts`, la variante `'bottle'` se preservó para mantener total retrocompatibilidad con las pantallas del perfil de bodega (`features/winery/**`, `publicCatalogAdapter`), mapeando a la entrega segura sin afectar áreas protegidas.
  - No se tocaron las vistas de Maridajes (`pages/PairingPage.tsx`, `features/pairings/**`, etc.), panel de administración ni perfiles de bodega.
- **Fallas preexistentes sin relación con el bloque**:
  - `npm run lint` reporta advertencias/errores preexistentes sobre `react-hooks/set-state-in-effect` en `src/frontend/src/features/wines/hooks/useRealWine.ts`, `src/frontend/src/features/wines/hooks/useWineCatalogs.ts` y `src/frontend/src/features/winery/pages/WineryDashboardPage.tsx`. No fueron alteradas por no corresponder al alcance del Bloque U12.

---

## 6. Resultado de verificaciones
- `dotnet build`: 0 errores, 0 advertencias.
- `dotnet test`: **795/795 tests superados** (0 fallas).
- `npm run build`: Compilación TypeScript (`tsc -b`) y empaquetado Vite (`vite build`) exitosos en 712ms sin errores.
- `npm test -- --run`: **66 suites / 332 tests superados** (0 fallas, 100% éxito).
- Verificación de Cloudinary en vivo: Códigos HTTP 200 con dimensiones exactas en las 3 variantes.

---

## 7. Pendientes
- Ninguno. Listo para revisión y merge por Kevin a `fix/usuario-reparaciones`.
