# Catálogo de Endpoints API - AyVino.Api

Este documento detalla exhaustivamente las rutas HTTP expuestas por el backend de AyVino mediante **Minimal APIs** en .NET 10. Cada endpoint se encuentra estructurado bajo su correspondiente **Vertical Slice**.

---

## Validación de Entrada

El backend implementa validación nativa de Minimal APIs en .NET 10 (`AddValidation()`) mediante Data Annotations (`[Required]`, `[StringLength]`, `[Range]`, `[EmailAddress]`, `[Url]`, `[EnumDataType]`, `[MaxLength]`, `[MinLength]`). La validación se ejecuta en la capa de transporte HTTP previa a la ejecución de los servicios, garantizando respuestas uniformes y consistentes bajo el estándar RFC 7807 (ProblemDetails).

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
| | | `LocationId` | `[Range(1, int.MaxValue)]` | "El id de la ubicación debe ser mayor a 0." |
| | | `Description` | `[StringLength(1000)]` | "La descripción no puede superar los 1000 caracteres." |
| | | `FoundationYear` | `[Range(1000, 2100)]` | "El año de fundación debe estar entre 1000 y 2100." |
| | | `Website` | `[Url]`, `[StringLength(200)]` | "El sitio web debe ser una URL válida." / "El sitio web no puede superar los 200 caracteres." |
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
| | | `ImageUrl` | `[Url]`, `[StringLength(300)]` | "La imagen debe ser una URL válida." / "La URL de la imagen no puede superar los 300 caracteres." |
| | | `Grapes` | `[MaxLength(20)]` (valida items recursivos) | "Una cosecha no puede tener más de 20 uvas." |
| | `WineGrapeRequestDto` | `GrapeId` | `[Range(1, int.MaxValue)]` | "El id de la uva debe ser mayor a 0." |
| | | `Percentage` | `[Range(0.01, 100.0)]` | "El porcentaje debe estar entre 0.01 y 100." |
| | `ChangeWineVintageStatusRequestDto` | `Status` | `[Required]`, `[StringLength(20)]` | "El estado es obligatorio." / "El estado no puede superar los 20 caracteres." |
| | `ClaimWinesRequestDto` | `WineIds` | `[Required]`, `[MinLength(1)]` | "La lista de vinos es obligatoria." / "Debe indicar al menos un vino." |
| **Cellars** | `CreateCellarRequestDto` / `UpdateCellarRequestDto` | `Name` | `[Required]`, `[StringLength(100)]` | "El nombre de la cava es obligatorio." / "El nombre no puede superar los 100 caracteres." |
| | `AddCellarItemRequestDto` | `WineVintageId` | `[Range(1, int.MaxValue)]` | "El id de la cosecha debe ser mayor a 0." |
| | | `Quantity` | `[Range(1, 999)]` | "La cantidad debe estar entre 1 y 999." |
| | | `Notes` | `[StringLength(500)]` | "Las notas no pueden superar los 500 caracteres." |
| | `UpdateCellarItemRequestDto` | `Quantity`, `Notes` | `[Range(1, 999)]`, `[StringLength(500)]` | "La cantidad debe estar entre 1 y 999." / "Las notas no pueden superar los 500 caracteres." |
| **Reviews** | `CreateReviewRequestDto` | `WineVintageId` | `[Range(1, int.MaxValue)]` | "El id de la cosecha debe ser mayor a 0." |
| | | `Rating` | `[Range(1, 5)]` | "El rating debe estar entre 1 y 5." |
| | | `Comment` | `[StringLength(1000)]` | "El comentario no puede superar los 1000 caracteres." |
| | `UpdateReviewRequestDto` | `Rating`, `Comment` | `[Range(1, 5)]`, `[StringLength(1000)]` | "El rating debe estar entre 1 y 5." / "El comentario no puede superar los 1000 caracteres." |

---

## 1. Autenticación (`/api/auth`)

Gestiona las credenciales, emisión de tokens JWT, rotación criptográfica de Refresh Tokens y revocación de sesiones. Protegido contra ataques de fuerza bruta mediante la política de Rate Limiting `AuthLimit` (15 peticiones/minuto por IP).

