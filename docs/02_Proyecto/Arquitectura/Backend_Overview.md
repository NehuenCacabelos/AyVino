---
title: "Arquitectura y Diseño Backend - Vertical Slices"
tipo: "arquitectura"
tags:
  - backend
  - dotnet
  - csharp
  - vertical-slice
  - dapper
---

# Arquitectura y Diseño Backend - AyVino.Api

El backend de AyVino está diseñado bajo el patrón **Vertical Slice Architecture (Diseño por Features)** dentro del proyecto [`src/backend/AyVino.Api`](../../src/backend/AyVino.Api).

---

## 1. Fundamentos de Vertical Slice Architecture

En las arquitecturas tradicionales por capas (Clean / Onion / 3-Tier), el código se divide horizontalmente en abstracciones técnicas globales (`Controllers`, `Services`, `Repositories` e `Interfaces`). Dicho enfoque suele introducir:
- Acoplamiento artificial entre casos de uso no relacionados.
- Abstracciones prematuras para operaciones simples.
- Dificultad para navegar y modificar una sola funcionalidad sin alterar múltiples proyectos.

En **AyVino**, el código se agrupa por **funcionalidad de negocio** dentro de [`Features/`](../../src/backend/AyVino.Api/Features). Cada "rebanada vertical" (slice) es autosuficiente y contiene todo lo necesario para cumplir con su caso de uso:

