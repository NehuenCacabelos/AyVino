# USUARIO — BLOQUE U10: Ficha del vino — Conexión con cava y enlaces a bodega
**Rama**: `fix/usuario-ficha-vino`  
**Fecha**: 14 de noviembre de 2026  
**Estado**: Completado exitosamente

---

## 1. Resumen de lo realizado
En este bloque se completó la experiencia de la ficha de vino (`/vinos/:id`) integrando la acción "Guardar en cava" con el modal de alta rápida (`QuickAddBottleModal`) precargado con los datos de la etiqueta y la cosecha activa seleccionada, y conectando la navegación hacia la bodega productora (`/bodegas/{wineryId}`) tanto desde el texto "Elaborado por..." como desde la tarjeta dedicada "Bodega Elaboradora".

### Principales intervenciones:
1. **Acción "Guardar en cava" para Vinos Reales**:
   - En `WineDetailView.tsx`, cuando se trata de una etiqueta real (`isRealWine === true`), al presionar "Guardar en cava" se abre `QuickAddBottleModal` con los datos del vino precargados (`name`, `winery`, `region`, `varietal`, `vintage`, `rating`, `bottle`, `imageUrl`, `matchedWineId`, `wineryId`).
   - La cosecha preseleccionada en el modal se sincroniza fielmente con la añada activa en la ficha (`selectedVintageYear` / `activeVintage.year`). Al cambiar de cosecha en la ficha mediante los chips de añadas y luego presionar "Guardar en cava", el modal abre con la nueva cosecha seleccionada.
   - En modo dueño de la bodega (`ownerMode = true`), el botón se mantiene deshabilitado con el tooltip "No podés guardar tus propios vinos en tu cava personal".
   - En vinos de maqueta editorial (`isRealWine === false`), se conserva intacto el comportamiento preexistente en memoria/storage.
   - Tras el guardado exitoso en el modal, se refresca el stock de la barra superior mediante `outletCtx.refreshStock()` o `outletCtx.setStockCount()` y se emite un toast confirmatorio con acción directa "Ver en mi Cava" (`/cava`).

2. **Navegación hacia la Bodega Productora**:
   - **Encabezado editorial ("Elaborado por {bodega}")**:
     - Si `wineryId` está disponible, el nombre de la bodega se renderiza como `<Link to={'/bodegas/${wineryId}'}>` con estilos interactivos y subrayado en hover.
     - Si `wineryId` no está presente (bodega de texto libre o sin ID registrado), se renderiza como texto plano sin link.
   - **Tarjeta "Bodega Elaboradora"**:
     - El título de la bodega se renderiza como `<Link to={'/bodegas/${wineryId}'}>`.
     - Toda la tarjeta actúa como contenedor interactivo con cursor pointer y efecto hover, navegando a `/bodegas/{wineryId}` si se hace clic sobre ella (con guarda para no disparar doble navegación al cliquear enlaces internos como la URL web).
     - Si `wineryId` no está disponible, la tarjeta se renderiza como bloque estático sin navegación.

3. **Mapeo de Datos en `apiWineToEditorial` y Tipos**:
   - Se extendieron las interfaces `WineWineryInfo` y `EditorialWine` en `editorialWines.ts` para incluir `wineryId?: number`.
   - Se actualizó el adaptador `apiWineToEditorial.ts` para resolver y mapear `wineryId` prioritariamente desde `winery.id`, o alternativamente desde `wine.wineryId`.

4. **Fidelidad Visual y Regresión Visual Estricta**:
   - La prueba de instantánea de regresión visual `WineDetailPage.snapshot.test.tsx` (que evalúa el renderizado HTML de `catena-zapata-malbec-argentino`) continúa pasando de forma 100% idéntica e inmodificada, preservando los espacios en blanco y el marcado editorial exacto.

---

## 2. Archivos modificados y creados
- `src/frontend/src/features/wines/data/editorialWines.ts`: extensión de tipos `WineWineryInfo` y `EditorialWine` con propiedad opcional `wineryId?: number`.
- `src/frontend/src/features/wines/adapters/apiWineToEditorial.ts`: resolución y mapeo de `wineryId` desde la bodega o el vino de la API.
- `src/frontend/src/features/wines/components/WineDetailView.tsx`: integración de `useQuickAddToCellar`, apertura de `QuickAddBottleModal` en vinos reales con la añada activa, enlaces y clics a `/bodegas/{wineryId}` en encabezado y tarjeta.
- `src/frontend/tests/pages/WineDetailPageBloqueU10.test.tsx`: nueva suite completa de pruebas unitarias y de integración (9 tests) cubriendo apertura de modal con añada activa preseleccionada, actualización de añada al cambiar chip, deshabilitado en ownerMode, comportamiento en maqueta, enlaces a bodega presente/ausente y adaptador `apiWineToEditorial`.

---

## 3. Decisiones técnicas
- **Preservación Estricta de Snapshot**: Para asegurar que el snapshot test no detectara divergencias de espacios en blanco en JSX, se cuidó minuciosamente la interpolación del texto `Elaborado por {wineryId ? <Link ...> : <span>...</span>}` asegurando que no se generen saltos de línea ni espacios adicionales no deseados.
- **Interacción del Contenedor de Bodega**: Para que el bloque de la bodega sea intuitivo, todo el panel tiene `onClick` hacia `/bodegas/{wineryId}`, pero respetando eventos en elementos interactivos anidados (`e.target.closest('a')`), evitando colisiones al hacer clic en el enlace web externo de la bodega.

---

## 4. Verificaciones
- **Backend**:
  - `dotnet test`: 763 pruebas ejecutadas, 763 superadas (0 fallas).
- **Frontend**:
  - `npm test`: 64 archivos de prueba, 313 pruebas superadas (0 fallas).
  - Snapshot test `WineDetailPage.snapshot.test.tsx`: 1 superado (0 fallas, snapshot inmodificado).
  - `npm run build`: Compilación TypeScript (`tsc -b`) y bundle Vite (`vite build`) exitosos en 694 ms.
  - `npm run lint`: Sin nuevos errores ni advertencias introducidos.

---

## 5. Pendientes
- Ninguno en el alcance del Bloque U10. Continuar con el Bloque U11 (`fix/usuario-cata-historial`).
