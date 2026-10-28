# Reporte Técnico de Estabilización, Refactorización UI y Portabilidad E2E (Bloque 27)

**Proyecto:** AyVino  
**Rama:** `feature/bodega-frontend`  
**Estado Git Remoto:** Sincronizado con `origin/feature/bodega-frontend` (`04638c8..a0db8ee`)  
**Fecha:** 28 de Octubre de 2026  
**Autor:** Asistente de Desarrollo (Antigravity)  

---

## 1. Resumen Ejecutivo

El presente reporte consolida las intervenciones técnicas, correcciones críticas y mejoras arquitectónicas desarrolladas recientemente sobre la rama `feature/bodega-frontend`. El trabajo abarcó cuatro frentes fundamentales:

1. **Correcciones de Backend & Base de Datos**:
   - Corrección del error de materialización Dapper en el endpoint `/api/wineries/{id}/public`.
   - Desambiguación en el registro de bodegas para permitir nombres homónimos de responsables, concentrando la unicidad en el email y la identificación de cuenta.
   - Resolución del error PostgreSQL `42P08` en el log de auditoría (`AuditRepository.cs`), garantizando tipado estricto en parámetros nulos.
2. **Refactorización UI del Perfil Institucional de Bodega**:
   - Rediseño integral de la cabecera institucional en React con Tailwind CSS: avatar flotante (`-mt-14` a `-mt-20`), legibilidad y preservación del logo mediante `object-contain`, gradiente continuo en el banner (`h-44` a `h-64`) y grilla/flex responsive para métricas y acciones.
3. **Portabilidad y Sanitización de la Suite E2E (Bloque 27)**:
   - Eliminación de secretos hardcodeados (`JWT_SECRET`) y rutas fijas dependientes de la máquina local.
   - Creación de la herramienta de consola `tests/e2e/db-util/` en .NET 10 y Npgsql, invocada relativamente desde el script E2E y aislada de `AyVino.slnx`.
4. **Documentación y Calidad**:
   - Documentación completa en `docs/backend/overview.md` sobre la ejecución segura del suite E2E.
   - Auditoría de tests: **666 tests .NET (100% OK)**, **173 tests Vitest (100% OK)** y **0 advertencias de linter y compilador**.

---

## 2. Detalle de Incidencias y Soluciones Implementadas

### A. Backend & Base de Datos

#### 1. Materialización Dapper en Perfil Público de Bodega
- **Síntoma:** Al invocar `GET /api/wineries/{id}/public`, el backend arrojaba `InvalidOperationException`: *"A parameterless default constructor or one matching signature (...) is required for WineryPublicProfileRow materialization"*.
- **Causa Raíz:** Se agregó la columna de estado provincial/regional en la consulta SQL pero el modelo de lectura `WineryPublicProfileRow` no disponía de un constructor sin parámetros ni de un constructor coincidente con los tipos e identificadores devueltos por el mapeador Dapper.
- **Solución:** Se implementó un constructor predeterminado sin parámetros e inicializadores de propiedades en `WineryPublicProfileRow`, asegurando la materialización tolerante e inmutable sin errores 500.

#### 2. Desambiguación de Responsable en Registro de Bodega
- **Síntoma:** El sistema rechazaba el registro de una bodega si el nombre del responsable ya existía en la base de datos, marcando erróneamente la casilla del correo electrónico.
- **Causa Raíz:** Existía una validación que trataba el nombre del contacto o representante legal como identificador único global, cuando en la práctica múltiples personas pueden compartir nombres idénticos.
- **Solución:** Se restringió la regla de unicidad exclusivamente al `Email` y al identificador de la cuenta (`UserId` / `CUIT`), permitiendo que el nombre y apellido del responsable sea un campo descriptivo no bloqueante.