```text
Features/
├── Auth/              # Autenticación, Login, Refresh Tokens, Revocación y TokenCleanupService
│   ├── DTOs/          # LoginRequestDto, RefreshRequestDto, etc.
│   ├── Endpoints/     # AuthEndpoints.cs (Mapeo Minimal APIs)
│   ├── Models/        # RefreshToken.cs (Entidad persistida)
│   ├── Repositories/  # IRefreshTokenRepository.cs y RefreshTokenRepository.cs
│   └── Services/      # IAuthService, AuthService y TokenCleanupBackgroundService
│
├── Users/             # Gestión de perfiles, registro de aficionados y administración
│   ├── DTOs/          # RegisterUserRequestDto, UserResponseDto, etc.
│   ├── Endpoints/     # UserEndpoints.cs
│   ├── Models/        # User.cs, UserCredential.cs
│   ├── Repositories/  # IUserRepository.cs y UserRepository.cs
│   └── Services/      # IUserService.cs y UserService.cs
│
├── Wineries/          # Bodegas (oficiales y comunitarias), registro y perfiles
│   ├── DTOs/          # RegisterWineryRequestDto, WineryResponseDto, ChangeWineryStatusRequestDto, etc.
│   ├── Endpoints/     # WineryEndpoints.cs
│   ├── Enums/         # WineryStatus (Pending, Approved, Rejected)
│   ├── Models/        # Winery.cs
│   ├── Repositories/  # IWineryRepository.cs y WineryRepository.cs
│   └── Services/      # IWineryService.cs y WineryService.cs
│
├── Locations/         # Georreferenciación vitivinícola (Provincias, Ciudades y Regiones)
│   ├── DTOs/          # StateResponseDto, CityResponseDto, LocationResponseDto, etc.
│   ├── Endpoints/     # StateEndpoints.cs, CityEndpoints.cs, LocationEndpoints.cs
│   ├── Enums/         # CityStatus (Pending, Approved, Rejected)
│   ├── Models/        # State.cs, City.cs, Location.cs
│   ├── Repositories/  # StateRepository, CityRepository, LocationRepository
│   └── Services/      # StateService, CityService, LocationService
│
├── Grapes/            # Varietales y tipos de uva (Malbec, Cabernet Franc, etc.)
│   ├── DTOs/          # CreateGrapeRequestDto, GrapeResponseDto, etc.
│   ├── Endpoints/     # GrapeEndpoints.cs
│   ├── Enums/         # GrapeColorType (Tinto, Blanco, Rosado)
│   ├── Models/        # Grape.cs
│   ├── Repositories/  # IGrapeRepository.cs y GrapeRepository.cs
│   └── Services/      # IGrapeService.cs y GrapeService.cs
│
├── Wines/             # Catálogo de botellas, cosechas (vintages), cortes (blends) y reclamo oficial
│   ├── DTOs/          # CreateWineRequestDto, WineResponseDto, WineVintageResponseDto, ChangeWineVintageStatusRequestDto, etc.
│   ├── Endpoints/     # WineEndpoints.cs y WineVintageEndpoints.cs
│   ├── Enums/         # WineType, ApprovalStatus, SourceType
│   ├── Models/        # Wine.cs, WineVintage.cs, WineGrape.cs
│   ├── Repositories/  # IWineRepository, WineRepository, IWineVintageRepository, WineVintageRepository
│   └── Services/      # IWineService, WineService, IWineVintageService, WineVintageService
│
├── Pairings/          # Maridajes culinarios y asociaciones N:M con etiquetas de vino
│   ├── DTOs/          # CreatePairingRequestDto, PairingResponseDto, etc.
│   ├── Endpoints/     # PairingEndpoints.cs
│   ├── Enums/         # PairingCategory (Carnes, Pastas, Quesos, etc.)
│   ├── Models/        # Pairing.cs, WinePairing.cs
│   ├── Repositories/  # IPairingRepository.cs y PairingRepository.cs
│   └── Services/      # IPairingService.cs y PairingService.cs
│
├── Reviews/           # Reseñas por cosecha y etiqueta con cálculo ponderado y cascade rollup
│   ├── DTOs/          # CreateReviewRequestDto, ReviewResponseDto, UpdateReviewRequestDto, etc.
│   ├── Endpoints/     # ReviewEndpoints.cs
│   ├── Models/        # Review.cs
│   ├── Repositories/  # IReviewRepository.cs y ReviewRepository.cs
│   └── Services/      # IReviewService.cs y ReviewService.cs
│
├── Follows/           # Red social vitivinícola: seguimiento a otros usuarios y a bodegas aprobadas
│   ├── DTOs/          # FollowUserResponseDto, FollowWineryResponseDto, etc.
│   ├── Endpoints/     # FollowEndpoints.cs
│   ├── Models/        # UserFollow.cs, WineryFollow.cs
│   ├── Repositories/  # IFollowRepository.cs y FollowRepository.cs
│   └── Services/      # IFollowService.cs y FollowService.cs
│
├── UserWines/         # Listas personales y marcas sobre vinos (deseados, probados, favoritos)
│   ├── DTOs/          # UserWineMarksResponseDto, UserWineListItemDto, etc.
│   ├── Endpoints/     # UserWineEndpoints.cs
│   ├── Models/        # UserWine.cs, UserWineListRow.cs
│   ├── Repositories/  # IUserWineRepository.cs y UserWineRepository.cs
│   └── Services/      # IUserWineService.cs y UserWineService.cs
│
├── Cellars/           # Cavas personales privadas y control de stock de botellas por cosecha
│   ├── DTOs/          # CreateCellarRequestDto, CellarResponseDto, AddCellarItemRequestDto, etc.
│   ├── Endpoints/     # CellarEndpoints.cs, CellarItemEndpoints.cs, CellarCareEndpoints.cs
│   ├── Models/        # Cellar.cs, CellarItem.cs, CellarSummaryRow.cs, CellarItemListRow.cs
│   ├── Repositories/  # ICellarRepository, CellarRepository, ICellarItemRepository, CellarItemRepository
│   └── Services/      # ICellarService, CellarService, ICellarItemService, CellarItemService, CellarCareService
│
├── WineCare/          # Consejos enológicos: temperaturas óptimas, decantado y ventanas de consumo
│   ├── DTOs/          # WineCareResponseDto, ServingTemperatureDto, DecantingDto, DrinkingWindowDto
│   ├── Endpoints/     # WineCareEndpoints.cs
│   ├── Enums/         # DrinkingStatus, AdviceSource
│   ├── Repositories/  # IWineCareRepository.cs y WineCareRepository.cs
│   └── Services/      # IWineCareService.cs y WineCareService.cs
│
└── Images/            # Almacenamiento, entrega y optimización de imágenes en Cloudinary
    ├── DTOs/          # ImageResponseDto, ImageUploadResultDto
    ├── Endpoints/     # ImageEndpoints.cs
    ├── Enums/         # ImageVariant (Thumbnail, Medium, Large, Original)
    ├── Models/        # StoredImage (Image)
    ├── Repositories/  # IImageRepository.cs y ImageRepository.cs
    └── Services/      # IImageStorage, CloudinaryImageStorage, IImageOrchestrator, ImageOrchestrator, IImageTransactionRunner, ImageTransactionRunner, ImageValidator
```

