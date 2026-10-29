---
title: "Centro de Documentación y Vault de Conocimiento - AyVino"
tipo: "meta"
tags:
  - vault
  - obsidian
  - indice
  - arquitectura
  - documentacion
---

# 📚 Centro de Documentación y Vault de Conocimiento - AyVino

Bienvenido al centro neurálgico de documentación técnica, gestión de producto y conocimiento de dominio enogastronómico de **AyVino**. Este espacio opera como un **Vault de Obsidian** integrado directamente con el ciclo de vida de desarrollo del proyecto.

---

## 🗺️ Estructura del Vault

```text
docs/
├── README.md                          # Este índice maestro y brújula de navegación
│
├── 00_Meta/                           # Metadocumentación, estándares y plantillas
│   ├── Templates/                     # Plantillas estandarizadas con YAML frontmatter
│   │   ├── tpl_cepa.md                # Plantilla para varietales y cepas
│   │   ├── tpl_maridaje.md            # Plantilla para platos y afinidades enogastronómicas
│   │   └── tpl_idea.md                # Plantilla para propuestas y notas de backlog
│   └── Styleguide.md                  # Convenciones de notas, tags en minúsculas y wikilinks
│
├── 01_Dominio/                        # Base de conocimiento de enología y gastronomía
│   ├── Cepas/                         # Fichas organolépticas de uvas y varietales
│   ├── Regiones/                      # Terruños, valles y regiones vitivinícolas
│   ├── Maridajes/                     # Afinidades y contrastes enogastronómicos
│   ├── Platos/                        # Platos culinarios de la gastronomía argentina
│   └── Glosario/                      # Términos enológicos y conceptos sommelier
│
├── 02_Proyecto/                       # Ingeniería de software, diseño y producto
│   ├── Arquitectura/                  # Decisiones de diseño técnico, diagramas y especificaciones
│   │   ├── Arquitectura_Overview.md   # Visión global del sistema, C4 y matriz tecnológica
│   │   ├── Flujos_De_Datos.md         # Diagramas de secuencia y flujos críticos
│   │   ├── Backend_Overview.md        # Vertical Slice Architecture, Dapper e infraestructura
│   │   ├── Catalogo_Endpoints_API.md  # Catálogo exhaustivo de endpoints Minimal APIs y DTOs
│   │   ├── Base_De_Datos_Migraciones.md # 11 migraciones FluentMigrator y modelo ERD
│   │   ├── Seguridad_Y_Autenticacion.md # Criptografía PBKDF2, JWT y Refresh Tokens
│   │   ├── Ciclo_Vida_Vino.md         # Origen oficial vs comunitario, blends y claiming
│   │   ├── Frontend_Overview.md       # React 19, Vite, Tailwind CSS v4 y estética editorial
│   │   └── Frontend_Navegacion_Flujo.md # Mapa de pantallas, UX y rutas protegidas
│   ├── MDE_Requerimientos/            # Requerimientos de producto y casos de uso
│   │   └── Especificacion_Requerimientos.md # Requisitos formales en sintaxis EARS
│   ├── Guias_Dev/                     # Puesta en marcha y manuales de desarrollo
│   │   └── Getting_Started.md         # Guía de inicio rápido (Docker, .NET, Vite, Tests)
│   └── Roadmap.md                     # Índice de hitos completados y pendientes
│
├── 03_Inbox_Ideas/                    # Bandeja de entrada rápida para notas sin procesar
│   └── README.md                      # Instructivo de uso y ciclo de maduración
│
└── 04_Assets/                         # Imágenes, infografías y diagramas estáticos
```

---

## 📑 Directorio Rápido de Documentos

### 🛠️ 00_Meta & Gobernanza
- [[00_Meta/Styleguide|Guía de Estilo y Convenciones]]: Reglas de nomenclatura atómica, frontmatter YAML y etiquetas en minúsculas.
- [[00_Meta/Templates/tpl_cepa|Plantilla de Cepa]]: Estructura para catalogar varietales.
- [[00_Meta/Templates/tpl_maridaje|Plantilla de Maridaje]]: Estructura para registrar armonizaciones culinarias.
- [[00_Meta/Templates/tpl_idea|Plantilla de Idea]]: Ficha para registrar propuestas de producto o backlog técnico.

