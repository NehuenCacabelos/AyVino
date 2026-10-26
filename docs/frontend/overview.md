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

## 4. Estructura de Directorios

```text
src/frontend/src/
├── assets/                    # Recursos visuales optimizados
├── components/                # Componentes transversales
│   └── layout/                # RootLayout, AppLayout, ProfileTopBar, RouteErrorElement, Navbar
├── constants/                 # Constantes globales compartidas (bannerThemes.ts)
├── features/                  # Arquitectura orientada a características
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

## 5. Calidad y Cumplimiento de Reglas 8 a 11

El área de bodega fue auditada y normalizada bajo cumplimiento estricto de las reglas constitucionales del proyecto:
- **Regla 8 (Inmutabilidad y Actualizaciones Funcionales)**: Ninguna mutación in-place (`push`, `splice`, `sort`). Todos los setters con dependencia del estado previo usan forma funcional `setX(prev => ...)`. En listas dinámicas (`blend`), cada fila posee un identificador determinista único (`id: string`) para evitar claves por índice de array.
- **Regla 9 (Saneamiento de Efectos y Limpieza de Recursos)**: Todos los `useEffect` que crean timers para auto-dismiss de mensajes devuelven funciones de limpieza con `clearTimeout`. Los efectos vigilan dependencias primitivas estables (`wineId`, `wineryId`) en lugar de objetos completos.
- **Regla 10 (Formularios Controlados y Validaciones)**: Todos los inputs inicializan con cadenas vacías controladas (nunca `null` ni `undefined`). Todos los formularios interceptan el envío mediante `e.preventDefault()`.
- **Regla 11 (Contextos Memoizados y Estado Derivado Puro)**: `WineryContext` y `useMyWinery` devuelven objetos memoizados con `useMemo`. No se almacenan valores derivados en `useState`.

---

## 6. Verificación y Testing

```bash
# Frontend (Vitest + Testing Library)
cd src/frontend
npm test        # 19 suites de prueba, 69 tests pasando en verde
npm run lint    # Cero errores y cero advertencias en ESLint
npm run build   # Compilación estricta TypeScript (tsc -b && vite build)

# Backend (.NET Core)
dotnet test     # 545 tests unitarios pasando en verde
dotnet build    # Cero errores de compilador
```
