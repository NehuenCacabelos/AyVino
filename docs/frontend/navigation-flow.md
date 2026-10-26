# Mapa de Navegación y Flujo de Usuario - AyVino Frontend

Este documento detalla la arquitectura de información, las vistas de la aplicación, el sistema de rutas protegidas y la experiencia interactiva (UX) del usuario en la SPA de AyVino.

---

## 1. Diagrama de Navegación y Guardias de Ruta

```mermaid
flowchart TD
    subgraph PublicRoutes["Rutas Públicas"]
        Landing["/ -> Landing.tsx (Hero + Muestra Curada + Franja Bodegas)"]
        ForWineries["/para-bodegas -> ForWineriesPage.tsx (Propuesta de Valor)"]
        WineryRegister["/bodega/registro -> WineryRegisterPage.tsx (Alta Unificada)"]
        WineryPublicProfile["/bodegas/:id -> WineryPublicProfilePage.tsx (Vidriera Pública)"]
        Login["/login -> LoginPage.tsx (Acceso Editorial con Redirección Contextual)"]
        Register["/register -> RegisterPage.tsx (Alta de Usuario Libre)"]
        Terms["/terms -> TermsPage.tsx (Términos y Condiciones)"]
        DetailModal["WineDetailModal (Ficha Técnica a 2 Columnas)"]
        CommunityModal["CommunityModal (Próximamente Editorial)"]
    end

    subgraph AuthPipeline["Autenticación & Autorización"]
        Guard["ProtectedRoute (Guardia por Rol)"]
        AuthContext["AuthContext (AuthProvider + useAuth)"]
    end

    subgraph ProtectedRoutes["Rutas Protegidas bajo AppLayout (Requieren Sesión)"]
        Layout["AppLayout (<Outlet /> + stockCount Context)"]
        Dashboard["/dashboard (o /app) -> DashboardPage.tsx (Exploración & Bodegas)"]
        Cava["/cava -> CavaPage.tsx (Mi Cava & Inventario Personal)"]
        Pairing["/maridaje -> PairingPage.tsx (Curaduría & Maridaje)"]
        Catalog["/catalogo -> CatalogPage.tsx (Catálogo General)"]
        Account["/cuenta -> AccountPage.tsx (Mi Cuenta y Seguridad)"]
        Layout --> Dashboard
        Layout --> Cava
        Layout --> Pairing
        Layout --> Catalog
        Layout --> Account

        subgraph WineryArea["Área Exclusiva de Bodega (/bodega/*)"]
            WineryLayoutComponent["WineryLayout.tsx (Navbar Bodega + Contexto)"]
            WineryDash["/bodega/dashboard -> WineryDashboardPage.tsx"]
            WineryProfile["/bodega/perfil -> WineryProfilePage.tsx"]
            WineryWines["/bodega/vinos -> WineryWinesPage.tsx"]
            WineryClaim["/bodega/reclamar -> WineryClaimPage.tsx"]
            WineCreateModalComponent["WineCreateModal (Alta + Corte Varietal)"]
            WineVintagesModalComponent["WineVintagesModal (Gestión de Cosechas)"]

            WineryLayoutComponent --> WineryDash
            WineryLayoutComponent --> WineryProfile
            WineryLayoutComponent --> WineryWines
            WineryLayoutComponent --> WineryClaim
            WineryWines --> WineCreateModalComponent
            WineryWines --> WineVintagesModalComponent
        end
    end

    Landing -->|"Click en tarjeta de vino"| DetailModal
    Landing -->|"Click en 'Comunidad' (Navbar / Footer)"| CommunityModal
    Landing -->|"Click en 'Para bodegas' (Navbar / Banner)"| ForWineries
    ForWineries -->|"Click en 'Registrar mi bodega'"| WineryRegister
    Landing -->|"Navegación /login"| Login
    Landing -->|"Navegación /register"| Register
    Landing -->|"Enlace /bodegas/:id"| WineryPublicProfile
    WineryPublicProfile -->|"Click en tarjeta de vino"| DetailModal
    Login -->|"Enlace a términos"| Terms
    Register -->|"Enlace a términos"| Terms
    WineryRegister -->|"Enlace a términos"| Terms
    Login -->|"Login exitoso (JWT + Refresh Token)"| AuthContext
    Register -->|"Registro exitoso"| AuthContext
    WineryRegister -->|"Registro + Login automático"| AuthContext
    AuthContext -->|"Redirección post-login"| TargetRoute["Ruta original (from), /bodega/dashboard o /dashboard"]

    Landing -->|"Navegación /dashboard"| Guard
    Landing -->|"Navegación /cava"| Guard
    Landing -->|"Navegación /maridaje"| Guard
    Landing -->|"Navegación /catalogo"| Guard
    Landing -->|"Navegación /cuenta"| Guard
    Landing -->|"Navegación /bodega/*"| Guard

    Guard -->|"!isAuthenticated (con state.from)"| Login
    Guard -->|"isAuthenticated (Cualquier rol)"| Dashboard
    Guard -->|"Navegación /cava (Autenticado)"| Cava
    Guard -->|"Navegación /maridaje (Autenticado)"| Pairing
    Guard -->|"Navegación /catalogo (Autenticado)"| Catalog
    Guard -->|"Navegación /cuenta (Autenticado)"| Account
    Guard -->|"isAuthenticated + Rol Winery/Admin"| WineryLayoutComponent
    Guard -->|"Rol no autorizado"| Dashboard

    Fallback["Ruta desconocida (*)"] -->|"Redirect"| Landing
```

