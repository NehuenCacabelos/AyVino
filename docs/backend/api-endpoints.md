# Catálogo de Endpoints API - AyVino.Api

Este documento detalla exhaustivamente las rutas HTTP expuestas por el backend de AyVino mediante **Minimal APIs** en .NET 10. Cada endpoint se encuentra estructurado bajo su correspondiente **Vertical Slice**.

---

## Validación de Entrada

El backend implementa validación nativa de Minimal APIs en .NET 10 (`AddValidation()`) mediante Data Annotations (`[Required]`, `[StringLength]`, `[Range]`, `[EmailAddress]`, `[Url]`, `[EnumDataType]`, `[MaxLength]`, `[MinLength]`). La validación se ejecuta en la capa de transporte HTTP previa a la ejecución de los servicios, garantizando respuestas uniformes y consistentes bajo el estándar RFC 7807 (ProblemDetails).

### Contrato de Serialización JSON y Fechas (Enums y DateOnly)

- **Enums en JSON**:
  - Los enums se envían y reciben como texto (`string`) en las respuestas y solicitudes JSON con sus identificadores válidos (por ejemplo `"Red"`, `"White"`, `"Rose"`, `"Orange"` para `ColorType`, o valores textuales para `TypicalBody`, `TypicalTannins`, `TypicalAcidity` y `PairingCategory`).
  - Para retrocompatibilidad y flexibilidad en clientes, los valores numéricos subyacentes (por ejemplo `1` para `Red`, `2` para `White`, etc.) siguen siendo aceptados de forma válida en los payloads entrantes.
  - Los valores de texto inexistentes o mal tipados son rechazados durante la deserialización JSON devolviendo `400 Bad Request`.
  - Los valores numéricos fuera de los definidos en el enum son rechazados por la validación de modelo mediante `[EnumDataType]`, devolviendo `400 Bad Request` con su mensaje específico en español.

- **DateOnly en JSON**:
  - Las propiedades de tipo `DateOnly` (como `PurchaseDate` en los ítems de cava) se serializan y reciben bajo el formato ISO-8601 estándar: `"yyyy-MM-dd"` (ejemplo: `"2026-05-15"`).

> **Aclaración sobre parámetros de consulta (Query Params):** Los parámetros de consulta (`pageNumber`, `pageSize`, filtros como `wineType`, `year`, etc.) se validan dentro de la capa de servicios (`Services/`) como parte de las reglas de negocio de cada caso de uso.

### Formato de Respuesta 400 de Validación

Todas las respuestas de validación fallidas devuelven código HTTP `400 Bad Request`, `Content-Type: application/problem+json` y el siguiente esquema:

```json
{
  "type": "https://tools.ietf.org/html/rfc9110#section-15.5.1",
  "title": "Error de validación",
  "status": 400,
  "detail": "El año de la cosecha debe estar entre 1800 y 2100.",
  "errors": {
    "FirstVintage.Year": [
      "El año de la cosecha debe estar entre 1800 y 2100."
    ]
  },
  "traceId": "00-5554fdfd120d8a32c00abf0f133b7de1-14b4e6712094a7d3-00"
}
```

### Reglas de Validación por Recurso y DTO

