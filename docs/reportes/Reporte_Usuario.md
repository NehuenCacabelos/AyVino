# Reporte Integral de Usuario - AyVino

Este documento consolida el avance, decisiones, problemas y verificaciones realizadas a lo largo de los bloques de desarrollo de Usuario.

---

# USUARIO — BLOQUE U1: Backend de búsqueda, filtros y alta rápida
**Rama**: `fix/usuario-backend-busqueda`  
**Fecha**: 2026-11-13  

## 1. Qué se hizo
- **1.1 Clave normalizada de búsqueda**:
  - Implementación de `WineLabelNormalizer.ToSearchKey(string?)` que remueve acentos, normaliza `ñ` a `n`, elimina puntuación y quita todos los espacios.
  - Implementación de `TrigramSimilarity` en C# compatible con `pg_trgm`.
  - Migración `M20261030003_AddSearchKeysAndTrgmIndexes` agregando `wines.name_key`, `wines.winery_text_key` y `wineries.name_key`, poblando registros existentes e indexando con GIN trigramas.
  - Mantenimiento centralizado de claves en altas y ediciones de vinos y bodegas.
- **1.2 Búsqueda tolerante en `GET /api/wines/search`**:
  - `key = ToSearchKey(search)`: con menos de 2 caracteres no devuelve resultados.
  - Coincidencia si las claves contienen el término o tienen similitud trigram `> 0.3` (`SearchSimilarityThreshold`).
  - Ranking de relevancia: clave idéntica (4), empieza con la clave (3), contiene la clave (2), mayor similitud (1), seguido por reseñas y orden alfabético.
- **1.3 Filtros de servidor en `GET /api/wines/search`**:
  - Agregados los parámetros `grapeId`, `stateId` y `wineryId`, combinables con `search` y `wineType`.
- **1.4 `GET /api/catalog/filters`**:
  - Nueva feature `Features/Catalog` (Vertical Slice completo) con endpoint anónimo que devuelve `{ grapes, provinces, wineries }` con conteo de vinos visibles, ordenados alfabéticamente y con caché de 5 minutos en memoria.
- **1.5 `GET /api/search/suggestions?q=`**:
  - Sugerencias agrupadas con máximo 3 por grupo (`wines`, `wineries`, `grapes`, `regions`). Uvas y regiones evaluadas y rankeadas en memoria.
- **1.6 Campos nuevos en catálogo**:
  - `CatalogWineItemDto` incorporó `WineryLogoImageId` con `LEFT JOIN` a `wineries`.
- **1.7 Alta rápida con uva principal**:
  - `QuickAddCellarWineRequestDto` sumó `MainGrapeId`.
  - Exigencia obligatoria para vinos tintos (uva tinta) y blancos. Naranjo sólo uvas blancas o rosadas.
  - Asignación de 100% de uva en cosecha creada con estado `ApprovalStatus.Pending`.
  - Retorno garantizado de `WineId` y `WineVintageId`.
- **1.8 Imagen de cosecha comunitaria**:
  - Autorización en `ImageOrchestrator` para que el creador de la cosecha comunitaria (`uploaded_by_user_id`) pueda subir su imagen, manteniendo el 403 Forbidden para otros usuarios.

## 2. Archivos tocados y creados
- **Creados**:
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
- **Modificados**:
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

## 3. Decisiones técnicas
- Migración `20261030003` consecutiva a `20261030002`.
- Deduplicación y cálculo en memoria de uvas y regiones en sugerencias usando caché de 5 minutos para alta performance.
- Algoritmo de similitud de trigramas implementado en C# con padding idéntico a `pg_trgm`.

## 4. Problemas encontrados
- Actualización de fakes en pruebas de optimización y servicio de vinos tras extender la interfaz del repositorio con parámetros opcionales.
- Ajuste de mocks en pruebas de cava al incorporar validación obligatoria de uva principal en vinos tintos.