---

## 2. Infraestructura Transversal ([`Common/`](../../src/backend/AyVino.Api/Common))

Aquellos aspectos técnicos requeridos transversalmente por múltiples slices se centralizan de forma minimalista en la carpeta `Common`:

### Acceso a Base de Datos ([`Common/Data/`](../../src/backend/AyVino.Api/Common/Data))
- **`IDbConnectionFactory`**: Interfaz asíncrona y síncrona para obtener conexiones físicas a PostgreSQL.
- **`NpgsqlConnectionFactory`**: Implementación basada en `NpgsqlConnection` que inyecta la cadena de conexión provista mediante User Secrets en desarrollo o variables de entorno en producción.

### Almacenamiento Unificado de Imágenes con Cloudinary ([`Features/Images/`](../../src/backend/AyVino.Api/Features/Images))
- **Único Proveedor Multimedia**: Cloudinary es el proveedor exclusivo para la carga, transformación y entrega de imágenes. Supabase Storage y el almacenamiento local de avatares fueron eliminados.
- **Abstracción `IImageStorage` y `CloudinaryImageStorage`**: Encapsula el cliente oficial de Cloudinary (`CloudinaryDotNet`), realizando cargas (`UploadAsync`), borrados físicos (`DeleteAsync`) y generación de URLs optimizadas con variantes dinámicas (`BuildDeliveryUrl`).
- **Orquestación y Compensación Transaccional (`IImageOrchestrator`, `IImageTransactionRunner`)**:
  Para garantizar consistencia atómica entre el almacenamiento en la nube y PostgreSQL, las altas y bajas de imágenes implementan un flujo de compensación:
  1. Validación en memoria de formato (JPEG, PNG, WebP) mediante números mágicos y tamaño (máx. 5 MB) con `ImageValidator`.
  2. Subida física del archivo a Cloudinary en carpetas de dominio (`ayvino/{folder}`).
  3. Ejecución transaccional en PostgreSQL vía `IImageTransactionRunner`: inserción en la tabla `images` y actualización de la clave foránea (`logo_image_id`, `banner_image_id`, `image_id`, `avatar_image_id`).
  4. En caso de fallo en la base de datos, se activa inmediatamente la compensación eliminando el asset recién subido de Cloudinary (`RollbackCloudinaryUploadAsync`).
  5. En caso de éxito con reemplazo de imagen existente, la imagen anterior se elimina de PostgreSQL y se purga en Cloudinary.
- **Entrega con Redirección y Caché (`GET /api/images/{id}`)**:
  - Redirección HTTP 302 hacia el CDN de Cloudinary aplicando auto-formato (`f_auto`) y auto-calidad (`q_auto`).
  - Cabecera `Cache-Control: public, max-age=604800` (7 días) para maximizar la velocidad de carga en el frontend.

### Manejo Global de Excepciones ([`Common/Middleware/`](../../src/backend/AyVino.Api/Common/Middleware))
- **`GlobalExceptionHandler`**: Interceptor que traduce cualquier excepción de negocio o fallo no controlado al formato estándar RFC 7807 (`ProblemDetails`).
- **Jerarquía de Excepciones de Dominio ([`Common/Exceptions/`](../../src/backend/AyVino.Api/Common/Exceptions))**:
  - `AppException`: Clase base que encapsula el código HTTP de estado.
  - `ValidationException` (400 Bad Request)
  - `UnauthorizedException` (401 Unauthorized)
  - `ForbiddenException` (403 Forbidden)
  - `NotFoundException` (404 Not Found)
  - `ConflictException` (409 Conflict)