| Recurso | DTO | Campo | Reglas y Restricciones | Mensaje de Error |
| :--- | :--- | :--- | :--- | :--- |
| **Auth** | `LoginRequestDto` | `Email` | `[Required]`, `[StringLength(100)]` | "El correo electrónico es obligatorio." / "El correo electrónico no puede superar los 100 caracteres." |
| | | `Password` | `[Required]`, `[StringLength(128)]` | "La contraseña es obligatoria." / "La contraseña no puede superar los 128 caracteres." |
| | `RefreshRequestDto` | `RefreshToken` | `[Required]`, `[StringLength(500)]` | "El token de refresco es obligatorio." / "El token de refresco no puede superar los 500 caracteres." |
| | `RevokeTokenRequestDto` | `RefreshToken` | `[Required]`, `[StringLength(500)]` | "El token de refresco es obligatorio." / "El token de refresco no puede superar los 500 caracteres." |
| | `ChangePasswordRequestDto` | `CurrentPassword` | `[Required]`, `[StringLength(128)]` | "La contraseña actual es obligatoria." / "La contraseña actual no puede superar los 128 caracteres." |
| | | `NewPassword` | `[Required]`, `[StringLength(128, Min=8)]` | "La nueva contraseña es obligatoria." / "La nueva contraseña debe tener entre 8 y 128 caracteres." |
| **Users** | `CreateUserRequestDto` | `Username` | `[Required]`, `[StringLength(100)]` | "El nombre de usuario es obligatorio." / "El nombre de usuario no puede superar los 100 caracteres." |
| | | `Email` | `[Required]`, `[EmailAddress]`, `[StringLength(100)]` | "El correo electrónico es obligatorio." / "El formato del correo electrónico no es válido." / "El correo electrónico no puede superar los 100 caracteres." |
| | | `Password` | `[Required]`, `[StringLength(128, Min=8)]` | "La contraseña es obligatoria." / "La contraseña debe tener entre 8 y 128 caracteres." |
| | | `Role` | `[StringLength(100)]` | "El rol no puede superar los 100 caracteres." |
| | | `Bio` | `[StringLength(1000)]` | "La biografía no puede superar los 1000 caracteres." |
| | | `Photo` | `[StringLength(100)]` | "La foto no puede superar los 100 caracteres." |
| | `RegisterUserRequestDto` | Campos idénticos a `CreateUserRequestDto` excepto `Role`. | | |
| | `UpdateUserProfileRequestDto`| `Username` | `[Required]`, `[StringLength(100)]` | "El nombre de usuario es obligatorio." / "El nombre de usuario no puede superar los 100 caracteres." |
| | | `Bio`, `Photo` | `[StringLength(1000)]`, `[StringLength(100)]` | "La biografía no puede superar los 1000 caracteres." / "La foto no puede superar los 100 caracteres." |
| | `ChangeUserStatusRequestDto` | `IsActive` | Tipo `bool` primitivo (sin anotaciones requeridas). | - |
| **Wineries** | `CreateWineryRequestDto` / `UpdateWineryRequestDto` | `Name` | `[Required]`, `[StringLength(100)]` | "El nombre de la bodega es obligatorio." / "El nombre de la bodega no puede superar los 100 caracteres." |
| | | `Latitude` / `Longitude` | Coordenadas decimales opcionales | Mutuamente excluyente con `LocationId`. Se resuelven con Georef. |
| | | `LocationId` | `[Range(1, int.MaxValue)]` | "El id de la ubicación debe ser mayor a 0." |
| | | `Description` | `[StringLength(1000)]` | "La descripción no puede superar los 1000 caracteres." |
| | | `FoundationYear` | `[Range(1000, 2100)]` | "El año de fundación debe estar entre 1000 y 2100." |
| | | `Website` | `[Url]`, `[StringLength(200)]` | "El sitio web debe ser una URL válida." / "El sitio web no puede superar los 200 caracteres." |
| | | `LogoUrl` | `[Url]`, `[StringLength(500)]` | "La URL del logo no puede superar los 500 caracteres." Si se proporciona y Supabase Storage está activo, debe pertenecer al bucket oficial. |
| | `RegisterWineryRequestDto` | Campos de usuario (`Username`, `Email`, `Password`) + campos de bodega (`WineryName`, `LocationId`, etc.). | | |
| | `ChangeWineryStatusRequestDto` | `Status` | `[Required]`, `[StringLength(20)]` | "El estado es obligatorio." / "El estado no puede superar los 20 caracteres." |
| **Locations**| `CreateCityRequestDto` | `Name` | `[Required]`, `[StringLength(100)]` | "El nombre de la ciudad es obligatorio." / "El nombre de la ciudad no puede superar los 100 caracteres." |
| | | `StateId` | `[Range(1, int.MaxValue)]` | "El id de la provincia debe ser mayor a 0." |
| | `CreateLocationRequestDto` | `CityId` | `[Range(1, int.MaxValue)]` | "El id de la ciudad debe ser mayor a 0." |
| | `UpdateCityStatusRequestDto`| `Status` | `[Required]`, `[StringLength(20)]` | "El estado es obligatorio." / "El estado no puede superar los 20 caracteres." |
| **Grapes** | `CreateGrapeRequestDto` / `UpdateGrapeRequestDto` | `Name` | `[Required]`, `[StringLength(100)]` | "El nombre de la uva es obligatorio." / "El nombre de la uva no puede superar los 100 caracteres." |
| | | `ColorType` | `[EnumDataType(typeof(ColorType))]` | "El tipo de color no es válido." |
| | | `TypicalBody` | `[EnumDataType(typeof(TypicalBody))]` (nullable) | "El cuerpo típico no es válido." |
| | | `TypicalTannins` | `[EnumDataType(typeof(TypicalTannins))]` (nullable) | "Los taninos típicos no son válidos." |
| | | `TypicalAcidity` | `[EnumDataType(typeof(TypicalAcidity))]` (nullable) | "La acidez típica no es válida." |
| | | `Description` | `[StringLength(1000)]` | "La descripción no puede superar los 1000 caracteres." |
| **Pairings** | `CreatePairingRequestDto` / `UpdatePairingRequestDto` | `Name` | `[Required]`, `[StringLength(100)]` | "El nombre del maridaje es obligatorio." / "El nombre del maridaje no puede superar los 100 caracteres." |
| | | `Category` | `[EnumDataType(typeof(PairingCategory))]` | "La categoría no es válida." |
| **Wines** | `CreateWineRequestDto` | `Name` | `[Required]`, `[StringLength(150)]` | "El nombre del vino es obligatorio." / "El nombre del vino no puede superar los 150 caracteres." |
| | | `WineType` | `[Required]`, `[StringLength(30)]` | "El tipo de vino es obligatorio." / "El tipo de vino no puede superar los 30 caracteres." |
| | | `FirstVintage` | `[Required]` (valida anidado recursivo) | "La primera cosecha es obligatoria." |
| | | `WineryId`, `LocationId` | `[Range(1, int.MaxValue)]` (nullable) | "El id de la bodega/ubicación debe ser mayor a 0." |
| | | `WineryNameText`, `Description` | `[StringLength(150)]`, `[StringLength(1000)]` | "El nombre de la bodega... no puede superar los 150/1000 caracteres." |
| | `UpdateWineRequestDto` | Igual a `CreateWineRequestDto` sin `FirstVintage`. | | |
| | `CreateWineVintageRequestDto` / `UpdateWineVintageRequestDto` | `Year` | `[Range(1800, 2100)]` | "El año de la cosecha debe estar entre 1800 y 2100." |
| | | `AlcoholContent` | `[Range(0.0, 99.99)]` | "El contenido de alcohol debe estar entre 0 y 99.99." |
| | | `ServingTemperature`| `[Range(0, 30)]` | "La temperatura de servicio debe estar entre 0 y 30 °C." |
| | | `AgingAdvice` | `[StringLength(500)]` | "El consejo de guarda no puede superar los 500 caracteres." |
| | | `ImageUrl` | `[Url]`, `[StringLength(300)]` | "La imagen debe ser una URL válida." / "La URL de la imagen no puede superar los 300 caracteres." Si se proporciona y Supabase Storage está activo, debe pertenecer al bucket oficial. |
| | | `Grapes` | `[MaxLength(20)]` (valida items recursivos) | "Una cosecha no puede tener más de 20 uvas." |
| | `WineGrapeRequestDto` | `GrapeId` | `[Range(1, int.MaxValue)]` | "El id de la uva debe ser mayor a 0." |
| | | `Percentage` | `[Range(0.01, 100.0)]` | "El porcentaje debe estar entre 0.01 y 100." |
| | `ChangeWineVintageStatusRequestDto` | `Status` | `[Required]`, `[StringLength(20)]` | "El estado es obligatorio." / "El estado no puede superar los 20 caracteres." |
| | `ClaimWinesRequestDto` | `WineIds` | `[Required]`, `[MinLength(1)]` | "La lista de vinos es obligatoria." / "Debe indicar al menos un vino." |
| **Cellars** | `CreateCellarRequestDto` / `UpdateCellarRequestDto` | `Name` | `[Required]`, `[StringLength(100)]` | "El nombre de la cava es obligatorio." / "El nombre no puede superar los 100 caracteres." |
| | `AddCellarItemRequestDto` | `WineVintageId` | `[Range(1, int.MaxValue)]` | "El id de la cosecha debe ser mayor a 0." |
| | | `Quantity` | `[Range(1, 999)]` | "La cantidad debe estar entre 1 y 999." |
| | | `PurchaseDate` | Formato fecha ISO `"yyyy-MM-dd"` (opcional) | Formato inválido genera 400 Bad Request en parsing JSON. |
| | | `Notes` | `[StringLength(500)]` | "Las notas no pueden superar los 500 caracteres." |
| | `UpdateCellarItemRequestDto` | `Quantity`, `Notes` | `[Range(1, 999)]`, `[StringLength(500)]` | "La cantidad debe estar entre 1 y 999." / "Las notas no pueden superar los 500 caracteres." |
| **Reviews** | `CreateReviewRequestDto` | `WineVintageId` | `[Range(1, int.MaxValue)]` | "El id de la cosecha debe ser mayor a 0." |
| | | `Rating` | `[Range(1, 5)]` | "El rating debe estar entre 1 y 5." |
| | | `Comment` | `[StringLength(1000)]` | "El comentario no puede superar los 1000 caracteres." |
| | `UpdateReviewRequestDto` | `Rating`, `Comment` | `[Range(1, 5)]`, `[StringLength(1000)]` | "El rating debe estar entre 1 y 5." / "El comentario no puede superar los 1000 caracteres." |

