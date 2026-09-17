# Flujo de Navegación, UX y Arquitectura Frontend - AyVino

Este documento detalla el mapa de navegación, los flujos de usuario y la estrategia de integración frontend para la plataforma **AyVino**, alineado estrictamente con los requisitos funcionales de [`docs/requirements/spec.md`](file:///c:/Codigo%20General/AyVino/AyVino/docs/requirements/spec.md).

---

## 1. Mapa de Rutas (Routing & Pantallas)

AyVino utiliza `react-router-dom` para gestionar la navegación con soporte para rutas públicas, semi-protegidas (contenido visible pero acciones autenticadas) y privadas.

| Ruta | Vista / Componente | Acceso | Propósito |
| :--- | :--- | :--- | :--- |
| `/` | `Landing.tsx` | Público | Presentación de marca, hero 3D, muestra curada abierta sin bloqueo y accesos a registro/login. |
| `/catalogo` | `CatalogPage.tsx` | Público / Abierto | Explorador global de vinos con filtros combinados (cepa, bodega, región, altitud, procedencia oficial vs comunitaria). |
| `/vinos/:id` | `WineDetailPage.tsx` | Público / Abierto | Ficha de cata técnica detallada, organoléptica, maridaje, listado de reseñas y acciones interactivas. |
| `/bodegas/:id` | `WineryProfilePage.tsx` | Público / Abierto | Perfil de bodega con distinción entre bodega oficial verificada y bodega creada por comunidad ([RF-1.4](file:///c:/Codigo%20General/AyVino/AyVino/docs/requirements/spec.md)). |
| `/subir-vino` | `AddWinePage.tsx` | Requiere Auth | Carga comunitaria de vinos nuevos por foto o ingreso manual ([RF-1.2](file:///c:/Codigo%20General/AyVino/AyVino/docs/requirements/spec.md), [RF-1.6](file:///c:/Codigo%20General/AyVino/AyVino/docs/requirements/spec.md)). |
| `/mis-colecciones`| `MyCellarPage.tsx` | Requiere Auth | Panel personal del usuario con sus listas fijas: **"Favoritos"** y **"Por Probar"** ([RF-3.1](file:///c:/Codigo%20General/AyVino/AyVino/docs/requirements/spec.md)). |
| `/mi-perfil` | `ProfilePage.tsx` | Requiere Auth | Historial de reseñas del usuario, vinos aportados a la comunidad y ajustes de cuenta. |

---

## 2. Flujos Clave de Usuario (User Flows)

### Flujo A: Autenticación & Acceso (`AuthDrawer`)
- **Punto de activación**: Botón en `Navbar` ("Iniciar Sesión" / "Crear Cuenta") o gatillado contextual al intentar una acción restringida (ej. dar "Like", guardar en colección o publicar reseña).
- **Mecanismo**: Panel lateral deslizante (`AuthDrawer.tsx`) para mantener el contexto visual de la página en la que se encuentra el usuario.
- **Transición**:
  1. El usuario completa credenciales.
  2. La API emite el JWT y la cookie/token de refresh (`/api/auth/login` o `/api/auth/register`).
  3. El frontend almacena el estado en el contexto de autenticación (`AuthContext`).
  4. Si la apertura fue gatillada por una acción previa, la acción se completa automáticamente tras el login sin perder la posición del usuario.

---

### Flujo B: Exploración y Ficha de Cata ([RF-1.3](file:///c:/Codigo%20General/AyVino/AyVino/docs/requirements/spec.md), [RF-2.1](file:///c:/Codigo%20General/AyVino/AyVino/docs/requirements/spec.md), [RF-2.2](file:///c:/Codigo%20General/AyVino/AyVino/docs/requirements/spec.md))
- **Descubrimiento**:
  - En `/` (Landing): Se accede a través de la sección "Selección Curada" en modal rápido (`WineDetailModal.tsx`).
  - En `/catalogo`: Se listan las tarjetas interactivas (`WineCard.tsx`) con badges visibles de procedencia:
    - 🟢 **Bodega Oficial**: ficha con datos técnicos verificados.
    - 🟡 **Agregado por la comunidad**: ficha con datos y fotos aportados por usuarios.
- **Interacciones en Ficha**:
  - **Me Gusta / Like**: Toggle rápido ([RF-2.2](file:///c:/Codigo%20General/AyVino/AyVino/docs/requirements/spec.md)).
  - **Guardar en Colección**: Selector desplegable para asignar a *"Favoritos"* o *"Por Probar"* ([RF-3.1](file:///c:/Codigo%20General/AyVino/AyVino/docs/requirements/spec.md)).
  - **Escribir Reseña**: Calificación de 1 a 5 estrellas + reseña escrita en texto libre ([RF-2.1](file:///c:/Codigo%20General/AyVino/AyVino/docs/requirements/spec.md)).

---

### Flujo C: Carga Comunitaria de Vinos ([RF-1.2](file:///c:/Codigo%20General/AyVino/AyVino/docs/requirements/spec.md), [RF-1.6](file:///c:/Codigo%20General/AyVino/AyVino/docs/requirements/spec.md))
1. **Acceso**: Botón flotante o link en navegación `"Catalogar Vino"`.
2. **Método de Entrada**:
   - Opción A: Capturar/Subir foto de etiqueta (preparado para extracción OCR futura).
   - Opción B: Carga manual directa.
3. **Formulario y Validación**:
   - **Obligatorios**: Nombre del vino y Bodega ([RF-1.6](file:///c:/Codigo%20General/AyVino/AyVino/docs/requirements/spec.md) - feedback inmediato si faltan).
   - **Opcionales**: Cepa / Varietal, Añada, Región, Notas sensoriales, Foto.
4. **Publicación**:
   - El vino queda etiquetado inmediatamente como `"Agregado por la comunidad"`.
   - Se ofrece al usuario la opción de dejar la primera reseña o sumarlo a sus listas.

---

### Flujo D: Gestión de Colecciones Fijas ([RF-3.1](file:///c:/Codigo%20General/AyVino/AyVino/docs/requirements/spec.md))
- La pantalla `/mis-colecciones` presenta dos pestañas principales inmutables:
  1. **Favoritos**: Vinos ya probados que el usuario destaca.
  2. **Por Probar**: Lista de deseos / recomendaciones pendientes.
- Acciones rápidas:
  - Mover un vino de "Por Probar" a "Favoritos" con prompt para calificarlo.
  - Quitar de la lista con un click.

---

## 3. Arquitectura Técnica del Frontend

```text
src/frontend/src/
├── assets/             # Imágenes, isotipos, logotipos
├── components/         # Componentes reutilizables
│   ├── auth/           # AuthDrawer, AuthModal, ProtectedRoute
│   ├── common/         # Botones, Inputs, Badges, Modales base
│   ├── layout/         # Navbar, Footer, Sidebar
│   └── wine/           # WineCard, WineBottleMock, WineDetailModal, WineRatingStars
├── context/            # Contextos React (AuthContext, ToastContext)
├── hooks/              # Custom hooks (useAuth, useWines, useDebounce)
├── pages/              # Páginas de rutas principales (Landing, Catalog, etc.)
├── services/           # Clientes HTTP (api.ts, wineService.ts, authService.ts)
└── types/              # Interfaces TypeScript estrictas (wine.ts, auth.ts, api.ts)
```

### Gestión de Estado y Comunicación con la API
- **Cliente HTTP Centralizado**: Instancia configurada de `axios` (`services/api.ts`) que:
  - Inyecta automáticamente el header `Authorization: Bearer <token>`.
  - Captura respuestas `401 Unauthorized` para ejecutar el flujo de refresh token silencioso o abrir el `AuthDrawer`.
- **Estado de Sesión**: `AuthContext` expone `user`, `isAuthenticated`, `login()`, `logout()` y `openAuth(mode)`.
- **Tipado Estricto**: DTOs del backend espejados fielmente en `types/` garantizando cero discrepancias de contrato.

