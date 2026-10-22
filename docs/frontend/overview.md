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
| **React Router DOM** | v7.x | Enrutamiento declarativo del lado del cliente. |
| **Axios** | ^1.20 | Cliente HTTP para comunicación tipada con la API RESTful. |

---

## 2. Pautas Visuales y Estilo Editorial

AyVino implementa una estética de **revista editorial de vinos**: cálida, noble, sofisticada y limpia, distanciándose del diseño corporativo frío.

### 2.1 Paleta Cromática y Acabados (Fondo Oscuro Mate)
- **Fondo Base Carbón Mate (`#0f0f11` / `#121214`)**: Evita el negro puro ofreciendo una textura sobria, descansada y elegante para la interfaz nocturna de cava.
- **Acento Bordó Vino Sobrio (`#722F37` / `#5c1d24`)**: Utilizado exclusivamente en botones de acción primaria (`+ REGISTRAR BOTELLA`, `"Descorchar"`) e insignias activas, sin saturación chillona.
- **Bordes de Estructura Limpia (`border-neutral-800` / `border-white/5`)**: Delimitación milimétrica de 1px para tarjetas, buscador e inputs.

### 2.2 Tipografías y Jerarquía Editorial
- **`Fraunces` / `Cormorant Garamond` (Serif 600)**: Títulos principales (`h1`, `h2`) en peso semi-bold, sin cursivas ni trazos ultra finos, con `tracking-tight` y color `text-neutral-100`.
- **`Plus Jakarta Sans` / `Geist Sans` (Sans-Serif 400 y 500)**: Interfaz, botones, textos de bajada y tablas técnicas.
- **`font-mono` (Caja alta & tracking amplio)**: Eyebrows y saludos (`text-[11px] font-mono tracking-[0.25em] uppercase text-neutral-400 font-medium`).
- **Navegación Superior (Navbar Reactivo al Scroll en 3 Columnas)**: Barra fija con transición fluida (`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-500`). En el primer pliegue durante el Hero (`window.scrollY <= window.innerHeight * 0.7`), se mantiene transparente (`bg-transparent border-b border-transparent shadow-none`); al descender más allá del 70% del viewport, se funde con la estética carbón (`bg-[#0a0a0c]/90 backdrop-blur-md border-b border-white/[0.08] shadow-lg shadow-black/40`) gestionado limpiamente con `cn()`. Layout centrado (`flex justify-between md:grid md:grid-cols-3 max-w-7xl mx-auto px-6 h-18`), logo sans contemporáneo de alta jerarquía con detalle de marca borravino (`AyVino.` en `text-xl font-bold tracking-tight text-zinc-100 md:justify-self-start` con punto `.text-rose-500`), enlaces en Title Case con mayor escala y separación (`text-[15px] font-medium text-zinc-300 hover:text-white transition-colors duration-150`, `hidden md:flex justify-center gap-10 transition-all duration-300`) y botón de acción "Crear cuenta" unificado a la paleta borravino sobria (`bg-[#6e1a24] hover:bg-[#831823] text-zinc-100 border border-rose-800/40 rounded-lg px-4 py-2 text-sm font-medium shadow-sm transition-all active:scale-[0.98]`).