## 5. Resultado de verificaciones
- `dotnet build`: 0 advertencias, 0 errores.
- `dotnet test`: 740/740 pruebas aprobadas (25 nuevas en `UsuarioBloqueU1Tests`).
- Verificación en vivo de la API conectada a base de datos PostgreSQL real (Supabase): endpoints de filtros, sugerencias y búsqueda tolerante validados con éxito.
- `npm run build` en frontend: exitoso (559ms).
- `npm test` en frontend: 235/235 pruebas pasando.
- `npm run lint` en frontend: 4 errores preexistentes reportados sin modificar.

## 6. Pendientes
- Ninguno en este bloque. Todo commiteado en la rama `fix/usuario-backend-busqueda`.


---

# USUARIO — BLOQUE U2: Combos reales y buscador con sugerencias en el dashboard
**Rama**: `fix/usuario-dashboard-filtros-buscador`  
**Fecha**: 2026-11-13  

## 1. Qué se hizo
- **2.1 Capa de API en el front (`catalogApi.ts`)**:
  - Implementación de `getCatalogFilters` con tipos `{ grapes, provinces, wineries }` y conteo de vinos.
  - Caché de sesión en memoria y en `sessionStorage`.
  - Implementación de `getSearchSuggestions(q, signal)` con cancelación vía `AbortSignal` y filtrado menor a 2 caracteres.
  - Soporte de `grapeId`, `stateId` y `wineryId` en `searchCatalogWines`.
- **2.2 Combos con datos reales (`QuickActions.tsx`)**:
  - Eliminadas las listas estáticas escritas a mano.
  - Carga reactiva de opciones con conteos de vinos. Estados de carga (disabled), error (con botón Reintentar) y vacío.
  - Selección de opciones emite los filtros al servidor y resetea la paginación a la primera página.
  - Eliminado el filtrado de texto redundante en cliente en `DashboardPage.tsx` (conservando chips rápidos intactos).
- **2.3 Buscador con desplegable de sugerencias agrupadas**:
  - Placeholder: `"Buscar vino, bodega, cepa o región..."`.
  - Debounce de 250ms con cancelación `AbortSignal` al escribir 2 o más caracteres.
  - Desplegable agrupado por Vinos, Bodegas, Uvas y Regiones (máximo 3 por grupo).
  - Fila fija `"Crear «texto escrito»"` al pie del desplegable; única opción visible con 0 resultados de la API.
  - Acciones:
    - Vino → navega a `/vinos/{id}` (ID numérico).
    - Bodega → navega a `/bodegas/{id}`.
    - Uva → aplica filtro de uva en combo, limpia texto de búsqueda y emite `onFilterChange`.
    - Región → aplica filtro de provincia en combo, limpia texto de búsqueda y emite `onFilterChange`.
    - Crear → ejecuta `onCreateWine` abriendo el modal de alta.
  - Navegación por teclado completa (flechas arriba/abajo, Enter para seleccionar o enviar, Escape para cerrar) y accesibilidad WAI-ARIA (`role="combobox"`, `role="listbox"`, `aria-activedescendant`).
- **2.4 Crear desde el buscador (conexión provisoria)**:
  - `QuickAddBottleModal` recibió la prop opcional `initialName` que precarga el nombre de la etiqueta.
  - Montado `QuickAddBottleModal` en `DashboardPage.tsx`, abriéndose con el texto escrito al seleccionar "Crear". Al guardar, envía `POST /api/cellars/me/quick-add`, emite toast y recarga el catálogo.
- **2.5 Enlaces a la ficha**:
  - Verificados y probados los enlaces de cards en `DashboardWineCard` y `WineryBlock` hacia `/vinos/{id}` numérico.
- **2.6 Tests (vitest)**:
  - Creadas 18 pruebas unitarias (`QuickActionsBloqueU2.test.tsx` y `catalogApi.test.ts`), logrando un total de 253 pruebas pasando en el frontend.

## 2. Archivos tocados y creados
- **Creados**:
  - `src/frontend/tests/features/dashboard/QuickActionsBloqueU2.test.tsx`
  - `src/frontend/tests/features/dashboard/catalogApi.test.ts`
  - `C:\Users\brian\Desktop\reportes\Reporte_Bloque_U2.md`
