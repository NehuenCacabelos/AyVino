# Flujos de Datos y Secuencia del Sistema - AyVino

Este documento detalla los flujos de datos críticos de AyVino, ilustrando las interacciones entre el cliente SPA, la capa de endpoints, los servicios de dominio, la base de datos PostgreSQL y los componentes transversales.

---

## 1. Flujo de Autenticación y Rotación Segura de Tokens

El sistema utiliza un esquema de autenticación stateless con **Access Tokens JWT** (vida útil: 2 horas) y **Refresh Tokens criptográficos opacos** (vida útil: 7 días) almacenados en PostgreSQL.

### Diagrama de Secuencia: Login y Refresco con Rotación

```mermaid
sequenceDiagram
    autonumber
    actor U as Usuario / Cliente SPA
    participant RL as RateLimiter ("AuthLimit")
    participant EP as AuthEndpoints (/api/auth)
    participant AS as AuthService
    participant PH as PasswordHasher (PBKDF2)
    participant JWT as JwtTokenGenerator
    participant DB as PostgreSQL (users, refresh_tokens)

    %% Inicio de Sesión
    Note over U,DB: 1. Inicio de Sesión (Login)
    U->>RL: POST /api/auth/login (Email, Password)
    RL->>EP: Petición permitida (< 15 req/min)
    EP->>AS: LoginAsync(request, clientIp)
    AS->>DB: GetUserWithCredentialsByEmailAsync(email)
    DB-->>AS: Retorna (User, UserCredential) o null
    alt Usuario no existe o inactivo
        AS->>PH: VerifyPassword(Password, DummyHash)
        Note right of AS: Mitigación de timing attack
        AS-->>EP: Lanza UnauthorizedException (401)
    else Credenciales válidas
        AS->>PH: VerifyPassword(Password, PasswordHash)
        AS->>JWT: GenerateToken(user)
        JWT-->>AS: AccessToken (expira en 120m)
        AS->>AS: GenerateSecureRefreshToken() (32 bytes crypto)
        AS->>DB: SaveRefreshTokenAsync(Token, UserId, ExpiresAt, clientIp)
        AS-->>EP: LoginResponseDto (AccessToken, RefreshToken, User)
        EP-->>U: 200 OK con payload de autenticación
    end

    %% Rotación de Token
    Note over U,DB: 2. Renovación de Sesión con Rotación (Token Refresh)
    U->>RL: POST /api/auth/refresh (RefreshToken)
    RL->>EP: Petición permitida
    EP->>AS: RefreshAsync(request, clientIp)
    AS->>DB: GetByTokenAsync(refreshToken)
    DB-->>AS: Retorna RefreshToken entity

    alt Token ya revocado o reemplazado (Detección de Robo / Reuso)
        AS->>DB: RevokeAllUserTokensAsync(userId, clientIp)
        Note right of AS: Compromiso detectado: revoca toda la familia
        AS-->>EP: Lanza UnauthorizedException (401)
    else Token válido y no expirado
        AS->>JWT: GenerateToken(user)
        AS->>AS: GenerateSecureRefreshToken() (nuevo par)
        AS->>DB: SaveRefreshTokenAsync(newRefreshToken)
        AS->>DB: UpdateRefreshTokenAsync(oldToken: RevokedAt, ReplacedByToken)
        AS-->>EP: RefreshResponseDto (NewAccessToken, NewRefreshToken)
        EP-->>U: 200 OK con tokens renovados
    end
```

---

## 2. Flujo de Ciclo de Vida y Reclamo de Vinos (Claim Process)

Este flujo materializa los requisitos funcionales **RF-1.1**, **RF-1.3**, **RF-1.4** y **RF-1.5** ([`spec.md`](../requirements/spec.md)), permitiendo que la comunidad suba botellas y que las bodegas oficiales las adopten formalmente.