| Método | Ruta | Acceso | Descripción | DTO Entrada | DTO Salida |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Público (Rate limited) | Inicia sesión y genera el par Access Token JWT + Refresh Token. Mitiga timing attacks con hash ficticio. | `LoginRequestDto` | `200 OK` (`LoginResponseDto`) |
| `POST` | `/api/auth/refresh` | Público (Rate limited) | Renueva un Access Token expirado. Implementa rotación estricta y revoca toda la familia si detecta reuso. | `RefreshRequestDto` | `200 OK` (`RefreshResponseDto`) |
| `POST` | `/api/auth/revoke` | Autenticado | Revoca manualmente el Refresh Token especificado (operación de logout). | `RevokeTokenRequestDto` | `204 NoContent` |
| `POST` | `/api/auth/change-password` | Autenticado | Actualiza la contraseña del usuario conectado y revoca sus refresh tokens activos. | `ChangePasswordRequestDto` | `204 NoContent` |

---

## 2. Usuarios y Perfiles (`/api/users`)

Administración de cuentas, perfiles comunitarios y operaciones restringidas a administradores.

| Método | Ruta | Acceso | Descripción | DTO Entrada | DTO Salida |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/users` | Público | Registra un nuevo aficionado en la comunidad con rol inmutable `User`. | `RegisterUserRequestDto` | `201 Created` (`UserResponseDto`) |
| `GET` | `/api/users/me` | Autenticado | Obtiene la información del perfil del usuario actualmente autenticado. | - | `200 OK` (`UserResponseDto`) |
| `PUT` | `/api/users/me` | Autenticado | Actualiza biografía, foto y nombre de usuario del perfil activo. | `UpdateUserProfileRequestDto` | `200 OK` (`UserResponseDto`) |
| `GET` | `/api/users` | Admin (`RequireAdmin`) | Lista todos los usuarios registrados en el sistema. | - | `200 OK` (`IEnumerable<UserResponseDto>`) |
| `GET` | `/api/users/{id}` | Admin (`RequireAdmin`) | Obtiene los detalles de cualquier usuario por ID. | - | `200 OK` (`UserResponseDto`) |
| `PUT` | `/api/users/{id}/profile`| Admin (`RequireAdmin`) | Modifica el perfil de un usuario específico. | `UpdateUserProfileRequestDto` | `200 OK` (`UserResponseDto`) |
| `PATCH`| `/api/users/{id}/status` | Admin (`RequireAdmin`) | Activa o desactiva la cuenta de un usuario. | `ChangeUserStatusRequestDto` | `204 NoContent` |
| `DELETE`| `/api/users/{id}` | Admin (`RequireAdmin`) | Elimina un usuario y sus credenciales de acceso. | - | `204 NoContent` |

---

## 3. Bodegas (`/api/wineries`)

Gestión integral de bodegas oficiales y comunitarias ([RF-1.1](../requirements/spec.md), [RF-1.4](../requirements/spec.md)).

| Método | Ruta | Acceso | Descripción | DTO Entrada | DTO Salida |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/wineries` | Público | Listado paginado con filtros opcionales de estado (`status`) y región (`locationId`). | Query params: `pageNumber`, `pageSize`, `status?`, `locationId?` | `200 OK` (`IEnumerable<WineryResponseDto>`) |
| `GET` | `/api/wineries/{id}` | Público | Obtiene el perfil público de una bodega por su ID. | - | `200 OK` (`WineryResponseDto`) |
| `POST` | `/api/wineries` | Autenticado | Crea una bodega de la comunidad sin propietario asignado (inicia en `Pending`). | `CreateWineryRequestDto` | `201 Created` (`WineryResponseDto`) |
| `POST` | `/api/wineries/register` | Público | Onboarding unificado: crea usuario con rol `Winery` y entidad bodega en una transacción, devolviendo JWT. | `RegisterWineryRequestDto` | `201 Created` (`RegisterWineryResponseDto`) |
| `PUT` | `/api/wineries/{id}` | Autenticado | Actualiza los datos informativos y de contacto de una bodega. | `UpdateWineryRequestDto` | `200 OK` (`WineryResponseDto`) |
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
| `POST` | `/api/cities` | Público | Retorna una ciudad existente o la crea con estado `Pending` si no se encuentra. | `CreateCityRequestDto` | `201 Created` (`CityResponseDto`) |
| `GET` | `/api/cities` | Público | Lista paginada de ciudades con filtros por provincia (`stateId`) y estado (`status`). | Query params: `pageNumber`, `pageSize`, `stateId?`, `status?` | `200 OK` (`IEnumerable<CityResponseDto>`) |
| `GET` | `/api/cities/{id}` | Público | Detalle de una ciudad por su ID. | - | `200 OK` (`CityResponseDto`) |
| `PATCH`| `/api/cities/{id}/status` | Admin (`RequireAdmin`) | Aprueba o rechaza una ciudad creada por la comunidad. | `UpdateCityStatusRequestDto` | `200 OK` (`CityResponseDto`) |