- **Modificados**:
  - `src/frontend/src/features/dashboard/api/catalogApi.ts`
  - `src/frontend/src/features/dashboard/components/QuickActions.tsx`
  - `src/frontend/src/features/cava/components/QuickAddBottleModal.tsx`
  - `src/frontend/src/pages/DashboardPage.tsx`

## 3. Decisiones técnicas
- Caché híbrida (memoria + `sessionStorage`) en `getCatalogFilters` para respuesta instantánea.
- Control de estado sin `useEffect` síncrono en `QuickAddBottleModal` siguiendo lineamientos oficiales de React 19 / ESLint.
- Manejo de debounce y cancelación de red seguro mediante `AbortController`.

## 4. Problemas encontrados
- Advertencias de `react-hooks/set-state-in-effect` resueltas trasladando reseteos síncronos a los handlers de eventos (`onChange`) y patrones de derivación en renderizado.

## 5. Resultado de verificaciones
- `dotnet build`: 0 advertencias, 0 errores.
- `dotnet test`: 740/740 pruebas superadas.
- `npm run build`: compilación limpia en 579 ms.
- `npm test`: 253/253 pruebas superadas (53 suites pasando).
- `npm run lint`: 0 errores en los archivos modificados en este bloque.

## 6. Pendientes
- Ninguno en este bloque. Todo commiteado en la rama `fix/usuario-dashboard-filtros-buscador`.


---

# USUARIO — BLOQUE U3: Nombre y logo de la bodega llevan a su perfil
**Rama**: `fix/usuario-bodega-enlaces`  
**Fecha**: 2026-11-13  

## 1. Qué se hizo
- **3.1 Datos**:
  - `CatalogWineItemDto` (`types/wine.ts`) incorporó `wineryLogoImageId?: string | null`.
  - `DashboardWine` sumó los campos `wineryId?: number` y `wineryLogoImageId?: string`.
  - `catalogWineToDashboardWine` mapea `wineryId` y `wineryLogoImageId` con fallback a `undefined`.
  - En `DashboardPage.tsx`, agrupamiento dinámico por `wineryId` numérico cuando existe y por clave de texto en minúsculas cuando no. Cada grupo almacena `key`, `wineryId`, `logoImageId`, `name`, `region`, `initials` y sus `wines`.
- **3.2 Cabecera de bloque de bodega (`WineryBlock.tsx`)**:
  - Si la bodega tiene `wineryId`: el isotipo/logo y el nombre de la bodega están vinculados mediante `<Link to={'/bodegas/' + wineryId}>`, con estados visibles de hover (`group-hover/winery:border-white/20`, `group-hover/winery:text-rose-200`) y foco (`focus-visible:ring-2 focus-visible:ring-rose-500/80`).
  - Si tiene `wineryLogoImageId`: renderiza el logo oficial a través de `imageUrl(logoImageId, 'logo')` con `object-contain` y respaldo transparente a las iniciales (`initials`) mediante el callback `onError`.
  - Si no tiene logo: monograma sobrio con iniciales.
  - Si no tiene `wineryId` (vino comunitario): el nombre se renderiza como texto plano `<h3>` no interactivo sin enlaces ni efectos hover.
  - El enlace a "Ver catálogo completo" y la grilla de botellas se mantuvieron intactos.
- **3.3 Verificación de Perfil de Bodega (solo lectura)**:
  - Inspeccionado `src/frontend/src/pages/WineryPublicProfileLayout.tsx`:
    - **Usuario común autenticado**: Ve el botón "Seguir bodega" activo, puede alternar a "Siguiendo" con actualización optimista y llamadas a `POST /api/wineries/{id}/follow` y `DELETE /api/wineries/{id}/follow`.
    - **Visitante anónimo**: Al hacer clic en "Seguir bodega", es redirigido a `/login` con el retorno guardado en `state.from`.
    - **Dueño de la bodega**: Botón deshabilitado con aviso visual ("No podés seguir a tu propia bodega").
    - **Bloqueos**: Ninguno para el usuario regular.
