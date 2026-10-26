# Arquitectura y Diseño Frontend - AyVino

El frontend de AyVino es una Single Page Application (SPA) desarrollada en **React 19** con **TypeScript** estricto y empaquetada mediante **Vite 8**.

---

## 1. Stack Tecnológico

| Dependencia | Versión | Rol / Justificación |
| :--- | :--- | :--- |
| **React** | 19.x | Interfaz reactiva con Concurrent Mode nativo y Functional Components con Hooks. |
| **TypeScript** | ~5.8 | Tipado estricto de extremo a extremo sin concesiones (`noUnusedLocals`, `noUnusedParameters`, cero `any`). |
| **Vite** | 8.x | Servidor de desarrollo con Hot Module Replacement (HMR) instantáneo y compilador optimizado. |
| **Tailwind CSS** | v4 (`@tailwindcss/vite`) | Motor de utilidades moderno de última generación integrado directamente con Vite. |
| **Lucide React** | ^1.46 | Iconografía vectorial consistente y liviana para acciones de usuario y navegación. |
| **Leaflet & React-Leaflet** | ^1.9 / ^5.0 | Mapas interactivos para geolocalización de bodegas y resolución territorial con Georef. |
| **React Router DOM** | v7.x | Data Router v7 (`createBrowserRouter`) con soporte de layouts anidados, loaders y error boundaries. |
| **Axios** | ^1.20 | Cliente HTTP para comunicación tipada con la API RESTful. |

---

## 2. Pautas Visuales y Estilo Editorial (Ronda 4)

AyVino implementa una estética de **revista editorial de vinos**: cálida, noble, sofisticada y limpia, distanciándose del diseño corporativo frío.

### 2.1 Paleta Cromática y Acabados Unificados
- **Fondo Base Nocturno Mate (`#0f0f11` / `#0b0b0e` / `#0c0c0e`)**: 
  - Vistas operativas y catálogos: `#0f0f11` con footer persistente `#0c0c0e`.
  - Vistas inmersivas (configuración y ficha de perfil): `#0b0b0e` edge-to-edge con `WineryTopBar` fija y paneles `#121015`/`#17151a`.
- **Acento Borgoña Vino Sobrio (`#6e1a24` / `#85222e`)**: Utilizado de manera consistente en todos los botones de acción primaria (`Nueva etiqueta`, `Guardar datos`, `Actualizar contraseña`, `Registrar mi bodega`), foco `ring-rose-500/50` y selecciones `selection:bg-[#6e1a24]`.
- **Acentos Dorados de Cava (`amber-200/60` a `amber-300`)**: Reservados para pasos editoriales, sellos de terruño, estrellas de cata y microetiquetas (`font-mono tracking-[0.25em]`).
- **Bordes Milimétricos Limpios (`border-white/5` y `border-white/10`)**: Delimitación sobria de 1px para tarjetas, buscadores, inputs y separadores de panel.

### 2.2 Tipografías y Jerarquía Editorial
- **Serif Editorial (600)**: Títulos principales (`h1`, `h2`) en peso semi-bold, con `tracking-tight` y color `text-neutral-100` o `text-white`.
- **Sans-Serif Interfaz (400 y 500)**: Formularios, botones, textos descriptivos y tablas técnicas.
- **`font-mono` (Caja alta & tracking amplio)**: Eyebrows, metadatos y fechas (`text-[10px] sm:text-[11px] font-mono tracking-[0.2em] uppercase text-neutral-400 font-medium`).

---

## 3. Arquitectura del Área de Bodega (`features/winery` y vistas)

Siguiendo la **Regla de Aislamiento Estricto** del proyecto, todo el dominio vitivinícola reside desacoplado en `src/frontend/src/features/winery/` y páginas `Winery*.tsx`, sin importar componentes de las áreas privadas de usuario (`features/dashboard`, `features/wines`, `features/pairings`, `features/cava`).

