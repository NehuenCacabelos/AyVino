# Guía de Inicio Rápido (Getting Started) - AyVino

Esta guía describe los pasos necesarios para configurar y poner en marcha el entorno de desarrollo local de AyVino (Base de datos PostgreSQL, Backend Web API y Frontend SPA).

---

## 1. Requisitos Previos

Asegúrate de contar con las siguientes herramientas instaladas:
- **.NET SDK**: Versión 10.0 (o 8.0+) - Comprueba con `dotnet --version`.
- **Node.js**: Versión 20.x o superior - Comprueba con `node -v`.
- **npm**: Versión 10.x o superior - Comprueba con `npm -v`.
- **Docker & Docker Compose**: Comprueba con `docker compose version`.

---

## 2. Configuración Inicial y Variables de Entorno

### 2.1 Variables para Docker Compose
El archivo `compose.yml` en la raíz utiliza variables de entorno para inicializar el contenedor PostgreSQL. Puedes definirlas en tu shell o en un archivo `.env` en la raíz del proyecto:

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=ayvino_db
POSTGRES_PORT=5433
```

> **¿Por qué puerto 5433?** Se utiliza el puerto `5433` por defecto en lugar de `5432` para evitar colisiones con instancias nativas de PostgreSQL que el desarrollador pudiera tener activas en su máquina local.

---

## 3. Puesta en Marcha Paso a Paso

### Paso 1: Levantar la Base de Datos con Docker

Desde la raíz del repositorio, inicia el servicio de PostgreSQL en segundo plano:

```bash
docker compose up -d postgres
```

Para verificar que el contenedor está activo:
```bash
docker compose ps
```

### Paso 2: Iniciar el Backend (.NET Web API)

Navega al proyecto de API y ejecuta:

```bash
cd src/backend/AyVino.Api
dotnet run
```

Al iniciar:
1. `Program.cs` se conectará a PostgreSQL y ejecutará automáticamente el runner de **FluentMigrator**.
2. Todas las 11 migraciones pendientes se aplicarán de forma transaccional, creando las tablas e insertando los datos iniciales de provincias (`SeedStates`).
3. El servidor HTTP escuchará por defecto en `http://localhost:5000` (y HTTPS en `https://localhost:5001`).

### Paso 3: Acceder a la Documentación Interactiva de la API

Con el backend en ejecución, abre tu navegador:
- **Scalar API Reference**: [http://localhost:5000/scalar/v1](http://localhost:5000/scalar/v1)
- **Especificación OpenAPI (JSON)**: [http://localhost:5000/openapi/v1.json](http://localhost:5000/openapi/v1.json)

> **Nota**: AyVino utiliza Scalar y la especificación nativa de ASP.NET Core (`Microsoft.AspNetCore.OpenApi`). La ruta clásica `/swagger` no está en uso.

### Paso 4: Iniciar el Frontend (React 19 + Vite)

Abre una nueva terminal independiente y ejecuta:

```bash
cd src/frontend
npm install
npm run dev
```

La consola indicará la dirección local de Vite, habitualmente:
- **Aplicación Web**: [http://localhost:5173](http://localhost:5173)

---

## 4. Ejecución de Pruebas y Control de Calidad (DoD)

De acuerdo con la [Constitución de AyVino (`AGENTS.md`)](../../AGENTS.md), toda contribución debe mantener **cero errores y cero advertencias**:

### 4.1 Pruebas de Backend (.NET)
Ejecuta la suite de pruebas unitarias en xUnit:

```bash
dotnet test tests/AyVino.UnitTests/AyVino.UnitTests.csproj
```

Esto validará:
- La inmutabilidad de roles en el registro público de usuarios (`RegisterUserRequestDto_ToCreateDto_AlwaysAssignsUserRole`).
- El correcto hashing, salado y verificación de contraseñas con PBKDF2 (`PasswordHasher_HashAndVerify_WorksCorrectly`).
- El rechazo de contraseñas inseguras de menos de 8 caracteres con `ValidationException` (`UserService_RegisterAsync_ThrowsValidationException_WhenPasswordShorterThan8Chars`).

### 4.2 Verificación de Tipos y Linter en Frontend
```bash
cd src/frontend
npm run build    # Ejecuta el compilador TypeScript (tsc -b) y empaqueta con Vite
npm run lint     # Ejecuta ESLint bajo reglas estrictas
```

Ambos comandos deben culminar con código de salida `0` sin advertencias.

---

## 5. Resolución de Problemas Frecuentes (Troubleshooting)

- **Error de conexión a PostgreSQL (`Npgsql.NpgsqlException`)**:
  Verifica que el contenedor de Docker esté corriendo con `docker compose ps` y que el puerto en `ConnectionStrings:DefaultConnection` de `appsettings.json` coincida con `POSTGRES_PORT` (por defecto `5433`).
- **Error `401 Unauthorized` al invocar endpoints de administración**:
  Asegúrate de incluir la cabecera `Authorization: Bearer <token>` con un token emitido para un usuario cuyo claim `role` sea `Admin`.
- **Fallo al compilar el frontend (`tsc not found`)**:
  Asegúrate de haber corrido `npm install` dentro del directorio `src/frontend` antes de iniciar el servidor de desarrollo.
