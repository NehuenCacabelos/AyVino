# Migraciones de Base de Datos - FluentMigrator

En cumplimiento de la constitución del proyecto ([`AGENTS.md`](../../AGENTS.md)):
> **Base de Datos**: Cambios de esquema estructurados únicamente mediante `FluentMigrator`.

---

## 1. Convenciones y Estructura

Las migraciones residen en [`src/backend/AyVino.Api/Migrations/`](../../src/backend/AyVino.Api/Migrations) y heredan de la clase base `Migration` de FluentMigrator.

Cada clase está decorada con el atributo `[Migration(version)]` donde la versión sigue el timestamp `YYYYMMDDNNN`. Toda migración es estrictamente bidireccional, implementando tanto `Up()` (aplicar cambios) como `Down()` (revertir cambios con eliminación ordenada de claves foráneas e índices).

---

## 2. Catálogo Completo de Migraciones

| Versión | Archivo de Migración | Tablas / Objetos Afectados | Descripción y Reglas de Negocio |
| :--- | :--- | :--- | :--- |
| `20260809001` | `CreateStatesTable.cs` | `states` | Tabla base para provincias argentinas (id, name). |
| `20260809002` | `SeedStates.cs` | `states` | Carga inicial (seed) de las 24 jurisdicciones de Argentina (Mendoza, San Juan, Salta, Río Negro, La Rioja, etc.). |
| `20260809003` | `CreateCitiesTable.cs` | `cities` | Ciudades y departamentos vitivinícolas con clave foránea a `states` y estado de moderación (`status`). |
| `20260809004` | `CreateLocationsTable.cs` | `locations` | Terruños y zonas específicas de producción con clave foránea a `cities`. |
| `20260829001` | `CreateUsersTable.cs` | `users`, `user_credentials` | Creación de perfiles de usuario (roles: `User`, `Winery`, `Admin`) y credenciales desacopladas (hash PBKDF2, intentos fallidos y bloqueo temporal). |
| `20260829003` | `CreateWineriesTable.cs` | `wineries` | Catálogo de bodegas con estado (`Pending`, `Approved`, `Rejected`) y relación nullable `user_id` con `users` (soporta bodegas comunitarias sin dueño y bodegas oficiales). |
| `20260829004` | `CreateGrapesTable.cs` | `grapes` | Variedades de uva y cepas con tipado por color (`color_type`: Tinto, Blanco, Rosado). |
| `20260830001` | `CreateRefreshTokensTable.cs` | `refresh_tokens` | Almacenamiento seguro de tokens de refresco, tracking de IP de creación/revocación, enlace de rotación (`replaced_by_token`) y auditoría. |
| `20260830002` | `CreateWinesTable.cs` | `wines`, `wine_vintages`, `wine_grapes` | Catálogo de etiquetas base (`wines`), cosechas anuales (`wine_vintages` con constraint de unicidad `UQ_WineVintages_WineId_Year` NULLS NOT DISTINCT) y composición varietal (`wine_grapes` con `CK_WineGrapes_Percentage`). |
| `20260919001` | `CreatePairingsTable.cs` | `pairings`, `wine_pairings` | Catálogo de maridajes culinarios clasificados por categoría y tabla intermedia de asociación N:M `wine_pairings` con eliminación en cascada. |
| `20260929001` | `CreateReviewsTable.cs` | `reviews` | Reseñas y calificaciones (1 a 5 estrellas) emitidas por usuarios sobre cosechas específicas (`wine_vintages`), con restricción de unicidad (`uq_reviews_user_wine_vintage`) y cascade rollup. |
| `20260929003` | `CreateFollowTables.cs` | `user_follows`, `winery_follows` | Seguimiento social: usuarios siguen a otros usuarios y a bodegas aprobadas, con timestamps y claves compuestas. |
| `20261004001` | `CreateUserWinesTable.cs` | `user_wines` | Marcas personales sobre vinos (`is_wanted`, `is_tried`, `is_favorite`) con constraint de existencia de al menos una marca. |
| `20261005002` | `EnablePgTrgm.cs` | Extensión PostgreSQL | Habilita `pg_trgm` y crea índices trigram (GIN/GiST) para búsqueda difusa en vinos y bodegas. |
| `20261005003` | `CreateCellarsTables.cs` | `cellars`, `cellar_items` | Cavas personales del usuario (`cellars`) y botellas/cosechas almacenadas en cada cava (`cellar_items`). |
| `20261022001` | `AddGeorefIdToStatesAndCities.cs` | `states`, `cities` | Códigos Georef oficiales para las 24 provincias argentinas e índice único para `georef_id` en departamentos. |
| `20261022002` | `SeedDepartmentsAndLocations.cs` | `cities`, `locations` | Carga inicial de los 529 departamentos oficiales argentinos y generación de filas en `locations`. |
| `20261022003` | `AddCoordinatesToWineries.cs` | `wineries` | Coordenadas geográficas (`latitude`, `longitude`, decimal(10, 7) nullable) para geolocalización de bodegas. |
| `20261022004` | `SeedGrapes.cs` | `grapes` | Catálogo de 35 varietales tradicionales argentinos con tipado por color (tintas, blancas, rosadas). |

---

## 3. Diagrama Entidad-Relación (ERD)