- **3.4 Tests (Vitest)**:
  - Creado `src/frontend/tests/features/dashboard/WineryBlockBloqueU3.test.tsx` con 7 pruebas unitarias cubriendo cabecera con y sin `wineryId`, con y sin logo, fallback por error de imagen, mapeo de DTO y algoritmo de agrupación por bodega.

## 2. Archivos tocados y creados
- **Creados**:
  - `src/frontend/tests/features/dashboard/WineryBlockBloqueU3.test.tsx`
  - `C:\Users\brian\Desktop\reportes\Reporte_Bloque_U3.md`
- **Modificados**:
  - `src/frontend/src/types/wine.ts`
  - `src/frontend/src/pages/DashboardPage.tsx`
  - `src/frontend/src/features/dashboard/components/WineryBlock.tsx`

## 3. Decisiones técnicas
- Generación de claves de grupo deterministas (`winery-id-${id}` vs `winery-text-${name}`) para evitar duplicar bloques de la misma bodega cuando hay ligeras discrepancias tipográficas.
- Preservación de accesibilidad con `alt={'Logo de ' + name}` en la imagen del logo y foco delineado para navegación por teclado.

## 4. Problemas encontrados
- Ninguno en el código implementado. Se confirmaron los 4 errores de lint preexistentes en archivos protegidos de la solución.

## 5. Resultado de verificaciones
- `dotnet build`: 0 advertencias, 0 errores.
- `dotnet test`: 740/740 pruebas superadas.
- `npm run build`: Compilación exitosa en 565 ms.
- `npm test`: 260/260 pruebas superadas (54 suites pasando).
- `npm run lint`: 0 errores en los archivos modificados.

## 6. Pendientes
- Ninguno en este bloque. Commits atómicos `f62ea3d` y `d8332e4` completados en `fix/usuario-bodega-enlaces`.


---

# USUARIO — BLOQUE U4: Cava con datos reales y modal "Ingresar Lote" con sugerencias
**Rama**: `fix/usuario-cava` (mergeada en `fix/usuario-reparaciones`)  
**Fecha**: 2026-11-13  

## 1. Qué se hizo
- **4.1 Enriquecimiento de Cava en Backend**:
  - `CellarItemResponseDto`: propiedades añadidas `WineryName`, `RegionName` y `GrapeName`.
  - `CellarItemListRow`: recepción de campos en la fila del repositorio.
  - `CellarMappingExtensions`: mapeo seguro y cálculo de `AverageRating` (`ReviewCount > 0 ? Math.Round(...) : null`).
  - `CellarItemRepository`: joins con `wineries`, `locations`, `cities`, `states` y `LATERAL` con `wine_grapes` para determinar `GrapeName` principal.
- **4.2 Hook Global `useMyCellarSummary`**:
  - Consulta `GET /api/cellars/me`, acumula total de botellas de estantes y compartimentos, expone estado reactivo y método `refresh()`.
- **4.3 Barra de Navegación y Contexto Global (`AppLayout.tsx`)**:
  - Sincronización en vivo del contador de botellas `stockCount` en el enlace a Cava.
  - Exposición de `refreshStock` en `AppOutletContext` para refresco desde páginas hijas.
- **4.4 Tarjeta de Bóveda Sobria (`VaultWineCard.tsx`)**:
  - Eliminación de placeholders mockeados ("ESTANTE #1", "92 PTS"); renderizado del guión largo `" — "` en ausencia de datos.
- **4.5 Modal "Ingresar Lote" con Sugerencias y Bloqueo (`QuickAddBottleModal.tsx`)**:
  - Búsqueda debounced (250ms) con `AbortController` al tipear el nombre.
  - Dropdown accesible WAI-ARIA navegable con teclado.
  - Al seleccionar vino: completa campos, bloquea edición de etiqueta, precarga añadas reales vía `GET /api/wines/${id}/vintages`.
  - Botón "Cambiar vino" para desbloquear y reiniciar campos.
  - Guardado directo a `POST /api/cellars/me/quick-add` usando `matchedWineId`.