---

## 2. Pantallas y Componentes Interactivos

### 2.1 Página de Inicio (`Landing.tsx`)
- **Estética Editorial de Cava Oscura (`#0f0f11` / `#141416`)**:
  - Fondo general carbón mate `#0f0f11`, eliminando fondos claros y sombras difusas.
  - Botones principales en bordó sólido `#6b1d28` (hover `#7e2432`) y secundarios outlined sobrios (`border-neutral-700 text-neutral-200`).
  - Metadatos técnicos, chips de categoría y procedencia en tipografía `font-mono tracking-widest text-[11px]`.
- **Sección Hero**:
  - Composición de una sola columna centrada (`max-w-5xl mx-auto text-center`) sobre atmósfera en capas y fondo profundo `#0a0a0c`.
  - Título editorial equilibrado (*"Descorchá nuevas historias, coleccioná cada copa"* en `font-semibold` con degradado cálido de texto en la segunda línea y `mb-6`).
  - Bajada amplia (`max-w-3xl`) con centrado estricto en `text-neutral-400`, vinculada a los CTAs mediante `mb-8`.
  - Botones de acción centrados con wrap en mobile (`flex-col sm:flex-row gap-5 mb-16 md:mb-20 px-4 px-6 py-3 text-sm`): *"Explorar catálogo"* (primario) y *"Crear cuenta libre"* (secundario con backdrop-blur).
  - Fila inferior de métricas centrada delimitada por borde sutil sobre un padding inferior amplio (`pb-28 sm:pb-32`).
- **Grilla de Vinos Curados**:
  - Renderizado de tarjetas de vino ([`WineCard.tsx`](../../src/frontend/src/features/wines/components/WineCard.tsx)) en contenedores `#141416` con bordes estructurales `border-neutral-800` en diseño a dos columnas.
  - **Minimalismo y escaneo visual rápido**: contiene únicamente silueta/foto de botella, varietal y añada (`font-mono`), nombre y bodega, calificación con cantidad de notas y botón sobrio *"Ver ficha"*. Totalmente libre de precios y descripciones redundantes.
- **Franja Institucional para Bodegas**:
  - Franja horizontal previa al pie de página con llamado editorial ("¿Sos productor vitivinícola?") y botón hacia `/para-bodegas`.