```mermaid
erDiagram
    USERS ||--o| USER_CREDENTIALS : "tiene credenciales"
    USERS ||--o{ REFRESH_TOKENS : "posee sesiones"
    USERS ||--o{ WINERIES : "administra (opcional)"
    USERS ||--o{ WINE_VINTAGES : "sube cosechas"
    USERS ||--o{ REVIEWS : "escribe"
    USERS ||--o{ USER_FOLLOWS : "sigue a usuarios"
    USERS ||--o{ WINERY_FOLLOWS : "sigue a bodegas"
    WINERIES ||--o{ WINERY_FOLLOWS : "recibe seguidores"
    USERS ||--o{ USER_WINES : "marca estado"
    WINES ||--o{ USER_WINES : "marcado por"
    USERS ||--o{ CELLARS : "posee"
    CELLARS ||--o{ CELLAR_ITEMS : "almacena botellas"
    WINE_VINTAGES ||--o{ CELLAR_ITEMS : "guardado en"

    STATES ||--o{ CITIES : "contiene"
    CITIES ||--o{ LOCATIONS : "alberga terruños"
    LOCATIONS ||--o{ WINERIES : "ubicación física"
    LOCATIONS ||--o{ WINES : "origen geográfico"

    WINERIES ||--o{ WINES : "produce botellas oficiales"
    
    WINES ||--o{ WINE_VINTAGES : "posee añadas"
    WINE_VINTAGES ||--o{ WINE_GRAPES : "compuesto por"
    GRAPES ||--o{ WINE_GRAPES : "participa en corte"

    WINES ||--o{ WINE_PAIRINGS : "recomienda"
    PAIRINGS ||--o{ WINE_PAIRINGS : "asociado a"

    WINES ||--o| WINES : "es duplicado de (self-FK)"

    WINE_VINTAGES ||--o{ REVIEWS : "recibe"

    USERS {
        int id PK
        string email UK
        string username UK
        string role
        string bio
        string photo_url
        boolean is_active
        datetime created_at
    }

    USER_CREDENTIALS {
        int user_id PK, FK
        string password_hash
        datetime last_password_change
        int failed_login_attempts
        datetime blocked_until
    }

    REFRESH_TOKENS {
        int id PK
        int user_id FK
        string token UK
        datetime expires_at
        datetime created_at
        string created_by_ip
        datetime revoked_at
        string revoked_by_ip
        string replaced_by_token
    }

    WINERIES {
        int id PK
        int user_id FK "nullable"
        string name
        string description
        int location_id FK
        string address
        string website_url
        string email
        string phone
        int status "Pending/Approved/Rejected"
    }

    WINES {
        int id PK
        int winery_id FK "nullable"
        string name
        string description
        int wine_type
        int location_id FK "nullable"
        string winery_name_text "nullable"
        int source_type "1=Community, 2=Official"
        int duplicate_of_wine_id FK "nullable"
        int rating_sum
        int review_count
    }

    WINE_VINTAGES {
        int id PK
        int wine_id FK
        int year "nullable"
        decimal alcohol_content "nullable"
        int serving_temperature "nullable"
        string aging_advice
        string image_url
        int approval_status
        int uploaded_by_user_id FK
        datetime register_date
        int rating_sum
        int review_count
    }

    WINE_GRAPES {
        int wine_vintage_id PK, FK
        int grape_id PK, FK
        decimal percentage "1.00 a 100.00"
    }

    PAIRINGS {
        int id PK
        string name
        int category
    }

    WINE_PAIRINGS {
        int wine_id PK, FK
        int pairing_id PK, FK
    }

    REVIEWS {
        int id PK
        int user_id FK
        int wine_vintage_id FK
        int rating "1 a 5"
        string comment
        datetime created_at
        datetime updated_at
    }

    USER_FOLLOWS {
        int follower_id PK, FK
        int followed_user_id PK, FK
        datetime created_at
    }

    WINERY_FOLLOWS {
        int user_id PK, FK
        int winery_id PK, FK
        datetime created_at
    }

    USER_WINES {
        int user_id PK, FK
        int wine_id PK, FK
        boolean is_wanted
        boolean is_tried
        boolean is_favorite
        datetime created_at
        datetime updated_at
    }

    CELLARS {
        int id PK
        int user_id FK
        string name
        datetime created_at
    }

    CELLAR_ITEMS {
        int cellar_id PK, FK
        int wine_vintage_id PK, FK
        int quantity
        date purchase_date
        string notes
        datetime created_at
        datetime updated_at
    }
```

---

## 4. Ejecución y Ciclo de Vida en Arranque

FluentMigrator se ejecuta automáticamente al iniciar la API en `Program.cs`:

```csharp
using (var scope = app.Services.CreateScope())
{
    var runner = scope.ServiceProvider.GetRequiredService<IMigrationRunner>();
    try {
        runner.MigrateUp();
    }
    catch (Exception ex)
    {
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
        logger.LogCritical(ex, "Error crítico durante la ejecución de las migraciones de base de datos.");
        throw;
    }
}
```

### Reglas para Nuevas Migraciones

1. **Nunca alterar migraciones ya aplicadas**: Si se requiere un cambio sobre una tabla existente, crear una nueva clase de migración con versión incremental.
2. **Reversibilidad total**: Todo método `Up()` debe tener su contraparte exacta en `Down()` eliminando foreign keys, índices y constraints antes de borrar tablas.
3. **Restricciones e Índices Explícitos**: Agregar siempre índices sobre columnas utilizadas en cláusulas `WHERE` o `JOIN` (ej: `winery_id`, `location_id`, `winery_name_text`).
