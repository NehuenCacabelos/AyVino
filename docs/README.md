# 📚 Centro de Documentación Técnica y de Producto - AyVino

Bienvenido al centro neurálgico de documentación oficial de **AyVino**. Este espacio organiza de manera modular y exhaustiva todos los aspectos del sistema: desde los requerimientos de negocio y arquitectura global, hasta los catálogos de endpoints, modelos de datos, protocolos de seguridad y convenciones de desarrollo.

---

## 🗺️ Mapa de Navegación de Documentación

```text
docs/
├── README.md                          # Este índice maestro
│
├── requirements/                      # Requerimientos de producto y negocio
│   └── spec.md                        # Especificación funcional formal en sintaxis EARS
│
├── architecture/                      # Arquitectura y diseño del sistema
│   ├── overview.md                    # Visión global, principios rectores y C4
│   └── data-flow.md                   # Flujos de datos, secuencia de procesos y decisiones técnicas
│
├── backend/                           # Documentación del backend (.NET 10 Minimal APIs)
│   ├── overview.md                    # Vertical Slice Architecture, Dapper e infraestructura transversal
│   ├── api-endpoints.md               # Catálogo exhaustivo de endpoints HTTP, parámetros y DTOs
│   ├── database-migrations.md         # Catálogo de 11 migraciones FluentMigrator y modelo ERD
│   ├── security-and-auth.md           # Criptografía, rotación de refresh tokens y rate limiting
│   └── wine-lifecycle.md              # Ciclo de vida del vino, cortes (blends) y reclamo oficial
│
├── frontend/                          # Documentación del frontend (React 19 + TypeScript + Vite)
│   ├── overview.md                    # Stack técnico, Tailwind CSS v4, tipado y diseño editorial
│   └── navigation-flow.md             # Mapa de navegación, UX, rutas protegidas y pantallas
│
└── guides/                            # Guías prácticas para el equipo de desarrollo
    └── getting-started.md             # Puesta en marcha paso a paso (Docker, Backend, Frontend, Tests)
```

---

## 📑 Directorio Rápido de Documentos

### 1. Requerimientos de Negocio
- 📄 [**Especificación Funcional (`requirements/spec.md`)**](requirements/spec.md): Definición detallada de requisitos RF-1.1 a RF-3.1 en sintaxis EARS (catálogo dual, corte de uvas, bodegas oficiales, adopción de vinos comunitarios y colecciones).

### 2. Arquitectura General del Sistema
- 📄 [**Visión Global y C4 (`architecture/overview.md`)**](architecture/overview.md): Modelo cliente-servidor desacoplado, diagrama C4 de contenedores, justificación de la matriz tecnológica y cumplimiento de la constitución ([`AGENTS.md`](../AGENTS.md)).
- 📄 [**Flujos de Datos y Decisiones Técnicas (`architecture/data-flow.md`)**](architecture/data-flow.md): Diagramas de secuencia para autenticación, mitigación de robo de tokens, adopción de vinos de la comunidad y manejo estandarizado de excepciones (RFC 7807).

### 3. Backend (.NET 10 Minimal APIs + Dapper)
- 📄 [**Arquitectura Vertical Slice (`backend/overview.md`)**](backend/overview.md): Estructura por slices dentro de `Features/`, abstracciones compartidas en `Common/` y acceso a datos sin Entity Framework mediante Dapper.
- 📄 [**Catálogo de Endpoints API (`backend/api-endpoints.md`)**](backend/api-endpoints.md): Especificación de todas las rutas HTTP para Auth, Users, Wineries, States, Cities, Locations, Grapes, Wines y Pairings.
- 📄 [**Migraciones de Base de Datos (`backend/database-migrations.md`)**](backend/database-migrations.md): Catálogo completo de las 11 migraciones de `FluentMigrator`, claves foráneas, índices de rendimiento y diagrama Entidad-Relación.
- 📄 [**Seguridad y Autenticación (`backend/security-and-auth.md`)**](backend/security-and-auth.md): Algoritmos PBKDF2, mitigación de timing attacks, rotación estricta de tokens de refresco y políticas de autorización por rol.
- 📄 [**Ciclo de Vida del Vino (`backend/wine-lifecycle.md`)**](backend/wine-lifecycle.md): Origen oficial vs comunitario, composición de cortes de uva (blends), estados de moderación y proceso de reclamo formal (`claim-wines`).

### 4. Frontend (React 19 + TypeScript + Vite)
- 📄 [**Diseño y Arquitectura Frontend (`frontend/overview.md`)**](frontend/overview.md): Stack tecnológico, Tailwind CSS v4, identidad editorial vinícola y tipado estricto sin `any`.
- 📄 [**Flujo de Navegación y Experiencia de Usuario (`frontend/navigation-flow.md`)**](frontend/navigation-flow.md): Arquitectura de vistas, páginas dedicadas de autenticación, modales contextuales y flujos de usuario.

### 5. Guías de Ingeniería
- 📄 [**Guía de Inicio Rápido (`guides/getting-started.md`)**](guides/getting-started.md): Instrucciones completas para levantar PostgreSQL en Docker, ejecutar la API con migraciones automáticas, iniciar la SPA en Vite y correr las suites de pruebas.

---

## 🏛️ Principios Rectores (Constitución de Ingeniería)

Toda contribución al repositorio debe alinearse estrictamente con los 7 principios de la [**Constitución de AyVino (`AGENTS.md`)**](../AGENTS.md):
1. **Stack Desacoplado**: Backend independiente en .NET y Frontend en `src/frontend`.
2. **Base de Datos Estructurada**: Cambios de esquema gobernados exclusivamente mediante `FluentMigrator`.
3. **Calidad Absoluta**: Cero advertencias de compilador, tipado estricto y manejo centralizado de excepciones.
4. **Límites de Dominio**: La API no expone entidades de persistencia; utiliza DTOs tipados.
5. **Cobertura de Pruebas**: Cada nueva funcionalidad debe incorporar sus respectivos tests en `tests/`.
6. **Desarrollo Guiado**: Cumplimiento de convenciones y habilidades en `.agents/skills/`.
7. **Documentación Viva**: Todo cambio de esquema, endpoint o pantalla debe documentarse en `docs/` como parte de la Definición de Terminado (DoD).
