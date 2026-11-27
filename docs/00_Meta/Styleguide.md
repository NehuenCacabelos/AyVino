---
title: "Guía de Estilo y Convenciones del Vault"
tipo: "meta"
tags:
  - meta
  - convenciones
  - styleguide
---

# 📐 Guía de Estilo y Convenciones del Vault - AyVino

Este documento define los lineamientos para crear, mantener y vincular notas dentro del Vault de documentación y conocimiento de **AyVino**.

---

## 1. Nomenclatura de Archivos y Notas

- **Notas atómicas y en singular**: Cada nota debe representar un concepto claro e indivisible (ej: `Malbec.md` en vez de `VinosTintosVariados.md`, o `Autenticacion_JWT.md`).
- **Formato de nombres**: Usa nombres concisos y legibles. Para notas de dominio se recomienda `PascalCase` o mayúscula inicial (`Cabernet_Sauvignon.md`, `Ojo_De_Bife.md`).
- **Sin caracteres especiales**: Evita caracteres reservados (`:`, `/`, `\`, `?`, `*`, `|`) en los nombres de archivo.

---

## 2. Frontmatter YAML Estándar

Toda nota nueva debe iniciar obligatoriamente con un bloque de metadatos YAML delimitado por `---`:

```yaml
---
title: "Título de la Nota"
fecha: "2026-10-28"
tipo: "cepa" # o: maridaje | arquitectura | guia | idea | glosario
tags:
  - cepa
  - dominio
---
```

- **Consistencia de tipos**: Utiliza los campos tipados provistos en las plantillas oficiales (`00_Meta/Templates/`).
- **No inventar campos arbitrarios**: Mantén alineados los metadatos con el esquema de Dataview/Obsidian para consultas automatizadas.

---

## 3. Uso de Etiquetas (Tags)

- **Siempre en minúsculas**: `#cepa`, `#maridaje`, `#backend`, `#frontend`, `#seguridad`.
- **Compuestos con kebab-case o guion bajo**: `#base-de-datos`, `#rate-limit` o `#ux_ui`.
- **Propósito de los tags**: Los tags se reservan para agrupar notas por naturaleza transversal (`#bug`, `#idea`, `#pendiente`, `#sommelier`), mientras que la jerarquía y pertenencia estructural se maneja mediante carpetas y Wikilinks.

---

## 4. Enlaces y Red de Conocimiento (Wikilinks)

- **Sintaxis preferida**: Utiliza Wikilinks nativos de Obsidian: `[[NombreNota]]` o con alias `[[NombreNota|Texto personalizado]]`.
- **Enlaces a secciones**: Utiliza `[[NombreNota#Sección|Alias]]` para apuntar a encabezados específicos.
- **Vínculos a multimedia**: Almacena imágenes, esquemas e infografías en `04_Assets/` e insértalas como `![[Assets/nombre_imagen.png]]`.
- **Densidad de enlaces**: Conecta activamente las notas entre sí (ej. una cepa debe enlazar a sus regiones y maridajes recomendados).

---

## 5. Ciclo de Vida del Conocimiento

1. **Captura Rápida (`03_Inbox_Ideas/`)**: Si tienes una idea, hallazgo o nota rápida sin pulir, guárdala en el Inbox sin preocuparte por el formato.
2. **Refinamiento**: Durante la revisión semanal/sprint, toma notas del Inbox, aplica la plantilla correspondiente desde `00_Meta/Templates/` y clasifícala en `01_Dominio/` o `02_Proyecto/`.
3. **Consolidación**: Asegura que la nueva nota quede enlazada desde los índices temáticos o el [[Roadmap]].

