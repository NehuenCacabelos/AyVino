# Reporte de Implementación — Bloque U6: Descorchar, favoritos e historial de catas

**Fecha:** 13 de Noviembre de 2026  
**Rama:** `fix/usuario-perfil-marcas` (lista para merge en `fix/usuario-reparaciones`)  
**Autor:** Antigravity AI Agent  
**Estado:** Finalizado con éxito — 100% verificado y listo para revisión por Kevin

---

## 1. Resumen Ejecutivo
El Bloque U6 conectó integralmente el ciclo de interacción del usuario con sus botellas y marcas personales:
1. **Descorche Atómico**: Implementación del endpoint transaccional `POST /api/cellars/{cellarId}/items/{wineVintageId}/uncork` y el shortcut `/api/cellars/me/items/{wineVintageId}/uncork`. En una única transacción con bloqueo de fila (`FOR UPDATE`), descuenta una unidad del ítem (error 409 Conflict si ya está en 0 o no existe, eliminación limpia de la fila si llega a 0 por el check `quantity >= 1` de base de datos) y marca el vino como **probado** (`is_tried = true`) de forma idempotente en `user_wines`.
2. **Favoritos Persistentes**: El botón de corazón en `DashboardWineCard` y `WineryBlock` ahora persiste con `PUT` y `DELETE /api/wines/{wineId}/favorite`. Se implementó actualización optimista con vuelta atrás automática ante fallos de red y notificación toast de error. El estado inicial se obtiene en **una sola consulta** (`GET /api/user-wines/me?favorite=true&pageSize=100`) compartida desde `DashboardPage`, erradicando el aviso falso preexistente ("añadido a tus Deseados").
3. **Pestañas de Perfil Enriquecidas**:
   - `ProfilePage.tsx` interpreta el parámetro obsoleto `?tab=deseados` como `favoritos`, activando la pestaña renombrada **"Favoritos"** y consultando exclusivamente `GET /api/user-wines/me?favorite=true`.
   - La pestaña **"Historial de Catas"** consulta `GET /api/user-wines/me?tried=true`.
   - Se enriquecieron los DTOs de `user-wines` en backend (`WineryName`, `Vintage`, `ImageUrl`) para renderizar las tarjetas con botella, añada, bodega, puntuación y fecha de cata, con estados vacíos sobrios y accesibles.
   - En `DashboardNavbar.tsx`, los enlaces "Mi historial" y "Favoritos" reemplazaron las anclas muertas (`#historial`, `#deseados`) por componentes `<Link>` directos a `/perfil/{username}?tab=historial` y `?tab=favoritos` en versiones de escritorio y móvil.

---

## 2. Detalle de Cambios por Componente

### 2.1 Backend: Descorche Atómico y DTOs de UserWines (`AyVino.Api`)
- **`ICellarItemRepository.cs` & `CellarItemRepository.cs`**:
  - Incorporación del método `UncorkAsync(int userId, int cellarId, int wineVintageId, CancellationToken ct)`.
  - Transacción atómica:
    - Bloqueo y lectura mediante `SELECT ... FOR UPDATE` uniendo `cellar_items` con `wine_vintages`.
    - Si no existe o cantidad <= 0: rollback y retorno de `null`.
    - Si cantidad > 1: decrementa en 1 y actualiza timestamp `updated_at`.
    - Si cantidad == 1: elimina la fila de `cellar_items` respetando el check de integridad `quantity >= 1`.
    - Upsert idempotente en `user_wines`: `INSERT INTO user_wines ... ON CONFLICT (user_id, wine_id) DO UPDATE SET is_tried = TRUE, updated_at = now() AT TIME ZONE 'utc'`.
    - Retorna `CellarItemListRow` con la cantidad resultante (incluyendo `0` para ítems agotados).
- **`ICellarItemService.cs` & `CellarItemService.cs`**:
  - Método `UncorkAsync`: valida la propiedad de la cava vía `EnsureCellarOwnedAsync` (lanzando `NotFoundException` 404 si la cava es ajena o inexistente).
  - Lanza `ConflictException` (409) con mensaje claro `"No quedan botellas de esta cosecha en la cava o el ítem no existe."` si el ítem no se encuentra.
  - Retorna `CellarItemResponseDto` actualizado.
- **`CellarItemEndpoints.cs` & `CellarEndpoints.cs`**:
  - Mapeo de `POST /api/cellars/{cellarId:int}/items/{wineVintageId:int}/uncork`.
  - Mapeo del atajo `POST /api/cellars/me/items/{wineVintageId:int}/uncork` resolviendo la cava activa del usuario.
- **Enriquecimiento de `UserWines`**:
  - `UserWineListItemDto.cs`: incorporó `string? WineryName = null`, `int? Vintage = null`, `string? ImageUrl = null`.
  - `UserWineListRow.cs`: incorporó las columnas correspondientes en la proyección.
  - `UserWineMappingExtensions.cs`: mapeo de bodega resuelta (`WineryName ?? WineryNameText`), añada (`Vintage`) y URL de imagen de botella.
  - `UserWineRepository.cs`: query SQL enriquecida con `LEFT JOIN wineries wy` y subquery lateral `latest_vintage` sobre `wine_vintages`.
- **Pruebas Unitarias xUnit (`UsuarioBloqueU6Tests.cs`)**:
  - 5 nuevas pruebas unitarias: descorche exitoso con unidades remanentes, descorche de última unidad (cantidad 0), conflicto 409 cuando no hay unidades, rechazo 404 ante cava ajena, y mapeo completo de DTO de vinos de usuario.

