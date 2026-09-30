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
│   ├── DTOs/          # RegisterWineryRequestDto, WineryResponseDto, etc.
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
├── Wines/             # Catálogo de botellas, cortes (blends) y reclamo oficial
│   ├── DTOs/          # CreateWineRequestDto, WineResponseDto, ClaimWinesRequestDto, etc.
│   ├── Endpoints/     # WineEndpoints.cs
│   ├── Enums/         # WineType, WineApprovalStatus, SourceType
│   ├── Models/        # Wine.cs, WineGrape.cs
│   ├── Repositories/  # IWineRepository.cs y WineRepository.cs
│   └── Services/      # IWineService.cs y WineService.cs
│
├── Pairings/          # Maridajes culinarios y asociaciones N:M con etiquetas de vino
│   ├── DTOs/          # CreatePairingRequestDto, PairingResponseDto, etc.
│   ├── Endpoints/     # PairingEndpoints.cs
│   ├── Enums/         # PairingCategory (Carnes, Pastas, Quesos, etc.)
│   ├── Models/        # Pairing.cs, WinePairing.cs
│   ├── Repositories/  # IPairingRepository.cs y PairingRepository.cs
│   └── Services/      # IPairingService.cs y PairingService.cs
│
└── Reviews/           # Módulo reservado para reseñas, notas de cata y calificaciones
    └── .gitkeep
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
