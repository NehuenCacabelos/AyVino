# Reporte de Usuario - Bloque U1 (A)
**Título**: USUARIO — BLOQUE U1: Backend de búsqueda, filtros y alta rápida  
**Rama**: `fix/usuario-backend-busqueda`  
**Fecha y hora**: 2026-11-13  

---

## 1. Resumen de lo realizado

### 1.1 Clave de búsqueda normalizada
- Se implementó `WineLabelNormalizer.ToSearchKey(string?)`, el cual normaliza acentos, sustituye `ñ` por `n`, elimina signos de puntuación, colapsa y remueve todos los espacios (ejemplo: `"Otro Loco Más"` → `"otrolocomas"`).
- Se implementó la función `WineLabelNormalizer.TrigramSimilarity(string?, string?)` compatible con la heurística de trigramas de PostgreSQL para ordenamiento y comparación en memoria.
- Se implementaron métodos centralizados `ComputeWineKeys` y `ComputeWineryKey` en `WineLabelNormalizer`.
- Se creó la migración consecutiva `M20261030003_AddSearchKeysAndTrgmIndexes.cs` (versión `20261030003`), agregando:
  - `wines.name_key` (text, nullable)
  - `wines.winery_text_key` (text, nullable)
  - `wineries.name_key` (text, nullable)
  - Población de registros existentes vía C# con `Execute.WithConnection`.
  - Creación de índices GIN `ix_wines_name_key_trgm`, `ix_wines_winery_text_key_trgm` e `ix_wineries_name_key_trgm` con operador `gin_trgm_ops`.
- Se centralizó el mantenimiento de claves en:
  - Alta y edición de vino (`WineRepository.CreateWithFirstVintageAsync` y `UpdateAsync`).
  - Alta rápida de cava (`CellarItemService.QuickAddAsync`).
  - Alta y edición de bodega (`WineryRepository.CreateAsync` y `UpdateAsync`).

### 1.2 Búsqueda tolerante en `GET /api/wines/search`
- Validación de longitud del parámetro `search`: si la clave normalizada tiene menos de 2 caracteres, no devuelve resultados (`return []`).
- Coincidencia si `w.name_key`, `wy.name_key` o `w.winery_text_key` contienen la clave o si la similitud trigram supera el umbral `0.3` (`SearchSimilarityThreshold`).
- Ranking de relevancia estricto:
  1. Coincidencia exacta de clave (`Score = 4`).
  2. Empieza con la clave (`Score = 3`).
  3. Contiene la clave (`Score = 2`).
  4. Mayor similitud trigram > 0.3 (`Score = 1`).
  5. Desempate por valor cuantitativo de similitud, seguido por cantidad de reseñas (`review_count DESC`), suma de puntaje (`rating_sum DESC`), orden alfabético (`name ASC`) e identificador.
- Cubiertos los casos de prueba: `"otrolocomas"` (exacto), `"oto loco mas"` (error de tipeo / similitud trigram > 0.3) y `"otro lo"` (prefijo).

### 1.3 Filtros del servidor en `GET /api/wines/search`
- Se incorporaron los parámetros opcionales `grapeId`, `stateId` y `wineryId`.
  - `grapeId`: verifica que el vino cuente con dicha uva en alguna cosecha visible en el catálogo.
  - `stateId`: filtra por provincia efectiva del vino mediante `COALESCE(s.id, wy_s.id) = @StateId` (misma resolución de `RegionName`).
  - `wineryId`: filtra por bodega registrada (`w.winery_id = @WineryId`).
- Todos combinables entre sí y con `search` y `wineType`.

### 1.4 `GET /api/catalog/filters`
- Se creó la nueva feature `Features/Catalog` siguiendo la arquitectura Vertical Slice:
  - `Features/Catalog/DTOs`: `CatalogFilterItemDto`, `CatalogFiltersResponseDto`.
  - `Features/Catalog/Repositories`: `ICatalogRepository`, `CatalogRepository`.
  - `Features/Catalog/Services`: `ICatalogService`, `CatalogService`.
  - `Features/Catalog/Endpoints`: `CatalogEndpoints.cs`.
- Devuelve `{ grapes, provinces, wineries }` con `{ id, name, wineCount }` únicamente para vinos visibles del catálogo, ordenados alfabéticamente por nombre.
- Caché en memoria de 5 minutos mediante `IMemoryCache`.
- Acceso anónimo (`AllowAnonymous`).