- **4.6 Página de Cava conectada a API (`CavaPage.tsx`)**:
  - Eliminación completa de `initialVaultWines` y `localStorage`.
  - Estados de carga, vacío ("Tu cava está vacía") y renderizado de ítems reales.
  - Refresco automático al guardar botellas desde el modal.
- **4.7 Integración de Añadir a Cava en Dashboard (`DashboardPage.tsx`)**:
  - Apertura del modal con vino preseleccionado.
  - Guardado con validación de backend: toast de éxito y actualización de contador al confirmar; toast de error y preservación del modal ante fallos (sin actualizar stock).

## 2. Archivos tocados y creados
- **Creados**:
  - `src/frontend/src/features/cava/hooks/useMyCellarSummary.ts`
  - `src/frontend/tests/features/cava/QuickAddBottleModalBloqueU4.test.tsx`
  - `src/frontend/tests/pages/CavaPageBloqueU4.test.tsx`
  - `src/frontend/tests/pages/DashboardPageAddToCellarBloqueU4.test.tsx`
  - `tests/AyVino.UnitTests/UsuarioBloqueU4Tests.cs`
  - `C:\Users\brian\Desktop\reportes\Reporte_Bloque_U4.md`
- **Modificados**:
  - `src/backend/AyVino.Api/Features/Cellars/DTOs/CellarItemResponseDto.cs`
  - `src/backend/AyVino.Api/Features/Cellars/DTOs/CellarMappingExtensions.cs`
  - `src/backend/AyVino.Api/Features/Cellars/Models/CellarItemListRow.cs`
  - `src/backend/AyVino.Api/Features/Cellars/Repositories/CellarItemRepository.cs`
  - `src/frontend/src/components/layout/AppLayout.tsx`
  - `src/frontend/src/features/cava/components/QuickAddBottleModal.tsx`
  - `src/frontend/src/features/cava/components/VaultWineCard.tsx`
  - `src/frontend/src/features/cava/index.ts`
  - `src/frontend/src/pages/CavaPage.tsx`
  - `src/frontend/src/pages/DashboardPage.tsx`

## 3. Decisiones técnicas
- Reemplazo absoluto de mock data por endpoints reales del backend.
- Respeto estricto a las reglas frontend: sin mutaciones, inputs controlados, sin `setState` síncrono dentro de efectos.
- Respaldo visual sobrio (`—`) en lugar de datos inventados.

## 4. Problemas encontrados
- Ajuste de selectores en tests de rechazo para tolerar notificación toast simultánea con el alert del modal (`getAllByText`).
- Resolución de advertencias de ciclo de vida en hooks asincrónicos mediante promesas y cleanup handlers.

## 5. Resultado de verificaciones
- `dotnet build`: 0 advertencias, 0 errores.
- `dotnet test`: 742/742 pruebas superadas (4 nuevas pruebas unitarias).
- `npm run build`: Compilación exitosa en 573 ms.
- `npm test`: 270/270 pruebas superadas (57 suites pasando, 10 pruebas nuevas en Cava).
- `npm run lint`: 0 errores en código creado/modificado.

## 6. Pendientes
- Los 4 bloques (U1, U2, U3 y U4) se encuentran 100% finalizados, testeados y consolidados en la rama `fix/usuario-reparaciones`. Listo para revisión y entrega.


---

# USUARIO — BLOQUE U5: Alta de vino comunitario desde el modal de Cava
**Rama**: `fix/usuario-alta-vino-comunitario` (mergeada en `fix/usuario-reparaciones`)  
**Fecha**: 2026-11-13  

## 1. Qué se hizo
- **5.1 Backend: Sugerencia de Bodegas (`AyVino.Api`)**:
  - `WinerySuggestItemDto`: DTO ligero `(int Id, string Name)`.
  - `IWineryRepository` y `WineryRepository`: método `SuggestAsync` con filtro `status = 2`, búsqueda trigramática `similarity(name_key, @queryKey) > 0.3` y límite de 5 sugerencias.
  - `IWineryService` y `WineryService`: validación para queries menores a 2 caracteres devolviendo array vacío.
  - `WineryEndpoints`: endpoint público `GET /api/wineries/suggest?q={query}` con `.AllowAnonymous()`.
