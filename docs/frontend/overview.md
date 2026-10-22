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
| **React Router DOM** | v7.x | Enrutamiento declarativo del lado del cliente con soporte de rutas anidadas. |
| **Axios** | ^1.20 | Cliente HTTP para comunicación tipada con la API RESTful. |

---

## 2. Pautas Visuales y Estilo Editorial

AyVino implementa una estética de **revista editorial de vinos**: cálida, noble, sofisticada y limpia, distanciándose del diseño corporativo frío.

### 2.1 Paleta Cromática y Acabados (Fondo Oscuro Mate)
- **Fondo Base Carbón Mate (`#0f0f11` / `#121214` / `#0a0a0c`)**: Evita el negro puro ofreciendo una textura sobria, descansada y elegante para la interfaz nocturna de cava.
- **Acento Bordó Vino Sobrio (`#6e1a24` / `#831823` y `#4f131f`)**: Utilizado en botones de acción primaria (`+ REGISTRAR BOTELLA`, `"Registrar mi bodega"`, `"Nueva etiqueta"`, `"Descorchar"`, `"Crear cuenta"`) y sellos de formulario (`#4f131f`), sin saturación chillona.
- **Acentos Dorados de Cava (`amber-200/60` a `amber-200/80`)**: Reservados para números de pasos editoriales, sellos de procedencia y microetiquetas (`font-mono tracking-[0.25em]`).
- **Bordes de Estructura Limpia (`border-neutral-800` / `border-white/5` / `border-white/10`)**: Delimitación milimétrica de 1px para tarjetas, buscador, inputs y separadores de panel.

### 2.2 Tipografías y Jerarquía Editorial
- **`Fraunces` / `Cormorant Garamond` (Serif 600)**: Títulos principales (`h1`, `h2`) en peso semi-bold, sin cursivas ni trazos ultra finos, con `tracking-tight` y color `text-neutral-100`.
- **`Plus Jakarta Sans` / `Geist Sans` (Sans-Serif 400 y 500)**: Interfaz, botones, textos de bajada y tablas técnicas.
- **`font-mono` (Caja alta & tracking amplio)**: Eyebrows y saludos (`text-[11px] font-mono tracking-[0.25em] uppercase text-neutral-400 font-medium`).
- **Navegación Superior (Navbar Reactivo al Scroll en 3 Columnas)**: Barra fija con transición fluida (`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-500`). En el primer pliegue durante el Hero (`window.scrollY <= window.innerHeight * 0.7`), se mantiene transparente (`bg-transparent border-b border-transparent shadow-none`); al descender más allá del 70% del viewport, se funde con la estética carbón (`bg-[#0a0a0c]/90 backdrop-blur-md border-b border-white/[0.08] shadow-lg shadow-black/40`) gestionado limpiamente con `cn()`. Incluye enlace discreto *"Para bodegas"* visible tanto en escritorio como en el menú drawer mobile.
- **Franja Editorial Institucional (`Landing.tsx`)**: Ubicada antes del footer principal, expone la propuesta de valor para productores ("¿Sos productor vitivinícola?") e invita a certificar etiquetas y reclamar botellas hacia `/para-bodegas`.

### 2.3 Portal Institucional y Registro de Bodegas (`/para-bodegas` y `/bodega/registro`)
- **Página de Propuesta de Valor (`ForWineriesPage.tsx`)**:
  - Hero editorial a pantalla completa con fondo carbón `#0a0a0c`, iluminación enológica difusa e invitaciones directas a registrarse.
  - Grilla de 3 beneficios diferenciales: Certificación Institucional (Ficha Técnica Oficial con sello), Adopción Inteligente (Reclamo de Vinos Comunitarios conservando reseñas) y Comunidad Enológica (Perfil Público y Seguidores).
  - Guía de proceso en 3 pasos numerados (`01` Registro, `02` Verificación editorial, `03` Publicación y gestión).
- **Registro Unificado de Bodega (`WineryRegisterPage.tsx`)**:
  - Formulario de alta en un único paso con estética split-card editorial y fotografía vertical de viñedos mendocinos.
  - Agrupación semántica en dos secciones: Datos del Responsable (nombre, email y contraseña con medidor de longitud) y Datos de la Bodega (nombre, ubicación, año de fundación opcional, sitio web y descripción).
  - **Selector de Ubicación en Cascada (`LocationCascadeSelect.tsx`)**: Consulta `/api/states` y `/api/locations` de forma reactiva, permitiendo al productor seleccionar su provincia y filtrar inmediatamente sus ciudades/terruños disponibles para asignar el `locationId` requerido por la API.
  - **Flujo de Alta Transaccional y Login Automático**: Invoca `registerWinery()` (`POST /api/wineries/register`), inmediatamente realiza login con las credenciales ingresadas vía `useAuth.login()` para sincronizar tokens y perfil en `AuthContext`, y redirige fluidamente hacia `/bodega/dashboard`.
  - Enlaces de consentimiento explícito a los Términos y Condiciones del servicio antes del envío.