### 1.5 `GET /api/search/suggestions?q=`
- Endpoint anónimo en `Features/Catalog` con parámetro `q`.
- Con menos de 2 caracteres devuelve listas vacías.
- Retorna hasta 3 elementos por grupo:
  - `wines`: `{ id, name, wineryName, vintage, imageId }`.
  - `wineries`: `{ id, name, logoImageId, location }` (solo bodegas registradas con vinos visibles).
  - `grapes` y `regions`: listas comparadas y filtradas en memoria a partir de los filtros cacheados, evaluando coincidencia por `Contains` y `TrigramSimilarity > 0.3`, ordenadas por relevancia y limitadas a 3.

### 1.6 Catálogo: campos nuevos
- `CatalogWineItemDto` incorporó el campo `Guid? WineryLogoImageId` resuelto mediante `LEFT JOIN wineries wy ON wy.id = w.winery_id` seleccionando `wy.logo_image_id`.

### 1.7 Alta rápida: uva principal
- `QuickAddCellarWineRequestDto` sumó `int? MainGrapeId = null`.
- Al crear un vino nuevo comunitario (`MatchedWineId` vacío):
  - Tinto y Blanco: `MainGrapeId` obligatorio ("La uva principal es obligatoria para vinos tintos y blancos.").
  - Rosado, Espumoso y Naranjo: opcional.
  - Validación de existencia de uva vía `IGrapeRepository`.
  - Tinto exige uva de tipo tinta (`ColorType.Red`).
  - Naranjo exige uva blanca o de piel rosada (`ColorType.White` o `ColorType.Rose`).
  - La cosecha comunitaria se crea asociada a la uva al 100% y en estado pendiente de moderación (`ApprovalStatus.Pending`).
  - La respuesta (`CellarItemResponseDto`) garantiza el retorno de `WineId` y `WineVintageId`.

### 1.8 Permiso de imagen en cosecha comunitaria
- En `ImageOrchestrator.AuthorizeVintageModificationAsync`, se otorgó permiso de subida de imagen al usuario creador de la cosecha (`vintage.UploadedByUserId == actor.UserId`) cuando el vino es comunitario o la cosecha está pendiente. Se mantiene el 403 Forbidden para usuarios ajenos.

---

## 2. Archivos tocados y creados

### Archivos Creados
- `src/backend/AyVino.Api/Migrations/M20261030003_AddSearchKeysAndTrgmIndexes.cs`
- `src/backend/AyVino.Api/Features/Catalog/DTOs/CatalogFilterItemDto.cs`
- `src/backend/AyVino.Api/Features/Catalog/DTOs/CatalogFiltersResponseDto.cs`
- `src/backend/AyVino.Api/Features/Catalog/DTOs/WineSuggestionDto.cs`
- `src/backend/AyVino.Api/Features/Catalog/DTOs/WinerySuggestionDto.cs`
- `src/backend/AyVino.Api/Features/Catalog/DTOs/SearchSuggestionsResponseDto.cs`
- `src/backend/AyVino.Api/Features/Catalog/Repositories/ICatalogRepository.cs`
- `src/backend/AyVino.Api/Features/Catalog/Repositories/CatalogRepository.cs`
- `src/backend/AyVino.Api/Features/Catalog/Services/ICatalogService.cs`
- `src/backend/AyVino.Api/Features/Catalog/Services/CatalogService.cs`
- `src/backend/AyVino.Api/Features/Catalog/Endpoints/CatalogEndpoints.cs`
- `tests/AyVino.UnitTests/UsuarioBloqueU1Tests.cs`