- **5.2 Frontend: Utilidades y Caché de Catálogo**:
  - `imageResize.ts`: función `resizeImageToMax(file, 1200)` para redimensionar en canvas antes de subir imagen (con fallback timer de 150ms para entornos de test).
  - `grapesCatalogCache.ts`: obtención cached de cepas (`/api/grapes`) con persistencia en `sessionStorage` y función de ordenamiento contextual `sortGrapesForWineType`.
- **5.3 Modal "Ingresar Lote" Mejorado (`QuickAddBottleModal.tsx`)**:
  - Selector de Bodega con búsqueda y autocompletado contra `/api/wineries/suggest` o texto libre.
  - Selector de Tipo de Vino (Tinto, Blanco, Rosado, Espumoso, Naranjo).
  - Selector de Cepa Principal obligatorio para Tintos y Blancos con búsqueda de cepas; opcional para otros tipos.
  - Subida de imagen opcional con previsualización, botón de eliminar y compresión a máx. 1200px.
  - Flujo en dos pasos: alta rápida `POST /api/cellars/me/quick-add` y subida de imagen `PUT /api/wines/{wineId}/vintages/{vintageId}/image`.
  - Alerta de error 409 Conflict en el modal sin cerrar ni perder datos.
  - Prevención de doble submit mediante ref y botón deshabilitado.

## 2. Archivos tocados y creados
- **Creados**:
  - `src/backend/AyVino.Api/Features/Wineries/DTOs/WinerySuggestItemDto.cs`
  - `tests/AyVino.UnitTests/UsuarioBloqueU5Tests.cs`
  - `src/frontend/src/features/cava/api/grapesCatalogCache.ts`
  - `src/frontend/src/features/cava/utils/imageResize.ts`
  - `src/frontend/tests/features/cava/QuickAddBottleModalBloqueU5.test.tsx`
  - `C:\Users\brian\Desktop\reportes\Reporte_Bloque_U5.md`
- **Modificados**:
  - `src/backend/AyVino.Api/Features/Wineries/Repositories/IWineryRepository.cs`
  - `src/backend/AyVino.Api/Features/Wineries/Repositories/WineryRepository.cs`
  - `src/backend/AyVino.Api/Features/Wineries/Services/IWineryService.cs`
  - `src/backend/AyVino.Api/Features/Wineries/Services/WineryService.cs`
  - `src/backend/AyVino.Api/Features/Wineries/WineryEndpoints.cs`
  - `src/frontend/src/features/cava/components/QuickAddBottleModal.tsx`
  - `src/frontend/src/features/cava/index.ts`
  - `src/frontend/src/features/cava/types.ts`
  - `src/frontend/src/pages/CavaPage.tsx`
  - `src/frontend/src/pages/DashboardPage.tsx`

## 3. Decisiones técnicas
- Cepa obligatoria en frontend para tintos y blancos asegurando consistencia en la base comunitaria.
- Subida de imagen secundaria asincrónica: un fallo en la imagen no anula la creación de la botella en cava, sino que notifica al usuario con un toast de advertencia.
- Búsqueda trigramática en PostgreSQL (`pg_trgm`) para tolerancia a faltas y coincidencias aproximadas en bodegas.

## 4. Problemas encontrados
- Soporte de imagen en Vitest/JSDOM resuelto mediante escape timeout de 150ms en `resizeImageToMax`.
- Mock repository en tests unitarios resuelto con default interface implementation en `IWineryRepository`.

## 5. Resultado de verificaciones
- `dotnet build`: 0 advertencias, 0 errores.
- `dotnet test`: 749/749 pruebas superadas (7 nuevas pruebas unitarias).
- `npm run build`: Compilación exitosa en 675 ms.
- `npm test`: 281/281 pruebas superadas (58 suites pasando, 11 pruebas nuevas en Vitest).
- `npm run lint`: 0 errores en código creado/modificado.

