# Ciclo de Vida del Vino, Cortes y Reclamo Oficial - AyVino.Api

Este documento describe las reglas de negocio del dominio vitivinícola en AyVino: procedencia de botellas, estados de moderación, formulación de cortes de uva (blends) y el protocolo de adopción o reclamo de vinos por bodegas oficiales.

---

## 1. Procedencia y Tipos de Origen (`SourceType`)

Cada vino en el catálogo posee un origen explícito que define su grado de certificación institucional:

| Valor Enumérico | Identificador | Creador Típico | Características |
| :---: | :--- | :--- | :--- |
| `1` | `SourceType.Community` | Usuario / Aficionado | Creado cuando no se especifica una bodega oficial registrada (`winery_id IS NULL`). El usuario ingresa el nombre de la bodega en el campo textual `winery_name_text`. Se muestra con la etiqueta pública *"Agregado por la comunidad"*. |
| `2` | `SourceType.Official` | Bodega Verificada / Reclamo | Creado directamente por una bodega con cuenta oficial en la plataforma o promovido tras un proceso de reclamo exitoso (`claim`). |

---

## 2. Estados de Moderación (`WineApprovalStatus`)

Todo vino nuevo ingresa con estado inicial `Pending` para garantizar la calidad del catálogo:

```mermaid
stateDiagram-v2
    [*] --> Pending: Alta de Vino (Community u Official)
    Pending --> Approved: Aprobación por Admin
    Pending --> Rejected: Rechazo por Admin
    Rejected --> Pending: Corrección y reenvío por creador
    Approved --> [*]
```

- **`1 = Pending`**: La cosecha/vino fue creado y está a la espera de revisión editorial o verificación de datos.
- **`2 = Approved`**: La cosecha/vino es visible en búsquedas públicas y listados generales.
- **`3 = Rejected`**: La cosecha/vino no cumple con los estándares mínimos de calidad (ej. datos apócrifos o duplicados manifiestos).

---

## 3. Cortes de Uva y Composición Varietal (Blends)

AyVino modela la enología real permitiendo tanto varietales puros (100% de una cepa) como cortes multivarietales (blends).

### Reglas de Validación de Dominio:
1. **Existencia de Cepas**: Cada `GrapeId` provisto en el corte debe existir previamente en el catálogo de `grapes`.
2. **Restricción de Porcentaje (`CK_WineGrapes_Percentage`)**:
   - Todo porcentaje individual debe ser estrictamente mayor a `0` y menor o igual a `100.00%`.
   - La suma total de los porcentajes especificados en el blend no puede exceder el `100.00%`.
3. **Persistencia Transaccional**:
   Al crear o actualizar un vino (`WineRepository.CreateAsync` / `UpdateAsync`), la inserción en la tabla `wine_grapes` se efectúa dentro de la misma transacción física, garantizando atomicidad.

---

## 4. El Proceso de Reclamo Oficial (Wine Claim Flow)

Para resolver el problema del contenido generado por usuarios antes de que una bodega se sume a la plataforma, se implementa el flujo de reclamo ([RF-1.5](../requirements/spec.md)):

```mermaid
graph TD
    A["Usuario carga vino: 'Malbec Reserva' / Bodega: 'La Rural'"] --> B["Vino registrado como Community (SourceType=1, winery_id=NULL)"]
    B --> C["Bodega 'La Rural' se registra formalmente en AyVino"]
    C --> D["Bodega consulta /api/wines/claim-candidates/{wineryId}"]
    D --> E["El sistema lista 'Malbec Reserva' por coincidencia de nombre textual"]
    E --> F["Bodega envía POST /api/wines/claim/{wineryId} con los IDs a adoptar"]
    F --> G["El sistema asigna winery_id y promueve SourceType a Official (2)"]
    G --> H["El vino pasa a ser parte del catálogo oficial de la bodega sin perder reseñas históricas"]
```

### Endpoints Intervinientes:
- **`GET /api/wines/claim-candidates/{wineryId}`**:
  Busca vinos con `winery_id IS NULL` y cuyo `winery_name_text` coincida fonética o textualmente (`ILIKE`) con el nombre de la bodega registrada.
- **`POST /api/wines/claim/{wineryId}`**:
  Recibe un `ClaimWinesRequestDto` con la lista de `WineIds`. Actualiza la columna `winery_id` y conmuta `source_type = SourceType.Official`.

---

## 5. Fundamentos para Deduplicación y Merge (Pieza C)

La migración `20260830003_AddWineClaimFields` incorporó la columna autoverificable `duplicate_of_wine_id` con foreign key recursiva a la misma tabla `wines`.

Esto sienta las bases para consolidar vinos idénticos cargados por múltiples usuarios:
- Un vino duplicado puede apuntar a su vino canónico (`duplicate_of_wine_id = original_wine_id`).
- Las calificaciones y reseñas se reasignan al vino maestro mediante cascada lógica, preservando el feedback de la comunidad sin saturar el catálogo.

---

## 6. Catálogo de Enumeradores del Sistema

Valores numéricos e identificadores sincronizados con el código backend:

### A. Vinos y Bodegas
- **`WineType`**: `Red = 1`, `White = 2`, `Rose = 3`, `Sparkling = 4`, `Orange = 5`
- **`SourceType`**: `Community = 1`, `Official = 2`
- **`ApprovalStatus`**: `Pending = 1`, `Approved = 2`, `Rejected = 3`
- **`WineryStatus`**: `Pending = 1`, `Approved = 2`, `Rejected = 3`
- **`CityStatus`**: `Approved = 1`, `Pending = 2`, `Rejected = 3`

### B. Varietales y Cepas (Grapes)
- **`ColorType`**: `Red = 1`, `White = 2`, `Rose = 3`, `Orange = 4`
- **`TypicalBody`**: `Light = 10`, `MediumLight = 20`, `Medium = 30`, `MediumFull = 40`, `Full = 50`
- **`TypicalTannins`**: `Soft = 10`, `MediumSoft = 20`, `Medium = 30`, `MediumAstringent = 40`, `Astringent = 50`
- **`TypicalAcidity`**: `Low = 10`, `MediumLow = 20`, `Medium = 30`, `MediumHigh = 40`, `High = 50`

### C. Maridajes (Pairings)
- **`PairingCategory`**:
  - `Meat = 1` (Carnes rojas / blancas)
  - `Fish = 2` (Pescados)
  - `Seafood = 3` (Mariscos)
  - `Cheese = 4` (Quesos)
  - `Dessert = 5` (Postres)
  - `Pasta = 6` (Pastas)
  - `Vegetarian = 7` (Vegetales / vegetariano)
  - `Appetizer = 8` (Picadas / aperitivos)
  - `Other = 9` (Otros)

### D. Cuidado y Guarda (WineCare)
- **`DrinkingStatus`**: `TooYoung = 10`, `InWindow = 20`, `DrinkSoon = 30`, `PastPeak = 40`
- **`AdviceSource`**: `Declared = 1`, `Inferred = 2`