### 3.1 Jerarquía de Layouts de Bodega
1. **`WineryPublicLayout` (Rutas Públicas)**:
   - Envuelve `/para-bodegas` y `/bodegas/:id`.
   - Renderiza el `Navbar` superior compartido, `<Outlet />` para la vista hija y el footer institucional.
2. **`WineryLayout` (Panel Protegido `/bodega/*`)**:
   - Reemplaza la antigua sidebar por `WineryNavbar`: barra superior persistente fija con logo "AyVino.", enlaces de navegación (`NavLink` con `isActive`), badge de estado institucional y menú desplegable con avatar/logo de bodega (`WineryLogo`), accesos a configuración, perfil público y cierre de sesión.
   - Provee contexto reactivo memoizado a las vistas hijas vía `WineryProvider` y `Outlet context`.
   - Footer legal persistente `#0c0c0e` con el texto: *"Beber con moderación · Prohibida su venta a menores de 18 años"*.
   - Tratamiento de estados globales: carga (`WineryLoadingState`), error de sincronización (`WineryErrorState`) y 404 para cuentas autenticadas sin bodega asociada.
3. **`WineryTopBar` (Vistas Inmersivas Contextuales)**:
   - Utilizado en `/bodega/configuracion` y `/bodega/perfil`.
   - Barra contextual superior fija (`h-14`, backdrop-blur, borde `border-b border-white/10`), marca enlazando a `/bodega/dashboard` y botón *"Volver al panel"*.

### 3.2 Vistas del Área de Bodega
- **Propuesta de Valor Institucional (`ForWineriesPage.tsx` en `/para-bodegas`)**: Landing de bienvenida para bodegas con beneficios y pasos de certificación.
- **Registro Unificado de Bodega (`WineryRegisterPage.tsx` en `/bodega/registro`)**: Formulario split-card inmersivo en 2 pasos con integración de `RegionPicker` y mapa Leaflet.
- **Panel Principal (`WineryDashboardPage.tsx` en `/bodega/dashboard`)**: Cinta de 4 KPIs (`WineryKpiRibbon`), accesos rápidos (`WineryQuickActions`), checklist interactivo (`WineryChecklistCard`) y últimas etiquetas oficiales (`WineryRecentWines`).
- **Configuración de la Bodega (`WineryConfigPage.tsx` en `/bodega/configuracion`)**: Clon visual inmersivo de `AccountPage` con sidebar izquierda (logo circular con `ring-4`, botones de subida/eliminación de logo, navegación en `font-mono`) y 4 secciones independientes:
  1. *Datos de la bodega*: Nombre oficial, año de fundación, sitio web y semblanza histórica (con validaciones y contador).
  2. *Región y terruño*: Selector territorial interactivo con `RegionPicker` (mapa satelital o selección en lista).
  3. *Cuenta del responsable*: Nombre de usuario y correo del titular en modo solo lectura (`getCurrentUserApi`).
  4. *Seguridad y acceso*: Formulario de cambio de contraseña con toggle de visibilidad (`changePasswordApi`).
- **Ficha Institucional de Bodega (`WineryOverviewPage.tsx` en `/bodega/perfil`)**: Rediseño visual alineado con `ProfilePage`:
  - Banner vitivinícola degradado determinista calculado con `getBannerThemeByUsername(winery.name)`.
  - Logo circular con aro `ring-4` superpuesto sobre el banner.
  - Nombre en Serif grande, badges de estado (`Oficial`, `En revisión`, `Observaciones`), terruño y año de fundación.
  - Botones de acción: *"Editar configuración"* (hacia `/bodega/configuracion`) y *"Ver cómo lo ven los usuarios"* (hacia `/bodegas/:id`, siempre habilitado).
  - Cinta de métricas consolidadas (seguidores, etiquetas oficiales, cosechas y puntaje de la comunidad).
  - Mapa Leaflet de terruño de solo lectura y catálogo resumido.