## 6. Pendientes
- Ninguno en este bloque. Completado y fusionado en `fix/usuario-reparaciones`.


---

# USUARIO — BLOQUE U6: Descorchar, favoritos e historial de catas
**Rama**: `fix/usuario-perfil-marcas` (mergeada en `fix/usuario-reparaciones`)  
**Fecha**: 2026-11-13  

## 1. Qué se hizo
- **6.1 Backend: Descorche Atómico (`AyVino.Api`)**:
  - `ICellarItemRepository` y `CellarItemRepository`: método `UncorkAsync(int userId, int cellarId, int wineVintageId, CancellationToken ct)`.
  - Operación en transacción atómica con `SELECT ... FOR UPDATE`:
    - Valida existencia y cantidad > 0 (retorna null / 409 si no hay unidades disponibles).
    - Si cantidad > 1: decrementa en 1 y actualiza timestamp.
    - Si cantidad == 1: elimina la fila en `cellar_items` cumpliendo la restricción de base de datos `CHECK (quantity >= 1)`.
    - Upsert idempotente en `user_wines`: `INSERT ... ON CONFLICT (user_id, wine_id) DO UPDATE SET is_tried = TRUE, updated_at = now() AT TIME ZONE 'utc'`.
    - Retorna `CellarItemListRow` con cantidad remanente (0 si se descorchó la última).
  - `ICellarItemService` y `CellarItemService`: validación de titularidad de la cava vía `EnsureCellarOwnedAsync` (404 Not Found si es ajena) y lanzamiento de `ConflictException` (409) con mensaje explicativo si no hay stock.
  - `CellarItemEndpoints` y `CellarEndpoints`: endpoints `POST /api/cellars/{cellarId}/items/{wineVintageId}/uncork` y `POST /api/cellars/me/items/{wineVintageId}/uncork`.
- **6.2 Backend: Enriquecimiento de DTOs de `user-wines`**:
  - `UserWineListItemDto`: sumó `string? WineryName = null`, `int? Vintage = null`, `string? ImageUrl = null`.
  - `UserWineListRow` y `UserWineRepository`: `LEFT JOIN wineries wy` y subquery lateral para `latest_vintage`, proyectando bodega, última cosecha e imagen de botella.
  - `UserWineMappingExtensions`: mapeo limpio hacia el DTO para consumo en vistas de perfil y catas.
- **6.3 Frontend: Integración de Descorche en Cava y Dashboard**:
  - `CavaPage.tsx`: invocación de `/api/cellars/{cellarId}/items/{vintageId}/uncork`, refresco del backend (`fetchBackendCellar`), actualización del stock global (`refreshStock`) y toast con el error exacto del backend ante 409 sin falso éxito.
  - `DashboardPage.tsx`: atajo al descorche de bodega, actualización reactiva del contador de stock en navbar y manejo de excepciones.
- **6.4 Frontend: Favoritos en Dashboard**:
  - Carga única en `DashboardPage` con `GET /api/user-wines/me?favorite=true&pageSize=100` y almacenamiento en `Set<number>`.
  - Actualización optimista inmediata en `DashboardWineCard` y `WineryBlock`.
  - Persistencia con `PUT /api/wines/{wineId}/favorite` y `DELETE /api/wines/{wineId}/favorite`.
  - Rollback reactivo ante error de red y notificación toast contextual sin mensajes falsos ("añadido a tus Deseados" erradicado).
- **6.5 Frontend: Perfil de Usuario y Navegación**:
  - `ProfilePage.tsx`: cálculo de `activeTab` como estado 100% derivado del query param `tab` (`cava` | `historial` | `favoritos`), mapeando retrocompatiblemente `?tab=deseados` a `'favoritos'`.
  - Pestaña "Favoritos": consulta `GET /api/user-wines/me?favorite=true` y muestra tarjetas con foto de botella, bodega, añada y calificación.
  - Pestaña "Historial de Catas": consulta `GET /api/user-wines/me?tried=true` con tarjetas identificadas con badge "Probado".
  - `DashboardNavbar.tsx`: reemplazo de anclas `#historial` y `#deseados` por enlaces `<Link>` a `/perfil/{username}?tab=historial` y `?tab=favoritos` en menú desktop y drawer móvil.

