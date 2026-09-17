# 🍷 AyVino - Backend API

Plataforma social para catalogar, puntuar y comparar vinos.

---

## 🛠️ Stack Tecnológico

- **Lenguaje / Framework:** C# (.NET 8 / Minimal APIs)
- **Acceso a Datos:** Dapper (Micro-ORM de alto rendimiento con SQL directo)
- **Base de Datos:** PostgreSQL / SQL Server

---

## 📂 Arquitectura y Estructura de Carpetas

Adoptamos **Vertical Slice Architecture (Diseño por Features)** dentro de `AyVino.Api`. En lugar de separar el proyecto en capas técnicas globales (`Controllers`, `Models`, `Repositories` gigantes), agrupamos el código por **funcionalidad/entidad**.

```text
AyVino/
├── AyVino.slnx                    # Archivo de solución para abrir en VS / Rider
├── src/
│   ├── frontend/                 # Proyecto Web (React, Vite, etc.)
│   └── backend/
│       └── AyVino.Api/           # Proyecto Web API principal
│           ├── Common/           # Clases y configuraciones compartidas (DB, helpers)
│           ├── Features/         # Funcionalidades agrupadas por dominio
│           │   ├── Vinos/        # Todo lo referente a Vinos
│           │   │   ├── Vino.cs           # Modelo de DB
│           │   │   ├── VinoDtos.cs       # DTOs de entrada y salida
│           │   │   ├── VinoRepository.cs # Consultas Dapper exclusivas de vinos
│           │   │   └── VinoEndpoints.cs  # Definición de rutas Minimal API
│           │   ├── Bodegas/     # Bodegas
│           │   └── Reviews/      # Reseñas y Puntuaciones
│           ├── appsettings.json  # Configuración y Connection Strings
│           └── Program.cs        # Punto de entrada (registro de servicios y rutas)
```

---

## 📚 Documentación del Proyecto

Toda la documentación técnica, funcional y de arquitectura se encuentra centralizada en el directorio [`docs/`](file:///c:/Codigo%20General/AyVino/AyVino/docs):

- 📖 [**Índice Maestro de Documentación (`docs/README.md`)**](file:///c:/Codigo%20General/AyVino/AyVino/docs/README.md)
- 📋 [Especificación de Requerimientos (`docs/requirements/spec.md`)](file:///c:/Codigo%20General/AyVino/AyVino/docs/requirements/spec.md)
- 🏗️ [Arquitectura Global (`docs/architecture/overview.md`)](file:///c:/Codigo%20General/AyVino/AyVino/docs/architecture/overview.md)
- ⚙️ [Documentación Backend (`docs/backend/overview.md`)](file:///c:/Codigo%20General/AyVino/AyVino/docs/backend/overview.md)
- 🎨 [Documentación Frontend (`docs/frontend/overview.md`)](file:///c:/Codigo%20General/AyVino/AyVino/docs/frontend/overview.md)
- 🚀 [Guía de Inicio Rápido (`docs/guides/getting-started.md`)](file:///c:/Codigo%20General/AyVino/AyVino/docs/guides/getting-started.md)
