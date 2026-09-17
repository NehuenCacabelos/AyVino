# 📚 Documentación Técnica y de Producto - AyVino

Bienvenido al centro de documentación oficial de **AyVino**. Este espacio organiza de manera modular todos los aspectos del sistema: desde los requerimientos de negocio hasta las decisiones de arquitectura, guías de desarrollo y convenciones de código.

---

## 🗺️ Mapa de Navegación de Documentación

```text
docs/
├── requirements/           # Requerimientos de negocio y producto
│   └── spec.md             # Especificación funcional en sintaxis EARS
│
├── architecture/           # Arquitectura global del sistema
│   └── overview.md         # Visión integral, stack tecnológico y principios
│
├── backend/                # Documentación del backend (.NET 8/10)
│   ├── overview.md         # Vertical Slice Architecture, Dapper y Common
│   ├── api-endpoints.md    # Catálogo de endpoints Minimal APIs y DTOs
│   └── database-migrations.md # Esquema PostgreSQL y FluentMigrator
│
├── frontend/               # Documentación del frontend (React 19 + TypeScript)
│   ├── overview.md         # Stack, pautas de estilo editorial y convenciones TS
│   └── navigation-flow.md  # Mapa de rutas, vistas y flujos de usuario
│
└── guides/                 # Guías de desarrollo para el equipo
    └── getting-started.md  # Puesta en marcha local (Docker, Backend, Front, Tests)
```

---

## 📑 Índice Rápido de Documentos

### 1. Requerimientos de Negocio
- 📄 [**Especificación Funcional (`spec.md`)**](file:///c:/Codigo%20General/AyVino/AyVino/docs/requirements/spec.md): Detalle de RF-1.1 a RF-3.1 en sintaxis EARS (catálogo, reseñas, colecciones fijas y alcance).

### 2. Arquitectura General
- 📄 [**Visión Global del Sistema (`overview.md`)**](file:///c:/Codigo%20General/AyVino/AyVino/docs/architecture/overview.md): Modelo cliente-servidor desacoplado, diagrama C4 y principios rectores del proyecto.

### 3. Backend (.NET Core / C#)
- 📄 [**Arquitectura Vertical Slice (`backend/overview.md`)**](file:///c:/Codigo%20General/AyVino/AyVino/docs/backend/overview.md): Estructura por features, Dapper, excepciones globales y manejo de base de datos.
- 📄 [**Catálogo de Endpoints (`api-endpoints.md`)**](file:///c:/Codigo%20General/AyVino/AyVino/docs/backend/api-endpoints.md): Endpoints disponibles para Auth, Wineries, Users, Grapes, Locations y próximos slices.
- 📄 [**Migraciones de Esquema (`database-migrations.md`)**](file:///c:/Codigo%20General/AyVino/AyVino/docs/backend/database-migrations.md): Pautas y versionado de cambios de esquema con FluentMigrator.

### 4. Frontend (React 19 + Vite + TypeScript)
- 📄 [**Visión General Frontend (`frontend/overview.md`)**](file:///c:/Codigo%20General/AyVino/AyVino/docs/frontend/overview.md): Tecnologías, Tailwind CSS v4, identidad editorial y reglas de tipado estricto.
- 📄 [**Flujo de Navegación y UX (`navigation-flow.md`)**](file:///c:/Codigo%20General/AyVino/AyVino/docs/frontend/navigation-flow.md): Mapa de rutas, pantallas, flujos de autenticación lateral (`AuthDrawer`) y cata abierta.

### 5. Guías Prácticas
- 📄 [**Guía de Inicio Rápido (`getting-started.md`)**](file:///c:/Codigo%20General/AyVino/AyVino/docs/guides/getting-started.md): Pasos para levantar Docker (PostgreSQL), ejecutar la API, iniciar Vite y correr tests.