- **Hero Editorial Centrado con Atmósfera en Capas**: En `Landing.tsx`, composición que abarca el primer pliegue de la pantalla (`min-h-screen flex flex-col justify-between pt-20 md:pt-24 pb-12 sm:pb-16`) sobre fondo carbón profundo (`#0a0a0c`). Incorpora textura de lienzo técnica Dot Pattern atenuada al 7% con desvanecimiento elíptico perimetral (`opacity-[0.07] [background-image:radial-gradient(#fff_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_60%,transparent_100%)]`) y un sistema de iluminación ambiental multicapa calibrado con halo borravino principal (`h-[450px] w-[700px] bg-rose-700/25 blur-[120px] -translate-y-10`) y halo cálido/ámbar de soporte (`h-[300px] w-[450px] bg-amber-600/20 blur-[90px] translate-y-8`), eliminando la sensación de negro plano y aportando profundidad luminosa real detrás del titular sin competir con el texto. Titular equilibrado (`text-4xl sm:text-6xl md:text-7xl font-semibold tracking-tight text-zinc-100 mb-6 px-4`) con degradado de texto en la segunda línea (*"coleccioná cada copa"*) y bajada reflexiva amplia (`max-w-3xl text-neutral-400 text-base md:text-lg leading-relaxed px-4`) centrados verticalmente (`my-auto`). Hacia el pie del Hero (`mt-auto`), se ubican los botones de acción con el botón primario *"Explorar catálogo"* sincronizado con la paleta borravino (`bg-[#6e1a24] hover:bg-[#831823] text-zinc-100 border border-rose-800/40 rounded-xl px-6 py-3 text-sm font-medium shadow-sm active:scale-[0.98]`, `mb-10 md:mb-14`) y la fila inferior de métricas sobre un padding inferior contenido, descansando de forma natural en el tercio inferior de la pantalla.
- **Cinta Compacta de KPIs (`Metrics`)**: Franja horizontal con fondo `#121214`, micro-iconos lineales y métricas con tipografía Fraunces y font-mono.
- **Bento Grid Modular (`PromoBlocks` y `StockCarousel`)**: Mosaico con tarjetas oscuras estructuradas, micro-datos técnicos de servicio y guarda.
- **Modal de Descorche (`UncorkDialog`)**: Ficha técnica de cata dividida con escaparate visual y registro sensorial.
- **Split-Card Flotante de Autenticación (`LoginPage.tsx` y `RegisterPage.tsx`)**: Arquitectura visual a dos columnas encajada en pantalla (`h-screen overflow-hidden p-4 bg-[#0e0e11]`) con estética *Clean Dark & Editorial Clásica de Bodega*. Tarjeta contenida (`h-[88vh] max-h-[640px] w-full max-w-5xl bg-[#141416]`), esquinas `rounded-3xl`, sombra profunda `shadow-2xl shadow-black/80` y borde `border-white/10`. Columna izquierda con encabezado superior invertido (Volver a la izquierda, AyVino a la derecha), cabecera editorial con tag de colección en Login (`"Colección Privada"` en `text-xs uppercase tracking-[0.25em] text-amber-200/60`), títulos en tipografía serif clásica de presencia vertical destacada (`font-serif text-3xl sm:text-4xl text-zinc-100 font-normal tracking-tight leading-tight`) y subtítulo explicativo legible (`text-sm text-zinc-400 mt-2 font-sans font-light`). Formulario con `<form noValidate>` y validación reactiva de campos obligatorios en estado de React (`errors: Record<string, string>`), inputs minimalistas Clean Dark sin etiquetas externas (solo placeholder amplio interior, altura `h-12`, esquinas `rounded-xl`, padding `px-4`, fondo `bg-zinc-900/50 hover:bg-zinc-900/70`, borde `border-zinc-800/80 focus:border-zinc-500 focus:bg-zinc-900`, texto `text-zinc-100 placeholder:text-zinc-500`), alternancia de visibilidad de contraseña con botón integrado (`pr-11`, `Eye`/`EyeOff` en `text-zinc-500 hover:text-zinc-300`), feedback contextual inline mínimo (`text-[11px] text-rose-400 mt-1 pl-1`) con borde `border-rose-500/70`, y botón primario estilo sello de cava con radio coincidente (`h-12 w-full rounded-xl bg-[#4f131f] hover:bg-[#5e1725] border border-rose-400/20 text-xs uppercase tracking-widest text-rose-100 font-medium transition-colors shadow-sm mt-2`) con textos directos (*"Iniciar sesión"* y *"Crear cuenta"*). Columna derecha con foto vertical nativa en WebP de viñedos y cordillera (`auth-vineyard.webp`), tinte suave, división nítida editorial mediante borde izquierdo (`border-l border-white/10`) eliminando cortes abruptos en el cielo, degradado inferior para legibilidad tipográfica y texto plano (*"VALLE DE UCO · MENDOZA"*).
- **Selección Curada y Tarjetas Editoriales (`WineCard.tsx`)**: Integración directa de fotografía real de botellas con `object-contain` y sombra de contacto profunda `drop-shadow-[0_15px_25px_rgba(0,0,0,0.7)]`. Eliminación definitiva de píldoras o pastillas encapsuladas en favor de texto tipográfico puro (`text-xs font-sans font-medium uppercase tracking-[0.2em] text-amber-200/70` para Ficha Oficial y `text-neutral-400` para Comunidad), varietal y añada en `text-xs font-sans font-medium uppercase tracking-wider text-neutral-400`, nombre destacado en `font-serif text-2xl text-neutral-100 font-semibold tracking-tight`, bodega y región en `text-sm text-neutral-300 font-normal leading-relaxed mt-1`, y enlace "Ver ficha" con puntaje en `text-sm font-medium text-neutral-200 hover:text-white`.
- **Navegación Dinámica con Smart Autohide (`Navbar.tsx` y `DashboardNavbar.tsx`)**: Barra de navegación superior reactiva con patrón de autohide:
  - En la parte superior (`scrollY < 20px`): completamente transparente (`bg-transparent border-transparent shadow-none`).
  - Durante todo el Hero inicial (`scrollY <= heroThreshold`): permanece visible continuamente.
  - Al desplazarse hacia abajo una vez superado el Hero: se desliza suavemente fuera de la pantalla (`-translate-y-full transition-all duration-300`).
  - Al desplazarse hacia arriba: vuelve a deslizarse visible (`translate-y-0`) con blur translúcido mínimo idéntico al Landing (`backdrop-blur-md bg-stone-950/60 border-b border-white/5 shadow-lg shadow-black/40`).
  - En el Dashboard (`DashboardNavbar.tsx`): branding oficial `AyVino.` idéntico al Landing con enlace a `/dashboard`, enlaces de descubrimiento central reducidos a *"Explorar"*, *"Maridaje"* y *"Comunidad"* con distribución flexible sin rotura de líneas (`whitespace-nowrap`, `gap-8` a `gap-10`), eliminación del selector de ubicación, avatar de usuario agrandado con menú desplegable que centraliza la gestión personal (Encabezado con rol, Bloque Colección con *"Mi Cava"*, *"Mi historial"*, *"Deseados"*, separador sutil y Bloque Cuenta con *"Cuenta"*, *"Cerrar sesión"*).
