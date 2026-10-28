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
| `GET` | `/api/reviews` | Admin (`RequireAdmin`) | Bandeja global de reseñas para moderación administrativa. Filtros opcionales combinables: `wineId`, `wineVintageId`, `userId`, `rating` (1 a 5). | Query params: `pageNumber = 1`, `pageSize = 10`, `wineId?`, `wineVintageId?`, `userId?`, `rating?` | `200 OK` (`IEnumerable<AdminReviewListItemDto>`) |
| `POST` | `/api/reviews` | Autenticado | Crea una reseña y puntaje para una cosecha puntual. | `CreateReviewRequestDto` | `201 Created` (`ReviewResponseDto`) |
| `PUT` | `/api/reviews/{id}` | Autenticado (Solo autor) | Actualiza el puntaje o comentario de una reseña propia. | `UpdateReviewRequestDto` | `200 OK` (`ReviewResponseDto`) |
| `DELETE`| `/api/reviews/{id}` | Autenticado (Autor o Admin) | Elimina una reseña y recalcula transaccionalmente el puntaje de la cosecha y del vino. Si quien elimina es un Administrador ajeno al autor, registra auditoría `ReviewDeletedByAdmin`. | - | `204 NoContent` |
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

---

## 16. Auditoría de Administración (`/api/audit-log`)

Registro inmutable de acciones administrativas y de moderación sobre entidades del sistema. Se registra automáticamente mediante el endpoint filter `.WithAudit(...)` tras respuestas exitosas (2xx).

| Método | Ruta | Acceso | Descripción | DTO Entrada | DTO Salida |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/audit-log` | Admin (`RequireAdmin`) | Listado paginado de entradas de auditoría con filtros opcionales. | Query params: `pageNumber`, `pageSize`, `action?`, `entityType?`, `userId?`, `from?`, `to?` | `200 OK` (`IEnumerable<AuditLogEntryDto>`) |

### Reglas de Auditoría
- **Filtros admitidos**:
  - `action`: Nombre del enum `AuditAction` (ej: `WineryStatusChanged`, `UserStatusChanged`). Se valida contra el enum; valores desconocidos devuelven `400 Bad Request`.
  - `entityType`: Tipo de entidad auditada (`Winery`, `City`, `Vintage`, `User`, `Grape`, `Pairing`, `Wine`, `Review`).
  - `userId`: Identificador del usuario administrador que ejecutó la acción.
  - `from` y `to`: Rango de fechas ISO 8601.
- **Acciones registradas automáticamente**:
  - Cambio de estado y borrado de bodegas (`WineryStatusChanged`, `WineryDeleted`).
  - Cambio de estado de ciudades (`CityStatusChanged`).
  - Cambio de estado y borrado de cosechas (`VintageStatusChanged`, `VintageDeleted`).
  - Bloqueo/desbloqueo, borrado y cambio de rol de usuarios (`UserStatusChanged`, `UserDeleted`, `UserRoleChanged`).
  - Alta, edición y baja de variedades de uva y maridajes (`GrapeCreated`, `GrapeUpdated`, `GrapeDeleted`, `PairingCreated`, `PairingUpdated`, `PairingDeleted`).
  - Edición por administrador y borrado de vinos (`WineUpdatedByAdmin`, `WineDeleted`).
- **Resiliencia**: Si el guardado de auditoría falla, se captura y registra el error con `ILogger` sin interrumpir ni fallar la operación principal solicitada por el usuario.

---

## 17. Fusión de Vinos Duplicados (`/api/wines/{targetId}/merge/{duplicateId}`)

Permite a los administradores unificar etiquetas de vino duplicadas dentro de una etiqueta principal canónica de manera transaccional y atómica, consolidando cosechas, reseñas, inventario de cavas y marcas personales.

| Método | Ruta | Acceso | Descripción | DTO Entrada | DTO Salida |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/wines/{targetId}/merge/{duplicateId}` | Admin (`RequireAdmin`) | Fusiona el vino duplicado dentro del vino destino. | Route params: `targetId`, `duplicateId` | `200 OK` (`MergeWinesResultDto`) |

### DTO de Respuesta (`MergeWinesResultDto`)
- `targetId` (`int`): ID del vino principal conservado.
- `duplicateId` (`int`): ID del vino duplicado absorbido.
- `movedVintages` (`int`): Cosechas del duplicado cuyo año no existía en el principal y fueron reasignadas directamente.
- `mergedVintages` (`int`): Cosechas del duplicado fusionadas con una del mismo año en el principal.
- `movedReviews` (`int`): Reseñas de cosechas fusionadas que fueron trasladadas al vino principal.
- `discardedReviews` (`int`): Reseñas del duplicado descartadas porque el mismo usuario ya había reseñado la cosecha principal homónima.
- `movedCellarItems` (`int`): Elementos de cava del duplicado trasladados o consolidados (sumando cantidades) en la cosecha principal.

### Validaciones Previas
- **Permisos**: Requiere rol `Admin` (`403 Forbidden` si no es admin).
- **Distintos**: `targetId` y `duplicateId` deben ser distintos (`400 ValidationException`).
- **Existencia**: Ambos vinos deben existir en la base de datos (`404 NotFoundException`).
- **No duplicados**: Ni el destino ni el origen pueden tener `duplicate_of_wine_id` no nulo (`409 ConflictException`).

### Reglas de la Transacción Atómica
1. **Cosechas sin conflicto de año**: Se reasignan al principal (`UPDATE wine_vintages SET wine_id = @targetId`).
2. **Cosechas con año homónimo (`NULL = NULL`)**: Se fusionan en la del principal:
   - **Reseñas**: Se mueven a la cosecha destino; si el usuario ya tiene reseña en la cosecha destino, se conserva la del principal y se descarta la del duplicado.
   - **Cavas**: Se trasladan; si la cava ya posee la cosecha destino, se suman las cantidades (`LEAST(999, quantity + dupQuantity)`).
   - **Uvas (`wine_grapes`)**: Se conservan las de la cosecha principal y se descartan las del duplicado.
   - Se elimina la cosecha duplicada sobrante.
3. **Maridajes (`wine_pairings`)**: Se copian al principal los maridajes que falten (`ON CONFLICT DO NOTHING`) y se borran los del duplicado.
4. **Marcas personales (`user_wines`)**: Se combinan aplicando operador lógico OR a `is_wanted`, `is_tried` y `is_favorite` (`ON CONFLICT DO UPDATE`) y se borran las del duplicado.
5. **Recálculo de puntajes**: Se actualizan `rating_sum` y `review_count` de las cosechas fusionadas y del vino principal a partir de los datos consolidados reales.
6. **Marcado del duplicado**: `UPDATE wines SET duplicate_of_wine_id = @targetId, rating_sum = 0, review_count = 0 WHERE id = @duplicateId`. El vino duplicado no se elimina físicamente.
7. **Visibilidad pública**: Los vinos con `duplicate_of_wine_id` asignado quedan ocultos de búsquedas, listados públicos y de `GET /api/wines/{id}` para usuarios no administradores (`404 Not Found`). Los administradores continúan visualizándolos con el badge de referencia al original.
8. **Auditoría**: Se registra automáticamente la acción `WineMerged` (action 18, entityType `Wine`, entityId `targetId`, details `duplicateId`).

