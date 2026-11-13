# Reporte de Implementación — Bloque U3: Nombre y logo de la bodega llevan a su perfil

**Fecha:** 13 de Noviembre de 2026  
**Rama:** `fix/usuario-bodega-enlaces`  
**Autor:** Antigravity AI Agent  
**Estado:** Finalizado con éxito — Listo para revisión y merge por Kevin

---

## 1. Resumen Ejecutivo
El Bloque U3 conecta la navegación entre el dashboard principal de usuario y los perfiles públicos de bodega (`/bodegas/:id`). Se incorporó el soporte para `wineryId` y `wineryLogoImageId` en el modelo y DTOs de vino, se implementó el agrupamiento dinámico inteligente por identificador de bodega en `DashboardPage`, y se dotó a la cabecera de `WineryBlock` de navegación accesible con soporte de logo institucional e iniciales de respaldo.

Adicionalmente, se realizó una inspección exhaustiva de solo lectura del flujo de seguimiento ("Seguir bodega" / "Siguiendo") en `WineryPublicProfileLayout.tsx`, comprobando su correcto funcionamiento para usuarios autenticados, visitantes anónimos y dueños.

---

## 2. Detalle de Cambios por Componente

### 2.1 Modelo y Mapeo de Datos (`src/frontend/src/types/wine.ts`)
- **`CatalogWineItemDto`**: Se incorporó el campo opcional `wineryLogoImageId?: string | null` provisto desde el endpoint de catálogo (incorporado en Bloque U1).
- **`DashboardWine`**: Se extendió la interfaz agregando `wineryId?: number` y `wineryLogoImageId?: string`.
- **`catalogWineToDashboardWine`**: Se actualizó la función pura de mapeo para propagar `wineryId: item.wineryId ?? undefined` y `wineryLogoImageId: item.wineryLogoImageId ?? undefined`.

### 2.2 Agrupamiento Dinámico en Dashboard (`src/frontend/src/pages/DashboardPage.tsx`)
- Se extendió la interfaz interna `WineryGroup` con los atributos `key: string`, `wineryId?: number` y `logoImageId?: string`.
- En el memo de `wineryGroups`:
  - Se genera una clave determinista: `wineryId != null ? 'winery-id-' + wine.wineryId : 'winery-text-' + wineryName.toLowerCase()`. Esto asegura que vinos con distinta grafía o puntuación en el nombre pero pertenecientes a la misma bodega registrada se consoliden en un único bloque.
  - Se almacena y preserva el `wineryId` y el primer `wineryLogoImageId` disponible en la colección de vinos del grupo.
  - Se actualizó el renderizado de `WineryBlock` en la lista paginada pasando `key={group.key}`, `wineryId={group.wineryId}` y `logoImageId={group.logoImageId}`.

### 2.3 Cabecera de Bloque de Bodega (`src/frontend/src/features/dashboard/components/WineryBlock.tsx`)
- Se actualizaron las props `WineryBlockProps` para aceptar `wineryId?: number` y `logoImageId?: string`.
- Se introdujo estado local `logoError: boolean` para controlar fallos de carga en imágenes remotas.
- **Bodega registrada (`wineryId` presente)**:
  - El contenedor de isotipo/logo y el nombre de la bodega están envueltos en un componente `<Link to={'/bodegas/' + wineryId}>` con clases de accesibilidad `focus-visible:ring-2 focus-visible:ring-rose-500/80`.
  - Soporta micro-interacciones mediante Tailwind `group/winery`: en hover, el borde del logo transiciona a `group-hover/winery:border-white/20` y el título `<h3>` a `group-hover/winery:text-rose-200`.
- **Vino comunitario / artesanal (`wineryId` ausente)**:
  - Se renderiza la cabecera como un bloque estático no interactivo (sin etiqueta `<a>`, sin hover, con `h3` estándar).
- **Renderizado de Logo y Respaldo**:
  - Si `logoImageId` está definido y no ha fallado, se genera la URL mediante `imageUrl(logoImageId, 'logo')` y se renderiza un elemento `<img>` con `object-contain p-1` y `alt={'Logo de ' + name}`.
  - Al dispararse el evento `onError`, el estado conmuta automáticamente a `logoError = true`, renderizando las iniciales editoriales de la bodega (`initials`) sin roturas visuales.

---

## 3. Verificación de Solo Lectura: Perfil de Bodega (Sección 3.3)

Se auditó el archivo `src/frontend/src/pages/WineryPublicProfileLayout.tsx` (líneas 120-195) para evaluar los comportamientos del botón de seguimiento según el rol:

