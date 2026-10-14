# 🍷 AyVino

Plataforma social y colaborativa diseñada para catalogar, puntuar, reseñar y comparar vinos, conectando de forma fluida a la comunidad de entusiastas del vino con las bodegas productoras oficiales.

---

## 📋 Tabla de Contenidos

- [Propósito y Visión](#-propósito-y-visión)
- [Stack Tecnológico](#-stack-tecnológico)
- [Requisitos Previos](#-requisitos-previos)
- [Configuración de Entorno y Variables](#-configuración-de-entorno-y-variables)
- [Puesta en Marcha Local](#-puesta-en-marcha-local)
- [Documentación Interactiva de la API](#-documentación-interactiva-de-la-api)
- [Ejecución de Pruebas y Control de Calidad](#-ejecución-de-pruebas-y-control-de-calidad)
- [Arquitectura y Estructura del Repositorio](#-arquitectura-y-estructura-del-repositorio)
- [Resumen de Módulos y Endpoints](#-resumen-de-módulos-y-endpoints)
- [Centro de Documentación Viva (`docs/`)](#-centro-de-documentación-viva-docs)

---

## 🎯 Propósito y Visión

AyVino resuelve la fragmentación y falta de trazabilidad en la información sobre vinos:
1. **Catálogo Dual (Oficial vs. Comunidad)**: Los usuarios pueden cargar botellas no catalogadas ("Agregado por la comunidad"), mientras que las bodegas oficiales pueden registrarse, certificar sus etiquetas y reclamar (`claim`) los vinos cargados previamente por los usuarios preservando calificaciones y reseñas históricas.
2. **Corte y Composición Detallada (Blends)**: Soporte estructurado para varietales puros y cortes con porcentajes verificados de uva.
3. **Maridajes Gastronómicos**: Catálogo especializado de maridajes clasificados por categoría (carnes, pastas, quesos, postres) asociados directamente a las etiquetas.
4. **Georreferenciación Vitivinícola**: Jerarquía territorial que modela Provincias (`States`), Ciudades (`Cities`) y Terruños/Regiones (`Locations`).

---

## 🛠️ Stack Tecnológico

| Capa | Tecnologías Clave | Justificación Arquitectural |
| :--- | :--- | :--- |
| **Backend API** | C# / .NET 10 (Minimal APIs) | Alto rendimiento, sintaxis concisa y bajo overhead de memoria. |
| **Acceso a Datos** | Dapper (Micro-ORM) | Consultas SQL directas, optimizadas y sin el tracking innecesario de Entity Framework. |
| **Base de Datos** | PostgreSQL 16 (Alpine en Docker) | Motor relacional robusto, soporte para tipos avanzados y constraints de integridad. |
| **Migraciones** | FluentMigrator (C# Runner) | Control de cambios de esquema estructurado, reproducible, versionado y con rollback (`Up`/`Down`). |
| **Frontend SPA** | React 19 + TypeScript + Vite 8 | Interfaz reactiva, compilación instantánea (HMR) y tipado estricto sin `any`. |
| **Diseño y Estilos** | Tailwind CSS v4 + Lucide React | Estética editorial vinícola, cálida y limpia con micro-interacciones sutiles. |
| **Seguridad** | JWT Bearer + Refresh Tokens rotativos + PBKDF2 | Autenticación stateless segura, mitigación de timing attacks y revocación de sesiones. |
| **API Docs** | Scalar API Reference + Microsoft.AspNetCore.OpenApi | Documentación interactiva moderna basada en estándares OpenAPI v3. |

---

## 💻 Requisitos Previos

Asegúrate de contar con el siguiente software instalado en tu entorno de desarrollo:
- **.NET SDK**: Versión 10.0 (o 8.0+)
- **Node.js**: Versión 20.x o superior
- **npm**: Versión 10.x o superior
- **Docker** y **Docker Compose**: Para la base de datos PostgreSQL

---

## ⚙️ Configuración de Entorno y Variables

### 1. Variables de Docker Compose (`compose.yml`)

El contenedor de base de datos lee sus credenciales de variables de entorno del sistema o de un archivo `.env` en la raíz del proyecto:

| Variable | Descripción | Valor por Defecto Recomendado |
| :--- | :--- | :--- |
| `POSTGRES_USER` | Usuario administrador de la base de datos | `postgres` |
| `POSTGRES_PASSWORD` | Contraseña del usuario administrador | `postgres` |
| `POSTGRES_DB` | Nombre de la base de datos | `ayvino_db` |
| `POSTGRES_PORT` | Puerto expuesto en el host | `5433` (o `5432`) |

> **Nota sobre el puerto**: El archivo de configuración de desarrollo apunta por defecto al puerto `5433` para evitar colisiones con instancias locales preexistentes de PostgreSQL.

### 2. Configuración del Backend (`src/backend/AyVino.Api/appsettings.json`)

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5433;Database=ayvino_db;Username=postgres;Password=postgres"
  },
  "Jwt": {
    "SecretKey": "Tu_Clave_Secreta_Super_Segura_De_Al_Menos_32_Caracteres_Aqui",
    "Issuer": "AyVinoApi",
    "Audience": "AyVinoApp",
    "ExpirationMinutes": 120,
    "RefreshTokenExpirationDays": 7
  },
  "Cors": {
    "AllowedOrigins": [
      "http://localhost:5173",
      "http://localhost:3000"
    ]
  }
}
```

---

## 🚀 Puesta en Marcha Local

### Paso 1: Levantar la Base de Datos (PostgreSQL)

Desde la raíz del repositorio, inicia el servicio de PostgreSQL en segundo plano:

```bash
docker compose up -d postgres
```

Para verificar que el contenedor se encuentra saludable:
```bash
docker compose ps
```

### Paso 2: Iniciar el Backend (.NET Web API)

Abre una terminal y ejecuta:

```bash
cd src/backend/AyVino.Api
dotnet run
```

> **Migraciones automáticas**: Al iniciar, `Program.cs` invoca automáticamente el runner de `FluentMigrator`, aplicando todas las migraciones pendientes sobre PostgreSQL de manera segura.

### Paso 3: Iniciar el Frontend (React + Vite)

En otra terminal independiente:

```bash
cd src/frontend
npm install
npm run dev
```

La aplicación web estará disponible en [http://localhost:5173](http://localhost:5173).

---

## 📖 Documentación Interactiva de la API

Cuando el backend se ejecuta en modo `Development`, dispones de:
- **Scalar API Reference (UI Interactiva)**: [http://localhost:5000/scalar/v1](http://localhost:5000/scalar/v1)
- **Especificación OpenAPI (JSON)**: [http://localhost:5000/openapi/v1.json](http://localhost:5000/openapi/v1.json)

---

## 🧪 Ejecución de Pruebas y Control de Calidad

De acuerdo con la constitución del proyecto ([`AGENTS.md`](AGENTS.md)), todo cambio debe mantener **cero advertencias y cero errores**.

### Pruebas Unitarias de Backend (.NET)

Para correr las pruebas unitarias y de integración del backend:

```bash
dotnet test tests/AyVino.UnitTests/AyVino.UnitTests.csproj
```

### Verificación de Tipos y Linter en Frontend (TypeScript / ESLint)

```bash
cd src/frontend
npm run build    # Ejecuta el chequeo de tipos estricto (tsc -b) y el build de Vite
npm run lint     # Analiza el código con ESLint bajo reglas estrictas
```

---

## 🏛️ Arquitectura y Estructura del Repositorio

AyVino implementa **Vertical Slice Architecture (Diseño por Features)**. En lugar de organizar el código en capas técnicas horizontales que dispersan la lógica (`Controllers/`, `Services/`, `Repositories/` globales), el backend organiza cada funcionalidad de negocio en su propio slice autosuficiente:

```text
AyVino/
├── .agents/                    # Flujos de trabajo y habilidades del asistente AI
├── docs/                       # Documentación viva y técnica centralizada
│   ├── architecture/           # Visión global, decisiones de diseño y flujos de datos
│   ├── backend/                # Catálogo de endpoints, migraciones y seguridad
│   ├── frontend/               # Guía visual, componentes y flujos de navegación
│   ├── guides/                 # Guías paso a paso para desarrolladores
│   └── requirements/           # Especificación funcional EARS
├── src/
│   ├── backend/
│   │   ├── AyVino.Api/         # Proyecto Web API principal
│   │   │   ├── Common/         # Infraestructura transversal (Data, Security, Middleware)
│   │   │   │   ├── Constants/  # Roles y políticas de seguridad
│   │   │   │   ├── Data/       # Factoría de conexiones Npgsql
│   │   │   │   ├── Exceptions/ # Jerarquía de excepciones de dominio (AppException)
│   │   │   │   ├── Middleware/ # Manejador global de excepciones (RFC 7807)
│   │   │   │   └── Security/   # Hasher PBKDF2 y generador de JWT Bearer
│   │   │   ├── Features/       # Vertical Slices del sistema
│   │   │   │   ├── Auth/       # Login, Refresh tokens, Revocación y TokenCleanupService
│   │   │   │   ├── Users/      # Registro, perfiles y administración de usuarios
│   │   │   │   ├── Wineries/   # Perfiles de bodega y onboarding unificado
│   │   │   │   ├── Locations/  # Provincias (States), Ciudades (Cities) y Regiones (Locations)
│   │   │   │   ├── Grapes/     # Varietales y tipos de uva
│   │   │   │   ├── Wines/      # Catálogo de vinos, cortes (blends) y reclamo oficial
│   │   │   │   ├── Pairings/   # Maridajes culinarios y relaciones N:M con vinos
│   │   │   │   └── Reviews/    # Calificaciones y reseñas (módulo planificado)
│   │   │   ├── Migrations/     # Migraciones versionadas en C# con FluentMigrator
│   │   │   └── Program.cs      # Punto de entrada, inyección de dependencias y pipeline HTTP
│   │   └── AyVino.Core/        # Librería base para entidades compartidas
│   └── frontend/               # Single Page Application (React 19 + Vite)
│       ├── public/             # Recursos estáticos y SVGs
│       └── src/
│           ├── assets/         # Imágenes e ilustraciones de marca
│           ├── components/     # Componentes modulares (Navbar, AuthDrawer, WineCard, etc.)
│           ├── pages/          # Páginas principales (Landing, etc.)
│           ├── types/          # Interfaces TypeScript estrictas (wine.ts, auth.ts)
│           └── App.tsx         # Componente raíz
├── tests/
│   └── AyVino.UnitTests/       # Pruebas unitarias en xUnit (.NET 10)
├── AGENTS.md                   # Constitución y reglas de ingeniería del proyecto
├── compose.yml                 # Definición de contenedor PostgreSQL 16
└── README.md                   # Documentación principal de bienvenida
```

---

## 📡 Resumen de Módulos y Endpoints

| Módulo / Slice | Prefijo HTTP | Propósito Principal |
| :--- | :--- | :--- |
| **Auth** | `/api/auth` | Login, rotación de refresh tokens con mitigación de reuso, logout y cambio de contraseña. |
| **Users** | `/api/users` | Registro público de aficionados, consulta y edición de perfil (`/me`), y gestión administrativa. |
| **Wineries** | `/api/wineries` | Consulta de bodegas, alta de bodega comunitaria, y registro integral de bodega con emisión de JWT (`/register`). |
| **States** | `/api/states` | Listado y consulta de provincias argentinas precargadas. |
| **Cities** | `/api/cities` | Obtención o alta automática de ciudades (`GetOrCreate`) y moderación administrativa. |
| **Locations** | `/api/locations` | Regiones vitivinícolas y terruños asociados a ciudades. |
| **Grapes** | `/api/grapes` | Catálogo maestro de cepas/varietales (Malbec, Cabernet Franc, Torrontés, etc.). |
| **Wines** | `/api/wines` | CRUD de vinos, filtros multicriterio, gestión de blends, moderación y adopción/reclamo oficial (`/claim`). |
| **Pairings** | `/api/pairings` | Catálogo de maridajes y asociación N:M con etiquetas (`/api/wines/{wineId}/pairings`). |

---

## 📚 Centro de Documentación Viva (`docs/`)

Para profundizar en cualquier aspecto técnico o de negocio, consulta los documentos especializados:

- 📑 [**Índice General de Documentación (`docs/README.md`)**](docs/README.md)
- 🏗️ [**Arquitectura Global del Sistema (`docs/architecture/overview.md`)**](docs/architecture/overview.md)
- 🔄 [**Flujos de Datos y Decisiones Técnicas (`docs/architecture/data-flow.md`)**](docs/architecture/data-flow.md)
- ⚙️ [**Diseño Backend y Vertical Slices (`docs/backend/overview.md`)**](docs/backend/overview.md)
- 🔌 [**Catálogo Exhaustivo de Endpoints API (`docs/backend/api-endpoints.md`)**](docs/backend/api-endpoints.md)
- 🗄️ [**Esquema de Base de Datos y Migraciones (`docs/backend/database-migrations.md`)**](docs/backend/database-migrations.md)
- 🔐 [**Seguridad, JWT y Autenticación (`docs/backend/security-and-auth.md`)**](docs/backend/security-and-auth.md)
- 🍇 [**Ciclo de Vida del Vino y Reclamo Oficial (`docs/backend/wine-lifecycle.md`)**](docs/backend/wine-lifecycle.md)
- 🎨 [**Diseño y Arquitectura Frontend (`docs/frontend/overview.md`)**](docs/frontend/overview.md)
- 🗺️ [**Mapa de Navegación y UX Frontend (`docs/frontend/navigation-flow.md`)**](docs/frontend/navigation-flow.md)
- 🚀 [**Guía de Inicio Rápido (`docs/guides/getting-started.md`)**](docs/guides/getting-started.md)
- 📋 [**Especificación Funcional EARS (`docs/requirements/spec.md`)**](docs/requirements/spec.md)