## 2. Archivos tocados y creados
- **Creados**:
  - `tests/AyVino.UnitTests/UsuarioBloqueU6Tests.cs`
  - `src/frontend/tests/pages/ProfilePageBloqueU6.test.tsx`
  - `src/frontend/tests/pages/DashboardAndCavaBloqueU6.test.tsx`
  - `C:\Users\brian\Desktop\reportes\Reporte_Bloque_U6.md`
- **Modificados**:
  - `src/backend/AyVino.Api/Features/Cellars/Endpoints/CellarItemEndpoints.cs`
  - `src/backend/AyVino.Api/Features/Cellars/Endpoints/CellarEndpoints.cs`
  - `src/backend/AyVino.Api/Features/Cellars/Repositories/ICellarItemRepository.cs`
  - `src/backend/AyVino.Api/Features/Cellars/Repositories/CellarItemRepository.cs`
  - `src/backend/AyVino.Api/Features/Cellars/Services/ICellarItemService.cs`
  - `src/backend/AyVino.Api/Features/Cellars/Services/CellarItemService.cs`
  - `src/backend/AyVino.Api/Features/Users/DTOs/UserWineListItemDto.cs`
  - `src/backend/AyVino.Api/Features/Users/Models/UserWineListRow.cs`
  - `src/backend/AyVino.Api/Features/Users/Repositories/UserWineRepository.cs`
  - `src/backend/AyVino.Api/Features/Users/UserWineMappingExtensions.cs`
  - `src/frontend/src/features/dashboard/components/DashboardNavbar.tsx`
  - `src/frontend/src/features/dashboard/components/DashboardWineCard.tsx`
  - `src/frontend/src/features/dashboard/components/WineryBlock.tsx`
  - `src/frontend/src/features/users/types/index.ts`
  - `src/frontend/src/pages/CavaPage.tsx`
  - `src/frontend/src/pages/DashboardPage.tsx`
  - `src/frontend/src/pages/ProfilePage.tsx`
  - `C:\Users\brian\Desktop\reportes\Reporte_Usuario.md`

## 3. Decisiones técnicas
- Eliminación física de la fila en `cellar_items` cuando la cantidad llega a cero, respetando el check `quantity >= 1` de la base de datos PostgreSQL, retornando el DTO con `Quantity = 0`.
- Cumplimiento estricto de las reglas frontend de Algoritmos y Programación III: `activeTab` como estado derivado puro de la URL sin sincronizaciones reactivas en `useEffect`, e inmutabilidad en sets y colecciones.
- Optimismo transaccional con reversión automática en favoritos para máxima fluidez de usuario en el catálogo.

## 4. Problemas encontrados
- Restricción de base de datos `CHECK (quantity >= 1)` que rechazaba `UPDATE quantity = 0`: resuelto eliminando el registro y devolviendo el DTO con 0.
- Conflicto de texto duplicado en pruebas de Vitest entre el botón de confirmación y el toast: resuelto focalizando la aserción en el role accesible `status`.

## 5. Resultado de verificaciones
- `dotnet build`: 0 advertencias, 0 errores.
- `dotnet test`: 754/754 pruebas superadas (5 nuevas pruebas en `UsuarioBloqueU6Tests`).
- `npm run build`: Compilación exitosa en 659 ms.
- `npm test`: 290/290 pruebas superadas (60 suites pasando, 9 pruebas nuevas en Vitest).
- `npm run lint`: 0 errores en código creado/modificado.

## 6. Conclusión y Cierre de Bloques de Usuario
Con la finalización de los bloques U1 a U6, el circuito completo del usuario de AyVino (búsqueda tolerante, catálogo con filtros reales, fichas técnicas con añadas, notas de cata con rating y badges de comunidad, alta de vinos comunitarios con cepas y compresión de fotos, descorche atómico, favoritos y perfil con historial de catas) queda 100% implementado, probado y validado.