- **Hero Unificado y Barra de Métricas "Cava Strip" (`QuickActions.tsx` y `Metrics.tsx`)**: Layout con altura completa del primer pliegue (`min-h-screen flex flex-col justify-between pt-20 pb-4 sm:pb-5`) con atmósfera envolvente (halo radial borgoña y micropuntos atenuados). Las márgenes internas y de encabezados (`QuickActions`) y la cinta de métricas (`Metrics`) están calibradas verticalmente de forma compacta para garantizar visibilidad total del 100% de las cajas y subtítulos en pantallas estándar de laptop antes del pliegue. Incorpora navegación cinematográfica reactiva al scroll:
  - **Difuminado y Fade Out Progresivo**: A medida que el usuario desciende, el Hero disuelve su fondo (`backgroundColor: rgba(15,15,17, 1 -> 0.05)`), atenúa su contenido (`opacity: 1 -> 0`), aplica desenfoque progresivo (`filter: blur(0px -> 8px)`) y elevación vertical sutil (`translateY(-28px)`), revelando orgánicamente el fondo continuo de corchos (`corchos-vinos.webp`).
  - **Auto-Scroll Inteligente con Tope Exacto**: Al superar el 38% de scroll del primer pliegue, el viewport se desliza suavemente hacia el límite exacto del Hero (`window.scrollTo({ top: heroHeight, behavior: 'smooth' })`) con bloqueo antirrebote (850ms).
  - **Catálogo Exclusivo por Bodegas** (`FilterChips.tsx` y `WineryBlock.tsx`): Estructurado con amplio respiro superior editorial (`pt-24 sm:pt-32` y `scroll-mt-28` en `#catalogo`) para que el titular descanse holgadamente debajo de la barra de navegación; tarjetas esmeriladas puras sin marcos ni bordes artificiales (`bg-stone-950/40`, `backdrop-blur-xl`, `rounded-2xl`, `shadow-xl shadow-black/50`), con escaparate flotante libre de recuadros que exhibe la imagen de la botella completa y sin recortes (`object-contain`). Las secciones personales de inventario y maridaje residen en sus propias páginas dedicadas (`/cava` y `/maridaje`).