```mermaid
sequenceDiagram
    autonumber
    actor Community as Usuario de la Comunidad
    actor Winery as Bodega Oficial
    participant API as WineEndpoints / WineService
    participant DB as PostgreSQL (wines, wineries, wine_grapes)

    %% Paso 1: Carga comunitaria
    Note over Community,DB: Fase 1: Carga de Vino por la Comunidad
    Community->>API: POST /api/wines (Name: "Gran Corte 2021", WineryId: null, WineryNameText: "Bodega Los Andes")
    API->>API: ValidateAndParseAsync()
    Note right of API: WineryId es null -> SourceType = Community (1)<br/>ApprovalStatus = Pending (0)
    API->>DB: INSERT INTO wines (source_type = 1, winery_name_text = 'Bodega Los Andes', ...)
    DB-->>API: Wine ID = 101
    API-->>Community: 201 Created (Vino marcado como "Agregado por la comunidad")

    %% Paso 2: Bodega se registra y busca candidatos
    Note over Winery,DB: Fase 2: Bodega Oficial busca vinos candidatos
    Winery->>API: GET /api/wines/claim-candidates/{wineryId} (con Token de Bodega)
    API->>DB: SELECT * FROM wines WHERE winery_id IS NULL AND LOWER(winery_name_text) LIKE LOWER(winery.name)
    DB-->>API: Retorna [Wine ID 101, Wine ID 104, ...]
    API-->>Winery: 200 OK con listado de candidatos a reclamar

    %% Paso 3: Reclamo y adopción oficial
    Note over Winery,DB: Fase 3: Adopción y Reclamo Oficial (Claim)
    Winery->>API: POST /api/wines/claim/{wineryId} { WineIds: [101] }
    API->>DB: UPDATE wines SET winery_id = @wineryId, source_type = 2 (Official) WHERE id IN (101)
    DB-->>API: Actualización exitosa
    API-->>Winery: 200 OK con los vinos adoptados y certificados
```

---

## 3. Flujo de Asociación Vino-Maridaje

El módulo de maridajes ([`Pairings`](../backend/overview.md)) utiliza una relación N:M mediante la tabla intermedia `wine_pairings` con integridad referencial en cascada.

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Sommelier / Administrador
    participant EP as PairingEndpoints
    participant SVC as PairingService
    participant DB as PostgreSQL (pairings, wine_pairings, wines)

    Note over Admin,DB: Asociación de Maridaje Recomendado
    Admin->>EP: POST /api/wines/{wineId}/pairings/{pairingId}
    EP->>SVC: AddToWineAsync(wineId, pairingId)
    SVC->>DB: ExistsByIdAsync(wineId) & ExistsByIdAsync(pairingId)
    DB-->>SVC: Ambos existen
    SVC->>DB: IsAssociatedAsync(wineId, pairingId)
    alt Ya se encuentra asociado
        SVC-->>EP: Lanza ConflictException (409)
    else No asociado previamente
        SVC->>DB: INSERT INTO wine_pairings (wine_id, pairing_id)
        DB-->>SVC: Inserción confirmada
        SVC-->>EP: Completado
        EP-->>Admin: 204 NoContent
    end
```

---

## 4. Flujo de Manejo Global de Excepciones (RFC 7807)

Todas las excepciones lanzadas en cualquier rebanada vertical son interceptadas por el `GlobalExceptionHandler`, garantizando respuestas homogéneas en formato `application/problem+json`:

```mermaid
sequenceDiagram
    autonumber
    actor Client as Cliente HTTP / SPA
    participant Pipeline as ASP.NET Core Pipeline
    participant Handler as GlobalExceptionHandler
    participant Logger as ILogger<GlobalExceptionHandler>

    Client->>Pipeline: Petición HTTP
    Pipeline->>Pipeline: Procesamiento en Endpoint / Service
    Note over Pipeline: Se lanza una excepción (ej: NotFoundException)
    Pipeline->>Handler: TryHandleAsync(httpContext, exception)
    alt Excepción de Dominio (AppException: 400, 401, 403, 404, 409)
        Handler->>Logger: LogWarning("Excepción de dominio {StatusCode} en {Path}")
        Handler->>Client: 4xx ProblemDetails (Status, Title, Detail, Instance, TraceId)
    else Excepción no controlada (500)
        Handler->>Logger: LogError(exception, "Excepción no controlada en {Path}")
        Handler->>Client: 500 ProblemDetails ("Error interno del servidor", TraceId)
    end
```

