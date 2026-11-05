# Hub de Maridaje Interactivo — Rediseño Editorial

> Implementado: 2026-10-31  
> Referencia de diseño: Stitch — "Hub de Maridaje: ¿Qué vas a comer?" y "¿Qué vas a tomar?"  
> Ruta: `/maridaje`

## Visión General

El Hub de Maridaje fue rediseñado de una UI tipográfica minimalista a una experiencia enogastronómica editorial e inmersiva, fiel al sistema de diseño **"Cava Nocturna & Revista Editorial"** definido en Stitch.

La arquitectura de datos (`pairingsData.ts`), el routing (`usePairingParams.ts`) y la lógica de estado se conservaron intactos. Solo se reescribieron los componentes visuales.

---

## Componentes Modificados

### `PairingInteractiveHub.tsx`
Orquestador principal. Ajuste de layout:
- `max-w-5xl` → `max-w-6xl` para dar más respiración al hero fotográfico
- `gap-8` → `gap-10` para mayor separación entre zonas
- Tokens de color actualizados al sistema "Cava Nocturna"

### `PairingWineSelector.tsx` — Vista "¿Qué vas a tomar?"
**Antes:** Chips de texto monoespaciado con filtros de texto.  
**Ahora:** Galería horizontal scrollable con miniaturas fotográficas de racimos de uva.

**Features:**
- `overflow-x-auto snap-x` para scroll táctil en mobile
- Miniaturas 96×96px con `object-cover`
- Borde rose-500 + glow (`shadow-[0_0_20px_rgba(255,178,184,0.35)]`) sobre el varietal activo
- Efecto `grayscale-[30%]` → color completo al hover/selección
- Fallback degradé elegante cuando no hay `grapeImageUrl` (muestra inicial del varietal)
- Filtros de categoría: Principales / Todos / Tintos / Blancos / Rosados/Naranjos

### `PairingFoodSelector.tsx` — Vista "¿Qué vas a comer?"
**Antes:** Chips monocromáticos de texto.  
**Ahora:** Tabs editoriales con íconos emoji y border-bottom animado.

**Features:**
- Tabs con `border-b-2 border-[#fbbf24]` en estado activo
- Íconos emoji representativos por categoría (🔥 Fuegos, 🥘 Ollas, 🍝 Pastas, 🐟 Mar, 🫓 Clásicos, 🧀 Quesos)
- Fila de platos concretos debajo con separación visual clara
- Scroll horizontal en mobile cuando hay muchas categorías

### `PairingDossierView.tsx` — Ficha Editorial Central
Refactorización completa con 8 sub-componentes extraídos.

---

## Sub-Componentes Nuevos

### `PairingHeroImage`
Imagen inmersiva full-width con overlay gradiente configurable.

```tsx
<PairingHeroImage src={url} alt="..." overlayFrom="bottom">
  {/* chips superpuestos al hero */}
</PairingHeroImage>
```

- `aspect-[21/9]` en desktop, `min-h-[220px]` en mobile
- `overlayFrom="bottom"` → gradiente `from-[#0e0e10]` para modo Plato
- `overlayFrom="top"` → gradiente `from-[#0e0e10]/80` para modo Cepa
- Los chips de temperatura/copa (modo Plato) o pills de sub-terruño (modo Cepa) se renderizan como `children` superpuestos

### `TechBar`
Barra de nivel visual para acidez, cuerpo y taninos.

Interpreta el texto del dato (ej: `"Media y redonda"`) en un nivel 1-5 y rellena barras de color `#722f37` proporcionalmente. Sin campo adicional en el data model.

### `PairingAffinityCard`
Card interactiva con badge de porcentaje para Afinidad (94%) y Contraste (72%).

```tsx
<PairingAffinityCard
  link={pairingLink}
  variant="affinity" | "contrast"
  mode="wine" | "food"
  currentName="Malbec"
  onSelectWine={...}
  onSelectFood={...}
/>
```

- Porcentajes: Afinidad = `94%`, Contraste = `72%` (valores editoriales fijos)
- Borde verde/ámbar según variante
- Click navega bidireccional al otro modo