- **Ficha Técnica Editorial en Modal (`WineDetailModal.tsx`)**: Arquitectura visual contenida sin scroll en escritorio (`max-w-4xl max-h-[85vh] bg-[#141417] border border-white/10 rounded-2xl shadow-2xl`):
  - *Columna Izquierda (Escaparate)*: Fondo `#0f0f12` con divisor `border-white/5`, botella contenida (`max-h-[340px]`) con halo difuso (`bg-rose-900/10 blur-[70px]`) y etiquetas esquineras en `text-xs font-sans uppercase tracking-widest text-neutral-300 font-medium`.
  - *Columna Derecha (Ficha Editorial)*: Eyebrow en texto plano sin cápsulas (`text-[11px] font-sans uppercase tracking-[0.25em] text-amber-200/70 font-medium` con separador `·`), título en `font-serif text-2xl sm:text-3xl text-neutral-100 font-semibold tracking-tight leading-snug`, región en `text-sm text-neutral-300 font-normal mt-1`, métricas contenidas (`py-3 my-3.5 border-y border-white/10`) con etiquetas en dorado cava (`text-[10px] uppercase tracking-[0.2em] text-amber-200/60 font-medium`) y números serif (`text-xl text-white font-semibold`), notas de cata nítidas de alto contraste en `text-sm sm:text-base text-neutral-100 font-normal leading-relaxed` (`line-clamp-3`), aromas fluidos en `text-sm text-neutral-200 mt-2 font-normal` con `text-amber-200/90 font-medium`, maridaje y terroir dispuestos en dos columnas horizontales (`grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-white/5`) con títulos `text-[11px] font-sans uppercase tracking-[0.2em] text-amber-200/80 font-semibold` y descripciones en `text-sm text-neutral-100 font-normal leading-snug`, y botón de acción en borravino de marca (`bg-[#6e1a24] hover:bg-[#831823] text-zinc-100 border border-rose-800/40 rounded-xl px-5 py-2.5 text-xs uppercase tracking-wider font-medium shadow-sm active:scale-[0.98]`) que redirige a `/login` pasando el estado de retorno (`state: { from: location }`). Cero scroll vertical en pantallas estándar 1080p/900p y soporte de accesibilidad total.

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
│   └── wines/                 # Módulo de Vinos y Catálogo
│       ├── components/        # Componentes de presentación (WineCard.tsx, WineBottleSilhouette.tsx, WineBottleMock.tsx, WineDetailModal.tsx)
│       ├── data/              # Mock curado con assets reales vinculados (curatedWines.ts)
│       ├── utils/             # Adaptadores de dominio y mapeadores (wineMapper.ts)
│       └── index.ts           # Barrel export del módulo wines
├── lib/                       # Utilidades transversales
│   └── utils.ts               # Función cn con clsx y tailwind-merge
├── pages/                     # Páginas y vistas principales (*Page.tsx)
│   ├── CatalogPage.tsx        # Catálogo general protegido
│   ├── CavaPage.tsx           # Mi Cava personal y registro de descorches
│   ├── DashboardPage.tsx      # Homepage / Exploración y catálogo por bodegas post-login
│   ├── Landing.tsx            # Vista de bienvenida con Hero y vinos destacados
│   ├── LoginPage.tsx          # Formulario de acceso editorial
│   ├── PairingPage.tsx        # Recomendaciones gastronómicas y maridaje
│   ├── RegisterPage.tsx       # Formulario de registro de sommelier persistente
│   ├── TermsPage.tsx          # Vista provisional de Términos y Condiciones
│   └── WineryDashboardPage.tsx# Panel exclusivo para bodegas y administradores
├── routes/                    # Configuración de enrutamiento
│   └── AppRoutes.tsx          # Definición de rutas públicas y protegidas con react-router-dom
├── services/                  # Infraestructura y clientes compartidos
│   └── apiClient.ts           # Instancia centralizada de Axios con interceptores JWT y refresh token
├── styles/                    # Sistema de estilización centralizado
│   ├── tokens.css             # Variables de diseño (:root, paleta vinícola, múltiplos de 4px)
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
   export interface WineCardProps {
     wine: CuratedWine;
     onSelect: (wine: CuratedWine) => void;
   }
   ```
3. **Modelos de Datos Centralizados en `src/types/`**: Evitar definiciones duplicadas de interfaces en componentes locales.

---

## 5. Sistema de Enrutamiento y Guardias de Seguridad

El enrutamiento se gestiona mediante **React Router DOM v7** con un enfoque declarativo centralizado en [`src/frontend/src/routes/AppRoutes.tsx`](../../src/frontend/src/routes/AppRoutes.tsx):

- **Guardia de Rutas (`ProtectedRoute.tsx`)**:
  - Valida el estado de autenticación (`isAuthenticated`) y los roles permitidos (`allowedRoles?: UserRole[]`).
  - Si la sesión se encuentra cargando (`isLoading = true`), presenta un indicador de espera accesible.
  - Si no está autenticado, redirige hacia `/login` preservando la ubicación previa en el estado de navegación (`<Navigate to="/login" state={{ from: location }} replace />`).
  - Al completar el inicio de sesión en `LoginPage.tsx`, se redirige al usuario a `location.state?.from?.pathname || '/dashboard'` respetando la navegación original.
  - Si el usuario está autenticado pero su rol no coincide con `allowedRoles`, redirige a `/dashboard` (`<Navigate to="/dashboard" replace />`).
  - Si cumple los criterios, renderiza la vista solicitada.

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
   - En mobile, `WineDetailModal` implementa zonas táctiles accesibles (mínimo 44x44px) y scroll dinámico adaptativo (`max-h-[92dvh] overflow-y-auto` en mobile y `md:overflow-hidden` contenido en escritorio).

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

1. **Flujo de Usuario Anónimo**:
   - Ingresar a `http://localhost:5173/`.
   - Intentar navegar manualmente a `/catalogo` o `/bodega/dashboard`.
   - **Resultado esperado**: El guardia `ProtectedRoute` intercepta la navegación y redirige automáticamente a `/`.
2. **Inicio de Sesión con Credenciales**:
   - Abrir el panel lateral presionando *"Iniciar Sesión"*.
   - Probar credenciales incorrectas para verificar la alerta de error.
   - Ingresar con credenciales válidas registradas en el backend.
   - **Resultado esperado**: Cierre automático del drawer, aparición de la píldora de usuario en el `Navbar` con su rol y desbloqueo de los accesos a `/catalogo` y/o `/bodega/dashboard`.
3. **Cierre de Sesión (Logout)**:
   - Presionar *"Salir"* en el `Navbar`.
   - **Resultado esperado**: Se invoca `POST /api/auth/revoke`, se limpian los tokens de `localStorage` y se restablece la vista pública.
4. **Verificación de Calidad de Código**:
   ```bash
   cd src/frontend
   npm run build  # Compilación estricta TypeScript (0 errores)
   npm run lint   # Validación de reglas ESLint (0 advertencias)
   ```

