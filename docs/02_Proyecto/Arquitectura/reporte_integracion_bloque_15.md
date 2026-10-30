# Reporte Técnico de Integración en Vivo — Panel de Administración (Bloque 15)

**Proyecto:** AyVino  
**Rama:** `feature/admin-panel`  
**Entorno de Pruebas:** Backend .NET 10 Minimal APIs (`http://localhost:5230/api`) contra base de datos PostgreSQL real (Supabase).  
**Script de Prueba Automatizada:** `tests/e2e/admin-live-test.mjs`  
**Fecha:** 26 de Octubre de 2026  
**Resultado Global:** **31 / 31 Casos Aprobados (100% OK)**

---

## 1. Tabla de Resultados de Integración E2E

| Caso | Comportamiento Esperado | Resultado Obtenido | Estado |
| :--- | :--- | :--- | :---: |
| **A.1 Cosechas sin token** | HTTP 401 Unauthorized al consultar `GET /api/wine-vintages` | HTTP 401 | **OK** |
| **A.2 Cosechas con token de usuario común** | HTTP 403 Forbidden al consultar `GET /api/wine-vintages` | HTTP 403 | **OK** |
| **A.3 Listar cosechas Pending con campos resueltos** | HTTP 200 con `vintageId` presente, `wineName`, `wineryName` y `uploadedByUsername` resueltos | HTTP 200, `vintageId: 9`, `wineName: "Vino Comunitario..."`, `wineryName: "Viñedos de Prueba"`, `user: "user_e2e..."` | **OK** |
| **A.4 Cosechas status inválido (`foo`)** | HTTP 400 Bad Request con estructura Problem Details | HTTP 400 (`detail: "Invalid status: 'foo'."`) | **OK** |
| **A.5 Cosechas `pageSize=101`** | HTTP 400 Bad Request por validación de límite | HTTP 400 | **OK** |
| **A.6 Cosechas `pageNumber=0`** | HTTP 400 Bad Request por paginación fuera de rango | HTTP 400 | **OK** |
| **A.7 Moderar cosecha a Approved y verificar visibilidad pública** | `PATCH` devuelve HTTP 200/204 y la añada aparece en el listado público `GET /api/wines/{wineId}/vintages` | `PATCH`: HTTP 200, `GET` público: HTTP 200, Visible: `true` | **OK** |
| **A.8 Moderar cosecha a Rejected y verificar exclusión pública** | `PATCH` devuelve HTTP 200/204 y la añada desaparece del listado público para usuarios anónimos | `PATCH`: HTTP 200, Excluida del listado público: `true` | **OK** |
| **A.9 GET detalle de cosecha con token admin** | HTTP 200 con ficha técnica y listado de cortes/blends (`grapes`) | HTTP 200, `grapes` retornadas: 1 | **OK** |
| **B.1 Listado de bodegas Pending incluye la sembrada** | HTTP 200 con `wineryId` presente en `GET /api/wineries?pageNumber=1&pageSize=100&status=Pending` | HTTP 200, bodega sembrada encontrada: `true` | **OK** |
| **B.2 Aprobar bodega y verificar en listado público** | `PATCH /api/wineries/{id}/status` con `Approved` (200/204) y visible en `GET /api/wineries?pageNumber=1&pageSize=100&status=Approved` | `PATCH`: HTTP 200, visible en catálogo público: `true` | **OK** |
| **B.3 Eliminar bodega** | `DELETE /api/wineries/{id}` devuelve HTTP 204 y posterior `GET /api/wineries/{id}` devuelve HTTP 404 | `DELETE`: HTTP 204, posterior `GET`: HTTP 404 | **OK** |
| **C.1 Listado de ciudades Pending incluye la sembrada** | HTTP 200 con `cityId` presente en `GET /api/cities?status=Pending&pageSize=100` | HTTP 200, ciudad encontrada: `true` | **OK** |
| **C.2 Aprobar ciudad y verificar en listado público Approved** | `PATCH /api/cities/{id}/status` con `Approved` (200/204) y visible en `GET /api/cities?status=Approved` | `PATCH`: HTTP 200, visible en listado aprobado: `true` | **OK** |
| **C.3 Rechazar ciudad y verificar que no figura en Approved** | `PATCH /api/cities/{id}/status` con `Rejected` (200/204) y excluida de `GET /api/cities?status=Approved` | `PATCH`: HTTP 200, excluida de Approved: `true` | **OK** |
| **D.1 GET /api/users paginado** | HTTP 200 con colección paginada de usuarios | HTTP 200, 10 usuarios obtenidos | **OK** |
| **D.2 Desactivar usuario (`isActive=false`) y rechazo de login** | `PATCH /api/users/{id}/status` devuelve HTTP 204 y posterior login es denegado con HTTP 401 | `PATCH`: HTTP 204, Login posterior: HTTP 401 (`"La cuenta se encuentra desactivada."`) | **OK** |
| **D.3 Reactivar usuario (`isActive=true`) y login exitoso** | `PATCH /api/users/{id}/status` devuelve HTTP 204 y nuevo intento de login responde HTTP 200 con JWT válido | `PATCH`: HTTP 204, Login: HTTP 200 con `accessToken` | **OK** |
| **D.4 Eliminar usuario sin datos asociados** | `DELETE /api/users/{id}` devuelve HTTP 204 y posterior `GET` responde HTTP 404 | `DELETE`: HTTP 204, posterior `GET`: HTTP 404 | **OK** |
| **E.1 Uvas CRUD completo** | `POST` (201/200), `PUT` (200), `GET` (200), `DELETE` (204) y `GET` final (404) | `POST`: 201, `PUT`: 200, `GET`: 200, `DELETE`: 204, Final: 404 | **OK** |
| **E.2 Maridajes CRUD completo** | `POST` (201/200), `PUT` (200) y `DELETE` (204) | `POST`: 201, `PUT`: 200, `DELETE`: 204 | **OK** |
| **E.3 Eliminar uva en uso en vino/cosecha** | HTTP 409 Conflict con mensaje legible de conflicto por integridad referencial | HTTP 409 (`"No se puede eliminar la uva porque está asociada a uno o más vinos."`) | **OK** |
| **F.1 Promover User a Admin y validar permisos con nuevo login** | `PATCH` devuelve HTTP 204, nuevo login emite token con rol `Admin` y accede a `GET /api/users` (200) | `PATCH`: HTTP 204, rol en JWT login: `Admin`, `GET /users`: HTTP 200 | **OK** |
| **F.2 Degradar Admin a User y verificar revocación de permisos** | `PATCH` devuelve HTTP 204, nuevo login emite token con rol `User` y deniega `GET /api/users` (403) | `PATCH`: HTTP 204, rol en JWT login: `User`, `GET /users`: HTTP 403 | **OK** |
| **F.3 Auto-modificación de rol prohibida** | HTTP 403 Forbidden cuando el administrador intenta alterar su propio rol | HTTP 403 (`"No se puede modificar el rol de la propia cuenta."`) | **OK** |
| **F.4 Modificación de usuario Bodega rechazada** | HTTP 409 Conflict si se intenta alterar el rol de un usuario con perfil de bodega institucional | HTTP 409 (`"El rol Winery se asigna al registrar una bodega y no puede modificarse manualmente."`) | **OK** |
| **F.5 Roles no permitidos (`Winery` y `SuperAdmin`)** | HTTP 400 Bad Request en ambos intentos | HTTP 400 en ambos intentos | **OK** |
| **F.6 Mismo rol (idempotencia)** | HTTP 204 No Content sin modificaciones en la base | HTTP 204 | **OK** |
| **G.1 Ningún endpoint admin responde sin token** | Todos los endpoints administrativos devuelven HTTP 401 Unauthorized | Confirmado: Todos los endpoints evaluados responden HTTP 401 | **OK** |
| **G.2 Ningún endpoint admin responde a usuario común** | Todos los endpoints administrativos devuelven HTTP 403 Forbidden ante token de `User` | Confirmado: Todos los endpoints evaluados responden HTTP 403 | **OK** |
| **G.3 Ningún endpoint admin responde a bodega** | Todos los endpoints administrativos devuelven HTTP 403 Forbidden ante token de `Winery` | Confirmado: Todos los endpoints evaluados responden HTTP 403 | **OK** |