### `PairingClashCard`
Card de alerta con ícono `AlertTriangle` (Lucide) en rose-400.

### `SpecChip`
Chip de dato técnico simple (temperatura, copa) para uso fuera del hero.

### `WineGlassSilhouette`
Componente vectorial de siluetas de copas enológicas realistas y anatómicamente diferenciadas (`viewBox="0 0 32 40"`):
- **Borgoña**: Balón prominente, panza esférica sobredimensionada (`w=25`) con boca recogida para captar ésteres volátiles y aromas sutiles.
- **Burdeos**: Cáliz alto, recto y estilizado (`w=15`, `h=20`) con hombros anchos para tintos con taninos y cuerpo.
- **Tulipán / Blancos**: Cáliz compacto en U (`w=11`) y tallo largo para retener la temperatura fría.
- **Flauta**: Tubo vertical ultra estrecho para concentrar el desprendimiento de burbujas en espumosos.
- Incluye etiqueta de subtítulo técnico descriptivo (`getGlassDisplayName`: ej. "Cáliz Balón (Borgoña)", "Cáliz Alto (Burdeos)").

### `EditorialBlock` & `WineEditorialDualCards`
- **Modo Plato (`EditorialBlock`)**: Bloque unificado apilado para Tip del Sommelier y Fundamento Bioquímico con borde izquierdo ámbar.
- **Modo Cepa (`WineEditorialDualCards`)**: Refactorizado al diseño Stitch de 2 tarjetas paralelas en grid responsive de 12 columnas (`grid-cols-1 lg:grid-cols-12 gap-6 mt-8`):
  - **Tarjeta Izquierda (`lg:col-span-4`) - Tip del Sommelier**:
    - Contenedor con `rounded-2xl border border-white/10 bg-[#121113] p-7`.
    - Badge con ícono SVG `Lightbulb` de Lucide y tipografía monoespaciada en ámbar (`text-amber-400 font-semibold`).
    - Título específico (`serviceTipTitle`) y descripción fluida del tip con separación vertical desahogada (`mt-5 mb-4`).
    - **Consejo Casero de Servicio (`practicalTip`)**: Tarjeta destacada con ícono `Sparkles` con tips reales y humanos de servicio casero (cómo oxigenar sin decanter, cómo enfriar express en frapera con agua, hielo y sal gruesa, o cómo templar blancos con crianza sin anestesiar la madera).
    - Footer con ícono SVG `Clock` de Lucide y metadata de servicio (`serviceMetadata`: ej. "APERTURA AROMÁTICA" / "30 MIN").
  - **Tarjeta Derecha (`lg:col-span-8`) - Fundamento y Por qué funciona**:
    - Contenedor con `rounded-2xl border border-white/10 bg-[#121113] p-7`.
    - Badge con ícono SVG `FlaskConical` de Lucide y etiqueta `POR QUÉ FUNCIONA • FUNDAMENTO`.
    - Pregunta rectora y explicación en lenguaje cercano y sensorial ("bajada a tierra"), con el mismo espaciado vertical armónico que la tarjeta izquierda (`mt-5 mb-4`).
    - Footer con 3 barras de progreso horizontales para métricas de balance y afinidad (`pairingMetrics`):
      - `variant: 'amber'`: `bg-amber-400` para afinidad grasa / lipídica.
      - `variant: 'wine'`: `bg-[#7a1c2d]` para balance y estructura tánica.
      - `variant: 'zinc'`: `bg-zinc-400` para retrogusto, mineralidad o notas de crianza.

### `WitnessBottleList`
Lista de etiquetas testigo estilizada con hover, truncado inteligente y link al catálogo.

### `WineFoodPairingSection` (Rediseño "Cuaderno Enogastronómico")
Grid temático de 3 columnas para recomendaciones gastronómicas en modo Cepa (`mode="wine"`):
- **Desktop (`lg`+)**: Grid de 3 columnas simultáneas:
  1. **Afinidad — Espejo Organoléptico**: Prioridad máxima, tarjeta fotográfica principal (`FeaturedPairingCard`) y fichas secundarias con porcentaje de afinidad (`SecondaryPairingCard`).
  2. **Contraste — Corte & Balance**: Equilibrio sensorial, tarjeta fotográfica destacada (`FeaturedPairingCard`) con badge "LIMPIEZA DE PALADAR" y fichas secundarias de balance.
  3. **Combinaciones a Evitar**: Alertas sommelier con badge "Alerta Química", explicación molecular del conflicto (`PairingAlertCard`) y chip con navegación directa hacia la cepa sugerida.
