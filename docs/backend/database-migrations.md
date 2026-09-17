# Migraciones de Base de Datos - FluentMigrator

En cumplimiento de la constitución del proyecto ([`AGENTS.md`](file:///c:/Codigo%20General/AyVino/AyVino/AGENTS.md)):
> **Base de Datos**: Cambios de esquema estructurados únicamente mediante `FluentMigrator`.

---

## 1. Convenciones y Estructura

Las migraciones residen en [`src/backend/AyVino.Api/Migrations/`](file:///c:/Codigo%20General/AyVino/AyVino/src/backend/AyVino.Api/Migrations) y heredan de `Migration`.

Cada migración cuenta con el atributo `[Migration(version)]` donde la versión sigue el timestamp `YYYYMMDDHHmm` o el orden correlativo definido.

### Migraciones Existentes

1. **`CreateUsersTable`**: Tabla `users` (credenciales, roles: Sommelier/User, Winery, Admin).
2. **`CreateLocationsTable`**: Tabla `locations` (país, provincia, región/departamento).
3. **`CreateGrapesTable`**: Tabla `grapes` (nombre de varietal, tipo de cepa).
4. **`CreateWineriesTable`**: Tabla `wineries` (datos de bodega, estado: Pending/Verified, asociación con usuario).
5. **`CreateRefreshTokensTable`**: Tabla `refresh_tokens` (gestión de tokens de refresco, revocaciones y fecha de expiración).

---

## 2. Ejecución Automática en Arranque

El runner de FluentMigrator se configura en `Program.cs` y ejecuta automáticamente las migraciones pendientes en el arranque de la aplicación:

```csharp
using var scope = app.Services.CreateScope();
var runner = scope.ServiceProvider.GetRequiredService<IMigrationRunner>();
runner.MigrateUp();
```

---

## 3. Pautas para Nuevas Migraciones

- **Siempre implementar `Up()` y `Down()`**: Toda alteración debe ser reversible de forma segura.
- **Evitar DDL manual**: Nunca ejecutar sentencias SQL directas en la base de datos sin su correspondiente migración versionada en C#.
- **Índices y Llaves Foráneas**: Definir explícitamente índices sobre columnas de búsqueda frecuente (ej. `email`, `winery_id`, `grape_id`).

