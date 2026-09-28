# Arquitectura y Diseño Frontend - AyVino

El frontend de AyVino es una Single Page Application (SPA) desarrollada en **React 19** con **TypeScript** estricto y empaquetada mediante **Vite 8**.

---

## 1. Stack Tecnológico

| Dependencia | Versión | Rol / Justificación |
| :--- | :--- | :--- |
| **React** | 19.x | Interfaz reactiva con Concurrent Mode nativo y Functional Components con Hooks. |
| **TypeScript** | ~5.8 | Tipado estricto de extremo a extremo sin concesiones (`noUnusedLocals`, `noUnusedParameters`, cero `any`). |
| **Vite** | 8.x | Servidor de desarrollo con Hot Module Replacement (HMR) instantáneo y compilador optimizado. |
| **Tailwind CSS** | v4 (`@tailwindcss/vite`) | Motor de utilidades moderno de última generación integrado directamente con Vite. |
| **Lucide React** | ^1.46 | Iconografía vectorial consistente y liviana para acciones de usuario y navegación. |
| **React Router DOM** | v7.x | Enrutamiento declarativo del lado del cliente. |
| **Axios** | ^1.20 | Cliente HTTP para comunicación tipada con la API RESTful. |

---

## 2. Pautas Visuales y Estilo Editorial

AyVino implementa una estética de **revista editorial de vinos**: cálida, noble, sofisticada y limpia, distanciándose del diseño corporativo frío.

### 2.1 Paleta Cromática
- **Gama Vinícola (`wine-*`)**: Tonos borravino profundo, rubí y granate noble para acciones principales, acentos y estados activos.
- **Gama Papel / Pergamino (`cream-*`)**: Fondos basados en tonos marfil, papel encerado y pergamino suave (`bg-cream-50`, `bg-cream-100`) para generar calidez visual y lectura descansada.
- **Gama Tierra (`earth-*`)**: Tipografía en tonos carbón vegetal y tierra tostada para garantizar contraste óptimo según las pautas WCAG sin la dureza del negro puro.

### 2.2 Tipografías
- **`Playfair Display` (Serif)**: Encabezados editoriales, nombres de bodegas y títulos de botellas. Aporta elegancia clásica.
- **`Plus Jakarta Sans` (Sans-Serif)**: Textos de cuerpo, notas de cata, tablas técnicas y formularios. Prioriza la legibilidad en pantallas retina y móviles.

### 2.3 Micro-interacciones y UX
- Elevaciones sutiles (`hover:-translate-y-1`), transiciones graduales (`transition-all duration-300`) y sombras orgánicas.
- **Paneles Deslizantes Laterales (`AuthDrawer`)**: La autenticación se resuelve mediante un cajón lateral deslizante que preserva el contexto de lectura del usuario, evitando modales invasivos en pantalla completa.
- **Modales Contextuales de Botella (`WineDetailModal`)**: Despliegue de ficha técnica detallada (añada, graduación alcohólica, notas de cata y maridajes sugeridos).

---

## 3. Estructura de Directorios Clave

```text
src/frontend/src/
├── assets/                    # Recursos visuales estáticos (hero.png, logos)
├── components/                # Componentes modulares reutilizables
│   ├── auth/                  # Componentes de autenticación
│   │   ├── AuthDrawer.tsx     # Panel lateral deslizable (Login / Registro / Bodega)
│   │   └── AuthModal.tsx      # Modal alternativo de login
│   ├── layout/                # Estructura visual global
│   │   └── Navbar.tsx         # Barra de navegación con acciones de usuario
│   └── wine/                  # Componentes del catálogo de vinos
│       ├── WineBottleMock.tsx # Representación gráfica simulada de la botella
│       ├── WineCard.tsx       # Tarjeta de vino con puntuación y badges
│       └── WineDetailModal.tsx# Ficha técnica ampliada en modal
├── pages/                     # Páginas y vistas principales
│   └── Landing.tsx            # Vista de bienvenida con Hero y vinos destacados
├── types/                     # Definiciones de tipos e interfaces TypeScript
│   ├── auth.ts                # Tipos de autenticación (AuthMode, AuthFormData)
│   └── wine.ts                # Modelos de presentación (CuratedWine)
├── App.tsx                    # Componente contenedor raíz
├── index.css                  # Directivas de Tailwind CSS v4 y fuentes
└── main.tsx                   # Punto de entrada de React 19 y montaje en DOM
```

---

## 4. Convenciones de Tipado y TypeScript

1. **Prohibido el uso de `any`**: Cualquier tipo desconocido debe gestionarse con genéricos, tipos de unión discriminada o `unknown` con type guards.
2. **Interfaces Explícitas para Componentes**: Cada componente debe definir su interfaz `Props` explícita:
   ```typescript
   export interface WineCardProps {
     wine: CuratedWine;
     onSelect: (wine: CuratedWine) => void;
   }
   ```
3. **Modelos de Datos Centralizados en `src/types/`**: Evitar definiciones duplicadas de interfaces en componentes locales.