---

## Roles y Permisos (Ownership y Matriz de Acceso)

La autorización en AyVino se resuelve a nivel de servicios (`Services/`) mediante el patrón `Actor(UserId, Role)` derivado de los claims del JWT (`ClaimsPrincipal.GetActor()`).

### Regla Fundamental de Respuestas HTTP
- **Recurso público existente sin permisos suficientes:** Devuelve `403 Forbidden` (`ForbiddenException`), con ProblemDetails RFC 7807 y mensaje claro en español.
- **Recurso inexistente:** Devuelve `404 Not Found` (`NotFoundException`). Nunca se utiliza `404` para ocultar recursos públicos; ese comportamiento queda reservado exclusivamente para recursos estrictamente privados (como cavas personales).

### Matriz de Acceso
(A = Admin, O = Dueño de la bodega relevante, U = Usuario que subió la cosecha, X = Cualquier usuario autenticado)

| Regla | Acción / Endpoint | Quién puede | Detalle y Condiciones |
|---|---|---|---|
| **R1** | `PUT /api/wineries/{id}` | A, O | Bodega sin dueño (`UserId == null`): solo A. El dueño puede editar su bodega aunque se encuentre en estado `Pending`. |
| **R2** | `POST /api/wines` **con `WineryId`** | A, O | O requiere que la bodega esté `Approved`. Sin `WineryId` (vino comunitario): X (cualquier usuario autenticado). |
| **R3** | `PUT /api/wines/{id}` | A, O | Vino con bodega: A o el dueño (O) de esa misma bodega. Vino comunitario (`WineryId == null`): solo A. **Cambiar o quitar la bodega solo lo hace un Admin.** Mantiene consistencia de `source_type`. |
| **R4** | `PUT /api/wines/{wineId}/vintages/{vintageId}` | A, O, U | A y O de la bodega del vino siempre. U (quien subió la cosecha) **solo mientras la cosecha esté en estado `Pending`**. Si ya fue moderada (`Approved` o `Rejected`), un usuario común no puede editarla. |
| **R5** | `GET .../claim-candidates/{wineryId}` y `POST .../claim/{wineryId}` | A, O | O requiere que la bodega esté en estado `Approved`. |
| **R6** | `POST` y `DELETE /api/wines/{wineId}/pairings/{pairingId}` | A, O | O de la bodega del vino. En vinos comunitarios (`WineryId == null`): solo A. |
| **R7** | `POST /api/cities`, `POST /api/locations` | X | Requiere autenticación. Las lecturas (`GET`) continúan siendo públicas. |
| **R8** | Bloqueo de login | — | 5 intentos fallidos consecutivos bloquean la cuenta por 15 minutos. Login exitoso o cambio de contraseña reinicia el contador. Durante el bloqueo se responde 401 con mensaje específico indicando vencimiento UTC. |

> **Nota sobre `PUT /api/wines/{id}`:** La operación `PUT` reemplaza completamente el recurso. El dueño de la bodega debe reenviar en el cuerpo del request el mismo `WineryId`. Enviar `null` o un identificador de otra bodega constituye un cambio de titularidad de la etiqueta, operación que solo puede realizar un Administrador. Al actualizar, el sistema recalcula y persiste el `source_type` (`Official` si posee `WineryId`, o `Community` si no lo posee).