- **Gestión de Catálogo y Cosechas (`WineryWinesPage.tsx` en `/bodega/vinos`)**: Grilla con filtros por tipo de vino, buscador en tiempo real, alta de etiqueta oficial (`WineCreateModal`) y administración de cosechas/añadas (`WineVintagesModal`).
- **Reclamo de Vinos Comunitarios (`WineryClaimPage.tsx` en `/bodega/reclamar`)**: Adopción de botellas subidas por aficionados conservando sus reseñas históricas.
- **Vidriera Pública Universal (`WineryPublicProfilePage.tsx` en `/bodegas/:id`)**: Vidriera accesible sin sesión con seguimiento comunitario, desacoplada 100% de `features/wines` mediante `WineryPublicWineCard` y `WineryPublicWineDetailModal`.

---

## 4. Arquitectura del Panel de Administración (`features/admin` y vistas `/admin/*`)

El panel de administración es una herramienta interna, sobria y funcional diseñada exclusivamente para usuarios con rol `Admin`. Implementa el mismo tema oscuro `#0f0f11` y acentos borgoña `#6b1d28` que el resto del sistema, garantizando responsividad fluida (menú lateral drawer en móviles y barra lateral fija en escritorio).

### 4.1 Componentes y Utilidades Compartidas (`features/admin`)
- **`AdminLayout.tsx`**: Layout maestro protegido (`ProtectedRoute allowedRoles={['Admin']}`). Incluye sidebar con navegación activa, cabecera con avatar y badge de rol "Admin", menú colapsable para dispositivos móviles, y enlaces rápidos de pie ("Volver al sitio" y "Cerrar sesión"). Aloja el `AdminToastProvider`.
- **`PageHeader.tsx`**: Título editorial, descripción explicativa de sección y slots para acciones primarias.
- **`DataTable.tsx`**: Tabla genérica tipada `<T>` con estados de carga animados (5 skeletons), mensaje vacío personalizado y scroll horizontal contenido sin romper el viewport general.
- **`PaginationControls.tsx`**: Paginación Anterior/Siguiente adaptada a colecciones sin conteo total de registros, indicador de página y selector de tamaño (10, 25, 50).
- **`StatusBadge.tsx` y `ActiveBadge.tsx`**: Badges visuales para estados de moderación (`Pending` en ámbar, `Approved` en verde, `Rejected` en rojo) y actividad de usuarios (`Activo` en verde, `Inactivo` en gris).
- **`ConfirmDialog.tsx`**: Diálogo modal accesible (`role="dialog"`, aria-modal, trampa de foco y cierre con Escape) con soporte para variantes neutras y críticas (`danger`) con feedback de procesamiento.
- **`AdminToast.tsx` / `useAdminToast`**: Notificaciones flotantes no invasivas para confirmaciones de éxito y captura de errores.
- **`ErrorBanner.tsx`**: Alertas visuales con botón de reintento ante fallos de red o de API.
- **`usePagedList.ts`**: Hook reutilizable de paginación que aísla respuestas obsoletas asíncronas y reinicia a la página inicial ante cambios en dependencias o filtros.
- **`getApiErrorMessage.ts`**: Extractor tipado de errores RFC 7807 (Problem Details) priorizando `detail` > `title`.

