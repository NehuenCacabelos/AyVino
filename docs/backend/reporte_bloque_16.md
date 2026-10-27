# Reporte Técnico — Tests de Regresión y Cobertura de Borrados con Dependencias (Bloque 16)

**Proyecto:** AyVino  
**Rama:** `feature/admin-panel`  
**Host de Base de Datos Confirmado:** `aws-0-us-east-1.pooler.supabase.com` (PostgreSQL administrado en Supabase, puerto 5432).  
**Script de Prueba Automatizada:** `tests/e2e/admin-live-test.mjs`  
**Fecha:** 26 de Octubre de 2026  
**Resultado Global E2E:** **38 / 38 Casos Aprobados (100% OK)**  
**Resultado Unit Tests:** **583 / 583 Tests Aprobados (0 fallos, incremento de 19 tests desde 564)**

---

## 1. Tabla de Resultados — Sección H (Borrados con Dependencias y Visibilidad Avanzada)

| Caso | Comportamiento Esperado | Resultado Obtenido | Estado |
| :--- | :--- | :--- | :---: |
| **H.1 GET público (anónimo y ajeno) de cosecha Pending y Rejected nunca 200** | Detalle de cosechas `Pending` y `Rejected` devuelve 404/4xx (nunca 200 ni 500) sin filtración de detalles internos de BD | Anónimo: 404 (Pending), 404 (Rejected).<br>Ajeno: 404 (Pending), 404 (Rejected).<br>Sin fugas internas. | **OK** |
| **H.2 Cosecha Approved de bodega Pending invisible para anónimo** | Listado público `GET /wines/{wineId}/vintages` la excluye/404 y Detalle `GET .../{vintageId}` responde 404 (nunca 200) | Listado público: HTTP 404 (excluida: `true`).<br>Detalle público: HTTP 404.<br>`detail`: "Wine with ID ... not found." | **OK** |
| **H.3 DELETE de un maridaje asociado a un vino** | HTTP 204 No Content (eliminación en cascada en tabla intermedia `wine_pairings` según `FK_WinePairings_Pairings`) o 4xx sin leaks (nunca 500) | `DELETE`: HTTP 204.<br>Posterior `GET /api/pairings/{id}`: HTTP 404. | **OK** |
| **H.4 DELETE de una bodega que tiene vinos** | HTTP 204 No Content (según `FK_Wines_Wineries` con `OnDelete(Rule.SetNull)`) o 4xx sin leaks (nunca 500) | `DELETE`: HTTP 204.<br>Posterior `GET /api/wineries/{id}`: HTTP 404. | **OK** |
| **H.5 DELETE de usuario con reseñas, cosechas y bodega propia** | HTTP 409 Conflict con Problem Details legible y genérico, sin nombres de tablas ni de constraints (nunca 500) | HTTP 409 Conflict.<br>`detail`: "No se puede eliminar el registro porque tiene otros datos asociados en el sistema." | **OK** |
| **H.6 DELETE cosecha con reseñas (409) y cosecha en cava (204)** | Cosecha con reseñas: 409 Conflict.<br>Cosecha en cava: 204 No Content (según regla `Cascade` en `fk_cellar_items_wine_vintage`). Nunca 500. | Con reseñas: HTTP 409 (`detail` genérico sin fugas).<br>En cava: HTTP 204.<br>Posterior `GET`: HTTP 404. | **OK** |
| **H.7 DELETE de un vino con cosechas (cascade)** | HTTP 204 No Content (cascada completa sobre `wine_vintages` y `wine_grapes` según `FK_WineVintages_Wines`) y posterior 404 (nunca 500) | `DELETE`: HTTP 204.<br>Posterior `GET /api/wines/{id}`: HTTP 404. | **OK** |

*(Nota: Los 31 casos previos de las Secciones A a G continúan ejecutándose y aprobándose al 100% en la misma corrida, totalizando 38 casos).*

---

## 2. Cobertura de Tests Unitarios (xUnit + NSubstitute)

Se añadieron pruebas de regresión siguiendo los patrones del repositorio en `tests/AyVino.UnitTests`:

1. **`GrapeServiceTests.cs` (Nuevo archivo):**
   - `DeleteAsync_WhenRepositoryThrowsForeignKeyPostgresException_ThrowsConflictException`: Simula `PostgresException` (SqlState 23503) arrojada por Npgsql y verifica que el servicio emita `ConflictException` con mensaje `"No se puede eliminar la uva porque está asociada a uno o más vinos."`.
   - Pruebas adicionales para `DeleteAsync` (éxito y no encontrado) y `GetByIdAsync`.
