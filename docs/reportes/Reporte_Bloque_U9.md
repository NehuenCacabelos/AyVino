# USUARIO — BLOQUE U9: Catálogo público de bodega con las cards del dashboard
**Rama**: `fix/usuario-catalogo-bodega`  
**Fecha**: 14 de noviembre de 2026  
**Estado**: Completado exitosamente

---

## 1. Resumen de lo realizado
En este bloque se unificó la experiencia del catálogo público de la bodega (`/bodegas/:id/catalogo`) para utilizar las mismas tarjetas editoriales del dashboard (`DashboardWineCard`), permitiendo navegar a la ficha del vino (`/vinos/{id}` numérico) y ofreciendo acceso rápido para añadir a la cava y marcar como favorito. Asimismo, se desacopló y eliminó el modal provisorio `WineryPublicWineDetailModal` que ya no tenía uso.

### Principales intervenciones:
1. **Cards del Dashboard en Catálogo Público**:
   - Se reemplazó el uso de `WineryPublicCatalogCard` por `DashboardWineCard` en `WineryPublicCatalogPage.tsx`.
   - Se conservó la grilla responsive, la barra de búsqueda y filtros server-side (`wineType`, `grapeId`, `year`, `sort`), paginación y estados de carga y vacío.
   - Cada tarjeta enlaza directamente a `/vinos/{id}` con el ID numérico del vino.

2. **Adaptador de Datos (`adaptWineryPublicCatalogWineToDashboardWine`)**:
   - Creado en `src/frontend/src/features/winery/utils/publicCatalogAdapter.ts`.
   - Transforma `WineryPublicCatalogWineDto` a `DashboardWine`:
     - `id`: ID numérico como string (`String(wine.id)`).
     - `wineryId`: ID de la bodega provisto por el perfil público.
     - `winery`: Nombre de la bodega (`profile.name`).
     - `name`: Nombre de la etiqueta.
     - `region`: Región resuelta o `'Mendoza, Argentina'`.
     - `varietal`: Uva principal de la cosecha más reciente o fallback determinista derivado del tipo.
     - `vintage`: Año más reciente disponible entre las añadas válidas o año actual.
     - `rating`: Promedio numérico o 0 si no cuenta con calificaciones.
     - `bottle`: Silueta determinista mediante `resolveBottleKind(wine.wineType, varietal)`.
     - `imageUrl`: Imagen de la botella con variante `imageUrl(imageId, 'bottle')`.

3. **Hooks Compartidos Desacoplados**:
   - `useQuickAddToCellar` (`features/dashboard/hooks/useQuickAddToCellar.ts` y reexportado en `features/cava/hooks/`): gestiona la apertura y precarga del vino seleccionado en `QuickAddBottleModal`. Reutilizado idénticamente en `DashboardPage` y `WineryPublicCatalogPage`.
   - `useFavorites` (`features/dashboard/hooks/useFavorites.ts`): gestiona la carga inicial en lote (`GET /api/user-wines/me?favorite=true&pageSize=100`), la actualización optimista inmediata en UI y la reversión automática si la API (`PUT/DELETE /api/wines/{id}/favorite`) falla. Reutilizado idénticamente en `DashboardPage` y `WineryPublicCatalogPage`.

4. **Guarda de Visitantes Sin Sesión**:
   - Se incorporó la propiedad `hideQuickActions` en `DashboardWineCard`.
   - En `WineryPublicCatalogPage`, si el visitante no está autenticado (`!isAuthenticated`), se ocultan las acciones de "Añadir a Cava" y botón flotante de favorito (`hideQuickActions={!isAuthenticated}`).
   - Si se invocaran programáticamente, se redirige de inmediato a `/login`.