1. **Usuario Común Autenticado**:
   - `!user` es `false`, `profile.isOwner` es `false`.
   - El botón se muestra plenamente habilitado con texto dinámico: `"Seguir bodega"` o `"Siguiendo"`.
   - Al cliquear, ejecuta `handleToggleFollow`:
     - Aplica actualización optimista inmediata (`isFollowing: !prev`, incrementa o decrementa `followersCount`).
     - Despacha `POST /api/wineries/{id}/follow` (`followWinery`) o `DELETE /api/wineries/{id}/follow` (`unfollowWinery`).
     - En caso de error de red o servidor, revierte el estado y muestra un toast de notificación.
   - **Resultado:** Flujo completamente operativo, sin bloqueos técnicos.

2. **Visitante Anónimo (Sin Sesión)**:
   - `!user` es `true`.
   - Al hacer clic en `"Seguir bodega"`, el handler evalúa `if (!user) { navigate('/login', { state: { from: location.pathname } }); return; }`.
   - Redirige al usuario al formulario de login preservando el origen en el estado de navegación.
   - **Resultado:** Comportamiento estándar y esperado de UX.

3. **Dueño de la Bodega (`profile.isOwner === true`)**:
   - El botón se presenta con opacidad reducida (`opacity-60 cursor-not-allowed`), atributo `title="No podés seguir a tu propia bodega"` y `aria-label="No podés seguir a tu propia bodega"`.
   - Al cliquearlo, no realiza llamadas HTTP y dispara un toast preventivo: `"No podés seguir a tu propia bodega"`.
   - **Resultado:** Protección de integridad de negocio coherente.

4. **Bloqueos Identificados:**
   - Ninguno. El flujo está implementado de forma robusta y no requiere intervención.

---

## 4. Pruebas Unitarias Desarrolladas (Vitest)

Archivo: `src/frontend/tests/features/dashboard/WineryBlockBloqueU3.test.tsx` (7 pruebas):
1. `renderiza cabecera con enlace a /bodegas/{id} cuando wineryId está presente`: Valida la presencia del tag `<a>`, el `href` exacto `/bodegas/42`, y las clases `group/winery` y `focus-visible`.
2. `renderiza cabecera como texto plano sin enlace cuando wineryId NO está presente`: Valida que no exista ningún enlace a `/bodegas/...` y que el encabezado sea un `<h3>` estático.
3. `renderiza imagen de logo cuando logoImageId está presente`: Valida la etiqueta `<img>` con `src` apuntando a `/api/images/{id}?variant=logo` y texto alternativo accesible.
4. `hace respaldo a iniciales cuando la imagen de logo falla al cargar (onError)`: Emula `fireEvent.error` en la imagen y valida la transición inmediata a las iniciales (`CZ`).
5. `muestra monograma con iniciales cuando no se proporciona logoImageId`: Valida el renderizado directo del monograma sin etiquetas `<img>`.
6. `DashboardWine mapea correctamente wineryId y wineryLogoImageId desde CatalogWineItemDto`: Valida la función pura `catalogWineToDashboardWine`.
7. `agrupación por wineryId unifica vinos de la misma bodega y preserva wineryId y logoImageId`: Valida el algoritmo de unificación de catálogo por identificador numérico y clave de texto.

---

## 5. Resultados de las Verificaciones

- **`dotnet build`**: Compilación exitosa, 0 advertencias, 0 errores.
- **`dotnet test`**: 740 pruebas unitarias aprobadas (0 fallas).
- **`npm run lint`**: 0 errores en los archivos modificados. Se documentaron 4 errores preexistentes de React 19 (`react-hooks/set-state-in-effect`) en componentes y hooks fuera del alcance del bloque (`WineDetailView.tsx`, `useRealWine.ts`, `useWineCatalogs.ts`, `WineryDashboardPage.tsx`).
- **`npm run build`**: Compilación de Vite y chequeo de tipos TypeScript (`tsc -b`) exitoso en 565ms.
- **`npm test`**: 54 suites de prueba ejecutadas, **260 pruebas superadas (100% éxito)**.

---

## 6. Historial de Commits Atómicos en la Rama
- `f62ea3d`: `feat(dashboard): vincular cabecera de bodega a su perfil y renderizar logo oficial con respaldo`
- `d8332e4`: `test(dashboard): agregar pruebas unitarias para cabecera con enlaces, logos y agrupacion por wineryId`
