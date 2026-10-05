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
- **Hero de Dos Columnas**: Columna izquierda con saludo monospace, titular Fraunces semi-bold con línea divisoria sutil, bajada y buscador integrado en bloque unificado (`bg-neutral-900/60`, `backdrop-blur-sm`, `border-neutral-800`) con botón `+ REGISTRAR BOTELLA`. Columna derecha con composición de botellas en mesa rústica y transición orgánica mediante viñetas degradadas.
- **Cinta Compacta de KPIs (`Metrics`)**: Franja horizontal con fondo `#121214`, micro-iconos lineales y métricas con tipografía Fraunces y font-mono.
- **Bento Grid Modular (`PromoBlocks` y `StockCarousel`)**: Mosaico con tarjetas oscuras estructuradas, micro-datos técnicos de servicio y guarda.
- **Modal de Descorche (`UncorkDialog`)**: Ficha técnica de cata dividida con escaparate visual y registro sensorial.

---

## 3. Estructura de Directorios Clave

```text
src/frontend/src/
├── assets/                    # Recursos visuales estáticos (hero.png, logos)
├── components/                # Componentes UI atómicos y modulares
│   ├── community/             # Módulo de comunidad
│   │   └── CommunityModal.tsx # Modal editorial de "Próximamente" para catas y clubes
│   ├── dashboard/             # Módulos del Dashboard/Cava post-login (QuickActions, Metrics, StockCarousel, etc.)
│   └── layout/                # Estructura visual global
│       └── Navbar.tsx         # Barra de navegación contextual
├── features/                  # Arquitectura híbrida orientada a características
│   ├── auth/                  # Módulo de Autenticación
│   │   ├── api/               # Llamadas API del módulo (authApi.ts)
│   │   ├── components/        # Componentes UI de autenticación y guardias (AuthDrawer.tsx, ProtectedRoute.tsx)
│   │   ├── context/           # Estado global de autenticación (AuthContext.tsx)
│   │   ├── types/             # DTOs y tipos de autenticación (index.ts)
│   │   └── index.ts           # Barrel export público del módulo auth
│   └── wines/                 # Módulo de Vinos y Catálogo
│       └── components/        # Componentes de presentación (WineCard.tsx, WineBottleSilhouette.tsx, WineBottleMock.tsx, WineDetailModal.tsx)
├── lib/                       # Utilidades transversales
│   └── utils.ts               # Función cn con clsx y tailwind-merge
├── pages/                     # Páginas y vistas principales
│   ├── CatalogPage.tsx        # Catálogo general protegido
│   ├── DashboardPage.tsx      # Homepage / Cava autenticada post-login
│   ├── Landing.tsx            # Vista de bienvenida con Hero y vinos destacados
│   ├── LoginPage.tsx          # Formulario de acceso editorial
│   ├── RegisterPage.tsx       # Formulario de registro de sommelier
│   └── WineryDashboardPage.tsx# Panel exclusivo para bodegas y administradores
├── routes/                    # Configuración de enrutamiento
│   └── AppRoutes.tsx          # Definición de rutas públicas y protegidas con react-router-dom
├── services/                  # Infraestructura y clientes compartidos
│   └── apiClient.ts           # Instancia centralizada de Axios con interceptores JWT y refresh token
├── styles/                    # Sistema de estilización centralizado (Sección 4 de la cátedra)
│   ├── tokens.css             # Variables de diseño (:root, paleta vinícola, múltiplos de 4px)
│   ├── reset.css              # Normalización y reseteo base
│   └── global.css             # Reglas tipográficas, integración Tailwind v4 y animaciones
├── types/                     # Tipos globales y re-exportaciones
│   ├── auth.ts                # Re-exportación centralizada de auth types
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
  - Si no está autenticado o el rol no coincide, redirige de forma atómica a `/` (`<Navigate to="/" replace />`).
  - Si cumple los criterios, renderiza la vista solicitada.

---

## 6. Manejo de Sesión y Renovación Automática (Refresh Token)

La capa de comunicación HTTP reside en [`src/frontend/src/services/apiClient.ts`](../../src/frontend/src/services/apiClient.ts) y opera en estrecha sincronía con [`AuthContext.tsx`](../../src/frontend/src/features/auth/context/AuthContext.tsx):

1. **Inyección Automática de Bearer Token**: El interceptor de request adjunta `Authorization: Bearer <accessToken>` en cada solicitud saliente.
2. **Interceptación de `401 Unauthorized`**:
   - Detecta respuestas 401 excluyendo endpoints de autenticación (`/auth/login`, `/auth/refresh`).
   - Lee el `refreshToken` desde `localStorage`.
   - Lanza una llamada a `POST /api/auth/refresh`.
   - Si la renovación tiene éxito, guarda las nuevas claves en `localStorage`, actualiza las cabeceras de la petición original y la reintenta sin intervención del usuario.
   - Si la renovación falla (token revocado o expirado) o se recibe un 401 fuera de login, purga el almacenamiento local (`localStorage`) y redirige forzosamente a la Landing pública (`window.location.href = '/'`), garantizando que nunca se desvíe al usuario al formulario de login.

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

