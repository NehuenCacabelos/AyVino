# 🍷 AyVino

Plataforma social y colaborativa diseñada para catalogar, puntuar, reseñar y comparar vinos, conectando de forma fluida a la comunidad de entusiastas del vino con las bodegas productoras oficiales.

---

## 📋 Tabla de Contenidos

- [Propósito y Visión](#-propósito-y-visión)
- [Reglas de Negocio Implementadas](#-reglas-de-negocio-implementadas)
- [Stack Tecnológico](#-stack-tecnológico)
- [Requisitos Previos](#-requisitos-previos)
- [Configuración de Entorno y Secretos](#-configuración-de-entorno-y-secretos)
- [Puesta en Marcha Local](#-puesta-en-marcha-local)
- [Uso de la Colección de Postman](#-uso-de-la-colección-de-postman)
- [Documentación Interactiva de la API](#-documentación-interactiva-de-la-api)
- [Ejecución de Pruebas y Control de Calidad](#-ejecución-de-pruebas-y-control-de-calidad)
- [Arquitectura y Estructura del Repositorio](#-arquitectura-y-estructura-del-repositorio)
- [Resumen de Módulos y Endpoints](#-resumen-de-módulos-y-endpoints)
- [Centro de Documentación Viva (`docs/`)](#-centro-de-documentación-viva-docs)

---

## 🎯 Propósito y Visión

AyVino resuelve la fragmentación y falta de trazabilidad en la información sobre vinos:
1. **Catálogo Dual (Oficial vs. Comunidad)**: Los usuarios pueden cargar botellas no catalogadas ("Agregado por la comunidad"), mientras que las bodegas oficiales pueden registrarse, certificar sus etiquetas y reclamar (`claim`) los vinos cargados previamente por los usuarios preservando calificaciones y reseñas históricas.
2. **Corte y Composición Detallada (Blends)**: Soporte estructurado para varietales puros y cortes con porcentajes verificados de uva.
3. **Maridajes Gastronómicos**: Catálogo especializado de maridajes clasificados por categoría (carnes, pastas, quesos, postres) asociados directamente a las etiquetas.
4. **Georreferenciación Vitivinícola**: Jerarquía territorial que modela Provincias (`States`), Ciudades (`Cities`) y Terruños/Regiones (`Locations`).
5. **Red Social y Comunidad**: Seguimiento entre aficionados y a bodegas oficiales, marcas de vinos deseados, probados y favoritos, y gestión de cavas virtuales.

---

## ⚖️ Reglas de Negocio Implementadas

El sistema implementa rigurosamente el dominio vinícola bajo los siguientes lineamientos:

- **Adopción y Reclamo Oficial (`claim`)**: Una bodega oficial puede listar candidatos (`GET /api/wines/claim-candidates/{wineryId}`) y reclamar vinos comunitarios (`POST /api/wines/claim/{wineryId}`). La etiqueta pasa a ser oficial (`SourceType = 2`), se enlaza formalmente a la bodega y se preservan todas sus añadas, reseñas y notas históricas.
- **Moderación de Estados**:
  - **Bodegas (`Wineries`)**: `Pending = 1`, `Approved = 2`, `Rejected = 3`. Solo bodegas aprobadas pueden emitir vinos oficiales o recibir seguidores.
  - **Ciudades (`Cities`)**: `Approved = 1`, `Pending = 2`, `Rejected = 3`. Alta comunitaria en estado pendiente hasta moderación administrativa.
  - **Añadas (`WineVintages`)**: `Pending = 1`, `Approved = 2`, `Rejected = 3`.
- **Roles y Ownership (Seguridad)**:
  - Roles definidos en el sistema: `User` (aficionados / sommeliers comunitarios), `Winery` (titulares de bodegas), y `Admin` (administradores y moderadores).
  - Control de acceso por titularidad: Solo el dueño de una bodega aprobada (o un Administrador) puede publicar o editar vinos y añadas oficiales.
  - Privacidad de cavas: El acceso a cavas de terceros retorna `404 Not Found` en lugar de `403` para no filtrar la existencia de inventarios privados.
- **Composición de Uvas (Blends)**: La suma total de los porcentajes de cepas asociadas a una añada no puede superar el 100%.
- **Cálculo de Rating Enológico**: Las etiquetas y añadas no publican un promedio de puntuación hasta haber acumulado un umbral mínimo de 5 reseñas verificadas (`review_count >= 5`), evitando sesgos estadísticos.
- **Red Social (Follows)**:
  - Los usuarios pueden seguir a otros aficionados (`POST /api/users/{id}/follow`) y a bodegas oficiales aprobadas (`POST /api/wineries/{id}/follow`).
  - Validación contra auto-seguimiento (`400 Bad Request`) e imposibilidad de seguir bodegas pendientes o inexistentes (`404 Not Found`).
- **Marcas Personales (UserWines)**:
  - Gestión de listas personales: `wanted` (deseado), `favorite` (favorito) y `tried` (probado).
  - La marca de `tried` es acumulativa y permanente en la trayectoria del usuario.
- **Cavas Virtuales (Cellars & CellarItems)**:
  - Múltiples cavas por usuario, con control de nombres duplicados por usuario (`409 Conflict`).
  - Inventario de botellas con cantidades, fecha de adquisición y notas.
  - Protección de borrado: Una cava con botellas asociadas no puede eliminarse (`409 Conflict`).
- **Enocuidado y Servicio (WineCare)**:
  - Motor enológico que analiza el tipo de vino (`WineType`) y tiempo de guarda para sugerir temperatura óptima de servicio, tiempos recomendados de decantación y ventana de consumo.
- **Protección de Fuerza Bruta y Lockout**:
  - Tras 5 intentos fallidos consecutivos de login, la cuenta del usuario se bloquea temporalmente por 15 minutos (`BlockedUntil`).
  - Rate limiting adicional por IP en endpoints de autenticación (`15 solicitudes por minuto`).

---

## 🛠️ Stack Tecnológico

| Capa | Tecnologías Clave | Justificación Arquitectural |
| :--- | :--- | :--- |
| **Backend API** | C# / .NET 10 (Minimal APIs) | Alto rendimiento, sintaxis concisa y bajo overhead de memoria. |
| **Acceso a Datos** | Dapper (Micro-ORM) | Consultas SQL directas, optimizadas y mapeo nativo con PostgreSQL. |
| **Base de Datos** | PostgreSQL 16 (Alpine en Docker) | Motor relacional robusto con extensión `pg_trgm` para búsquedas difusas. |
| **Migraciones** | FluentMigrator (C# Runner) | Control de cambios de esquema estructurado, versionado y reproducible en C#. |
| **Frontend SPA** | React 19 + TypeScript + Vite 8 | Interfaz reactiva, compilación instantánea (HMR) y tipado estricto sin `any`. |
| **Diseño y Estilos** | Tailwind CSS v4 + Lucide React | Estética editorial vinícola, cálida y limpia con micro-interacciones sutiles. |
| **Seguridad** | JWT Bearer + Refresh Tokens rotativos + PBKDF2 | Autenticación stateless segura, mitigación de timing attacks y revocación de sesiones. |
| **API Docs** | Scalar API Reference + OpenAPI v3 | Documentación interactiva moderna integrada en Minimal APIs. |

---

## 💻 Requisitos Previos

Asegúrate de contar con el siguiente software instalado en tu entorno de desarrollo:
- **.NET SDK**: Versión 10.0
- **Node.js**: Versión 20.x o superior
- **npm**: Versión 10.x o superior
- **Docker** y **Docker Compose**: Para la base de datos PostgreSQL en contenedor

---

## ⚙️ Configuración de Entorno y Secretos

> [!IMPORTANT]
> **Gestión segura de credenciales**: El archivo `appsettings.json` no contiene connection strings ni contraseñas codificadas. La configuración de conexión a la base de datos se realiza mediante **.NET User Secrets** en desarrollo o mediante **Variables de Entorno** en producción.

### 1. Variables de Docker (`compose.yml` / `.env`)

Copia la plantilla de variables de entorno en la raíz del proyecto:

```bash
cp .env.example .env
```

Contenido de `.env`:
```ini
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=ayvino_db
POSTGRES_PORT=5432
```

> [!NOTE]
> **Puerto 5432**: El contenedor expone y mapea la base de datos en el puerto estándar `5432`. Verifica que tu connection string apunte a `Port=5432`.

### 2. Configuración del Backend con User Secrets (.NET)

Para configurar la cadena de conexión y generar una clave secreta propia para JWT (mínimo 32 caracteres / 256 bits) en desarrollo sin dejar secretos en archivos versionados:

**Generación de clave y configuración con .NET User Secrets:**

```bash
# Configurar cadena de conexión
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=localhost;Port=5432;Database=ayvino_db;Username=postgres;Password=postgres" --project src/backend/AyVino.Api

# Generar y configurar clave JWT en Linux / macOS (Bash con OpenSSL):
JWT_KEY=$(openssl rand -base64 48)
dotnet user-secrets set "Jwt:SecretKey" "$JWT_KEY" --project src/backend/AyVino.Api

# Generar y configurar clave JWT en Windows (PowerShell):
$jwtKey = [Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(48))
dotnet user-secrets set "Jwt:SecretKey" $jwtKey --project src/backend/AyVino.Api
```

**O bien mediante variables de entorno:**

```powershell
# Windows (PowerShell)
$env:ConnectionStrings__DefaultConnection = "Host=localhost;Port=5432;Database=ayvino_db;Username=postgres;Password=postgres"
$env:Jwt__SecretKey = [Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(48))
```

```bash
# Linux / macOS (Bash)
export ConnectionStrings__DefaultConnection="Host=localhost;Port=5432;Database=ayvino_db;Username=postgres;Password=postgres"
export Jwt__SecretKey="$(openssl rand -base64 48)"
```

> [!WARNING]
> **Requisito obligatorio para el arranque**: La clave `Jwt:SecretKey` (o `Jwt__SecretKey`) debe contener un mínimo de 32 caracteres (256 bits). La API valida esta longitud en el arranque y rechaza la inicialización si la clave falta o es menor a dicho límite.

---

## 🚀 Puesta en Marcha Local

### Paso 1: Iniciar PostgreSQL con Docker

Desde la raíz del repositorio:

```bash
docker compose up -d postgres
```

Para verificar que el contenedor se encuentra saludable y escuchando en el puerto `5432`:
```bash
docker compose ps
```

### Paso 2: Iniciar la API Backend (.NET)

```bash
dotnet run --project src/backend/AyVino.Api --launch-profile http
```

La API estará escuchando en: [http://localhost:5230](http://localhost:5230).

> **Migraciones automáticas**: Al iniciar, `Program.cs` ejecuta automáticamente el runner de `FluentMigrator`, aplicando todas las migraciones estructuradas pendientes (incluyendo índices trigram y tablas de cavas y seguimiento).

### Paso 3: Iniciar el Frontend (React + Vite)

En una terminal separada:

```bash
cd src/frontend
npm install
npm run dev
```

La aplicación web estará disponible en [http://localhost:5173](http://localhost:5173).

---

## 📬 Uso de la Colección de Postman

El proyecto incluye una suite integral de endpoints y pruebas automatizadas en el directorio `postman/`:
- `postman/AyVino.postman_collection.json`: Colección completa organizada en carpetas de configuración, casos felices y casos de error (400, 401, 403, 404, 409).
- `postman/AyVino.postman_environment.json`: Entorno con variables configuradas (`baseUrl`, credenciales y tokens por rol, e IDs dinámicos).

### Cómo importar y ejecutar en Postman:

1. Abrí **Postman** y hacé clic en **Import**.
2. Seleccioná los dos archivos dentro de la carpeta `postman/`:
   - `AyVino.postman_collection.json`
   - `AyVino.postman_environment.json`
3. En la esquina superior derecha de Postman, seleccioná el entorno activo: **AyVino - Localhost**.
4. Abrí la carpeta `01 - Casos felices > Auth` y ejecutá las peticiones de login para los diferentes roles:
   - `Login - Sommelier / Usuario Común` -> Almacena `userToken` y `myUserId`.
   - `Login - Dueño Bodega (Winery)` -> Almacena `ownerToken` y `wineryToken`.
   - `Login - Administrador` -> Almacena `adminToken`.
5. Los scripts de prueba automáticos (**Tests**) configurados en cada petición capturan dinámicamente los identificadores generados (`wineryId`, `wineId`, `vintageId`, `cellarId`, `pairingId`, etc.) y los reinyectan en las llamadas subsiguientes, garantizando un flujo de prueba completamente encadenado y sin intervención manual.

---

## 📖 Documentación Interactiva de la API

Cuando el backend se ejecuta en modo `Development`, dispones de:
- **Scalar API Reference (UI Interactiva Moderna)**: [http://localhost:5230/scalar/v1](http://localhost:5230/scalar/v1)
- **Especificación OpenAPI (JSON OpenAPI v3)**: [http://localhost:5230/openapi/v1.json](http://localhost:5230/openapi/v1.json)

---

## 🧪 Ejecución de Pruebas y Control de Calidad

De acuerdo con la constitución del proyecto ([`AGENTS.md`](AGENTS.md)), todo cambio debe mantener **cero advertencias del compilador y todas las pruebas en verde**.

### Pruebas Unitarias de Backend (.NET)

Para correr la suite de pruebas automatizadas:

```bash
dotnet test
```

### Verificación de Tipos y Linter en Frontend (TypeScript / ESLint)

```bash
cd src/frontend
npm run build    # Chequeo estricto de tipos con tsc y compilación de producción con Vite
npm run lint     # Análisis estático de código con ESLint
```

---

## 🏛️ Arquitectura y Estructura del Repositorio

AyVino implementa **Vertical Slice Architecture**. Cada funcionalidad de negocio se organiza en su propio slice vertical autosuficiente (Endpoints, Servicios, Repositorios, DTOs, Modelos):

```text
AyVino/
├── .agents/                    # Flujos de trabajo y habilidades del asistente AI
├── docs/                       # Documentación viva y técnica centralizada
│   ├── architecture/           # Arquitectura global y flujos de datos
│   ├── backend/                # Endpoints, migraciones estructuradas y seguridad
│   ├── frontend/               # Guía visual, componentes y navegación
│   └── requirements/           # Especificación funcional EARS
├── postman/                    # Colección y variables de entorno para Postman
│   ├── AyVino.postman_collection.json
│   └── AyVino.postman_environment.json
├── src/
│   ├── backend/
│   │   └── AyVino.Api/         # Proyecto Web API principal (.NET 10 Minimal APIs)
│   │       ├── Common/         # Infraestructura transversal (Data, Security, Middleware)
│   │       │   ├── Constants/  # Roles (AppRoles) y políticas (AppPolicies)
│   │       │   ├── Data/       # Factoría de conexiones Npgsql y TypeHandlers
│   │       │   ├── Exceptions/ # Excepciones de dominio tipadas (AppException, NotFound, Conflict)
│   │       │   ├── Middleware/ # Manejo global RFC 7807 (ProblemDetails)
│   │       │   └── Security/   # Hasher PBKDF2 y generador de JWT Bearer
│   │       ├── Features/       # Vertical Slices del sistema
│   │       │   ├── Auth/       # Login, rotación de refresh tokens, revocación y lockout
│   │       │   ├── Users/      # Registro, perfiles y gestión administrativa paginada
│   │       │   ├── Wineries/   # Registro unificado, catálogo y aprobación de bodegas
│   │       │   ├── Locations/  # Provincias (States), Ciudades (Cities) y Regiones (Locations)
│   │       │   ├── Grapes/     # Catálogo maestro de cepas y varietales
│   │       │   ├── Wines/      # Vinos, añadas (vintages), búsquedas trigram y reclamos
│   │       │   ├── Pairings/   # Maridajes culinarios y relaciones N:M con etiquetas
│   │       │   ├── Reviews/    # Calificaciones y reseñas por cosecha con umbral mínimo
│   │       │   ├── Follows/    # Seguimiento social a usuarios y bodegas aprobadas
│   │       │   ├── UserWines/  # Vinos deseados (wanted), probados (tried) y favoritos
│   │       │   ├── Cellars/    # Cavas personales, inventario de botellas y care-summary
│   │       │   └── WineCare/   # Recomendaciones de temperatura, decantación y consumo
│   │       ├── Migrations/     # Migraciones estructuradas con FluentMigrator
│   │       └── Program.cs      # Configuración de pipeline, seguridad y mapeo de rutas
│   └── frontend/               # Single Page Application (React 19 + TypeScript + Vite)
│       ├── public/             # Recursos estáticos
│       └── src/
│           ├── assets/         # Ilustraciones de marca
│           ├── components/     # Componentes modulares accesibles
│           ├── pages/          # Vistas principales
│           ├── types/          # Interfaces TypeScript estrictas
│           └── App.tsx         # Componente raíz
├── tests/
│   └── AyVino.UnitTests/       # Pruebas unitarias en xUnit (.NET 10)
├── AGENTS.md                   # Constitución y reglas de ingeniería
├── compose.yml                 # Definición del contenedor PostgreSQL 16
├── .env.example                # Plantilla de variables de entorno para Docker
└── README.md                   # Documentación principal de bienvenida
```

---

## 📡 Resumen de Módulos y Endpoints

| Módulo / Slice | Prefijo HTTP | Propósito Principal |
| :--- | :--- | :--- |
| **Auth** | `/api/auth` | Login, rotación de refresh tokens, logout, cambio de contraseña y rate limiting. |
| **Users** | `/api/users` | Registro público, perfil personal (`/me`), y gestión administrativa paginada. |
| **Wineries** | `/api/wineries` | Catálogo de bodegas, alta comunitaria, onboarding unificado (`/register`) y aprobación. |
| **States** | `/api/states` | Listado y consulta de provincias argentinas precargadas. |
| **Cities** | `/api/cities` | Consulta paginada, alta comunitaria y moderación administrativa. |
| **Locations** | `/api/locations` | Terruños y regiones vitivinícolas asociadas a ciudades. |
| **Grapes** | `/api/grapes` | Catálogo maestro de cepas/varietales (Malbec, Cabernet Franc, etc.). |
| **Wines** | `/api/wines` | CRUD de vinos, filtros paginados, blends, búsquedas difusas y reclamo oficial (`/claim`). |
| **Pairings** | `/api/pairings` | Catálogo de maridajes y asociación N:M con etiquetas de vino. |
| **Reviews** | `/api/reviews` | Calificaciones (1 a 5) y reseñas con cálculo de rating tras 5 opiniones. |
| **Follows** | `/api/users/{id}/follow`, `/api/wineries/{id}/follow` | Red social: seguir y dejar de seguir a usuarios y a bodegas aprobadas. |
| **UserWines** | `/api/wines/{id}/{wanted\|tried\|favorite}` | Marcas personales de vinos deseados, probados y favoritos. |
| **Cellars** | `/api/cellars` | Cavas virtuales, inventario de botellas, stock y resumen enológico (`care-summary`). |
| **WineCare** | `/api/wines/{id}/vintages/{vId}/care-recommendations` | Guía de servicio, temperatura, decantación y ventana óptima de consumo. |

---

## 📚 Centro de Documentación Viva y Vault de Obsidian (`docs/`)

Para profundizar en cualquier aspecto técnico o de negocio, consulta los documentos especializados en el Vault de Obsidian:

- 📑 [**Índice General del Vault (`docs/README.md`)**](docs/README.md)
- 🏗️ [**Arquitectura Global del Sistema (`docs/02_Proyecto/Arquitectura/Arquitectura_Overview.md`)**](docs/02_Proyecto/Arquitectura/Arquitectura_Overview.md)
- 🔄 [**Flujos de Datos y Decisiones Técnicas (`docs/02_Proyecto/Arquitectura/Flujos_De_Datos.md`)**](docs/02_Proyecto/Arquitectura/Flujos_De_Datos.md)
- ⚙️ [**Diseño Backend y Vertical Slices (`docs/02_Proyecto/Arquitectura/Backend_Overview.md`)**](docs/02_Proyecto/Arquitectura/Backend_Overview.md)
- 🔌 [**Catálogo Exhaustivo de Endpoints API (`docs/02_Proyecto/Arquitectura/Catalogo_Endpoints_API.md`)**](docs/02_Proyecto/Arquitectura/Catalogo_Endpoints_API.md)
- 🗄️ [**Esquema de Base de Datos y Migraciones (`docs/02_Proyecto/Arquitectura/Base_De_Datos_Migraciones.md`)**](docs/02_Proyecto/Arquitectura/Base_De_Datos_Migraciones.md)
- 🔐 [**Seguridad, JWT y Autenticación (`docs/02_Proyecto/Arquitectura/Seguridad_Y_Autenticacion.md`)**](docs/02_Proyecto/Arquitectura/Seguridad_Y_Autenticacion.md)
- 🍇 [**Ciclo de Vida del Vino y Reclamo Oficial (`docs/02_Proyecto/Arquitectura/Ciclo_Vida_Vino.md`)**](docs/02_Proyecto/Arquitectura/Ciclo_Vida_Vino.md)
- 🎨 [**Diseño y Arquitectura Frontend (`docs/02_Proyecto/Arquitectura/Frontend_Overview.md`)**](docs/02_Proyecto/Arquitectura/Frontend_Overview.md)
- 🗺️ [**Mapa de Navegación y UX Frontend (`docs/02_Proyecto/Arquitectura/Frontend_Navegacion_Flujo.md`)**](docs/02_Proyecto/Arquitectura/Frontend_Navegacion_Flujo.md)
- 🚀 [**Guía de Inicio Rápido (`docs/02_Proyecto/Guias_Dev/Getting_Started.md`)**](docs/02_Proyecto/Guias_Dev/Getting_Started.md)
- 📋 [**Especificación Funcional EARS (`docs/02_Proyecto/MDE_Requerimientos/Especificacion_Requerimientos.md`)**](docs/02_Proyecto/MDE_Requerimientos/Especificacion_Requerimientos.md)
- 🗺️ [**Roadmap del Proyecto (`docs/02_Proyecto/Roadmap.md`)**](docs/02_Proyecto/Roadmap.md)
- 📐 [**Guía de Estilo del Vault (`docs/00_Meta/Styleguide.md`)**](docs/00_Meta/Styleguide.md)