### 2.4 Panel de Bodega y Estructura Editorial (`features/winery`)
- **Layout de Panel (`WineryLayout.tsx`)**: Arquitectura de doble panel con cabecera superior y barra lateral izquierda (`aside`) en escritorio (`w-64`, fondo `#121214`, borde `border-r border-white/5`), monograma circular con iniciales de la bodega (`getWineryInitials`), badge de estado institucional (`Oficial`, `En revisión` o `Rechazada`), y enlaces directos a Dashboard, Perfil, Mis Vinos y Reclamo de etiquetas.
- **Banner Reactivo de Moderación (`WineryStatusBanner.tsx`)**: Informa de forma transparente y sobria las restricciones de `WineryAccessRules` cuando la bodega está en estado `Pending` o `Rejected`.
- **Manejo Centralizado de Problem Details (RFC 7807)**: Tratamiento de errores tipados mediante `getProblemDetails()` y `getErrorMessage()`, exponiendo el `detail` de las excepciones de negocio (`NotFoundException`, `ForbiddenException`, `ValidationException`).
- **Tratamiento del 404 de Cuenta sin Bodega**: Si un usuario con rol `Winery` o `Admin` accede al panel pero no posee una bodega asociada en la base de datos, el layout intercepta el 404 y presenta una vista editorial guiada con opción para registrar su bodega oficial o volver a la cava personal.
- **Inicio de Panel de Bodega (`WineryDashboardPage.tsx`)**:
  - **Cabecera Editorial**: Saludo con fecha contextual rioplatense, nombre oficial de la bodega, badge de verificación institucional, terruño geográfico resuelto (`getLocationById`), año de fundación y botón primario de acción rápida (*"Nueva etiqueta"*).
  - **Cinta de 4 KPIs (`WineryKpiRibbon.tsx`)**: Muestra de forma concisa el total de etiquetas en catálogo, desglose de cosechas activas vs en revisión, seguidores de la comunidad (protegido contra el 404 de bodegas pendientes) y calificación promedio comunitaria con estrellas y total de reseñas.
  - **Accesos Rápidos (`WineryQuickActions.tsx`)**: Atajos de navegación rápida para publicar etiquetas, reclamar vinos de la comunidad, editar la ficha institucional de la bodega y explorar el catálogo general.
  - **Checklist Institucional (`WineryChecklistCard.tsx`)**: Guía de completitud del perfil de bodega con cálculo porcentual dinámico (0 a 100%) y enlaces directos para completar ubicación, semblanza histórica, sitio web y primera etiqueta oficial.
  - **Resumen de Etiquetas (`WineryRecentWines.tsx`)**: Grilla de las últimas botellas oficiales incorporadas con chip de varietal/tipo de vino, calificación agregada y enlace a gestión o estado de empty state con llamada a la acción si aún no hay vinos.

---

## 3. Estructura de Directorios Clave

