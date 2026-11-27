---
title: "Roadmap y Próximos Hitos del Proyecto"
tipo: "gestion"
tags:
  - proyecto
  - roadmap
  - gestion
---

# 🗺️ Roadmap de Producto e Ingeniería - AyVino

Este documento consolida el plan de evolución, hitos alcanzados y próximas funcionalidades de **AyVino**, basado en la [[Especificacion_Requerimientos]], la arquitectura actual y los módulos en desarrollo.

---

## 📌 Estado de Hitos

### 🟢 Fase 1: Cimientos de Dominio y Arquitectura Base (Completado)
- [x] **Arquitectura Desacoplada**: API en .NET 10 (Minimal APIs + Vertical Slices) y SPA en React 19 + TypeScript + Tailwind CSS v4 ([[Arquitectura_Overview]]).
- [x] **Persistencia y Migraciones**: 11 migraciones automatizadas en PostgreSQL mediante FluentMigrator ([[Base_De_Datos_Migraciones]]).
- [x] **Seguridad y Sesiones**: Autenticación JWT stateless con rotación estricta de Refresh Tokens criptográficos en DB y Rate Limiting ([[Seguridad_Y_Autenticacion]]).
- [x] **Catálogo Central de Vinos**: Soporte de varietales, mezclas (blends porcentuales) y orígenes comunitarios vs. oficiales ([[Ciclo_Vida_Vino]]).
- [x] **Gestión Geográfica y Bodegas**: Slices de Provincias, Ciudades, Regiones Vitivinícolas y Bodegas ([[Catalogo_Endpoints_API]]).
- [x] **Cavas y Guardado**: Modelo de Cavas personales con control de stock, fecha de compra y notas de guarda.

---

### 🟡 Fase 2: Experiencia Social y Maridajes (En Desarrollo Activo)
- [x] **Diseño de Endpoints de Maridajes**: CRUD y consultas de pairings por vino y por categoría de plato ([[Backend_Overview]]).
- [ ] **Vista Frontend de Maridajes Interacivos** (`feat/vista-maridajes`):
  - [x] Estructuración de componentes y fondos temáticos.
  - [ ] Integración con la API de maridajes y filtros combinados (cepas vs. platos).
  - [ ] Sugerencias contextuales de servicio (temperatura, cristalería).
- [ ] **Interacciones Rápidas de Reseña y Likes** ([[Especificacion_Requerimientos#2-reseñas-e-interacciones|RF-2.1, RF-2.2]]):
  - [x] Endpoints y almacenamiento en DB para reseñas y calificaciones.
  - [ ] Componente visual de calificación por estrellas y reseñas enriquecidas en la ficha de vino.
  - [ ] Botón de "Me Gusta" reactivo con contador en tiempo real.
- [ ] **Colecciones Personales Fijas** ([[Especificacion_Requerimientos#3-colecciones-personales|RF-3.1]]):
  - [x] Backend de `UserWines` (Favoritos y Por Probar).
  - [ ] Vistas dedicadas en el perfil de usuario para gestionar listas personales.

---

### 🔴 Fase 3: Deduplicación, OCR y Onboarding de Bodegas (Próximos Pasos)
- [ ] **Flujo de Reclamo Oficial de Bodegas** ([[Especificacion_Requerimientos#1-gestión-del-catálogo-de-vinos-y-bodegas|RF-1.5]], [[Ciclo_Vida_Vino#4-proceso-de-reclamo-oficial-claim-wines]]):
  - [x] Servicio backend `claim-wines` con adopción de botellas comunitarias y traspaso histórico de reseñas.
  - [ ] Pantalla de verificación y panel de administración para bodegas en el Frontend.
- [ ] **Carga Rápida Asistida por Imagen / OCR** ([[Especificacion_Requerimientos#1-gestión-del-catálogo-de-vinos-y-bodegas|RF-1.2]]):
  - [ ] Captura de etiqueta desde cámara móvil / carga de archivo en frontend.
  - [ ] Procesamiento de texto de la etiqueta (OCR) para precargar bodega, año y varietal.
  - [ ] Modo fallback para ingreso manual guiado en caso de baja resolución.

---

### ⚪ Fase 4: Comunidad y Recomendaciones Inteligentes (Largo Plazo)
- [ ] **Red de Seguimiento entre Usuarios (`Follows`)**:
  - [x] Slice backend de seguidores/seguidos.
  - [ ] Feed dinámico de actividad: reseñas y descubrimientos de sommeliers seguidos.
- [ ] **Motor de Recomendación de Maridajes**:
  - [ ] Algoritmo heurístico que sugiera cepas a partir de perfiles de sabor de platos personalizados.
- [ ] **Alertas de Consumo Óptimo (WineCare)**:
  - [ ] Notificaciones en base a la ventana de guarda calculada según la añada y el tipo de vino.

---

## 🔗 Documentos de Referencia Relacionados
- [[Especificacion_Requerimientos]]: Requerimientos funcionales detallados (EARS).
- [[Arquitectura_Overview]]: Mapa general de componentes y subsistemas.
- [[Catalogo_Endpoints_API]]: Especificación técnica de contratos de API.
- [[Flujos_De_Datos]]: Diagramas de secuencia y flujos de negocio.