> **Nota sobre `POST /api/cities` y `POST /api/locations`:** Ahora exigen autenticación. Consecuencia: Dado que `POST /api/wineries/register` es un endpoint público anónimo que solicita un `LocationId` existente, si se desea registrar una bodega en una nueva ciudad no cargada previamente en el catálogo, un usuario autenticado debe crear primero la ciudad y la ubicación correspondiente.

---

## 1. Autenticación (`/api/auth`)

Gestiona las credenciales, emisión de tokens JWT, rotación criptográfica de Refresh Tokens y revocación de sesiones. Protegido contra ataques de fuerza bruta mediante la política de Rate Limiting `AuthLimit` (15 peticiones/minuto por IP).

| Método | Ruta | Acceso | Descripción | DTO Entrada | DTO Salida |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Público (Rate limited) | Inicia sesión y genera el par Access Token JWT + Refresh Token. Mitiga timing attacks con hash ficticio. Bloquea la cuenta por 15 min tras 5 intentos fallidos consecutivos. | `LoginRequestDto` | `200 OK` (`LoginResponseDto`), `401 Unauthorized` (Credenciales inválidas o cuenta temporalmente bloqueada) |
| `POST` | `/api/auth/refresh` | Público (Rate limited) | Renueva un Access Token expirado. Implementa rotación estricta y revoca toda la familia si detecta reuso. | `RefreshRequestDto` | `200 OK` (`RefreshResponseDto`) |
| `POST` | `/api/auth/revoke` | Autenticado | Revoca manualmente el Refresh Token especificado (operación de logout). | `RevokeTokenRequestDto` | `204 NoContent` |
| `POST` | `/api/auth/change-password` | Autenticado | Actualiza la contraseña del usuario conectado y revoca sus refresh tokens activos. | `ChangePasswordRequestDto` | `204 NoContent` |

---

## 2. Usuarios y Perfiles (`/api/users`)

Administración de cuentas, perfiles comunitarios y operaciones restringidas a administradores.

| Método | Ruta | Acceso | Descripción | DTO Entrada | DTO Salida |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/users` | Público | Registra un nuevo aficionado en la comunidad con rol inmutable `User`. | `RegisterUserRequestDto` | `201 Created` (`UserResponseDto`) |
| `GET` | `/api/users/{username}` | Público | Obtiene el perfil público de un usuario por su nombre (avatar, bio, estadísticas) sin exponer datos privados. | - | `200 OK` (`PublicUserProfileDto`) |
| `GET` | `/api/users/{username}/cellar-items` | Público | Lista los vinos en cava de un usuario para visualización pública en modo solo lectura. | Query params: `pageNumber = 1`, `pageSize = 20` | `200 OK` (`IReadOnlyList<PublicCellarItemResponseDto>`) |
| `GET` | `/api/users/me` | Autenticado | Obtiene la información del perfil del usuario actualmente autenticado. | - | `200 OK` (`UserResponseDto`) |
| `PUT` | `/api/users/me` | Autenticado | Actualiza biografía, foto y nombre de usuario del perfil activo. | `UpdateUserProfileRequestDto` | `200 OK` (`UserResponseDto`) |
| `POST` | `/api/users/me/avatar` | Autenticado | Sube una foto de perfil personalizada (JPG, PNG, WEBP, máx 5MB). | `multipart/form-data` (`file`) | `200 OK` (`UserResponseDto`) |
| `DELETE` | `/api/users/me/avatar` | Autenticado | Elimina la foto de perfil física y restaura el avatar por defecto. | - | `200 OK` (`UserResponseDto`) |
| `GET` | `/api/users` | Admin (`RequireAdmin`) | Lista paginada de todos los usuarios registrados en el sistema. | Query params: `pageNumber = 1`, `pageSize = 10` | `200 OK` (`IEnumerable<UserResponseDto>`) |
| `GET` | `/api/users/{id}` | Admin (`RequireAdmin`) | Obtiene los detalles de cualquier usuario por ID. | - | `200 OK` (`UserResponseDto`) |
| `PUT` | `/api/users/{id}/profile`| Admin (`RequireAdmin`) | Modifica el perfil de un usuario específico. | `UpdateUserProfileRequestDto` | `200 OK` (`UserResponseDto`) |
| `PATCH`| `/api/users/{id}/status` | Admin (`RequireAdmin`) | Activa o desactiva la cuenta de un usuario. | `ChangeUserStatusRequestDto` | `204 NoContent` |
| `PATCH`| `/api/users/{id}/role` | Admin (`RequireAdmin`) | Cambia el rol de un usuario (`Admin` o `User`). Respuestas: `204 NoContent`, `400 Validation` (rol inválido), `403 Forbidden` (propia cuenta), `404 NotFound`, `409 Conflict` (rol Winery). | `ChangeUserRoleRequestDto` | `204 NoContent` |
| `DELETE`| `/api/users/{id}` | Admin (`RequireAdmin`) | Elimina un usuario y sus credenciales de acceso. | - | `204 NoContent` |

---

## 3. Bodegas (`/api/wineries`)

Gestión integral de bodegas oficiales y comunitarias ([RF-1.1](../requirements/spec.md), [RF-1.4](../requirements/spec.md)).

| Método | Ruta | Acceso | Descripción | DTO Entrada | DTO Salida |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/wineries` | Público | Listado paginado con filtros opcionales de estado (`status`) y región (`locationId`). | Query params: `pageNumber`, `pageSize`, `status?`, `locationId?` | `200 OK` (`IEnumerable<WineryResponseDto>`) |
| `GET` | `/api/wineries/me` | Autenticado | Obtiene la bodega asociada al usuario autenticado (fuente de verdad del panel). | - | `200 OK` (`WineryResponseDto`) / `404 Not Found` |
| `GET` | `/api/wineries/{id}` | Público | Obtiene el perfil público de una bodega por su ID. | - | `200 OK` (`WineryResponseDto`) |
| `POST` | `/api/wineries` | Autenticado | Crea una bodega de la comunidad sin propietario asignado (inicia en `Pending`). | `CreateWineryRequestDto` | `201 Created` (`WineryResponseDto`) |
| `POST` | `/api/wineries/register` | Público | Onboarding unificado: crea usuario con rol `Winery` y entidad bodega en una transacción, devolviendo JWT. | `RegisterWineryRequestDto` | `201 Created` (`RegisterWineryResponseDto`) |
| `PUT` | `/api/wineries/{id}` | Autenticado (Admin o Dueño) | Actualiza los datos informativos y de contacto de una bodega. | `UpdateWineryRequestDto` | `200 OK` (`WineryResponseDto`) |
| `PATCH` | `/api/wineries/{id}/status` | Admin (`RequireAdmin`) | Modifica el estado de moderación (`Pending`, `Approved`, `Rejected`). | `ChangeWineryStatusRequestDto` | `200 OK` (`WineryResponseDto`) |
| `DELETE`| `/api/wineries/{id}` | Admin (`RequireAdmin`) | Elimina una bodega del catálogo. | - | `204 NoContent` |