5. **Eliminación del Modal Provisorio**:
   - Se removió `WineryPublicWineDetailModal.tsx` y su exportación en `features/winery/components/index.ts`.
   - Se retiraron de `WineryPublicCatalogPage` los estados y callbacks asociados (`selectedWine`, `handleSelectWine`, `adaptCatalogWineToDetail`).
   - Se preservó intacto `WineryPublicCatalogCard.tsx`, ya que es utilizado por el dashboard privado de la bodega en modo vista previa (`WineryRecentWines.tsx`).

---

## 2. Archivos modificados y creados
- `src/frontend/src/features/dashboard/components/DashboardWineCard.tsx`: soporte para prop opcional `hideQuickActions` y control de estado reactivo puro.
- `src/frontend/src/features/dashboard/hooks/useQuickAddToCellar.ts`: hook compartido para ingreso rápido a cava.
- `src/frontend/src/features/dashboard/hooks/useFavorites.ts`: hook compartido para favoritos con carga batch y rollback.
- `src/frontend/src/features/dashboard/hooks/index.ts`: barrel de hooks del dashboard.
- `src/frontend/src/features/dashboard/index.ts`: exportación de hooks del dashboard.
- `src/frontend/src/features/cava/hooks/useQuickAddToCellar.ts`: re-export del hook en cava.
- `src/frontend/src/features/winery/utils/publicCatalogAdapter.ts`: adaptador de catálogo a `DashboardWine`.
- `src/frontend/src/features/winery/index.ts`: exportación del adaptador.
- `src/frontend/src/features/winery/components/index.ts`: remoción de exportación de `WineryPublicWineDetailModal`.
- `src/frontend/src/features/winery/components/WineryPublicWineDetailModal.tsx`: archivo eliminado.
- `src/frontend/src/pages/DashboardPage.tsx`: refactorización limpia para consumir `useQuickAddToCellar` y `useFavorites`.
- `src/frontend/src/pages/WineryPublicCatalogPage.tsx`: uso de `DashboardWineCard`, hooks compartidos y remoción de modal provisorio.
- `src/frontend/tests/features/winery/publicCatalogAdapter.test.ts`: tests unitarios del adaptador (campos completos y faltantes).
- `src/frontend/tests/pages/WineryPublicCatalogPageBloqueU9.test.tsx`: suite de integración para tarjetas, enlaces `/vinos/{id}`, modal de cava, favoritos y visitantes anónimos.
- `src/frontend/tests/pages/WineryPublicProfile.test.tsx`: actualización del test de catálogo para reflejar la navegación a `/vinos/{id}` sin modal provisorio.

---

## 3. Decisiones técnicas
- **Inmutabilidad y Estado Derivado**: En `DashboardWineCard`, cuando `onToggleFavorite` está presente (modo controlado por el padre), el estado de favorito no se duplica en `useState` sino que se deriva directamente de `wine.isFavorite`, garantizando que ante un rollback del backend la UI refleje el estado verdadero de forma instantánea.
- **Acceso Anónimo**: El catálogo público de bodega debe ser navegable por visitantes no registrados; por ende, las acciones operativas de Cava y Favoritos se ocultan visualmente y cuentan con guarda defensiva hacia `/login`.

---

## 4. Verificaciones
- **Backend**:
  - `dotnet test`: 763 pruebas ejecutadas, 763 superadas (0 fallas).
- **Frontend**:
  - `npm test`: 63 archivos de prueba, 304 pruebas superadas (0 fallas).
  - `npm run build`: Compilación TypeScript (`tsc -b`) y empaquetado Vite (`vite build`) exitosos sin advertencias de tipos.
  - `npm run lint`: Se ejecutan los linters de ESLint. 7 problemas preexistentes identificados en archivos fuera de este alcance (`WineDetailView.tsx`, `useRealWine.ts`, `useWineCatalogs.ts`, `WineryDashboardPage.tsx`), ninguno introducido por el Bloque U9.

---

## 5. Pendientes
- Ninguno en el alcance del Bloque U9. Continuar con el Bloque U10 (`fix/usuario-ficha-vino`).