- **Modal de Ficha Técnica** ([`WineDetailModal.tsx`](../../src/frontend/src/features/wines/components/WineDetailModal.tsx)):
  - Estructura a dos columnas: columna izquierda con escaparate de botella (foto o [`WineBottleSilhouette.tsx`](../../src/frontend/src/features/wines/components/WineBottleSilhouette.tsx)) y columna derecha con ficha técnica exhaustiva.
  - Desglose sensorial y técnico: puntaje, añada, crianza, notas de cata y aromas (copywriting cercano), descriptores, maridaje y origen/altura. Sin precios.
- **Modal de Comunidad** ([`CommunityModal.tsx`](../../src/frontend/src/components/community/CommunityModal.tsx)):
  - Modal sobrio de *"Próximamente"* activado desde el Navbar y el pie de página.
  - Titular en Serif noble, gráfico minimalista SVG en trazo fino (copas y mesa de cata) y texto explicativo sobre catas compartidas y clubes enológicos locales.

### 2.2 Portal Institucional para Bodegas (`ForWineriesPage.tsx` y `WineryRegisterPage.tsx`)
- **Página Para Bodegas (`/para-bodegas`)**:
  - Presentación editorial con propuesta de valor única para establecimientos vitivinícolas argentinos.
  - Tres ejes clave: Ficha técnica oficial con sellos de garantía, reclamo de vinos existentes preservando reseñas de la comunidad, y perfil público con seguidores.
  - Flujo de incorporación en 3 pasos: Registro ágil, verificación por sommeliers de AyVino, y publicación / reclamo de cosechas.
- **Formulario de Registro Unificado (`/bodega/registro`)**:
  - Estética split-card en dos columnas con panel fotográfico vertical.
  - Registro conjunto del usuario administrador (nombre, email, contraseña con revelador visual y validación de 8 caracteres) y de la bodega (nombre, terruño, año de fundación, web y semblanza histórica).
  - Selector de terruño interactivo ([`RegionPicker.tsx`](../../src/frontend/src/features/winery/components/RegionPicker.tsx)) con mapa Leaflet OpenStreetMap y resolución oficial de departamentos Georef o selección manual en cascada.
  - Proceso transaccional completo: `registerWinery()` $\rightarrow$ login automático $\rightarrow$ redirección a `/bodega/dashboard`.

### 2.3 Pantalla de Inicio de Sesión (`LoginPage.tsx`) y Registro (`RegisterPage.tsx`)
- Vistas dedicadas (`/login` y `/register`) con layout split-card sobrio, equilibrado y sin scroll.
- Validación reactiva sin tooltips nativos del navegador (`noValidate`), manejo de errores en estado de React (`errors: Record<string, string>`), y conexión con `loginApi` y `registerApi`.
- **Redirección Contextual Inteligente en Login**: Si el usuario autenticado posee rol `Winery` y no existía una ruta previa en el historial (`state.from`), es derivado automáticamente a `/bodega/dashboard`.

### 2.4 Panel de Bodega (`WineryLayout.tsx` y `/bodega/*`)
- **Contenedor Principal (`WineryLayout.tsx`)**:
  - Enrutamiento anidado bajo `/bodega/*` exclusivo para roles `Winery` y `Admin`.
  - Header superior de gestión: Branding `AyVino.`, nombre y monograma circular de la bodega, enlace directo hacia *"Ver perfil público"* y menú de sesión.
  - Barra lateral de navegación (Sidebar): Accesos a Dashboard (`/bodega/dashboard`), Mi Perfil (`/bodega/perfil`), Mis Vinos (`/bodega/vinos`), Reclamar Vinos (`/bodega/reclamar`) y retorno al catálogo general (`/dashboard`).
  - Drawer móvil con navegación táctil fluida.
  - Proveedor `WineryContext` que consume `useMyWinery()` y distribuye el estado de la bodega en tiempo de ejecución.
  - **Banner de Moderación (`WineryStatusBanner.tsx`)**: Feedback continuo cuando la bodega está `Pending` o `Rejected`.
  - **Manejo Amable de Cuenta sin Bodega (404)**: Presenta una vista explicativa cuando el usuario con rol de bodega no posee aún una bodega registrada en la base de datos, con enlaces directos para registrarla o regresar al catálogo.