---

## 4. Provincias y Territorio (`/api/states`)

Catálogo de provincias vitivinícolas argentinas precargadas mediante la migración `SeedStates`.

| Método | Ruta | Acceso | Descripción | DTO Salida |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/states` | Público | Lista todas las provincias registradas. | `200 OK` (`IEnumerable<StateResponseDto>`) |
| `GET` | `/api/states/{id}` | Público | Obtiene una provincia por su ID. | `200 OK` (`StateResponseDto`) |

---

## 5. Ciudades (`/api/cities`)

Gestión de municipios y ciudades vitivinícolas con patrón `GetOrCreate`.

| Método | Ruta | Acceso | Descripción | DTO Entrada | DTO Salida |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/cities` | Autenticado | Retorna una ciudad existente o la crea con estado `Pending` si no se encuentra. | `CreateCityRequestDto` | `201 Created` (`CityResponseDto`) |
| `GET` | `/api/cities` | Público | Lista paginada de ciudades con filtros por provincia (`stateId`) y estado (`status`). Soporta `pageSize` de hasta 250. | Query params: `pageNumber = 1`, `pageSize = 10` (máx 250), `stateId?`, `status?` | `200 OK` (`IEnumerable<CityResponseDto>`) |
| `GET` | `/api/cities/{id}` | Público | Detalle de una ciudad por su ID. | - | `200 OK` (`CityResponseDto`) |
| `PATCH`| `/api/cities/{id}/status` | Admin (`RequireAdmin`) | Aprueba o rechaza una ciudad creada por la comunidad. | `UpdateCityStatusRequestDto` | `200 OK` (`CityResponseDto`) |

---

## 6. Ubicaciones Vitivinícolas / Terruños (`/api/locations`)

Modelado de regiones vitivinícolas y valles (ej: Valle de Uco, Cafayate, San Patricio del Chañar) asociados a ciudades.

| Método | Ruta | Acceso | Descripción | DTO Entrada | DTO Salida |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/locations` | Autenticado | Da de alta una nueva ubicación vinculada a una `CityId` existente. | `CreateLocationRequestDto` | `201 Created` (`LocationResponseDto`) |
| `GET` | `/api/locations/{id}` | Público | Obtiene la ubicación con los nombres resueltos de su ciudad y provincia. | - | `200 OK` (`LocationResponseDto`) |
| `GET` | `/api/locations` | Público | Listado paginado de ubicaciones con nombres geográficos resueltos. | Query params: `pageNumber`, `pageSize` | `200 OK` (`IEnumerable<LocationResponseDto>`) |
| `GET` | `/api/locations/resolve` | Público (`MapResolveLimit`: 60 req/min) | Resuelve coordenadas geográficas (lat, lon) argentinas mediante la API oficial Georef vinculando provincia y departamento. | Query params: `lat`, `lon` | `200 OK` (`ResolvedLocationResponseDto`) |

---

## 7. Varietales y Cepas (`/api/grapes`)

Catálogo maestro de cepas (Malbec, Cabernet Sauvignon, Torrontés, Bonarda, etc.) con categorización por color (Tinto, Blanco, Rosado).

| Método | Ruta | Acceso | Descripción | DTO Entrada | DTO Salida |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/grapes` | Admin (`RequireAdmin`) | Crea un nuevo varietal en el catálogo maestro. | `CreateGrapeRequestDto` | `201 Created` (`GrapeResponseDto`) |
| `GET` | `/api/grapes` | Público | Lista paginada de uvas, con filtro opcional por color (`colorType`). | Query params: `pageNumber`, `pageSize`, `colorType?` | `200 OK` (`IEnumerable<GrapeResponseDto>`) |
| `GET` | `/api/grapes/{id}` | Público | Obtiene el detalle de un varietal. | - | `200 OK` (`GrapeResponseDto`) |
| `PUT` | `/api/grapes/{id}` | Admin (`RequireAdmin`) | Actualiza la información de un varietal en el catálogo maestro. | `UpdateGrapeRequestDto` | `200 OK` (`GrapeResponseDto`) |
| `DELETE`| `/api/grapes/{id}` | Admin (`RequireAdmin`) | Elimina un varietal del catálogo maestro. | - | `204 NoContent` |

---

## 8. Vinos y Catálogo General (`/api/wines`)

Núcleo del sistema: administración de etiquetas, mezclas/blends con porcentaje verificado, moderación de estados y proceso de reclamo oficial ([RF-1.1](../requirements/spec.md), [RF-1.2](../requirements/spec.md), [RF-1.3](../requirements/spec.md), [RF-1.5](../requirements/spec.md), [RF-1.6](../requirements/spec.md)).