2. **`GlobalExceptionHandlerTests.cs` (Ampliación):**
   - `TryHandleAsync_ForeignKeyPostgresException_TranslatesTo409WithGenericDetailWithoutLeakingSchema`: Instancia una `PostgresException` cargada con nombres explícitos de tablas (`wine_grapes`, `grapes`), constraints (`fk_wine_grapes_grapes`) y texto crudo. Comprueba que la respuesta HTTP sea 409 con Problem Details y que el campo `detail` sea genérico (`"No se puede eliminar el registro porque tiene otros datos asociados en el sistema."`), sin fugar ningún nombre de tabla o constraint.
3. **`WineVintageVisibilityRegressionTests.cs` (Nuevo archivo - 13 escenarios con `[Theory]` y `[InlineData]`):**
   - Visibilidad de cosechas `Pending` y `Rejected`: Anónimo y usuario ajeno reciben `NotFoundException` en detalle y lista vacía en listado; uploader, dueño de bodega y admin pueden verlas en detalle y listado.
   - Cosecha `Approved` de bodega no aprobada (`Pending`/`Rejected`): Anónimo recibe `NotFoundException`; dueño de bodega y admin pueden verla.
   - Moderación administrativa: `GetOwnedVintageOrThrowAsync` y `ChangeStatusAsync` cargan y moderan la cosecha para cualquier estado inicial (`Pending`, `Rejected`, `Approved`) sin ser bloqueados.

---

## 3. Seguridad y Limpieza del Script E2E

1. **Control de Entorno Local:**
   - Se incorporó la validación preventiva al inicio del script `tests/e2e/admin-live-test.mjs`. Si `API_BASE` no contiene `localhost` o `127.0.0.1`, la ejecución aborta inmediatamente con código de salida 1, salvo que se configure explícitamente `E2E_ALLOW_REMOTE=true`.
2. **Prefijo Obligatorio `e2e_` y Limpieza en `finally`:**
   - Todas las entidades generadas en la suite llevan el prefijo `e2e_` (usuarios, bodegas, ciudades, vinos, uvas, maridajes, cavas y reseñas).
   - El bloque `finally` ejecuta una sentencia SQL atómica que elimina en estricto orden de dependencias referenciales cualquier registro creado con el prefijo `e2e_`, garantizando que la base de datos quede limpia aun si alguna aserción falla.

---

## 4. Auditoría de Base de Datos y Propuesta de Limpieza (Bloque 15)

- **Host de la cadena de conexión:** `aws-0-us-east-1.pooler.supabase.com` (PostgreSQL en Supabase).
- **Registros remanentes detectados en la base del Bloque 15:**
  - **Tabla `wines`:**
    - `id = 6` — Name: `Vino Comunitario 1793056657460`
    - `id = 7` — Name: `Vino Comunitario 1793056862184`
  - **Tabla `cities`:**
    - `id = 531` — Name: `Ciudad E2E 1793055820359`
    - `id = 532` — Name: `Ciudad E2E 1793056657460`
    - `id = 533` — Name: `Ciudad E2E 1793056862184`

### Sentencias SQL propuestas para su eliminación (a la espera de confirmación del usuario):
```sql
-- Ejecutar únicamente tras confirmación del usuario:
DELETE FROM wines WHERE id IN (6, 7);
DELETE FROM cities WHERE id IN (531, 532, 533);
```

---

## 5. Commits Creados en la Rama `feature/admin-panel`

1. `9e31444` — `test(unit): pruebas de regresion para fixes de bloque 15 y visibilidad de cosechas`
2. `7f5ca58` — `test(e2e): ampliar suite con seccion H y borrados con dependencias`

*(Total en la rama local: 6 commits por delante de `origin/feature/admin-panel`. Política de **NO GIT PUSH** respetada al 100%).*

---

## 6. Estado de Compilación y Suites de Pruebas

- **Compilación de la solución:** `dotnet build AyVino.slnx` $\rightarrow$ **0 Errores**, compilación correcta.
- **Suite de Pruebas Unitarias .NET:** `dotnet test AyVino.slnx` $\rightarrow$ **583 pruebas aprobadas**, 0 fallidas, 0 omitidas (584 ms).
- **Suite de Pruebas Frontend Vitest:** `npm test --prefix src/frontend -- --run` $\rightarrow$ **107 pruebas aprobadas**, 0 fallidas (30 suites).
- **Suite de Integración E2E en Vivo:** `node tests/e2e/admin-live-test.mjs` $\rightarrow$ **38 pruebas aprobadas**, 0 fallidas (100% OK).
