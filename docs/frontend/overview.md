# Arquitectura y Diseño Frontend - AyVino

El frontend de AyVino es una Single Page Application (SPA) desarrollada en **React 19** con **TypeScript** estricto y empaquetada mediante **Vite**.

---

## 1. Stack y Tecnologías

- **Framework**: React 19 con Functional Components y Hooks.
- **Tipado**: TypeScript con configuración estricta (`strict: true`, `noUnusedLocals: true`, `noUnusedParameters: true`).
- **Build Tool**: Vite 8 con hot module replacement (HMR).
- **Estilos**: Tailwind CSS v4 con `@tailwindcss/vite`.
- **Iconografía**: `lucide-react`.
- **Rutas**: `react-router-dom` v7.
- **Comunicación HTTP**: `axios`.

---

## 2. Pautas Visuales y Estilo Editorial

AyVino adopta una línea visual editorial vinícola, cálida y limpia:

- **Paleta de Colores**:
  - `wine-*`: Tonos borravino, rubí profundo y granate noble.
  - `cream-*`: Fondos papel encerado, marfil y pergamino suave (`bg-cream-50`, `bg-cream-100`).
  - `earth-*`: Tipografías en tonos carbón y tierra oscura para máximo contraste sin la frialdad del negro puro.
- **Tipografías**:
  - `Playfair Display`: Títulos editoriales, nombres de etiquetas y encabezados nobles en serif.
  - `Plus Jakarta Sans`: Textos de cuerpo, notas de cata y formularios para máxima legibilidad.
- **Micro-interacciones**:
  - Elevaciones sutiles (`hover:-translate-y-1`), transiciones suaves y desenfoques controlados (`backdrop-blur-md`).
  - Paneles deslizantes (`AuthDrawer.tsx`) en lugar de modales intrusivos para preservar el contexto de lectura.

---

## 3. Convenciones de Tipado y TypeScript

- Todo nuevo componente debe tener sus `interface` o `type` explícitos para props.
- Los modelos compartidos residen en [`src/types/`](file:///c:/Codigo%20General/AyVino/AyVino/src/frontend/src/types):
  - [`wine.ts`](file:///c:/Codigo%20General/AyVino/AyVino/src/frontend/src/types/wine.ts): Interfaz `CuratedWine`.
  - [`auth.ts`](file:///c:/Codigo%20General/AyVino/AyVino/src/frontend/src/types/auth.ts): Tipos `AuthMode`, `AuthFormData`.
- Prohibido el uso de `any`; usar tipos discriminados, genéricos o `unknown` con type guards.

