# BLOQUE U11: Registrar cata completa, bitácora real y contador de la cava
**Rama**: `fix/usuario-cata-historial`  
**Fecha**: 14 de noviembre de 2026  
**Estado**: Completado exitosamente

---

## 1. Resumen de lo realizado

### 1.1 Backend: Descorche con Reseña Transaccional
- **Endpoints de Descorche**: `POST /api/cellars/{cellarId}/items/{wineVintageId}/uncork` y `POST /api/cellars/me/items/{wineVintageId}/uncork` ahora aceptan un cuerpo JSON opcional `{ rating?: int, comment?: string }` modelado en `UncorkCellarItemRequestDto`.
- **Transaccionalidad Atómica**:
  - Se ejecuta en una única transacción de base de datos (`IDbTransaction`).
  - Descuenta una botella del inventario del usuario en `cellar_items`.
  - Marca la cosecha como probada en `user_wines` (`is_tried = TRUE`).
  - Si se proporciona `rating` (1 a 5), inserta o actualiza la reseña del usuario en la tabla `reviews` (`user_id`, `wine_vintage_id`, `rating`, `comment`), respetando las restricciones de unicidad y el límite de 1000 caracteres en el comentario.
  - Recalcula y actualiza automáticamente los promedios de calificación y conteos de reseñas tanto en `wine_vintages` como en `wines`.
- **Validaciones Defensivas**:
  - `rating` fuera de rango (< 1 o > 5) o comentario mayor a 1000 caracteres dispara `ValidationException` (HTTP 400 Bad Request) con mensaje claro y garantizando cero efectos secundarios (no se descuenta stock).
  - Si no se envía cuerpo, conserva intacto el comportamiento previo de descorche simple.
  - Control de propiedad de cava (403 Forbidden) y falta de stock disponible (409 Conflict).

### 1.2 Frontend: Registrar Cata en `/cava`
- En `CavaPage.tsx`, `handleUncorkSaved` envía el `rating` (redondeado a entero entre 1 y 5) y las notas de cata en el parámetro `comment` hacia el endpoint del backend.
- Ante éxito, despliega una notificación visible y refresca la cava y el contador global de stock.
- Ante fallo en el backend, exhibe el error retornado por la API y no altera el estado local (no hay decrementos falsos ni desincronización).

### 1.3 Bitácora y Historial Reales
- **Persistencia de Bitácora**: En `CavaPage.tsx`, la bitácora dejó de ser un array en memoria o local storage estático. Ahora se sincroniza dinámicamente consumiendo `GET /api/user-wines/me?tried=true&pageSize=100`.
- **Extensión de DTOs y Query**:
  - Se añadieron `UserRating` y `UserComment` a `UserWineListItemDto`, `UserWineListRow` y `UserWineMappingExtensions`.
  - En `UserWineRepository.cs`, la consulta SQL incorpora un `LEFT JOIN LATERAL` sobre `reviews` para seleccionar la calificación y comentario más reciente del usuario, junto con la fecha real del cambio (`last_change_at`).
  - La bitácora en `VaultLogbookModule` persiste fielmente al recargar la página.
- **Historial de Catas en Perfil**: En `ProfilePage.tsx` (pestaña "Historial de Catas"), las tarjetas reflejan las calificaciones y notas de cata reales de los vinos descorchados por el usuario.
- **Descorche en Dashboard**:
  - En `DashboardPage.tsx`, `handleUncorkSaved` envía `{ rating, comment }` al endpoint `/cellars/me/items/{vintageId}/uncork` o busca la cosecha activa en la cava del usuario para descorcharla.
  - Se habilitó un disparador de descorche en el widget "Listas para Descorchar" del Strip de Métricas.

### 1.4 "Joyas de la Cava" y Conteo con Stock
- En `UserRepository.cs`, `CellarWinesCount` pasó a contar únicamente cosechas con stock disponible: `COUNT(DISTINCT ci.wine_vintage_id) ... AND ci.quantity > 0`.
- En `ProfilePage.tsx` (perfil propio y visitante), los textos que exhiben este valor cambiaron su denominación a "vinos" / "vino" (ej. `Ver Cava Completa (N vinos)`), distinguiéndose del conteo de botellas físicas.