### 2.5 Inicio del Panel de Bodega (`WineryDashboardPage.tsx`)
- **Saludo Editorial y Cabecera de Bodega**:
  - Encabezado con fecha contextual rioplatense, nombre oficial de la bodega, badge de verificación institucional (`Oficial`, `En Verificación` o `Observaciones Pendientes`), terruño geográfico resuelto y año de fundación.
  - Acciones directas: Botón primario *"Nueva etiqueta"* y enlace externo hacia la vidriera pública si la bodega está aprobada.
- **Cinta de 4 KPIs (`WineryKpiRibbon.tsx`)**:
  - Cantidad de etiquetas oficiales registradas en el catálogo.
  - Cosechas registradas con desglose de activas vs en revisión.
  - Seguidores de la bodega (con resguardo contra el error 404 para bodegas no aprobadas).
  - Calificación global promedio con estrellas y total de reseñas comunitarias.
- **Accesos Rápidos Directos (`WineryQuickActions.tsx`)**:
  - Publicar etiqueta (`/bodega/vinos`).
  - Reclamar botellas comunitarias (`/bodega/reclamar`).
  - Editar perfil institucional (`/bodega/perfil`).
  - Ver vidriera pública o explorar catálogo general (`/catalogo`).
- **Checklist Institucional (`WineryChecklistCard.tsx`)**:
  - Guía de primeros pasos con cálculo porcentual dinámico (0 a 100%) y enlaces directos para completar ubicación, semblanza histórica, sitio web y primera etiqueta oficial.
- **Resumen de Etiquetas Recientes (`WineryRecentWines.tsx`)**:
  - Previsualización de las últimas botellas oficiales con categoría enológica, puntuación comunitaria y enlace a gestión.
  - Empty state sobrio integrado con botón para cargar la primera etiqueta si el catálogo está vacío.

### 2.6 Perfil Institucional de Bodega (`WineryProfilePage.tsx`)
- **Edición en Tiempo Real (`PUT /api/wineries/{id}`) con Logo y Región**:
  - Formulario Clean Dark: nombre oficial, selector de logo oficial con `ImageUploadField.tsx` (subida a `POST /api/images` con `folder=wineries`, botón para quitar logo enviando `logoUrl: ""`), selector de terruño con `RegionPicker.tsx` (con pin actual si hay coordenadas), año de fundación, sitio web y semblanza histórica de hasta 1000 caracteres.
  - La ubicación en el `PUT` solo se envía si fue alterada por el usuario.
  - Botón primario *"Guardar cambios"* con indicador de carga y botón secundario *"Descartar cambios"* para volver a los valores persistidos.
- **Vista Previa Editorial en Vivo (Split View)**:
  - Panel lateral permanente que refleja de manera instantánea el monograma con iniciales enológicas, nombre en tipografía Serif noble, badges de verificación, terruño geográfico y párrafos de la semblanza histórica tal como los miembros de la comunidad los visualizarán en la vidriera pública (`/bodegas/:id`).

### 2.7 Catálogo y Gestión de Etiquetas Oficiales (`WineryWinesPage.tsx`)
- **Explorador y Filtros de Etiquetas**:
  - Buscador reactivo por nombre de etiqueta.
  - Filtros por categoría enológica (`Todos`, `Red`, `White`, `Rose`, `Sparkling`, `Orange`) con conteo dinámico.
  - Apertura contextual directa de modal vía query string (`?action=new` o `?nuevo=1`).
  - **Soporte para Bodegas en Revisión (`Pending`)**: Una bodega pendiente puede cargar sus etiquetas sin impedimentos, visualizando un cartel editorial (*"Tu bodega está en revisión. Podés cargar tus vinos: serán visibles para los usuarios cuando te aprueben."*) y un badge distintivo *"Borrador, solo lo ves vos"* en sus etiquetas.
  - Tarjetas con visualización de estado de cosechas (`Aprobada`, `En revisión`, `Rechazada`).