### 2.2 Frontend: Integración de Descorche en Cava y Dashboard
- **`src/frontend/src/pages/CavaPage.tsx`**:
  - `handleUncorkSaved`: invoca `POST /cellars/${cellarId}/items/${vintageId}/uncork`.
  - Éxito: toast de confirmación, recarga de la cava con `fetchBackendCellar()`, actualización del contador de stock en navbar (`refreshStock()`) y agregado a la bitácora local.
  - Error: muestra toast con el mensaje exacto de error o conflicto del backend, sin alterar stock ni emitir falsos éxitos.
- **`src/frontend/src/pages/DashboardPage.tsx`**:
  - `handleUncorkSaved`: invoca `POST /cellars/me/items/${vintageId}/uncork` (o resuelve el ítem en la cava del usuario).
  - Éxito: notificación toast, `refreshStock()` y decremento reactivo de `stockCount`.
  - Error: notificación con el mensaje de error devuelto por la API.

### 2.3 Frontend: Favoritos en Dashboard
- **Carga inicial única**: `DashboardPage` ejecuta una sola vez `GET /user-wines/me?favorite=true&pageSize=100` y almacena los IDs de vino en un `Set<number>`.
- **Propagación reactiva**: `wineryGroups` inyecta `isFavorite` a las tarjetas evaluando `favoriteWineIds.has(Number(wine.id))`.
- **`handleToggleFavorite`**:
  - Optimismo inmediato: conmuta el ID en el `Set` local.
  - Persistencia: ejecuta `PUT /api/wines/{wineId}/favorite` o `DELETE /api/wines/{wineId}/favorite`.
  - Rollback: ante fallo de red o error de servidor, revierte el `Set` a su estado previo y emite toast de advertencia.
  - Eliminación de notificación falsa: se quitó el aviso de "añadido a tus Deseados" en favor de la respuesta visual inmediata del corazón y toast solo en caso de error.
- **`DashboardWineCard.tsx` & `WineryBlock.tsx`**:
  - Estado local sobrio sin `useEffect` de sincronización (cumpliendo la regla de estado derivado).
  - Accesibilidad WAI-ARIA actualizada: `aria-label="Añadir/Quitar {nombre} de favoritos"`.

### 2.4 Frontend: Perfil de Usuario y Navegación
- **`src/frontend/src/pages/ProfilePage.tsx`**:
  - `activeTab` 100% derivado del query param `tab` de la URL vía `useSearchParams` (cumpliendo Rule 8, cero `useState` redundante).
  - Mapeo retrocompatible: `?tab=deseados` y `?tab=favoritos` activan la pestaña `'favoritos'`.
  - Pestaña "Favoritos": consulta `getMyUserWinesApi({ favorite: true })` (dejando de pedir `wanted: true`), renderiza tarjetas completas con silueta/imagen de botella, añada, bodega, calificación y fecha. Estado vacío: `"Sin favoritos registrados"`.
  - Pestaña "Historial de Catas": consulta `getMyUserWinesApi({ tried: true })`, renderiza tarjetas con badge "Probado", imagen, bodega y añada. Estado vacío: `"Sin historial registrado"`.
- **`src/frontend/src/features/dashboard/components/DashboardNavbar.tsx`**:
  - Menú de usuario (escritorio y móvil): "Mi historial" y "Favoritos" enlazados mediante `<Link>` a `/perfil/{username}?tab=historial` y `?tab=favoritos` (eliminando anclas muertas `#historial` y `#deseados`).

---

## 3. Decisiones Técnicas y Reglas Frontend
1. **Inmutabilidad y Estado Derivado (Regla 8 - Algoritmos y Programación III)**:
   - `activeTab` en `ProfilePage` se calcula en tiempo de renderizado a partir de `searchParams.get('tab')`.
   - Se eliminaron sincronizaciones innecesarias con `useEffect` para flags derivadas de props en tarjetas.
2. **Capa HTTP y Limpieza de Recursos (Regla 9)**:
   - Toda llamada en efectos incluye saneamiento con banderas de montaje y `AbortController`.
3. **Enrutamiento y Composición (Regla 10)**:
   - Navegación interna exclusiva mediante `<Link>` con parámetros semánticos, eliminando tags `<a>` con anclas vacías.

---

## 4. Problemas Encontrados y Soluciones
- **Check Constraint en Base de Datos**: La tabla `cellar_items` cuenta con la restricción `CHECK (quantity >= 1 AND quantity <= 999)`. Por lo tanto, al descorchar la última botella, el registro debe ser eliminado de `cellar_items`, retornando el DTO con `Quantity = 0` para notificar al front.
- **Detección de Toast en Tests**: En Vitest, la aserción de descorche se orientó a la región accesible `role="status"` para evitar ambigüedades con el texto `"¡Descorche Registrado!"` del botón interno de `UncorkDialog`.

---

## 5. Resultado de Verificaciones
- **Compilación .NET (`dotnet build`)**: 0 advertencias, 0 errores.
- **Pruebas Unitarias .NET (`dotnet test`)**: 754/754 pruebas superadas (5 nuevas en `UsuarioBloqueU6Tests`).
- **Linter Frontend (`npm run lint`)**: 0 errores en todos los archivos modificados y nuevos. (Se documentan los 4 errores preexistentes en `WineDetailView.tsx`, `useRealWine.ts`, `useWineCatalogs.ts`, `WineryDashboardPage.tsx`).
- **Compilación Frontend (`npm run build`)**: Exitosa en 659 ms.
- **Pruebas Vitest (`npm test`)**: 60 suites de prueba, 290/290 pruebas superadas (9 nuevas pruebas en `ProfilePageBloqueU6` y `DashboardAndCavaBloqueU6`).