---

## 2. Diagnóstico y Corrección de Bugs Encontrados (Fix Commits)

Durante la ejecución de las pruebas en vivo contra la base de datos real, se aislaron dos discrepancias en la capa de persistencia y servicios:

### Bug 1: Error 500 no controlado por violación de Foreign Key al eliminar uva
- **Síntoma:** Al invocar `DELETE /api/grapes/{id}` sobre una variedad asociada a un vino o cosecha, el backend devolvía `HTTP 500 Internal Server Error` sin formato de Problem Details.
- **Causa Raíz:** Npgsql arrojaba una excepción `PostgresException` con `SqlState == "23503"` (`PostgresErrorCodes.ForeignKeyViolation`) proveniente de la restricción de clave foránea en la tabla `wine_grapes`. El servicio `GrapeService` no interceptaba excepciones específicas del motor relacional, y `GlobalExceptionHandler` carecía de mapeo hacia `StatusCodes.Status409Conflict`.
- **Solución:**
  1. En `GrapeService.cs`: se envolvió la invocación al repositorio en un bloque `try/catch` que intercepta `PostgresException` con código `ForeignKeyViolation` y la traduce a `ConflictException("No se puede eliminar la uva porque está asociada a uno o más vinos.")`.
  2. En `GlobalExceptionHandler.cs`: se incorporó la regla de mapeo automático para excepciones de Postgres con `23503` hacia `StatusCodes.Status409Conflict`.