- **Modal de Alta de Etiqueta (`WineCreateModal.tsx`)**:
  - Creación unificada de etiqueta y cosecha inaugural (`POST /api/wines`).
  - Incorporación de foto opcional de añada con `ImageUploadField` (`folder="vintages"`).
  - Compositor de cortes varietales dinámico con uvas consultadas en `/api/grapes`: porcentaje inicial vacío, máximo 20 cepas, exclusión de uvas duplicadas en los selectores, validación entre 0,01% y 100% por uva y suma total $\le 100\%$ con aviso visual si se excede.
  - Validación de año y graduación alcohólica opcional.
- **Modal de Gestión de Cosechas (`WineVintagesModal.tsx`)**:
  - Consulta y listado reactivo de cosechas por vino (`GET /api/wines/{wineId}/vintages`).
  - Exhibición de miniatura de botella si la cosecha cuenta con imagen registrada.
  - Badges de estado de moderación editorial.
  - Formulario para incorporar nuevas cosechas con foto de botella (`ImageUploadField`), año, graduación alcohólica opcional y corte varietal sin cepas repetidas.

### 2.8 Reclamo de Vinos Comunitarios (`WineryClaimPage.tsx`)
- **Detección Automática de Candidatos**:
  - Consulta de botellas comunitarias mediante `GET /api/wines/claim-candidates/{wineryId}`.
  - Aviso editorial protector si la bodega se encuentra en estado `Pending`, inhabilitando el botón de reclamo hasta que sea certificada.
- **Selección Masiva y Preservación de Reseñas**:
  - Checkboxes interactivos por etiqueta y control maestro *"Seleccionar todos"*.
  - Garantía de preservación de reseñas, notas de cata y calificaciones de los usuarios.
  - Ejecución del reclamo institucional atómico mediante `POST /api/wines/claim`.

### 2.9 Vidriera Pública de Bodega (`WineryPublicProfilePage.tsx` en `/bodegas/:id`)
- **Acceso Público Universal**:
  - Vidriera accesible tanto para visitantes anónimos como para usuarios registrados.
- **Cabecera Editorial y Perfil de Terruño**:
  - Monograma circular con iniciales de la bodega (`getWineryInitials`).
  - Ubicación geográfica y terruño resuelto (`getLocationById`).
  - Año de fundación, enlace al sitio web oficial y semblanza histórica completa.
- **Interacción Social y Catálogo de Botellas**:
  - Botón de *"Seguir bodega"* / *"Siguiendo"* con contador reactivo de seguidores y manejo automático de estado (`followWinery` / `unfollowWinery`).
  - Grilla de etiquetas oficiales representadas con [`WineCard.tsx`](../../src/frontend/src/features/wines/components/WineCard.tsx).
  - Apertura directa de la ficha técnica completa en [`WineDetailModal.tsx`](../../src/frontend/src/features/wines/components/WineDetailModal.tsx).