| Método | Ruta | Acceso | Descripción | DTO Entrada | DTO Salida |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/wines` | Público | Listado paginado de vinos con filtros combinados por bodega, varietal y rango de añadas. | Query params: `pageNumber`, `pageSize`, `wineryId?`, `grapeId?`, `yearFrom?`, `yearTo?` | `200 OK` (`IEnumerable<WineResponseDto>`) |
| `GET` | `/api/wines/{id}` | Público | Obtiene la ficha técnica completa del vino y su corte de uvas (`Grapes`). | - | `200 OK` (`WineResponseDto`) |
| `POST` | `/api/wines` | Autenticado (Admin o Dueño si incluye `WineryId`; comunitario: cualquier autenticado) | Crea un vino. Si incluye `WineryId` se categoriza como `Official`; si no, como `Community`. Inicia en `Pending`. | `CreateWineRequestDto` | `201 Created` (`WineResponseDto`) |
| `PUT` | `/api/wines/{id}` | Autenticado (Admin o Dueño de la bodega) | Actualiza los datos de la botella y mantiene consistente `source_type`. Solo Admin cambia de bodega. | `UpdateWineRequestDto` | `200 OK` (`WineResponseDto`) |
| `DELETE`| `/api/wines/{id}` | Admin (`RequireAdmin`) | Elimina un vino y sus asociaciones de uvas en cascada. | - | `204 NoContent` |
| `GET` | `/api/wines/claim-candidates/{wineryId}` | Autenticado (Admin o Dueño de bodega aprobada) | Lista vinos comunitarios cuyo texto de bodega coincide con el nombre de la bodega oficial especificada. | - | `200 OK` (`IEnumerable<WineResponseDto>`) |
| `POST` | `/api/wines/claim/{wineryId}` | Autenticado (Admin o Dueño de bodega aprobada) | Reclama y certifica los vinos comunitarios indicados, asignándoles `WineryId` y pasando a `Official`. | `ClaimWinesRequestDto` | `200 OK` (`IEnumerable<WineResponseDto>`) |
| `GET` | `/api/wines/search` | Público | Búsqueda difusa y avanzada de vinos por nombre, bodega, año o tipo con trigramas PostgreSQL. | Query params: `pageNumber`, `pageSize`, `name?`, `winery?`, `year?`, `wineType?` | `200 OK` (`IEnumerable<WineSearchResponseDto>`) |
| `GET` | `/api/wines/{wineId}/vintages` | Público | Lista todas las cosechas/añadas de una etiqueta de vino con sus cortes de uvas. | - | `200 OK` (`IEnumerable<WineVintageResponseDto>`) |
| `GET` | `/api/wines/{wineId}/vintages/{vintageId}` | Público | Obtiene una cosecha individual con su corte de uvas y calificación. | - | `200 OK` (`WineVintageResponseDto`) |
| `POST` | `/api/wines/{wineId}/vintages` | Autenticado | Registra una nueva cosecha para la etiqueta especificada (inicia en `Pending`). | `CreateWineVintageRequestDto` | `201 Created` (`WineVintageResponseDto`) |
| `PUT` | `/api/wines/{wineId}/vintages/{vintageId}` | Autenticado (Admin, Dueño de la bodega o Autor mientras sea Pending) | Actualiza los datos de la cosecha y reemplaza su corte de uvas. | `UpdateWineVintageRequestDto` | `200 OK` (`WineVintageResponseDto`) |
| `PATCH`| `/api/wines/{wineId}/vintages/{vintageId}/status` | Admin (`RequireAdmin`) | Modifica el estado de aprobación de una cosecha (`Pending`, `Approved`, `Rejected`). | `ChangeWineVintageStatusRequestDto` | `200 OK` (`WineVintageResponseDto`) |
| `DELETE`| `/api/wines/{wineId}/vintages/{vintageId}` | Admin (`RequireAdmin`) | Elimina una cosecha específica de la etiqueta. | - | `204 NoContent` |
| `GET` | `/api/wine-vintages` | Admin (`RequireAdmin`) | Bandeja global de cosechas para moderación administrativa. Filtro opcional por estado (`Pending`, `Approved`, `Rejected`). | Query params: `pageNumber = 1`, `pageSize = 10`, `status?` | `200 OK` (`IEnumerable<AdminWineVintageListItemDto>`) |

#### Ejemplo de Respuesta `GET /api/wine-vintages?pageNumber=1&pageSize=10&status=Pending` (200 OK)

```json
[
  {
    "vintageId": 101,
    "wineId": 42,
    "wineName": "Malbec Reserva",
    "wineType": "Red",
    "wineryId": 7,
    "wineryName": "Bodega del Fin del Mundo",
    "year": 2022,
    "alcoholContent": 14.2,
    "imageUrl": "https://example.com/vintage.jpg",
    "approvalStatus": "Pending",
    "uploadedByUserId": 3,
    "uploadedByUsername": "sommelier_juan",
    "registerDate": "2026-01-15T12:00:00Z"
  }
]
```

---

## 9. Maridajes y Relaciones Gastronómicas (`/api/pairings`)

Catálogo de maridajes (carnes, pescados, pastas, quesos, postres) y relaciones N:M entre vinos y maridajes sugeridos.

| Método | Ruta | Acceso | Descripción | DTO Entrada | DTO Salida |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/pairings` | Admin (`RequireAdmin`) | Registra una nueva opción gastronómica en el catálogo maestro. | `CreatePairingRequestDto` | `201 Created` (`PairingResponseDto`) |
| `GET` | `/api/pairings` | Público | Listado paginado de maridajes, filtrable por categoría. | Query params: `pageNumber`, `pageSize`, `category?` | `200 OK` (`IEnumerable<PairingResponseDto>`) |
| `GET` | `/api/pairings/{id}` | Público | Obtiene el detalle de un maridaje. | - | `200 OK` (`PairingResponseDto`) |
| `PUT` | `/api/pairings/{id}` | Admin (`RequireAdmin`) | Actualiza nombre o categoría de un maridaje existente en el catálogo. | `UpdatePairingRequestDto` | `200 OK` (`PairingResponseDto`) |
| `DELETE`| `/api/pairings/{id}` | Admin (`RequireAdmin`) | Elimina un maridaje del catálogo maestro. | - | `204 NoContent` |
| `GET` | `/api/wines/{wineId}/pairings` | Público | Lista todos los maridajes asociados a una botella de vino. | - | `200 OK` (`IEnumerable<PairingResponseDto>`) |
| `POST` | `/api/wines/{wineId}/pairings/{pairingId}` | Autenticado (Admin o Dueño de la bodega del vino) | Asocia un maridaje a un vino en la tabla intermedia `wine_pairings`. | - | `204 NoContent` |
| `DELETE`| `/api/wines/{wineId}/pairings/{pairingId}` | Autenticado (Admin o Dueño de la bodega del vino) | Desvincula un maridaje de un vino. | - | `204 NoContent` |