### 🍇 01_Dominio Enogastronómico
- [[01_Dominio/Cepas/|Directorio de Cepas]]: Varietales de uva tintas, blancas y criollas de Argentina.
- [[01_Dominio/Regiones/|Directorio de Regiones]]: Valles y terruños vitivinícolas (Mendoza, San Juan, Salta, Patagonia, etc.).
- [[01_Dominio/Maridajes/|Directorio de Maridajes]]: Fichas sommelier de interacciones enogastronómicas.
- [[01_Dominio/Platos/|Directorio de Platos]]: Guía culinaria tradicional y contemporánea.
- [[01_Dominio/Glosario/|Glosario Sommelier]]: Definición de términos organolépticos y técnicos.

### 🏗️ 02_Proyecto & Ingeniería

#### Arquitectura
- [[Arquitectura_Overview]]: Modelo cliente-servidor desacoplado, diagrama C4 de contenedores y matriz tecnológica.
- [[Flujos_De_Datos]]: Diagramas de secuencia de autenticación, deduplicación/reclamo de vinos y manejo RFC 7807.
- [[Backend_Overview]]: Vertical Slice Architecture en `Features/`, abstracciones de `Common/` y acceso a datos con Dapper.
- [[Catalogo_Endpoints_API]]: Especificación exhaustiva de todas las rutas HTTP y validación de DTOs.
- [[Base_De_Datos_Migraciones]]: Catálogo de las 11 migraciones FluentMigrator y diagrama Entidad-Relación (ERD).
- [[Seguridad_Y_Autenticacion]]: PBKDF2 con DummyHash, doble token JWT rotativo y rate limiting.
- [[Ciclo_Vida_Vino]]: Procedencia `Community` vs `Official`, porcentajes en cortes de uva y proceso `claim-wines`.
- [[Frontend_Overview]]: Stack tecnológico (React 19 + TypeScript + Vite + Tailwind v4) e identidad visual.
- [[Frontend_Navegacion_Flujo]]: Árbol de navegación, guardias de ruta por rol y componentes interactivos.

#### Requerimientos y Gestión
- [[Especificacion_Requerimientos]]: Requisitos funcionales formales EARS (RF-1.1 al RF-3.1).
- [[Roadmap]]: Checklist vivo de los hitos alcanzados y próximas funcionalidades por implementar.

#### Guías de Ingeniería
- [[Getting_Started]]: Puesta en marcha paso a paso en entorno local (Docker PostgreSQL, Backend y Frontend).

### 📥 03_Inbox & Captura Rápida
- [[03_Inbox_Ideas/README|Bandeja de Entrada]]: Buzón rápido para volcar ideas, enlaces, dudas de arquitectura y notas de cata preliminares.

---

## 🏛️ Constitución del Proyecto

Toda contribución técnica o documental debe respetar la [[AGENTS.md|Constitución de AyVino (AGENTS.md)]]:
1. **Stack**: Backend en .NET Core (C#) y Frontend desacoplado en `src/frontend`.
2. **Base de Datos**: Cambios de esquema estructurados únicamente mediante `FluentMigrator`.
3. **Calidad**: Cero advertencias de compilador, tipado estricto y manejo global de excepciones.
4. **Límites**: Desacoplamiento estricto; la capa API no expone entidades de dominio, usa DTOs.
5. **Tests**: Cada nueva funcionalidad debe incluir sus respectivos tests en el directorio `tests`.
6. **Agente**: Reglas de desarrollo en `AGENTS.md` y flujos complejos en `.agents/skills/`.
7. **Documentación Viva**: Toda nueva funcionalidad, endpoint, cambio de esquema o vista debe reflejarse y documentarse automáticamente en su carpeta correspondiente dentro de `docs/` como parte de la definición de terminado (DoD).