### 2.8 Página de Mi Cuenta y Seguridad (`AccountPage.tsx`)
- Vista post-login dedicada accesible en `/cuenta` (vinculada desde el menú desplegable del Avatar de usuario y desde la Top Bar Contextual Slim de `/perfil`):
  - **Navegación Inmersiva**: Barra superior contextual minimalista (`ProfileTopBar.tsx`) con branding `AyVino.` y botón de escape directo `← Volver a Mi Perfil` (redirige a `/perfil/:username`), suprimiendo el Navbar global para maximizar el área útil.
  - **Sidebar con Jerarquía Sommelier**:
    * Avatar circular destacado (`w-28 h-28 sm:w-32 sm:h-32 rounded-full ring-4 ring-rose-950/40 border border-white/10 shadow-lg mx-auto object-cover`).
    * Nombre de usuario en tipografía Serif destacada (`font-serif text-xl sm:text-2xl text-white font-medium mt-3 tracking-tight text-center`) y correo en `text-xs sm:text-sm text-zinc-400`.
    * Botón *"Cargar foto"* compacto y sobrio (`bg-white/5 hover:bg-white/10 border border-white/10 rounded-md py-1.5 px-3 text-xs text-zinc-300`).
    * Navegación exclusiva de "CONFIGURACIÓN": "Mi Perfil" y "Seguridad y Contraseña" con píldora activa en borgoña profundo (`bg-[#6e1a24] text-white`).
    * Pie del sidebar con botón directo de "Cerrar sesión".
  - **Layout Abierto y Balanceado (Sin Doble Caja Aislada)**:
    * Eliminación del marco rectangular rígido para una integración fluida sobre el lienzo `#0b0b0e`.
    * Contenedor de ancho controlado (`max-w-3xl w-full`) con cabecera en `font-serif text-3xl text-white`, bajada descriptiva en `text-zinc-400 text-sm mt-1` y divisor `border-b border-white/5 pb-4 mb-6`.
    * Disposición de inputs en grilla balanceada (`grid grid-cols-1 sm:grid-cols-2 gap-4`), con la Biografía ocupando el ancho completo (`sm:col-span-2`).
    * Botones de acción alineados a la derecha y unificados en borgoña de marca (`bg-[#6e1a24] hover:bg-[#85222e] text-white font-medium px-6 py-2.5 rounded-lg shadow-sm`).

### 2.9 Página de Perfil de Usuario (`ProfilePage.tsx`)
- Vista accesible en `/perfil/:username` (pública y canónica) y `/perfil` (redirección contextual al usuario activo o `/login`).
- **Navegación Inmersiva Contextual**: Implementa [`ProfileTopBar.tsx`](../../src/frontend/src/components/layout/ProfileTopBar.tsx) fija en el tope (`h-14` con `bg-[#0b0b0e]/90` y backdrop-blur), con vía de escape explícita `← Volver a Explorar` hacia `/dashboard`, eliminando la sobrecarga cognitiva del Navbar global.
- **Banner Atmosférico & Identidad**:
  - Banner superior con altura optimizada (`h-28 sm:h-32 md:h-36`) y tema cromático vitivinícola 100% determinista en frontend calculado según el hash del username (5 presets de guarda: *Gran Reserva*, *Cava Nocturna*, *Roble Tostado*, *Sauvignon Oliva*, *Cosecha Tardía*).
  - **Avatar Circular Superpuesto**: Avatar circular (`rounded-full`) con solapamiento orgánico (`-mt-12 sm:-mt-14 relative z-10`), aro protector `ring-4 ring-[#0b0b0e]`, sombra profunda `shadow-2xl` y borde sutil `white/15`.
- **Jerarquía Tipográfica Editorial**:
  - Nombre de usuario en tipografía Serif noble (`font-serif text-3xl sm:text-4xl font-medium tracking-tight text-white`), completamente limpio sin píldoras ni badges artificiales para máxima pureza visual, en armonía con los títulos de sección.
  - Metadatos y biografía en tipografía Sans nítida (`text-zinc-200` y `text-zinc-300`), garantizando alto contraste sobre el fondo `#0b0b0e`.
  - Cifras estadísticas en bloque compacto `#17151a` usando `font-mono text-xl sm:text-2xl font-bold text-white`.
- **Navegación Segmentada**:
  - Pestañas en cápsula flotante (`bg-[#17151a] border border-white/10 rounded-md p-1`) con píldora activa en borgoña profundo (`bg-[#6e1a24] text-white`):
    * *Joyas de la Cava*: Mosaico curado de las botellas más destacadas/calificadas de la colección, con badge dinámico de botellas totales y enlace a `/cava`.
    * *Historial de Catas*: Mosaico de etiquetas descorchadas y notas sensoriales.
    * *Deseados & Favoritos*: Mosaico de vinos guardados con chips contextuales ("Favorito" / "Deseado").