---

## 10. Reseñas y Calificaciones (`/api/reviews`)

Gestión de reseñas comunitarias y valoraciones (1 a 5 estrellas) por cosecha y feed de etiqueta. Requiere mínimo 5 reseñas por cosecha para computar el promedio público.

| Método | Ruta | Acceso | Descripción | DTO Entrada | DTO Salida |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/reviews` | Autenticado | Crea una reseña y puntaje para una cosecha puntual. | `CreateReviewRequestDto` | `201 Created` (`ReviewResponseDto`) |
| `PUT` | `/api/reviews/{id}` | Autenticado (Solo autor) | Actualiza el puntaje o comentario de una reseña propia. | `UpdateReviewRequestDto` | `200 OK` (`ReviewResponseDto`) |
| `DELETE`| `/api/reviews/{id}` | Autenticado (Solo autor) | Elimina una reseña propia y recalcula agregaciones. | - | `204 NoContent` |
| `GET` | `/api/wine-vintages/{vintageId}/reviews` | Público | Lista paginada de reseñas de una cosecha específica. | Query params: `pageNumber`, `pageSize` | `200 OK` (`IEnumerable<ReviewResponseDto>`) |
| `GET` | `/api/wines/{wineId}/reviews` | Público | Feed agregado y paginado de reseñas de una etiqueta (todas sus cosechas). | Query params: `pageNumber`, `pageSize` | `200 OK` (`IEnumerable<ReviewResponseDto>`) |

---

## 11. Red Social y Seguimiento (`/api/users/.../follow` y `/api/wineries/.../follow`)

Seguimiento unidireccional entre usuarios y hacia bodegas aprobadas. Protegido contra auto-follow (400) y duplicados (409).

| Método | Ruta | Acceso | Descripción | DTO Entrada | DTO Salida |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/users/{id}/follow` | Autenticado | Comienza a seguir a otro usuario aficionado. | - | `204 NoContent` |
| `DELETE`| `/api/users/{id}/follow` | Autenticado | Deja de seguir a un usuario. | - | `204 NoContent` |
| `GET` | `/api/users/{id}/followers` | Autenticado | Lista paginada de seguidores de un usuario. | Query params: `pageNumber = 1`, `pageSize = 10` | `200 OK` (`IReadOnlyList<FollowUserResponseDto>`) |
| `GET` | `/api/users/me/following` | Autenticado | Lista paginada de usuarios a los que sigue el usuario actual. | Query params: `pageNumber = 1`, `pageSize = 10` | `200 OK` (`IReadOnlyList<FollowUserResponseDto>`) |
| `POST` | `/api/wineries/{id}/follow` | Autenticado | Sigue a una bodega oficial aprobada (404 si es pendiente o inexistente). | - | `204 NoContent` |
| `DELETE`| `/api/wineries/{id}/follow` | Autenticado | Deja de seguir a una bodega. | - | `204 NoContent` |
| `GET` | `/api/wineries/{id}/followers` | Autenticado | Lista paginada de usuarios seguidores de una bodega aprobada. | Query params: `pageNumber = 1`, `pageSize = 10` | `200 OK` (`IReadOnlyList<FollowUserResponseDto>`) |
| `GET` | `/api/users/me/following-wineries` | Autenticado | Lista paginada de bodegas que sigue el usuario actual. | Query params: `pageNumber = 1`, `pageSize = 10` | `200 OK` (`IReadOnlyList<FollowWineryResponseDto>`) |

---

## 12. Marcas y Listas Personales de Vinos (`/api/wines/...` y `/api/user-wines`)

Marcado rápido de botellas: deseadas (`wanted`), probadas (`tried`, permanente/no desmarcable) y favoritas (`favorite`).

| Método | Ruta | Acceso | Descripción | DTO Entrada | DTO Salida |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `PUT` | `/api/wines/{wineId}/wanted` | Autenticado | Marca el vino como deseado (lo agrega a tu lista de deseos). | - | `204 NoContent` |
| `DELETE`| `/api/wines/{wineId}/wanted` | Autenticado | Desmarca el vino como deseado. Borra la fila si no quedan otras marcas. | - | `204 NoContent` |
| `PUT` | `/api/wines/{wineId}/tried` | Autenticado | Marca el vino como probado (inmutable: no posee endpoint DELETE). | - | `204 NoContent` |
| `PUT` | `/api/wines/{wineId}/favorite` | Autenticado | Marca el vino como favorito personal. | - | `204 NoContent` |
| `DELETE`| `/api/wines/{wineId}/favorite` | Autenticado | Desmarca el vino de favoritos. | - | `204 NoContent` |
| `GET` | `/api/wines/{wineId}/my-marks` | Autenticado | Consulta el estado actual de las 3 marcas del usuario para una etiqueta. | - | `200 OK` (`UserWineMarksResponseDto`) |
| `GET` | `/api/user-wines/me` | Autenticado | Lista paginada de todos los vinos marcados por el usuario, con filtros combinables. | Query params: `pageNumber = 1`, `pageSize = 10`, `wanted?`, `tried?`, `favorite?` | `200 OK` (`IReadOnlyList<UserWineListItemDto>`) |