- **Mobile/Tablet (`< lg`)**: Selector de pestañas interactivas tipo pill (`Afinidad` / `Contraste` / `Evitar`) para evitar scroll infinito en pantallas reducidas.

### `FeaturedPairingCard` & `EditorialDishImage`
- Tarjeta editorial con imagen gastronómica, efecto zoom en hover, gradiente nocturno de fusión (`bg-gradient-to-t from-[#0e0e10]`), badge flotante con glassmorphism ("MARIDAJE PERFECTO", "LIMPIEZA DE PALADAR"), título en `font-serif`, descripción organoléptica y métricas de comida (intensidad, grasa, efecto, textura).
- `EditorialDishImage` incluye skeleton loader con pulso y fallback con micro-gradiente borravino.

### `SecondaryPairingCard`
- Ficha compacta con título, porcentaje en `font-mono` ámbar/esmeralda y descripción organoléptica.
- Al hacer clic, navega bidireccionalmente a la ficha del plato correspondiente (`?mode=food&food={id}`).

### `PairingAlertCard`
- Tarjeta de conflicto químico (`border-rose-950/60 bg-[#171415]`) con ícono `Ban`, título en `font-serif`, fundamento de colisión (`Reacción férrica`, `Colapso de acidez`, `Multiplicador de fuego`) y botón de acción con redirección directa a la cepa alternativa recomendada.

### `SourceContextBanner`
Banner de procedencia (cuando se llega desde un click bidireccional en otra vista).

---

## Sistema de Imágenes

Los campos `grapeImageUrl` y `foodImageUrl` ya existían en los tipos TypeScript. Se poblaron con URLs de Unsplash para los varietales y familias principales:

| Entidad | Campo |
|---|---|
| `malbec`, `cabernet-sauvignon`, `cabernet-franc`, `bonarda`, `pinot-noir`, `torrontes`, `chardonnay` | `grapeImageUrl` |
| `fuegos`, `ollas-y-guisos`, `pastas`, `rio-y-mar`, `clasicos-urbanos`, `quesos-charcuteria` | `foodImageUrl` |

Para reemplazar con imágenes propias: modificar las URLs en `src/data/pairingsData.ts`.

---

## Flujo de Navegación

```
/maridaje
  └── PairingInteractiveHub
        ├── PairingModeSelector     ← pill "¿Tomar?" / "¿Comer?"
        ├── PairingWineSelector     ← galería de racimos (modo wine)
        │   PairingFoodSelector     ← tabs editoriales (modo food)
        └── PairingDossierView
              ├── PairingHeroImage  ← foto inmersiva
              ├── TechBar ×3        ← acidez / cuerpo / taninos
              ├── EditorialBlock    ← tip + fundamento (modo food)
              ├── WineEditorialDualCards ← tip sommelier + fundamento bioquímico (modo wine)
              ├── WineFoodPairingSection ← Grid de 3 columnas (Afinidad, Contraste, Evitar) (modo wine)
              │     ├── FeaturedPairingCard (con EditorialDishImage)
              │     ├── SecondaryPairingCard ×N
              │     └── PairingAlertCard ×N
              ├── SuggestionsSection ← afinidad, contraste y alertas en modo food
              └── WitnessBottleList
```

## Estado y URL

Toda la selección se serializa en SearchParams — sin estado local fuera del componente:

| Param | Valores | Significado |
|---|---|---|
| `mode` | `wine` \| `food` | Modo activo |
| `wine` | ID del varietal | Cepa seleccionada |
| `food` | ID de familia o plato | Comida seleccionada |
| `style` | `tradicional` \| `altura` etc. | Sub-terruño activo |
| `from` | Nombre de origen | Contexto de navegación bidireccional |