- **Empty State Condicional e Interactivo**:
  - **Para el Dueño (`isOwner === true`)**: Grilla con slots punteados interactivos (`border-2 border-dashed border-rose-500/25 hover:border-rose-400/60 bg-[#17151a]/30`) e ícono `+` que invitan directamente a sumar la primera joya desde el catálogo (`/dashboard`).
  - **Para Visitantes (`isOwner === false`)**: Tarjeta editorial sobria en `#17151a` indicando "Cava en curación", con botones para explorar el catálogo general o crear su propia cuenta (sin dropzones ni slots punteados).
- **Mosaico de Botellas**:
  - Tarjetas con esquinas suavizadas `rounded-md` sobre `#17151a` y hover borgoña sutil (`hover:border-rose-900/40 hover:-translate-y-0.5`). Escaparate oscuro para silueta o imagen, varietal y añada en `font-mono`, bodega y calificación en estrellas doradas.

---

## 3. Vistas Protegidas y Políticas de Acceso

| Ruta | Componente | Acceso Permitido | Comportamiento si no cumple |
| :--- | :--- | :--- | :--- |
| `/` | `Landing.tsx` | Público (todos) | Redirige al dashboard según rol si ya está autenticado |
| `/para-bodegas` | `ForWineriesPage.tsx` | Público (todos) | N/A |
| `/bodega/registro` | `WineryRegisterPage.tsx` | Público | Si ya está autenticado como `Winery`/`Admin`, redirige a `/bodega/dashboard` |
| `/bodegas/:id` | `WineryPublicProfilePage.tsx` | Público (todos) | N/A |
| `/login` | `LoginPage.tsx` | Público (redirige a `state.from`, `/bodega/dashboard` o `/dashboard`) | N/A |
| `/register` | `RegisterPage.tsx` | Público (redirige a `/dashboard` si ya está autenticado) | N/A |
| `/terms` | `TermsPage.tsx` | Público (todos) | N/A |
| `/perfil/:username` | `ProfilePage.tsx` | Público (todos) | Si no existe el usuario: mensaje 404 sobrio |
| `/perfil` | Alias Redirección | Todos | Redirige a `/perfil/:myUsername` si está logueado, o `/login` si no |
| `/dashboard` | `DashboardPage.tsx` | Autenticado (`User`, `Winery`, `Admin`) | Redirige a `/login` pasando `{ from: location }` |
| `/cava` | `CavaPage.tsx` | Autenticado (`User`, `Winery`, `Admin`) | Redirige a `/login` pasando `{ from: location }` |
| `/maridaje` | `PairingPage.tsx` | Autenticado (`User`, `Winery`, `Admin`) | Redirige a `/login` pasando `{ from: location }` |
| `/cuenta` | `AccountPage.tsx` | Autenticado (`User`, `Winery`, `Admin`) | Redirige a `/login` pasando `{ from: location }` |
| `/app` | Alias Redirección | Redirige automáticamente a `/dashboard` | N/A |
| `/catalogo` | `CatalogPage.tsx` | Autenticado (`User`, `Winery`, `Admin`) | Redirige a `/login` pasando `{ from: location }` |
| `/bodega` | `WineryLayout.tsx` | Exclusivo `Winery` o `Admin` | Redirige internamente a `/bodega/dashboard` |
| `/bodega/dashboard` | `WineryDashboardPage.tsx` | Exclusivo `Winery` o `Admin` | Si no está autenticado: `/login` (`state.from`). Si no tiene rol: `/dashboard` |
| `/bodega/perfil` | `WineryProfilePage.tsx` | Exclusivo `Winery` o `Admin` | Si no está autenticado: `/login` (`state.from`). Si no tiene rol: `/dashboard` |
| `/bodega/vinos` | `WineryWinesPage.tsx` | Exclusivo `Winery` o `Admin` | Si no está autenticado: `/login` (`state.from`). Si no tiene rol: `/dashboard` |
| `/bodega/reclamar` | `WineryClaimPage.tsx` | Exclusivo `Winery` o `Admin` | Si no está autenticado: `/login` (`state.from`). Si no tiene rol: `/dashboard` |
| `*` | Redirección 404 | N/A | Redirige automáticamente a `/` |