- **Commit:** `f842442` — `fix(grapes): mapear violacion de clave foranea a 409 conflict al eliminar variedad en uso`

### Bug 2: Error 404 al consultar o moderar cosechas en estado `Pending` o `Rejected`
- **Síntoma:** `GET /api/wines/{wineId}/vintages/{vintageId}` y `PATCH /api/wines/{wineId}/vintages/{vintageId}/status` devolvían `HTTP 404 Not Found` cuando un administrador intentaba acceder o aprobar/rechazar cosechas comunitarias recién cargadas en estado `Pending`.
- **Causa Raíz:** En `WineVintageRepository.cs`, el método atómico `GetByIdAsync(int id, CancellationToken ct)` delegaba ciegamente a la sobrecarga `GetByIdAsync(id, currentUserId: null, isAdmin: false, ct)`. Dicha sobrecarga incorporaba en su cláusula SQL un filtro de visibilidad que exigía `approval_status = 2` (Approved). En consecuencia, para cosechas pendientes (`approval_status = 1`), la consulta SQL devolvía cero filas, haciendo que `WineVintageService.GetOwnedVintageOrThrowAsync` lanzara un `NotFoundException` preventivo antes de que la lógica de negocio y permisos del administrador pudiera intervenir.
- **Solución:** Se corrigió `WineVintageRepository.cs` para que `GetByIdAsync(id, ct)` y `GetAllByWineIdAsync(wineId, ct)` ejecuten la consulta directa por ID/WineId sobre la tabla `wine_vintages` utilizando la constante `SelectColumns`, respetando la separación de responsabilidades y permitiendo que `WineVintageService` aplique sus reglas de autorización de acceso (administradores, propietarios y uploaders) de manera determinista.
- **Commit:** `fb7b3b0` — `fix(vintages): permitir que GetByIdAsync y GetAllByWineIdAsync en repositorio devuelvan cosechas sin filtrar por aprobadas`

---

## 3. Commit de Suite E2E

- **Commit:** `33d29ac` — `test(e2e): suite de pruebas de integracion en vivo para panel admin`
- **Archivo:** `tests/e2e/admin-live-test.mjs`
- **Seguridad:** Cero credenciales hardcodeadas; lectura segura de variables de entorno (`JWT_SECRET`, `API_BASE`, `ADMIN_EMAIL`, etc.) con generación dinámica criptográfica de usuarios y firmas HMAC-SHA256.

---

## 4. Estado de Pruebas Frontend y Elementos Pendientes

### Pruebas de Interfaz Automatizadas (Playwright)
- **Estado:** *Pendiente de prueba manual.*
- **Justificación:** De acuerdo con la instrucción explícita del Bloque 15 (*"solo si Playwright ya está instalado en el proyecto; si no, NO lo instales y marcalo como 'pendiente de prueba manual'"*), se verificó el archivo `src/frontend/package.json` y se constató que Playwright no forma parte de las herramientas instaladas. En estricto apego a la directiva de no introducir dependencias no acordadas, el flujo de navegación de navegador queda catalogado para verificación manual.

### Salud del Conjunto de Pruebas Unitarias y de Componentes
1. **Backend (.NET Core 10):**
   - Comando: `dotnet test AyVino.slnx`
   - Resultado: **564 pruebas superadas**, 0 fallidas, 0 omitidas (731 ms).
2. **Frontend (Vitest + Testing Library):**
   - Comando: `npm test --prefix src/frontend -- --run`
   - Resultado: **30 archivos de prueba superados**, **107 pruebas pasando**, 0 fallidas (6.47 s).

---

## 5. Política de Git Push

- **Estado:** **Sin Push remoto realizado.**
- Conforme a la regla del Bloque 15 (*"- No hagas push."*), las ramas locales permanecen listas e íntegras en el workspace local sin haberse emitido ningún comando `git push` a `origin`.
