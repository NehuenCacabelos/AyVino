# 🍷 AyVino - Backend Architecture & Development Guidelines

## 1. Stack Tecnológico
- **Framework:** .NET 10 (ASP.NET Core Minimal APIs).
- **Acceso a Datos:** Dapper (Consultas SQL nativas parametrizadas).
- **Enfoque Arquitectural:** Vertical Slice Architecture (organizado por Features/Entidades).
- **Ubicación del Backend:** `src/backend/AyVino.Api/`

---

## 2. Estructura de Directorios por Entidad (Feature)
Cada entidad/módulo debe ser completamente autosuficiente y residir dentro de `src/backend/AyVino.Api/Features/<Entidad>/` con la siguiente distribución interna de carpetas:

```text
src/backend/AyVino.Api/Features/<Entidad>/
├── Models/
│   └── <Entidad>.cs                 # Mapeo 1:1 exacto con la tabla de la base de datos
├── DTOs/
│   ├── <Accion><Entidad>RequestDto.cs   # DTO de entrada (ej: CreateWineRequestDto.cs)
│   ├── <Entidad>ResponseDto.cs         # DTO de salida estándar
│   └── <Entidad>MappingExtensions.cs   # Métodos de extensión para mapeo (Model <-> DTO)
├── Repositories/
│   ├── I<Entidad>Repository.cs      # Interfaz de acceso a datos
│   └── <Entidad>Repository.cs       # Implementación Dapper con IDbConnectionFactory
├── Services/
│   ├── I<Entidad>Service.cs         # Interfaz de lógica de negocio/orquestación
│   └── <Entidad>Service.cs          # Implementación del servicio
└── Endpoints/
    └── <Entidad>Endpoints.cs        # Definición de Minimal APIs con MapGroup
```

---

## 3. Reglas de Componentes y Responsabilidades

### A. Modelos (Models/<Entidad>.cs)
- Mapean exactamente 1:1 las columnas de la tabla en base de datos.
- Se definen preferentemente como `public class` o `public record` con propiedades coincidentes en tipo y nulabilidad con SQL.

### B. DTOs y Mapeo (DTOs/)
- Todos los DTOs deben ser `public record` inmutables.
- Convención de nombres estricta:
  - Entrada: `<Accion><Entidad>RequestDto` (ej: `CreateWineRequestDto`, `UpdateWineRequestDto`).
  - Salida: `<Entidad>ResponseDto` o `<Entidad>SummaryResponseDto`.
- **MappingExtensions:** Todo el mapeo debe realizarse mediante métodos de extensión estáticos puros en `<Entidad>MappingExtensions.cs` (ej: `dto.ToEntity()`, `entity.ToResponseDto()`). Prohibido usar AutoMapper o lógica de mapeo dentro de los endpoints.

### C. Repositorio (Repositories/)
- `I<Entidad>Repository`: Define operaciones CRUD y consultas directas en términos de entidades o tipos primitivos.
- `<Entidad>Repository`:
  - Recibe `IDbConnectionFactory` por constructor.
  - Ejecuta consultas SQL exclusivamente parametrizadas (`@Param`) para prevenir SQL Injection.
  - Retorna entidades de dominio o valores primitivos (nunca DTOs de presentación).

### D. Servicio (Services/)
- `I<Entidad>Service`: Expone métodos orientados al caso de uso (trabaja con DTOs de entrada y salida).
- `<Entidad>Service`:
  - Recibe `I<Entidad>Repository` por inyección de dependencias.
  - Aplica validaciones de negocio, orquesta llamadas al repositorio y ejecuta los mapeos mediante `MappingExtensions`.

### E. Endpoints (Endpoints/)
- Clase estática con método de extensión: `public static IEndpointRouteBuilder Map<Entidad>Endpoints(this IEndpointRouteBuilder app)`.
- Usa `app.MapGroup("/api/<entidades>")`.
- Inyecta únicamente `I<Entidad>Service` (no repositorios directos).
- Responsabilidad exclusiva: recibir request, invocar el servicio y retornar `Results.Ok()`, `Results.Created()`, `Results.NotFound()`, etc.

---

## 4. Inyección de Dependencias (DI)
- Todos los servicios y repositorios deben registrarse en el contenedor de DI de .NET:
  - Repositorios: `builder.Services.AddScoped<I<Entidad>Repository, <Entidad>Repository>();`
  - Servicios: `builder.Services.AddScoped<I<Entidad>Service, <Entidad>Service>();`
- `Program.cs` debe mantenerse minimalista: solo registrar DI, middlewares globales y llamar a `app.Map<Entidad>Endpoints()`.

---

## 5. Reglas Generales de Código
- Usar C# 13 / .NET 10 idioms (collection expressions `[]`, primary constructors donde sea legible, raw string literals `"""` para SQL).
- Manejo asíncrono estricto (`async`/`await` con `Task<T>`) en todas las capas de I/O.
- Nunca usar Controllers (`[ApiController]`).