### Criptografía y Seguridad ([`Common/Security/`](../../src/backend/AyVino.Api/Common/Security))
- **`PasswordHasher`**: Implementa PBKDF2 (HMAC-SHA256) con 100,000 iteraciones y una sal criptográfica de 16 bytes generada por `RandomNumberGenerator`. Incorpora la propiedad `DummyHash` para neutralizar ataques de temporización (timing attacks) durante el login.
- **`JwtTokenGenerator`**: Emite JSON Web Tokens firmados con HMAC-SHA256 y claims tipados (`ClaimTypes.NameIdentifier`, `ClaimTypes.Email`, `ClaimTypes.Name`, `ClaimTypes.Role`).
- **Modelo de Autorización `Actor`**: Desacopla la seguridad de la capa HTTP representando la identidad del usuario (`UserId`, `Role`) con métodos utilitarios como `IsAdmin`.
- **Reglas de Acceso `WineryAccessRules`**: Centraliza el control de titularidad (`IsOwner(winery, actor)`), exigiendo permisos de administrador o dueño de bodega aprobada para publicaciones oficiales, reclamos y modificaciones.
- **Bloqueo de Cuentas (Lockout)**: 5 intentos fallidos consecutivos de inicio de sesión bloquean temporalmente la cuenta por 15 minutos en UTC, registrándose en `user_credentials`.

### Constantes de Seguridad ([`Common/Constants/`](../../src/backend/AyVino.Api/Common/Constants))
- **`AppRoles`**: Define los roles canónicos (`Admin`, `User`, `Winery`).
- **`AppPolicies`**: Define las políticas de autorización para Minimal APIs (`RequireAdmin`, `RequireUser`, `RequireWinery`).

---

## 3. Acceso a Datos con Dapper

Para maximizar el rendimiento, reducir la latencia y mantener control total sobre cada sentencia ejecutada, AyVino utiliza **Dapper**:

1. **Configuración de Mapeo**:
   En el arranque de la aplicación (`Program.cs`), se establece:
   ```csharp
   Dapper.DefaultTypeMap.MatchNamesWithUnderscores = true;
   ```
   Esto permite que las columnas en formato `snake_case` de PostgreSQL (ej. `winery_id`, `created_at`, `source_type`) se mapeen automáticamente a propiedades C# en formato `PascalCase` (`WineryId`, `CreatedAt`, `SourceType`).
2. **Consultas SQL Explícitas**:
   Cada repositorio escribe consultas SQL nativas parametrizadas, evitando inyecciones SQL y garantizando un uso óptimo de índices.
3. **Mapeo de Relaciones Complejas (Blends y Cortes)**:
   Las entidades con composición múltiple (como `Wine` y sus `wine_grapes`) se consultan mediante joins eficientes o queries combinadas ejecutadas sobre la misma conexión.

---

## 4. Inyección de Dependencias y Ciclos de Vida

El registro de servicios en `Program.cs` respeta los siguientes alcances:
- **Singleton**: Servicios sin estado (`IDbConnectionFactory`, `IPasswordHasher`, `IJwtTokenGenerator`).
- **Scoped**: Servicios de dominio y repositorios por slice (`IWineService`, `IWineRepository`, `IAuthService`, etc.).
- **HostedService**: `TokenCleanupBackgroundService`, que ejecuta una tarea periódica cada hora para purgar tokens de refresco expirados o revocados hace más de 30 días.

---

## 5. Aislamiento Estricto de Capas (Cero Fuga de DTOs en Persistencia)

Siguiendo el estándar canónico del proyecto (`Users` y `Auth`), la capa de persistencia se encuentra estrictamente desacoplada de los contratos de transporte de la API:

1. **Firmas de Repositorio Puras**:
   Los repositorios (`IWineryRepository`, `IWineRepository`, `IWineVintageRepository`, `ILocationRepository`, etc.) operan **exclusivamente con modelos de dominio (`Models/`) o parámetros escalares/primitivos**. Ninguna interfaz ni implementación de repositorio importa namespaces de DTOs.
2. **Transformación DTO -> Entidad en Capa de Servicio**:
   La conversión de peticiones HTTP a entidades de dominio se realiza dentro de los servicios de aplicación (`Services/`) mediante métodos de extensión puros (`ToEntity(...)`) alojados en `DTOs/*MappingExtensions.cs`.
3. **Proyección y Mapeo de Salida**:
   Las consultas de base de datos leen y reconstruyen entidades o proyecciones relacionales internas (`Location`, `Wine`, `Winery`). Es la capa de servicio quien mapea dichas entidades a contratos de respuesta (`ToResponseDto()`).