### 4.2 Vistas del Panel de Administración
- **Inicio y Métricas (`AdminDashboardPage.tsx` en `/admin`)**: Saludo al administrador, tres tarjetas KPI independientes con conteo real y soporte para desbordamiento ("100+"), listado directo de los últimos pendientes de moderación (bodegas y ciudades) y accesos rápidos a catálogos maestros.
- **Moderación de Bodegas (`AdminWineriesPage.tsx` en `/admin/bodegas`)**: Filtros por chip según estado de moderación (con sincronización en URL `?status=`), tabla detallada con iniciales/logo, acciones dinámicas de aprobación/rechazo, modal de detalle institucional con hipervínculo al perfil público y eliminación física con diálogo destructivo.
- **Moderación de Ciudades (`AdminCitiesPage.tsx` en `/admin/ciudades`)**: Gestión de ciudades sugeridas por la comunidad al registrar bodegas. Filtro por provincia con resolución en memoria de nombres de provincia, y aprobación o rechazo con confirmación.
- **Moderación de Cosechas (`AdminVintagesPage.tsx` en `/admin/cosechas`)**: Bandeja centralizada de añadas cargadas por usuarios y bodegas. Filtros de estado, tabla con miniaturas, resolución sensorial de varietales (blends), modal de ficha técnica extendida (temperatura de servicio, guarda) y acciones de moderación o baja.
- **Gestión de Usuarios (`AdminUsersPage.tsx` en `/admin/usuarios`)**: Catálogo de cuentas registradas con avatar, rol y fecha de alta. Buscador en tiempo real y selector de rol sobre la página cargada, acciones de activación y desactivación, eliminación con borrado de credenciales y protección estricta contra auto-modificación de la cuenta propia en sesión.
- **Catálogo de Variedades de Uva (`AdminGrapesPage.tsx` en `/admin/uvas`)**: ABM integral de cepas enológicas. Filtros por tipo de color, tabla con descriptores sensoriales (cuerpo, taninos, acidez), modal de alta/edición con validación de longitudes y selects opcionales, y borrado con captura de conflictos (409).
- **Catálogo de Maridajes (`AdminPairingsPage.tsx` en `/admin/maridajes`)**: ABM completo de sugerencias gastronómicas categorizadas (Carnes, Pescados, Quesos, Pastas, etc.), modal de creación/edición y eliminación con confirmación.

---

## 5. Estructura de Directorios

```text
src/frontend/src/
├── assets/                    # Recursos visuales optimizados
├── components/                # Componentes transversales
│   └── layout/                # RootLayout, AppLayout, ProfileTopBar, RouteErrorElement, Navbar
├── constants/                 # Constantes globales compartidas (bannerThemes.ts)
├── features/                  # Arquitectura orientada a características
│   ├── admin/                 # Módulo del Panel de Administración (Rol Admin)
│   │   ├── api/               # adminWineriesApi, adminCitiesApi, adminVintagesApi, adminUsersApi, adminGrapesApi, adminPairingsApi
│   │   ├── components/        # AdminLayout, DataTable, PaginationControls, StatusBadge,
│   │   │                      # ConfirmDialog, AdminToast, ErrorBanner, PageHeader
│   │   ├── hooks/             # usePagedList
│   │   ├── types/             # adminUsers, adminPairings, adminVintages
│   │   └── utils/             # getApiErrorMessage, grapeLabels, pairingLabels, wineTypeLabels
│   ├── auth/                  # Módulo de Autenticación (AuthContext, ProtectedRoute, useAuth)
│   ├── dashboard/             # Módulo de Dashboard y Cava de Usuario
│   ├── users/                 # Módulo de APIs de Usuario (getCurrentUserApi, changePasswordApi)
│   ├── wines/                 # Módulo de Vinos de Usuario
│   └── winery/                # Módulo Institucional de Bodegas (100% Desacoplado)
│       ├── api/               # wineryApi, wineApi, locationApi, grapeApi, imageApi
│       ├── components/        # WineryNavbar, WineryTopBar, WineryLayout, WineryPublicLayout,
│       │                      # WineryPublicWineCard, WineryPublicWineDetailModal, WineryLogo,
│       │                      # WineryStatusBanner, WineryKpiRibbon, WineryQuickActions,
│       │                      # WineryChecklistCard, WineryRecentWines, RegionPicker,
│       │                      # WineCreateModal, WineVintagesModal, ImageUploadField, etc.
│       ├── context/           # WineryContext (estado global memoizado con useMemo)
│       ├── hooks/             # useMyWinery (sincronización con /api/wineries/me)
│       ├── types/             # DTOs tipados estrictos (winery, wine, location, grape, problemDetails)
│       └── utils/             # Funciones puras auxiliares
├── pages/                     # Páginas y vistas principales
│   ├── AdminCitiesPage.tsx    # Moderación de ciudades (/admin/ciudades)
│   ├── AdminDashboardPage.tsx # Inicio del panel admin (/admin)
│   ├── AdminGrapesPage.tsx    # Catálogo de variedades de uva (/admin/uvas)
│   ├── AdminPairingsPage.tsx  # Catálogo de maridajes (/admin/maridajes)
│   ├── AdminUsersPage.tsx     # Gestión de usuarios (/admin/usuarios)
│   ├── AdminVintagesPage.tsx  # Moderación de cosechas (/admin/cosechas)
│   ├── AdminWineriesPage.tsx  # Moderación de bodegas (/admin/bodegas)
│   ├── ForWineriesPage.tsx    # Landing para bodegas (/para-bodegas)
│   ├── WineryRegisterPage.tsx # Registro split-card (/bodega/registro)
│   ├── WineryDashboardPage.tsx# Inicio del panel (/bodega/dashboard)
│   ├── WineryConfigPage.tsx   # Configuración inmersiva (/bodega/configuracion)
│   ├── WineryOverviewPage.tsx # Ficha institucional con banner (/bodega/perfil)
│   ├── WineryProfilePage.tsx  # Reexport limpio hacia WineryOverviewPage
│   ├── WineryWinesPage.tsx    # Catálogo y cosechas (/bodega/vinos)
│   ├── WineryClaimPage.tsx    # Reclamo de vinos comunitarios (/bodega/reclamar)
│   └── WineryPublicProfilePage.tsx # Vidriera pública (/bodegas/:id)
├── routes/                    # Data Router v7
│   └── AppRoutes.tsx          # Definición centralizada con createBrowserRouter
└── services/                  # Infraestructura
    └── apiClient.ts           # Cliente Axios con mutex de refresh token
```