```text
src/frontend/src/
├── assets/                    # Recursos visuales estáticos optimizados (hero-bottles.webp, auth-vineyard.webp, corchos-vinos.webp)
├── components/                # Componentes transversales y reutilizables en toda la aplicación
│   ├── community/             # Modales comunitarios transversales (CommunityModal.tsx)
│   └── layout/                # Estructura visual global compartida (Navbar.tsx)
├── features/                  # Arquitectura orientada a características (Feature-Driven Architecture)
│   ├── auth/                  # Módulo de Autenticación
│   │   ├── api/               # Llamadas API del módulo (authApi.ts)
│   │   ├── components/        # Componentes UI de autenticación y guardias (AuthField.tsx, ProtectedRoute.tsx)
│   │   ├── context/           # Estado global de autenticación (AuthContext.tsx)
│   │   ├── types/             # DTOs y tipos de autenticación (index.ts)
│   │   └── index.ts           # Barrel export público del módulo auth
│   ├── dashboard/             # Módulo del Dashboard / Mi Cava Personal
│   │   ├── components/        # Componentes del dominio (QuickActions, Metrics, StockCarousel, UncorkDialog, etc.)
│   │   └── index.ts           # Barrel export público del feature dashboard
│   ├── wines/                 # Módulo de Vinos y Catálogo
│   │   ├── components/        # Componentes de presentación (WineCard.tsx, WineBottleSilhouette.tsx, WineBottleMock.tsx, WineDetailModal.tsx)
│   │   ├── data/              # Mock curado con assets reales vinculados (curatedWines.ts)
│   │   ├── utils/             # Adaptadores de dominio y mapeadores (wineMapper.ts)
│   │   └── index.ts           # Barrel export del módulo wines
│   └── winery/                # Módulo de Bodegas y Productores Oficiales
│       ├── api/               # Capa API tipada (wineryApi, wineApi, locationApi, grapeApi)
│       ├── components/        # Componentes del panel (WineryLayout, WineryStatusBanner, WineryKpiRibbon, WineryQuickActions, WineryChecklistCard, WineryRecentWines, LocationCascadeSelect, etc.)
│       ├── context/           # Contexto de la bodega activa (WineryContext)
│       ├── hooks/             # Hooks de sincronización (useMyWinery)
│       ├── types/             # DTOs y contratos C# (winery, wine, location, grape, problemDetails)
│       └── index.ts           # Barrel export público del módulo winery
├── lib/                       # Utilidades transversales
│   └── utils.ts               # Función cn con clsx y tailwind-merge
├── pages/                     # Páginas y vistas principales (*Page.tsx)
│   ├── CatalogPage.tsx        # Catálogo general protegido
│   ├── CavaPage.tsx           # Mi Cava personal y registro de descorches
│   ├── DashboardPage.tsx      # Homepage / Exploración y catálogo por bodegas post-login
│   ├── ForWineriesPage.tsx    # Landing pública institucional para bodegas (/para-bodegas)
│   ├── Landing.tsx            # Vista de bienvenida con Hero, vinos destacados y franja para bodegas
│   ├── LoginPage.tsx          # Formulario de acceso editorial (redirige a /bodega/dashboard según rol)
│   ├── PairingPage.tsx        # Recomendaciones gastronómicas y maridaje
│   ├── RegisterPage.tsx       # Formulario de registro de sommelier persistente
│   ├── TermsPage.tsx          # Vista provisional de Términos y Condiciones
│   ├── WineryDashboardPage.tsx# Vista de inicio del panel oficial de bodega (KPIs, Checklist, Quick Actions, Vinos)
│   └── WineryRegisterPage.tsx # Formulario público de alta de bodega unificada (/bodega/registro)
├── routes/                    # Configuración de enrutamiento
│   └── AppRoutes.tsx          # Definición de rutas públicas y protegidas con react-router-dom
├── services/                  # Infraestructura y clientes compartidos
│   └── apiClient.ts           # Instancia centralizada de Axios con interceptores JWT y refresh token
├── styles/                    # Sistema de estilización centralizado
│   ├── tokens.css             # Variables de diseño (legacy)
│   ├── reset.css              # Normalización y reseteo base
│   └── global.css             # Reglas tipográficas, integración Tailwind v4 y animaciones
├── types/                     # Tipos globales transversales
│   └── wine.ts                # Modelos de presentación (CuratedWine, DashboardWine, etc.)
├── App.tsx                    # Componente contenedor raíz con BrowserRouter y AuthProvider
└── main.tsx                   # Punto de entrada de React 19 (carga en cascada de estilos)
```

---

## 4. Convenciones de Tipado y TypeScript

1. **Prohibido el uso de `any`**: Cualquier tipo desconocido debe gestionarse con genéricos, tipos de unión discriminada o `unknown` con type guards.
2. **Interfaces Explícitas para Componentes**: Cada componente debe definir su interfaz `Props` explícita:
   ```typescript
   export interface WineryKpiRibbonProps {
     winesCount: number;
     vintagesCount: number;
     approvedVintagesCount: number;
     pendingVintagesCount: number;
     followersCount: number | null;
     averageRating: number | null;
     totalReviews: number;
     isWineryApproved: boolean;
     isLoading?: boolean;
   }
   ```
3. **Calco Estricto de DTOs del Backend**: Todos los modelos de datos en `features/winery/types/` calcan los contratos C# reales (nombres y nulabilidad exacta).

---

## 5. Sistema de Enrutamiento y Guardias de Seguridad

El enrutamiento se gestiona mediante **React Router DOM v7** con un enfoque declarativo centralizado en [`src/frontend/src/routes/AppRoutes.tsx`](../../src/frontend/src/routes/AppRoutes.tsx):

- **Rutas Públicas Institucionales**:
  - `/para-bodegas`: Página de presentación y beneficios para bodegas.
  - `/bodega/registro`: Formulario de alta para nuevos establecimientos.
  - `/login`: Formulario de inicio de sesión que redirige con criterio contextual (a la ruta solicitada en `state.from`, a `/bodega/dashboard` para usuarios con rol `Winery`, o a `/dashboard` para usuarios estándar).