---

## 6. Ubicaciones Vitivinícolas / Terruños (`/api/locations`)

Modelado de regiones vitivinícolas y valles (ej: Valle de Uco, Cafayate, San Patricio del Chañar) asociados a ciudades.

| Método | Ruta | Acceso | Descripción | DTO Entrada | DTO Salida |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/locations` | Público | Da de alta una nueva ubicación vinculada a una `CityId` existente. | `CreateLocationRequestDto` | `201 Created` (`LocationResponseDto`) |
| `GET` | `/api/locations/{id}` | Público | Obtiene la ubicación con los nombres resueltos de su ciudad y provincia. | - | `200 OK` (`LocationResponseDto`) |
| `GET` | `/api/locations` | Público | Listado paginado de ubicaciones con nombres geográficos resueltos. | Query params: `pageNumber`, `pageSize` | `200 OK` (`IEnumerable<LocationResponseDto>`) |

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
| `POST` | `/api/wines` | Autenticado | Crea un vino. Si incluye `WineryId` se categoriza como `Official`; si no, como `Community`. Inicia en `Pending`. | `CreateWineRequestDto` | `201 Created` (`WineResponseDto`) |
| `PUT` | `/api/wines/{id}` | Autenticado | Actualiza los datos de la botella y reemplaza la composición de uvas. | `UpdateWineRequestDto` | `200 OK` (`WineResponseDto`) |
| `DELETE`| `/api/wines/{id}` | Admin (`RequireAdmin`) | Elimina un vino y sus asociaciones de uvas en cascada. | - | `204 NoContent` |
| `GET` | `/api/wines/claim-candidates/{wineryId}` | Autenticado | Lista vinos comunitarios cuyo texto de bodega coincide con el nombre de la bodega oficial especificada. | - | `200 OK` (`IEnumerable<WineResponseDto>`) |
| `POST` | `/api/wines/claim/{wineryId}` | Autenticado | Reclama y certifica los vinos comunitarios indicados, asignándoles `WineryId` y pasando a `Official`. | `ClaimWinesRequestDto` | `200 OK` (`IEnumerable<WineResponseDto>`) |
| `GET` | `/api/wines/{wineId}/vintages` | Público | Lista todas las cosechas/añadas de una etiqueta de vino con sus cortes de uvas. | - | `200 OK` (`IEnumerable<WineVintageResponseDto>`) |
| `GET` | `/api/wines/{wineId}/vintages/{vintageId}` | Público | Obtiene una cosecha individual con su corte de uvas y calificación. | - | `200 OK` (`WineVintageResponseDto`) |
| `POST` | `/api/wines/{wineId}/vintages` | Autenticado | Registra una nueva cosecha para la etiqueta especificada (inicia en `Pending`). | `CreateWineVintageRequestDto` | `201 Created` (`WineVintageResponseDto`) |
| `PUT` | `/api/wines/{wineId}/vintages/{vintageId}` | Autenticado | Actualiza los datos de la cosecha y reemplaza su corte de uvas. | `UpdateWineVintageRequestDto` | `200 OK` (`WineVintageResponseDto`) |
| `PATCH`| `/api/wines/{wineId}/vintages/{vintageId}/status` | Admin (`RequireAdmin`) | Modifica el estado de aprobación de una cosecha (`Pending`, `Approved`, `Rejected`). | `ChangeWineVintageStatusRequestDto` | `200 OK` (`WineVintageResponseDto`) |
| `DELETE`| `/api/wines/{wineId}/vintages/{vintageId}` | Admin (`RequireAdmin`) | Elimina una cosecha específica de la etiqueta. | - | `204 NoContent` |

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
| `POST` | `/api/wines/{wineId}/pairings/{pairingId}` | Autenticado | Asocia un maridaje a un vino en la tabla intermedia `wine_pairings`. | - | `204 NoContent` |
| `DELETE`| `/api/wines/{wineId}/pairings/{pairingId}` | Autenticado | Desvincula un maridaje de un vino. | - | `204 NoContent` |

---

## 10. Módulos Planificados (Siguientes Slices)

- **Reseñas y Calificaciones (`/api/reviews`)**: Puntuación numérica ponderada (1-100 o 1-5 estrellas), notas de cata en texto libre y "Likes" rápidos ([RF-2.1](../requirements/spec.md), [RF-2.2](../requirements/spec.md)).
- **Colecciones Personales (`/api/collections`)**: Listas fijas por usuario ("Favoritos", "Por Probar", "En mi Cava") ([RF-3.1](../requirements/spec.md)).