#### 3. Error PostgreSQL `42P08: could not determine data type of parameter $4`
- **Síntoma:** Al filtrar actividades en `/api/audit-log`, PostgreSQL arrojaba el error `42P08` provocando una excepción HTTP 500 no controlada.
- **Causa Raíz:** Al enviar parámetros opcionales (`userId`, `action`, etc.) como valores `null` en sentencias preparadas de Dapper/Npgsql con cláusulas condicionales (`($4 IS NULL OR user_id = $4)`), el optimizador de PostgreSQL no podía inferir el tipo de dato subyacente.
- **Solución:** En `AuditRepository.cs` se especificó el tipo explícito para los parámetros potencialmente nulos utilizando `DynamicParameters` con `DbType.Int32` y `DbType.String`, permitiendo que el motor de base de datos infiera correctamente el plan de ejecución.

---

### B. Frontend — Refactorización UI del Encabezado de Bodega

#### 1. Problema de Maquetación Detectado
En la vista institucional de bodega ([`WineryOverviewPage.tsx`](file:///src/frontend/src/pages/WineryOverviewPage.tsx) y [`WineryPublicProfileLayout.tsx`](file:///src/frontend/src/pages/WineryPublicProfileLayout.tsx)):
- El avatar/logo circular quedaba cortado verticalmente sobre la línea del banner, aplastado contra el margen izquierdo y desalineado respecto al nombre y la semblanza.
- La imagen interna utilizaba `object-cover`, recortando sellos circulares, tipografías e insignias institucionales (como "Bodegas López 1898").
- El banner superior carecía de una altura proporcionada (`h-32` a `h-44`) y el overlay generaba un oscurecimiento irregular con líneas duras de corte.

#### 2. Solución Arquitectónica Aplicada
- **Avatar Flotante**:
  - Se encapsuló el logo en un contenedor relativo con margen negativo superior calibrado (`-mt-14 sm:-mt-16 md:-mt-20`) y `z-20`.
  - Se incorporó un marco con halo de protección (`ring-4 ring-[#0b0b0e]`, `border border-white/15` y sombra profunda `shadow-2xl`).
  - Cuando existe un logo oficial cargado, el contenedor adopta fondo blanco con padding interno (`p-2.5 sm:p-3`), asegurando contraste y legibilidad con cualquier identidad gráfica.
- **Componente `WineryLogo` Mejorado**:
  - Soporte nativo para prop `objectFit: 'contain' | 'cover'` (por defecto `'contain'`).
  - Integración de la función utilitaria `cn()` para resolver colisiones de estilos Tailwind sin mutación de clases.
- **Banner Enriquecido**:
  - Se incrementó la escala vertical a `h-44 sm:h-52 md:h-60 lg:h-64`.
  - Se reemplazó el corte inferior por un degradado suave de dos capas (`bg-gradient-to-t from-[#0b0b0e] via-black/25 to-black/10`), logrando una fusión natural con el fondo del panel.
- **Disposición Flex/Grid Responsive**:
  - En móviles: Disposición centrada con apilado vertical y lectura limpia.
  - En tablets/desktop: Disposición horizontal armónica con columna izquierda dedicada a identidad (logo, nombre, medalla de "Bodega Oficial", ubicación, año de fundación, sitio web y semblanza histórica) y columna derecha dedicada a botones de acción y tarjeta de métricas (`bg-[#17151a]/90`).

---

### C. Bloque 27 — Portabilidad E2E y Sanitización de Secretos

#### 1. Erradicación de Secretos Fijos
- Se eliminó el valor predeterminado `"AyVinoSuperSecretKeyForDevelopmentOnly2026!#"` en [`tests/e2e/admin-live-test.mjs`](file:///tests/e2e/admin-live-test.mjs) y [`src/frontend/tests/e2e/e2e-live-test.mjs`](file:///src/frontend/tests/e2e/e2e-live-test.mjs).
- Si la variable de entorno `JWT_SECRET` no está presente, el script aborta inmediatamente con un mensaje de guía explícito que indica obtener el valor desde User Secrets de .NET (`dotnet user-secrets get "Jwt:SecretKey"`).
- Se auditaron las colecciones y entornos de Postman (`postman/`) y tests con mocks para asegurar que no contengan contraseñas productivas ni cadenas de conexión hardcodeadas.

#### 2. Creación del Componente Portable `tests/e2e/db-util`
- Se removió la referencia fija absoluta a herramientas externas del host (`DB_UTIL_PROJECT = C:/Users/...`).
- Se creó el proyecto de consola mínimo en [`tests/e2e/db-util/`](file:///tests/e2e/db-util):
  - **Framework:** .NET 10.0 con `Npgsql 10.0.3` (alineado a las dependencias de `AyVino.Api`).
  - **Función:** Recibe sentencias SQL por argumento de línea de comandos y lee la conexión desde `E2E_DB_CONNECTION`.
  - **Seguridad:** En caso de error, emite mensajes sanitizados a `stderr` sin imprimir credenciales ni cadenas de conexión.
  - **Aislamiento:** El proyecto fue explícitamente excluido de `AyVino.slnx` para no interferir en el ciclo de vida habitual ni en las ejecuciones de `dotnet test`.
- La llamada desde `admin-live-test.mjs` resuelve la ruta de `db-util/DbUtil.csproj` de forma relativa a través de `import.meta.url`.

#### 3. Documentación Oficial
- Se incorporó la sección **"8. Cómo correr el e2e"** en [`docs/backend/overview.md`](file:///docs/backend/overview.md), detallando:
  - Variables requeridas (`API_BASE`, `JWT_SECRET`, `E2E_DB_CONNECTION`, `E2E_ALLOW_REMOTE`).
  - Comandos para extracción de secretos desde `dotnet user-secrets`.
  - Comandos exactos de ejecución en PowerShell y Bash.

---

## 3. Matriz de Resultados de Verificación y Auditoría

| Entorno / Herramienta | Comando de Ejecución | Métrica / Cobertura | Resultado |
| :--- | :--- | :--- | :---: |
| **Backend Unit & Integration Tests** | `dotnet test` | 666 pruebas ejecutadas | **666 / 666 Aprobadas (0 fallos)** |
| **Backend Solution Build** | `dotnet build AyVino.slnx` | Compilación general | **0 Errores / 0 Advertencias** |
| **Frontend Unit Tests** | `npm --prefix src/frontend test` | 38 suites de componentes | **173 / 173 Aprobados (0 fallos)** |
| **Frontend Linter** | `npm --prefix src/frontend run lint` | ESLint + TypeScript | **0 Errores / 0 Advertencias** |
| **Frontend Production Build** | `npm --prefix src/frontend run build` | Vite Bundle | **Exitoso (0 advertencias)** |
| **Validación E2E (Sin JWT_SECRET)** | `node tests/e2e/admin-live-test.mjs` | Aborto preventivo controlado | **Falla con mensaje explicativo OK** |
| **Validación E2E (Sin E2E_DB_CONNECTION)** | `node tests/e2e/admin-live-test.mjs` | Aborto preventivo controlado | **Falla con mensaje explicativo OK** |

---

## 4. Registro de Commits Pusheados

Los siguientes commits atómicos fueron confirmados y enviados exitosamente al repositorio remoto en la rama `feature/bodega-frontend`:

| Hash | Tipo / Alcance | Mensaje de Commit |
| :--- | :--- | :--- |
| `77339fe` | `fix(winery-ui)` | refactorizar cabecera institucional de bodega con avatar flotante y banner equilibrado |
| `1e25d9b` | `test(e2e)` | hacer portable la suite eliminando secretos y reemplazando db-util externo por proyecto local |
| `a0db8ee` | `docs(backend)` | documentar seccion 'Como correr el e2e' con variables requeridas y comandos de ejecucion |

---

## 5. Conclusión y Estado de Entrega

La rama `feature/bodega-frontend` se encuentra en estado limpio, con todos los requerimientos del Bloque 27 cumplidos al 100%, el problema de layout resuelto con estándares modernos de diseño responsivo y la suite completa de pruebas unitarias y de integración en verde tanto en backend como en frontend.
