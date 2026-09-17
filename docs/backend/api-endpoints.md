# Catálogo de Endpoints API - AyVino.Api

Este documento resume las rutas expuestas por el backend a través de .NET Minimal APIs, organizadas por feature.

---

## 1. Autenticación (`/api/auth`)

Manejo de credenciales, tokens JWT y refresh tokens con rate limiting.

| Método | Endpoint | Acceso | Descripción | DTO Entrada | DTO Salida |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Público (Rate limited) | Inicia sesión y genera par access/refresh token. | `LoginRequestDto` | `LoginResponseDto` |
| `POST` | `/api/auth/refresh` | Público (Rate limited) | Renueva un token de acceso expirado con refresh token. | `RefreshRequestDto` | `RefreshResponseDto` |
| `POST` | `/api/auth/revoke` | Autenticado | Revoca manualmente un refresh token (logout). | `RevokeTokenRequestDto` | `204 NoContent` |
| `POST` | `/api/auth/change-password` | Autenticado | Actualiza contraseña de la cuenta activa. | `ChangePasswordRequestDto` | `204 NoContent` |

---

## 2. Bodegas (`/api/wineries`)

Gestión y registro de bodegas oficiales y comunitarias ([RF-1.1](file:///c:/Codigo%20General/AyVino/AyVino/docs/requirements/spec.md), [RF-1.4](file:///c:/Codigo%20General/AyVino/AyVino/docs/requirements/spec.md)).

| Método | Endpoint | Acceso | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/wineries` | Público | Lista paginada de bodegas con filtros opcionales de estado (`status`) y región (`locationId`). |
| `GET` | `/api/wineries/{id}` | Público | Obtiene el perfil detallado de una bodega. |
| `POST` | `/api/wineries` | Autenticado | Crea una bodega comunitaria pendiente de verificación oficial. |
| `POST` | `/api/wineries/register` | Público | Registro oficial de bodega: crea cuenta de usuario (`Role=Winery`) y entidad de bodega en un solo flujo, devolviendo JWT. |
| `PUT` | `/api/wineries/{id}` | Propietario / Admin | Actualiza los datos de una bodega existente. |
| `PUT` | `/api/wineries/{id}/status` | Admin | Modifica el estado de verificación de una bodega. |

---

## 3. Varietales y Cepas (`/api/grapes`)

| Método | Endpoint | Acceso | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/grapes` | Público | Obtiene la lista completa de variedades de uva (Malbec, Cabernet Franc, Torrontés, etc.). |
| `GET` | `/api/grapes/{id}` | Público | Detalle de un varietal. |
| `POST` | `/api/grapes` | Admin | Da de alta un nuevo varietal en el catálogo maestro. |

---

## 4. Regiones y Ubicaciones (`/api/locations`)

| Método | Endpoint | Acceso | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/locations` | Público | Lista de regiones vitivinícolas (Valle de Uco, Calingasta, Valles Calchaquíes, etc.). |
| `GET` | `/api/locations/{id}` | Público | Detalle de una región geográfica. |
| `POST` | `/api/locations` | Admin | Da de alta una nueva región vitivinícola. |

---

## 5. Usuarios (`/api/users`)

| Método | Endpoint | Acceso | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/users/me` | Autenticado | Retorna el perfil y datos del usuario conectado según los claims de su token. |
| `GET` | `/api/users/{id}` | Autenticado | Consulta de perfil público de usuario. |
| `POST` | `/api/users` | Público | Registro directo de usuario común de la comunidad. |
| `PUT` | `/api/users/{id}` | Propietario / Admin | Modificación de información personal y preferencias. |

---

## 6. Endpoints Planificados (Próximos Slices)

- **Vinos (`/api/vinos`)**: Búsqueda, filtrado multicriterio, alta de botella con foto ([RF-1.2](file:///c:/Codigo%20General/AyVino/AyVino/docs/requirements/spec.md), [RF-1.6](file:///c:/Codigo%20General/AyVino/AyVino/docs/requirements/spec.md)).
- **Reseñas & Colecciones (`/api/reviews`)**: Puntuación numérica y texto ([RF-2.1](file:///c:/Codigo%20General/AyVino/AyVino/docs/requirements/spec.md)), Likes rápidos ([RF-2.2](file:///c:/Codigo%20General/AyVino/AyVino/docs/requirements/spec.md)) y guardado en colecciones ("Favoritos" y "Por Probar" - [RF-3.1](file:///c:/Codigo%20General/AyVino/AyVino/docs/requirements/spec.md)).