---

## 6. Calidad y Cumplimiento de Reglas 8 a 11

El área de bodega y el panel de administración fueron auditados y normalizados bajo cumplimiento estricto de las reglas constitucionales del proyecto:
- **Regla 8 (Inmutabilidad y Actualizaciones Funcionales)**: Ninguna mutación in-place (`push`, `splice`, `sort`). Todos los setters con dependencia del estado previo usan forma funcional `setX(prev => ...)`. En listas dinámicas (`blend`), cada fila posee un identificador determinista único (`id: string`) para evitar claves por índice de array.
- **Regla 9 (Saneamiento de Efectos y Limpieza de Recursos)**: Todos los `useEffect` que crean timers para auto-dismiss de mensajes devuelven funciones de limpieza con `clearTimeout`. Los efectos vigilan dependencias primitivas estables (`wineId`, `wineryId`, `key`) en lugar de objetos completos y controlan banderas de desmontaje (`cancelled`) para ignorar respuestas obsoletas.
- **Regla 10 (Formularios Controlados y Validaciones)**: Todos los inputs inicializan con cadenas vacías controladas (nunca `null` ni `undefined`). Todos los formularios interceptan el envío mediante `e.preventDefault()`.
- **Regla 11 (Contextos Memoizados y Estado Derivado Puro)**: `WineryContext`, `AdminToastContext` y sus proveedores devuelven objetos memoizados con `useMemo`. No se almacenan valores derivados en `useState`.

---

## 7. Verificación y Testing

```bash
# Frontend (Vitest + Testing Library)
cd src/frontend
npm test        # 29 suites de prueba, 101 tests pasando en verde
npm run lint    # Cero errores y cero advertencias en ESLint
npm run build   # Compilación estricta TypeScript (tsc -b && vite build)

# Backend (.NET Core)
dotnet test     # Tests unitarios pasando en verde
dotnet build    # Cero errores de compilador
```