### Archivos Modificados
- `src/backend/AyVino.Api/Features/Wines/WineLabelNormalizer.cs`
- `src/backend/AyVino.Api/Features/Wines/Models/Wine.cs`
- `src/backend/AyVino.Api/Features/Wineries/Models/Winery.cs`
- `src/backend/AyVino.Api/Features/Wineries/Repositories/WineryRepository.cs`
- `src/backend/AyVino.Api/Features/Wines/Repositories/IWineRepository.cs`
- `src/backend/AyVino.Api/Features/Wines/Repositories/WineRepository.cs`
- `src/backend/AyVino.Api/Features/Wines/Services/IWineService.cs`
- `src/backend/AyVino.Api/Features/Wines/Services/WineService.cs`
- `src/backend/AyVino.Api/Features/Wines/Endpoints/WineEndpoints.cs`
- `src/backend/AyVino.Api/Features/Wines/DTOs/CatalogWineItemDto.cs`
- `src/backend/AyVino.Api/Features/Cellars/DTOs/QuickAddCellarWineRequestDto.cs`
- `src/backend/AyVino.Api/Features/Cellars/Services/CellarItemService.cs`
- `src/backend/AyVino.Api/Features/Images/Services/ImageOrchestrator.cs`
- `src/backend/AyVino.Api/Program.cs`
- `tests/AyVino.UnitTests/CellarItemServiceTests.cs`
- `tests/AyVino.UnitTests/WineOptimizationTests.cs`
- `tests/AyVino.UnitTests/WineServiceTests.cs`

---

## 3. Decisiones técnicas
1. **Versión de migración**: La última migración existente era `20261030002` (`SeedPairings.cs`). Se asignó la versión estrictamente consecutiva `20261030003`.
2. **Caché y cálculo en memoria**: Tal como especificó el requerimiento para listas reducidas, las sugerencias de uvas y provincias se procesan en memoria a partir de los filtros cacheados por 5 minutos, reduciendo roundtrips a la base de datos y garantizando tiempos de respuesta ultrarrápidos para el debounce del buscador.
3. **Similitud trigram en C#**: Se implementó `TrigramSimilarity` en `WineLabelNormalizer` usando la técnica de trigramas con padding compatible con `pg_trgm` para asegurar consistencia entre el filtrado en base de datos y el filtrado en memoria.

---

## 4. Problemas encontrados y soluciones
- **Pruebas unitarias existentes**: Los tests fakes en `WineOptimizationTests` y `WineServiceTests` requerían la nueva sobrecarga de `SearchCatalogAsync`; se añadieron los parámetros opcionales correspondientes.
- **Validaciones en CellarItemService**: Al requerir uva obligatoria para vinos tintos creados de cero, se ajustaron las pruebas unitarias que simulaban altas rápidas sin uva para que proveyeran `MainGrapeId` y mock de `IGrapeRepository`.
- **Magic bytes de imágenes**: Las pruebas de `ImageOrchestrator` requerían que los streams de archivos contuvieran encabezados reales JPEG (`0xFF, 0xD8, 0xFF`) para superar el validador estricto `ImageValidator`.

---

## 5. Verificaciones y Resultados

1. `dotnet build`:
   - Resultado: Correcto. 0 advertencias, 0 errores.
2. `dotnet test`:
   - Resultado: 740 pruebas ejecutadas, 740 aprobadas, 0 fallidas (incluyendo las 25 pruebas del nuevo archivo `UsuarioBloqueU1Tests.cs`).
3. **Prueba en vivo de la API con base de datos real (PostgreSQL Supabase)**:
   - Se inició la API en `http://localhost:5000` ejecutando las migraciones en el startup.
   - `GET /api/catalog/filters`: Probado exitosamente. Retornó listas de uvas, provincias y bodegas con sus correspondientes `wineCount` reales.
   - `GET /api/search/suggestions?q=malbec` y `?q=rutini`: Probado exitosamente. Retornó vinos, bodegas con su logo y ubicación, y cepas.
   - `GET /api/wines/search`: Probado exitosamente con tolerancia tipográfica y con filtros combinados (`?wineryId=5`, `?grapeId=1`, `?stateId=12`, y combinados `?grapeId=1&stateId=12`).
4. **Frontend**:
   - `npm run build`: Compilación Vite + TypeScript completada en 559ms sin errores.
   - `npm test`: 235 tests aprobados (51 archivos de test).
   - `npm run lint`: Se registraron 4 errores preexistentes en `WineDetailView.tsx`, `useRealWine.ts`, `useWineCatalogs.ts`, `WineryDashboardPage.tsx` (anotados sin modificar conforme a la directiva).

---

## 6. Pendientes y Dudas Técnicas
- **Pendientes**: Ninguno. El Bloque U1 se encuentra 100% completo, verificado y commiteado en la rama `fix/usuario-backend-busqueda`.
- **Dudas técnicas**: Ninguna. La base de datos y los endpoints quedaron listos para ser consumidos por los componentes del dashboard en el Bloque U2.