---

## 6. Organización de Vertical Slices y Convención de Namespaces

Cada slice funcional en `Features/` mantiene una subdivisión estandarizada de carpetas y namespaces canónicos:

```text
AyVino.Api.Features.<FeatureName>
├── DTOs          # Request/Response records y clases de extensión de mapeo (*MappingExtensions.cs)
├── Endpoints     # Definición y registro de Minimal APIs (*Endpoints.cs)
├── Enums         # Enumeradores y tipos de valor de dominio
├── Models        # Entidades de dominio y registros de persistencia
├── Repositories  # Interfaces (I*Repository.cs) e implementaciones con Dapper (*Repository.cs)
└── Services      # Interfaces (I*Service.cs) e implementaciones de lógica de negocio (*Service.cs)
```

En particular, la funcionalidad territorial (`Features/Locations/`) unifica de manera coherente los agregados de `States`, `Cities` y `Locations` bajo el espacio de nombres común `AyVino.Api.Features.Locations.*`, garantizando cohesión interna e importaciones limpias en `Program.cs`.

---

## 7. Suite de Pruebas Unitarias (`tests/AyVino.UnitTests`)

Cumpliendo con la **Regla 5 de la Constitución de AyVino**, cada servicio y optimización del backend cuenta con su respectiva suite de pruebas automatizadas:

- **Aislamiento sin mocks pesados**: Se emplean fakes en memoria y mocks tipados con `NSubstitute` (`IUserRepository`, `IFollowRepository`, `IUserWineRepository`, `ICellarRepository`, etc.) siguiendo la convención estricta `Metodo_Condicion_Resultado`.
- **Cobertura de Casos de Negocio**:
  - `AuthServiceLockoutTests`: Bloqueo de cuentas por 15 minutos tras 5 intentos fallidos, reseteo tras éxito o cambio de password.
  - `UserServiceTests`: Paginación y validación de límites (`pageNumber > 0`, `pageSize 1-100`).
  - `CityServiceTests`: Paginación con defaults y validación en `GetAllAsync`.
  - `FollowServiceTests`: Auto-follow prohibido (400), duplicados (409), unfollow inexistente (404) y verificación de bodegas aprobadas.
  - `UserWineServiceTests`: Marcas deseadas, probadas y favoritas, idempotencia, invariabilidad de probadas y 404 por vino inexistente.
  - `CellarServiceTests`, `CellarItemServiceTests`, `CellarCareServiceTests`: Aislamiento estricto de propiedad (404), conflicto al borrar cavas con botellas (409), reemplazo de cantidad y consejos de guarda.
  - `WineryServiceTests` y `WineryServiceAuthorizationTests`: Creación, actualización, propiedad y reglas de acceso.
  - `WineServiceTests` y `WineServiceAuthorizationTests`: Mapeo de DTOs complejos, blends, primera cosecha, claim oficial y validaciones.
  - `LocationServiceTests`: Mapeo relacional de `Location` con `City` y `State`.
  - `WineOptimizationTests`: Verificación de batching Dapper contra problemas N+1.
  - `ReviewSecurityTests`: Autorización y segregación de excepciones (403 vs 401).

---

## 8. Cómo correr el e2e

El proyecto cuenta con baterías de pruebas integrales de extremo a extremo (E2E) que se ejecutan directamente contra el backend en funcionamiento (.NET 10 Minimal APIs) y una base de datos PostgreSQL real:

- `tests/e2e/admin-live-test.mjs`: Valida el ciclo completo de administración (moderación de bodegas, cosechas, ciudades, varietales, maridajes, usuarios, métricas de ecosistema y auditoría).
- `src/frontend/tests/e2e/e2e-live-test.mjs`: Valida el flujo institucional de bodegas (registro, aprobación, publicación de etiquetas oficiales y cosechas).

### Variables de Entorno Requeridas

Por motivos de seguridad y portabilidad, los scripts no contienen valores sensibles ni cadenas de conexión hardcodeadas en el código fuente. Se configuran mediante variables de entorno:

| Variable | Tipo | Requerida | Descripción |
| :--- | :--- | :---: | :--- |
| `API_BASE` | URL | Opcional | URL base de la API. Valor por defecto: `http://localhost:5230/api`. |
| `JWT_SECRET` | String | **Sí** | Clave secreta simétrica para firmar y validar tokens JWT. Debe coincidir con `Jwt:SecretKey` del backend. |
| `E2E_DB_CONNECTION` | String | **Sí** (en admin) | Cadena de conexión a PostgreSQL utilizada por `tests/e2e/db-util` para sembrar y limpiar datos de prueba. |
| `ADMIN_EMAIL` | String | Opcional | Email del administrador para la prueba. Si se omite, se genera uno efímero con prefijo `e2e_`. |
| `ADMIN_PASSWORD` | String | Opcional | Contraseña del administrador para la prueba. Si se omite, se utiliza `Password123!`. |
| `E2E_ALLOW_REMOTE` | Booleano | Opcional | Guarda de seguridad. Si es distinto de `true`, el script aborta inmediatamente si `API_BASE` no apunta a `localhost` o `127.0.0.1`. |

> [!NOTE]
> Podés extraer de forma segura los valores de desarrollo configurados en los User Secrets del backend:
> ```bash
> dotnet user-secrets get Jwt:SecretKey --project src/backend/AyVino.Api
> dotnet user-secrets get ConnectionStrings:DefaultConnection --project src/backend/AyVino.Api
> ```

### Herramienta Auxiliar `tests/e2e/db-util`

Para ejecutar sentencias de preparación y saneamiento directo en la base de datos sin requerir dependencias pesadas ni modificar la API, se incluye un proyecto mínimo de consola en .NET (`tests/e2e/db-util/`):
- Lee la conexión exclusivamente desde la variable de entorno `E2E_DB_CONNECTION`.
- Recibe la consulta SQL como argumento y ejecuta de forma segura `ExecuteReader` o `ExecuteNonQuery`.
- Nunca imprime credenciales ni secretos en stdout o stderr.
- Se mantiene excluido de `AyVino.slnx` para no interferir con `dotnet test`.

### Comandos de Ejecución

#### 1. Iniciar la API Backend
En una terminal:
```bash
dotnet run --project src/backend/AyVino.Api
```

#### 2. Ejecutar la Batería E2E del Panel de Administración

**En Linux / macOS (Bash):**
```bash
export API_BASE="http://localhost:5230/api"
export JWT_SECRET="$(dotnet user-secrets get Jwt:SecretKey --project src/backend/AyVino.Api)"
export E2E_DB_CONNECTION="$(dotnet user-secrets get ConnectionStrings:DefaultConnection --project src/backend/AyVino.Api)"

node tests/e2e/admin-live-test.mjs
```

**En Windows (PowerShell):**
```powershell
$env:API_BASE = "http://localhost:5230/api"
$env:JWT_SECRET = (dotnet user-secrets get Jwt:SecretKey --project src/backend/AyVino.Api)
$env:E2E_DB_CONNECTION = (dotnet user-secrets get ConnectionStrings:DefaultConnection --project src/backend/AyVino.Api)

node tests/e2e/admin-live-test.mjs
```

#### 3. Ejecutar la Batería E2E de Bodega

**En Linux / macOS (Bash):**
```bash
export API_BASE="http://localhost:5230/api"
export JWT_SECRET="$(dotnet user-secrets get Jwt:SecretKey --project src/backend/AyVino.Api)"

node src/frontend/tests/e2e/e2e-live-test.mjs
```

**En Windows (PowerShell):**
```powershell
$env:API_BASE = "http://localhost:5230/api"
$env:JWT_SECRET = (dotnet user-secrets get Jwt:SecretKey --project src/backend/AyVino.Api)

node src/frontend/tests/e2e/e2e-live-test.mjs
```

---

## 🔗 Referencias Relacionadas
- [[Arquitectura_Overview]]: Fundamentos globales y decisiones técnicas.
- [[Catalogo_Endpoints_API]]: Detalle exhaustivo de rutas y contratos HTTP.
- [[Base_De_Datos_Migraciones]]: Modelo ERD y tablas PostgreSQL.
- [[Seguridad_Y_Autenticacion]]: Esquema de tokens y autorización `Actor`.
- [[Ciclo_Vida_Vino]]: Lógica de dominación, cortes y claiming.