---

## 13. Cavas Personales e Inventario (`/api/cellars`)

Administración de cavas virtuales del usuario (ej. Cava Hogar, Cava Quincho) y control de stock por añada.

| Método | Ruta | Acceso | Descripción | DTO Entrada | DTO Salida |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/cellars` | Autenticado | Crea una nueva cava para el usuario autenticado. | `CreateCellarRequestDto` | `201 Created` (`CellarResponseDto`) |
| `GET` | `/api/cellars/me` | Autenticado | Lista paginada de cavas del usuario con recuento de botellas y cosechas. | Query params: `pageNumber = 1`, `pageSize = 10` | `200 OK` (`IReadOnlyList<CellarResponseDto>`) |
| `GET` | `/api/cellars/{cellarId}` | Autenticado (Solo dueño) | Detalle y totales de una cava propia (404 si pertenece a otro). | - | `200 OK` (`CellarResponseDto`) |
| `PUT` | `/api/cellars/{cellarId}` | Autenticado (Solo dueño) | Renombra una cava propia (409 si el nombre ya existe para el usuario). | `UpdateCellarRequestDto` | `200 OK` (`CellarResponseDto`) |
| `DELETE`| `/api/cellars/{cellarId}` | Autenticado (Solo dueño) | Borra una cava propia. Devuelve `409 Conflict` si aún posee botellas. | - | `204 NoContent` |
| `POST` | `/api/cellars/{cellarId}/items` | Autenticado (Solo dueño) | Agrega una cosecha con cantidad (1-999), fecha de compra y notas. 409 si ya existe. | `AddCellarItemRequestDto` | `201 Created` (`CellarItemResponseDto`) |
| `GET` | `/api/cellars/{cellarId}/items` | Autenticado (Solo dueño) | Lista paginada del inventario de botellas de la cava con filtros por tipo y año. | Query params: `pageNumber = 1`, `pageSize = 10`, `wineType?`, `year?` | `200 OK` (`IReadOnlyList<CellarItemResponseDto>`) |
| `GET` | `/api/cellars/{cellarId}/items/{wineVintageId}` | Autenticado (Solo dueño) | Detalle de una cosecha puntual almacenada en la cava. | - | `200 OK` (`CellarItemResponseDto`) |
| `PUT` | `/api/cellars/{cellarId}/items/{wineVintageId}` | Autenticado (Solo dueño) | Reemplaza cantidad (1-999), fecha de compra y notas de la cosecha en la cava. | `UpdateCellarItemRequestDto` | `200 OK` (`CellarItemResponseDto`) |
| `DELETE`| `/api/cellars/{cellarId}/items/{wineVintageId}` | Autenticado (Solo dueño) | Elimina la cosecha de la cava (vacía el stock de esa añada). | - | `204 NoContent` |
| `GET` | `/api/cellars/{cellarId}/care-summary` | Autenticado (Solo dueño) | Resumen de recomendaciones de temperatura, decantado y ventana de consumo de todas las botellas en cava. | - | `200 OK` (`IReadOnlyList<WineCareResponseDto>`) |

---

## 14. Consejos de Guarda y Servicio (`/api/wines/.../care-recommendations`)

Cálculo de temperatura óptima de servicio, tiempo y conveniencia de decantación, y ventana de consumo estimado.

| Método | Ruta | Acceso | Descripción | DTO Entrada | DTO Salida |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/wines/{wineId}/vintages/{vintageId}/care-recommendations` | Público | Retorna consejos enológicos basados en datos declarados por la bodega o heurísticas del motor. | - | `200 OK` (`WineCareResponseDto`) |

---

## 15. Almacenamiento de Imágenes (`/api/images`)

Subida y validación estricta de imágenes para logotipos de bodegas y fotografías de botellas/cosechas en Supabase Storage.

| Método | Ruta | Acceso | Descripción | DTO Entrada | DTO Salida |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/images` | Autenticado | Sube una imagen a Supabase Storage (`multipart/form-data`) validando folder, tamaño (máx 2 MB) y magic bytes (JPEG, PNG, WebP). | Form: `file` (`IFormFile`), `folder` (`wineries` \| `vintages`) | `201 Created` (`ImageUploadResponseDto`: `{ "url": "..." }`) |

### Reglas y Restricciones de `/api/images`
- **Carpetas admitidas (`folder`)**: Únicamente `wineries` o `vintages`. Cualquier otro valor es rechazado con `400 Bad Request`.
- **Límite de tamaño**: 2 MB (2,097,152 bytes). Archivos mayores devuelven `413 Payload Too Large`.
- **Formatos y Magic Bytes**: Se validan los primeros bytes reales del stream (JPEG `FF D8 FF`, PNG `89 50 4E 47 0D 0A 1A 0A`, WebP `RIFF....WEBP`). Archivos con magic bytes inválidos o extensiones no soportadas devuelven `415 Unsupported Media Type`.
- **Nombres de archivo**: Se asigna un GUID único para evitar colisiones y sobreescrituras accidentales.
- **Disponibilidad de Supabase**: Si la API no tiene configuradas las credenciales del bucket (`Supabase:Url`, `Supabase:ServiceRoleKey` o `Supabase:Bucket`), el endpoint responde de manera segura con `503 Service Unavailable`.


