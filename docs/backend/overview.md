# Arquitectura y Diseño Backend - AyVino.Api

El backend de AyVino está diseñado bajo el patrón **Vertical Slice Architecture (Diseño por Features)** dentro del proyecto [`src/backend/AyVino.Api`](file:///c:/Codigo%20General/AyVino/AyVino/src/backend/AyVino.Api).

---

## 1. ¿Por qué Vertical Slice Architecture?

En arquitecturas tradicionales por capas (Clean / Onion), el código se dispersa horizontalmente en capas técnicas globales (`Controllers`, `Services`, `Repositories` e `Interfaces`). Esto suele provocar:
- Acoplamiento artificial entre casos de uso no relacionados.
- Abstracciones innecesarias para operaciones CRUD simples.
- Dificultad para navegar y modificar una sola funcionalidad.

En AyVino, el código se agrupa por **funcionalidad de negocio** dentro de [`Features/`](file:///c:/Codigo%20General/AyVino/AyVino/src/backend/AyVino.Api/Features). Cada "rebanada vertical" (slice) contiene todo lo necesario para resolver su caso de uso:

```text
Features/
├── Auth/              # Autenticación, Login, Registro, Refresh Tokens
│   ├── DTOs/          # LoginRequestDto, UserResponseDto, etc.
│   ├── Endpoints/     # AuthEndpoints.cs (Minimal API mapping)
│   ├── Models/        # RefreshToken.cs (entidad de base de datos)
│   ├── Repositories/  # RefreshTokenRepository.cs (queries Dapper)
│   └── Services/      # TokenCleanupBackgroundService.cs
├── Wineries/          # Bodegas (oficiales y comunitarias)
├── Users/             # Gestión de perfiles y usuarios
├── Grapes/            # Varietales y cepas
├── Locations/         # Regiones vitivinícolas y terruños
├── Vinos/             # Catálogo de vinos
└── Reviews/           # Reseñas y calificaciones numéricas
```

---

## 2. Infraestructura Transversal ([`Common/`](file:///c:/Codigo%20General/AyVino/AyVino/src/backend/AyVino.Api/Common))

Aquellos componentes técnicos que son verdaderamente compartidos por múltiples slices se ubican en `Common`:

- **Acceso a Base de Datos** ([`Common/Data/`](file:///c:/Codigo%20General/AyVino/AyVino/src/backend/AyVino.Api/Common/Data)):
  - Interfaz [`IDbConnectionFactory`](file:///c:/Codigo%20General/AyVino/AyVino/src/backend/AyVino.Api/Common/Data/IDbConnectionFactory.cs) que provee conexiones asíncronas a PostgreSQL.
  - Implementación [`NpgsqlConnectionFactory`](file:///c:/Codigo%20General/AyVino/AyVino/src/backend/AyVino.Api/Common/Data/NpgsqlConnectionFactory.cs).
- **Manejo Centralizado de Excepciones** ([`Common/Middleware/`](file:///c:/Codigo%20General/AyVino/AyVino/src/backend/AyVino.Api/Common/Middleware)):
  - [`GlobalExceptionHandler`](file:///c:/Codigo%20General/AyVino/AyVino/src/backend/AyVino.Api/Common/Middleware/GlobalExceptionHandler.cs): intercepta excepciones de dominio y las serializa bajo el estándar RFC 7807 (ProblemDetails).
  - Jerarquía de excepciones: `NotFoundException`, `ConflictException`, `ValidationException`, `ForbiddenException`, `UnauthorizedException`.
- **Seguridad y Criptografía** ([`Common/Security/`](file:///c:/Codigo%20General/AyVino/AyVino/src/backend/AyVino.Api/Common/Security)):
  - Generación de JWT tokens con claims tipados (`IJwtTokenGenerator`).
  - Hashing de contraseñas seguro con PBKDF2 (`IPasswordHasher`).

---

## 3. Acceso a Datos con Dapper

Para maximizar el rendimiento y el control de las consultas, se utiliza **Dapper**:
- Cada consulta SQL se escribe explícitamente en el repositorio correspondiente.
- Se aprovechan las capacidades nativas de PostgreSQL (índices, jsonb, agregaciones).
- No hay seguimiento de cambios en memoria (change tracking) innecesario.