### 1.5 Limpieza de Errores Silenciosos
- Se removieron capturas vacías (`.catch(() => {})`) en `CavaPage.tsx`, canalizando todos los errores a través de `showNotification` para visibilidad inmediata del usuario.

---

## 2. Archivos Tocados y Creados

### Backend
- **Creados**:
  - `src/backend/AyVino.Api/Features/Cellars/DTOs/UncorkCellarItemRequestDto.cs`
  - `tests/AyVino.UnitTests/UsuarioBloqueU11Tests.cs`
- **Modificados**:
  - `src/backend/AyVino.Api/Features/Cellars/Endpoints/CellarEndpoints.cs`
  - `src/backend/AyVino.Api/Features/Cellars/Endpoints/CellarItemEndpoints.cs`
  - `src/backend/AyVino.Api/Features/Cellars/Repositories/ICellarItemRepository.cs`
  - `src/backend/AyVino.Api/Features/Cellars/Repositories/CellarItemRepository.cs`
  - `src/backend/AyVino.Api/Features/Cellars/Services/ICellarItemService.cs`
  - `src/backend/AyVino.Api/Features/Cellars/Services/CellarItemService.cs`
  - `src/backend/AyVino.Api/Features/Users/Repositories/UserRepository.cs`
  - `src/backend/AyVino.Api/Features/UserWines/DTOs/UserWineListItemDto.cs`
  - `src/backend/AyVino.Api/Features/UserWines/DTOs/UserWineMappingExtensions.cs`
  - `src/backend/AyVino.Api/Features/UserWines/Models/UserWineListRow.cs`
  - `src/backend/AyVino.Api/Features/UserWines/Repositories/UserWineRepository.cs`

### Frontend
- **Creados**:
  - `src/frontend/tests/pages/CavaAndHistoryBloqueU11.test.tsx`
- **Modificados**:
  - `src/frontend/src/features/dashboard/components/Metrics.tsx`
  - `src/frontend/src/features/users/types/index.ts`
  - `src/frontend/src/pages/CavaPage.tsx`
  - `src/frontend/src/pages/DashboardPage.tsx`
  - `src/frontend/src/pages/ProfilePage.tsx`
  - `src/frontend/tests/pages/DashboardAndCavaBloqueU6.test.tsx`
  - `src/frontend/tests/pages/WineDetailPageBloqueU10.test.tsx`
  - `src/frontend/tests/pages/__snapshots__/WineDetailPage.snapshot.test.tsx.snap`

---

## 3. Decisiones Técnicas

1. **Sobrecargas Explícitas en Repositorio y Servicio**: Para evitar ambigüedades en resolución de métodos con argumentos por defecto y preservar compatibilidad con mocks preexistentes de NSubstitute en tests de U6, se mantuvieron sobrecargas explícitas delegando la ejecución cuando no se proveen datos de reseña.
2. **Subconsulta Lateral en UserWineRepository**: Se utilizó `LEFT JOIN LATERAL (SELECT rating, comment, updated_at FROM reviews ... ORDER BY updated_at DESC LIMIT 1)` para resolver eficientemente la reseña del usuario sin afectar la paginación ni duplicar filas.
3. **Mapeo Tipado Seguro en Tests**: Se utilizó la interfaz `CellarItemDto` completa en `CavaAndHistoryBloqueU11.test.tsx`, eliminando cualquier casteo a `any` y satisfaciendo las reglas estrictas de ESLint.

---

## 4. Resultado de Verificaciones

- **Backend**:
  - `dotnet build`: 0 advertencias, 0 errores.
  - `dotnet test`: 774/774 tests superados (11 tests nuevos en `UsuarioBloqueU11Tests.cs`).
- **Frontend**:
  - `npm run build`: Compilación TypeScript (`tsc -b`) y empaquetado Vite (`vite build`) exitosos en 697ms.
  - `npm test`: 65 suites de test / 318 tests superados (5 tests nuevos en `CavaAndHistoryBloqueU11.test.tsx`).
  - `npm run lint`: Cero errores ni advertencias introducidos en código del bloque (4 errores preexistentes en `useRealWine.ts`, `useWineCatalogs.ts` y `WineryDashboardPage.tsx` documentados).

---

## 5. Pendientes
- Ninguno en este bloque. Todos los objetivos 11.1 a 11.6 han sido completados y validados.