- **Guardia de Rutas (`ProtectedRoute.tsx`)**:
  - Valida el estado de autenticación (`isAuthenticated`) y los roles permitidos (`allowedRoles?: UserRole[]`).
  - Si la sesión se encuentra cargando (`isLoading = true`), presenta un indicador de espera accesible.
  - Si no está autenticado, redirige hacia `/login` preservando la ubicación previa en el estado de navegación (`<Navigate to="/login" state={{ from: location }} replace />`).
  - Si el usuario está autenticado pero su rol no coincide con `allowedRoles`, redirige a `/dashboard` (`<Navigate to="/dashboard" replace />`).
  - Las rutas de bodega se encuentran anidadas bajo `/bodega/*` envueltas por `<WineryLayout />` con protección `allowedRoles={['Winery', 'Admin']}`.

---

## 6. Manejo de Sesión y Renovación Automática (Refresh Token)

La capa de comunicación HTTP reside en [`src/frontend/src/services/apiClient.ts`](../../src/frontend/src/services/apiClient.ts) y opera en estrecha sincronía con [`AuthContext.tsx`](../../src/frontend/src/features/auth/context/AuthContext.tsx):

1. **Hidratación Perezosa Síncrona y Estado Derivado**:
   - En `AuthContext.tsx`, `user` se inicializa síncronamente en el primer ciclo de render mediante funciones proveedoras en `useState(() => ...)`.
   - `isAuthenticated` es un **estado derivado** directo (`user !== null`), eliminando estados sincronizados manualmente o redundantes.
2. **Inyección Segura de Bearer Token**: El interceptor de request valida que el origen de la URL de destino coincida estrictamente con `API_BASE_URL` antes de adjuntar `Authorization: Bearer <accessToken>`, blindando el token contra fugas a terceros.
3. **Mutex Concurrente en `401 Unauthorized`**:
   - Para evitar tormentas de peticiones a `/api/auth/refresh` ante múltiples llamadas simultáneas no autenticadas, se implementa una promesa compartida única (`refreshPromise`).
   - El primer fallo 401 inicia la promesa; las peticiones concurrentes esperan la resolución común y reintentan con el nuevo token sin disparar renovaciones duplicadas.
   - Si la renovación falla o se recibe un 401 fuera de login, se ejecuta `purgeAndSignalUnauthorized()` y se emite el evento global `window.dispatchEvent(new CustomEvent('auth:unauthorized'))`.
   - El proveedor `AuthContext.tsx` escucha este evento en un `useEffect`, limpia el estado reactivo (`user = null`) y ejecuta la navegación limpia por SPA a `/login`.
4. **Rendimiento, Code-Splitting y Core Web Vitals**:
   - Todas las páginas en `AppRoutes.tsx` se cargan bajo demanda con `React.lazy` y `<Suspense fallback={<RouteFallbackLoader />}>`.
   - Todas las etiquetas de imagen (`WineCard`, `WineDetailModal`, vistas de autenticación) cuentan con `loading="lazy"`, `decoding="async"` y dimensiones relativas/fijas controladas para prevenir Cumulative Layout Shift (CLS).

---

## 7. Guía de Prueba y Verificación de Flujos

### 7.1 Arranque de Entornos
```bash
# Terminal 1: Backend (.NET Core)
cd src/backend/AyVino.Api
dotnet run

# Terminal 2: Frontend (Vite SPA)
cd src/frontend
npm run dev
```

### 7.2 Casos de Prueba Interactivos

1. **Inicio del Panel de Bodega (`/bodega/dashboard`)**:
   - Iniciar sesión con un usuario con rol `Winery` que tenga bodega asociada.
   - Verificar la cabecera editorial con el nombre de la bodega, badge de estado, terruño y fecha actual.
   - Comprobar la cinta de 4 KPIs (Etiquetas, Cosechas, Seguidores y Puntaje).
   - Revisar la tarjeta de primeros pasos (Checklist institucional) y su barra porcentual de progreso.
   - Explorar los 4 accesos rápidos directos (Publicar etiqueta, Reclamar botellas, Editar perfil, Ver vidriera / Explorar).
   - Comprobar la grilla de etiquetas recientes o su estado vacío amable si no hay vinos cargados.
2. **Caso de Cuenta sin Bodega Asociada**:
   - Iniciar sesión con un usuario con rol `Winery` sin bodega en la base de datos (o cuando `/api/wineries/me` responda 404).
   - Comprobar que se presenta la pantalla 404 amable ofreciendo registrar su bodega.
3. **Verificación de Calidad de Código**:
   ```bash
   cd src/frontend
   npm run build  # Compilación estricta TypeScript (0 errores)
   npm run lint   # Validación de reglas ESLint (0 advertencias)
   ```
