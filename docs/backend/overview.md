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
└── Reviews/           # Reseñas por cosecha y etiqueta con cálculo ponderado y cascade rollup
    ├── DTOs/          # CreateReviewRequestDto, ReviewResponseDto, UpdateReviewRequestDto, etc.
    ├── Endpoints/     # ReviewEndpoints.cs
    ├── Models/        # Review.cs
    ├── Repositories/  # IReviewRepository.cs y ReviewRepository.cs
    └── Services/      # IReviewService.cs y ReviewService.cs
```

---

## 2. Infraestructura Transversal ([`Common/`](../../src/backend/AyVino.Api/Common))

Aquellos aspectos técnicos requeridos transversalmente por múltiples slices se centralizan de forma minimalista en la carpeta `Common`:

### Acceso a Base de Datos ([`Common/Data/`](../../src/backend/AyVino.Api/Common/Data))
- **`IDbConnectionFactory`**: Interfaz asíncrona y síncrona para obtener conexiones físicas a PostgreSQL.
- **`NpgsqlConnectionFactory`**: Implementación basada en `NpgsqlConnection` que inyecta la cadena de conexión configurada en `appsettings.json`.

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

- **Aislamiento sin mocks pesados**: Se emplean fakes en memoria (`FakeWineRepository`, `FakeWineryRepository`, `FakeLocationRepository`, `FakeGrapeRepository`, `FakeReviewRepository`) que implementan las interfaces canónicas del dominio.
- **Cobertura de Casos de Negocio**:
  - `WineryServiceTests`: Pruebas de registro de bodegas, creación comunitaria, actualización de perfil, validaciones de negocio y no existencia.
  - `WineServiceTests`: Mapeo de DTOs complejos (cortes/uvas y primera añada) hacia entidades de dominio, validaciones de claves foráneas (`WineryId`, `LocationId`), parsing de `WineType` y flujos de actualización.
  - `LocationServiceTests`: Mapeo relacional de `Location` con `City` y `State`, validaciones de terruño y ciclo de consultas.
  - `WineOptimizationTests`: Verificación de batching Dapper contra problemas N+1 (`GetByIdsAsync` y `GetGrapesByVintageIdsBatchAsync`).
  - `ReviewSecurityTests`: Verificación de límites de autorización y segregación de excepciones (`ForbiddenException` 403 vs `UnauthorizedException` 401).

