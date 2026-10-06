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
- **Navegación Superior**: `text-xs uppercase tracking-widest text-neutral-400 hover:text-neutral-100`.

### 2.3 Micro-interacciones y Tratamiento de Componentes
- **Hero Editorial Minimalista**: En `Landing.tsx`, composición a dos columnas sobre fondo carbón mate `#0f0f11` con halos sutiles de luz ambiental (`bg-[#6b1d28]/10 blur-3xl`). Columna izquierda con tipografía Fraunces, eyebrows mono y métricas clave. Columna derecha con escaparate 3D interactivo (`WineBottleMock` con chips técnicos de terroir y puntaje) descansando orgánicamente sobre el fondo oscuro sin sobrecargas visuales.
- **Cinta Compacta de KPIs (`Metrics`)**: Franja horizontal con fondo `#121214`, micro-iconos lineales y métricas con tipografía Fraunces y font-mono.
- **Bento Grid Modular (`PromoBlocks` y `StockCarousel`)**: Mosaico con tarjetas oscuras estructuradas, micro-datos técnicos de servicio y guarda.
- **Modal de Descorche (`UncorkDialog`)**: Ficha técnica de cata dividida con escaparate visual y registro sensorial.
- **Split-Card Flotante de Autenticación (`LoginPage.tsx` y `RegisterPage.tsx`)**: Arquitectura visual a dos columnas encajada en pantalla (`h-screen overflow-hidden p-4 bg-[#0e0e11]`) con estética *Clean Dark & Editorial Clásica de Bodega*. Tarjeta contenida (`h-[88vh] max-h-[640px] w-full max-w-5xl bg-[#141416]`), esquinas `rounded-3xl`, sombra profunda `shadow-2xl shadow-black/80` y borde `border-white/10`. Columna izquierda con encabezado superior invertido (Volver a la izquierda, AyVino a la derecha), cabecera editorial con tags de colección (`"Colección Privada"` / `"Membresía"` en `text-[10px] uppercase tracking-[0.25em] text-amber-200/60`), títulos en tipografía serif clásica (`font-serif text-3xl text-zinc-100 font-normal tracking-tight`) y subtítulo explicativo (`text-xs text-zinc-400 mt-2 font-sans font-light`). Formulario con `<form noValidate>` y validación reactiva de campos obligatorios en estado de React (`errors: Record<string, string>`), inputs minimalistas Clean Dark sin etiquetas externas (solo placeholder amplio interior, altura `h-12`, esquinas `rounded-xl`, padding `px-4`, fondo `bg-zinc-900/50 hover:bg-zinc-900/70`, borde `border-zinc-800/80 focus:border-zinc-500 focus:bg-zinc-900`, texto `text-zinc-100 placeholder:text-zinc-500`), alternancia de visibilidad de contraseña con botón integrado (`pr-11`, `Eye`/`EyeOff` en `text-zinc-500 hover:text-zinc-300`), feedback contextual inline mínimo (`text-[11px] text-rose-400 mt-1 pl-1`) con borde `border-rose-500/70`, y botón primario estilo sello de cava con radio coincidente (`h-12 w-full rounded-xl bg-[#4f131f] hover:bg-[#5e1725] border border-rose-400/20 text-xs uppercase tracking-widest text-rose-100 font-medium transition-colors shadow-sm mt-2`) con textos directos (*"Iniciar sesión"* y *"Crear cuenta"*). Columna derecha con foto vertical nativa en WebP de viñedos y cordillera (`auth-vineyard.webp`), tinte suave, capa de degradado hacia el borde izquierdo (`bg-gradient-to-r from-[#141416] via-transparent to-transparent`) que fusiona suavemente la imagen con la columna oscura del formulario, degradado inferior y texto tipográfico plano (*"VALLE DE UCO · MENDOZA"*).

---

## 3. Estructura de Directorios Clave

```text
src/frontend/src/
├── assets/                    # Recursos visuales estáticos optimizados (hero-bottles.webp, auth-vineyard.webp)
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
│       └── utils/             # Adaptadores de dominio y mapeadores (wineMapper.ts)
├── lib/                       # Utilidades transversales
│   └── utils.ts               # Función cn con clsx y tailwind-merge
├── pages/                     # Páginas y vistas principales (*Page.tsx)
│   ├── CatalogPage.tsx        # Catálogo general protegido
│   ├── DashboardPage.tsx      # Homepage / Cava autenticada post-login
│   ├── Landing.tsx            # Vista de bienvenida con Hero y vinos destacados
│   ├── LoginPage.tsx          # Formulario de acceso editorial
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

1. **Hidratación Perezosa Síncrona (`useState` Lazy Initialization)**:
   - En `AuthContext.tsx`, `user` e `isAuthenticated` se inicializan síncronamente en el primer ciclo de render mediante funciones proveedoras en `useState(() => ...)`.
   - Esto erradica estados parpadeantes (`flicker`) y desactiva la necesidad de supresiones de reglas de ESLint (`react-hooks/set-state-in-effect`).
2. **Inyección Automática de Bearer Token**: El interceptor de request adjunta `Authorization: Bearer <accessToken>` en cada solicitud saliente.
3. **Interceptación de `401 Unauthorized` Desacoplada**:
   - Detecta respuestas 401 excluyendo endpoints de autenticación (`/auth/login`, `/auth/refresh`).
   - Lee el `refreshToken` desde `localStorage`.
   - Lanza una llamada a `POST /api/auth/refresh`.
   - Si la renovación tiene éxito, guarda las nuevas claves en `localStorage`, actualiza las cabeceras de la petición original y la reintenta sin intervención del usuario.
   - Si la renovación falla (token revocado o expirado) o se recibe un 401 fuera de login, purga el almacenamiento local (`localStorage`) y emite el evento global `window.dispatchEvent(new CustomEvent('auth:unauthorized'))`.
   - El proveedor `AuthContext.tsx` escucha este evento en un `useEffect`, limpia el estado reactivo (`user = null`, `isAuthenticated = false`) y ejecuta la navegación limpia por SPA a `/login` sin recargar la página (`window.location.href`).

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

