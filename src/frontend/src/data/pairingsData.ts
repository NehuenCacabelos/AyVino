import { CURATED_WINES } from '../features/wines/data/curatedWines';
import type { CuratedWine } from '../types/wine';

/**
 * Taxonomía cerrada de categorías gastronómicas adaptadas a la cultura culinaria argentina
 */
export type FoodCategoryId =
  | 'asado-fuegos'
  | 'empanadas-regional'
  | 'pastas-robustas'
  | 'picadas-quesos'
  | 'pescados-rio-mar'
  | 'cocina-urbana'
  | 'dulces-criollos';

/**
 * Taxonomía cerrada de cepas argentinas e internacionales insignia
 */
export type WineVarietyId =
  // 1. Tintos
  | 'malbec'
  | 'cabernet-sauvignon'
  | 'cabernet-franc'
  | 'bonarda'
  | 'syrah'
  | 'merlot'
  | 'pinot-noir'
  | 'tannat'
  | 'garnacha'
  | 'tempranillo'
  | 'petit-verdot'
  | 'aspirant-bouschet'
  | 'ancellotta'
  // 2. Blancos
  | 'torrontes'
  | 'chardonnay'
  | 'sauvignon-blanc'
  | 'pinot-gris'
  | 'viognier'
  | 'albarino'
  | 'semillon'
  | 'chenin'
  | 'ugni-blanc'
  // 3. Criollas / Otras / Rosados
  | 'criolla-chica'
  | 'moscatel-rosado'
  | 'moscatel-alejandria'
  | 'pedro-gimenez'
  | 'cereza'
  | 'rosado-seco'
  | 'espumante-dulce';

export type WineCategoryGroup = 'Tintos' | 'Blancos' | 'Criollas / Rosados';

export type PairingPrinciple =
  | 'Complemento molecular'
  | 'Contraste y corte graso'
  | 'Afinidad ácida'
  | 'Sinergia sápida y de textura'
  | 'Equilibrio de dulzor y taninos';

export interface FoodPairingEntity {
  id: FoodCategoryId;
  title: string;
  badge: string;
  dishes: string[];
  recommendedVarieties: WineVarietyId[];
  sommelierNote: string;
  serviceTip: string;
  glassware: string;
  servingTemperature: string;
  principle: PairingPrinciple;
  curatedWineIds: number[];
  headline?: string;
  affinityNote?: string;
}

export interface WineVarietyEntity {
  id: WineVarietyId;
  title: string;
  categoryGroup: WineCategoryGroup;
  wineType: 'Tinto' | 'Blanco' | 'Rosado' | 'Espumante';
  body: 'Ligero' | 'Medio' | 'Con cuerpo' | 'Robusto y estructurado';
  acidity: 'Baja' | 'Media' | 'Media-Alta' | 'Vibrante y filosa';
  tannins?: 'Sedosos y pulposos' | 'Firmes y calcáreos' | 'Dóciles y amables' | 'Cárnicos y potentes' | 'Estructurados y envolventes';
  flavorProfile: string;
  recommendedFoods: FoodCategoryId[];
  sommelierNote: string;
  serviceTip: string;
  glassware: string;
  servingTemperature: string;
  curatedWineIds: number[];
  headline?: string;
  agingPotential?: string;
  tanninsScore?: number; // Escala 1 a 10
  acidityScore?: number; // Escala 1 a 10
  bodyScore?: number;    // Escala 1 a 10
}

/**
 * Matriz consolidada de Maridaje Gastronómico Argentino (¿Qué vas a comer?)
 */
export const FOOD_PAIRINGS: Record<FoodCategoryId, FoodPairingEntity> = {
  'asado-fuegos': {
    id: 'asado-fuegos',
    title: 'Asado & Fuegos',
    badge: 'Brasas, Humo & Cortes Nobles',
    headline: 'Colágeno, Leña Seca & Redondez Tánica',
    affinityNote: 'CORTE GRASO / FUEGO',
    dishes: ['Asado de tira', 'Vacío a la llama', 'Entraña jugosa', 'Matambre a la pizza', 'Achuras / mollejas'],
    recommendedVarieties: ['malbec', 'cabernet-sauvignon', 'bonarda', 'syrah', 'tannat', 'cabernet-franc'],
    sommelierNote:
      'El colágeno, la grasa infiltrada y el ahumado de la leña exigen tintos con estructura, buen volumen y agarre tánico. El tanino funde la proteína animal mientras la acidez limpia el paladar para renovar cada bocado del ritual parrillero.',
    serviceTip: 'Servir entre 16°C y 18°C. En tintos de gran concentración de altura se recomienda descorchar o decantar 30 minutos antes.',
    glassware: 'Copa Burdeos de cáliz amplio (oxigena y redondea taninos potentes)',
    servingTemperature: '16°–18°C',
    principle: 'Complemento molecular',
    curatedWineIds: [1, 2], // Piedra Infinita Malbec, El Enemigo Cabernet Franc
  },
  'empanadas-regional': {
    id: 'empanadas-regional',
    title: 'Empanadas & Cocina Regional',
    badge: 'Olla de Barro, Pimentón & Identidad Andina',
    headline: 'Comino, Masa Hojaldrada & Frescura Criolla',
    affinityNote: 'ESPECIAS & CEBOLLA',
    dishes: ['Empanadas salteñas de corte a cuchillo', 'Humita en chala', 'Locro criollo', 'Tamales'],
    recommendedVarieties: ['torrontes', 'criolla-chica', 'malbec', 'bonarda', 'semillon'],
    sommelierNote:
      'Las cocciones criollas de olla y las empanadas jugosas con comino y pimentón encuentran su gran contrapunto en la tipicidad autóctona: el Torrontés salteño refresca y exalta el picor, mientras una Criolla Chica o un Malbec joven aportan frescura y trago fluido.',
    serviceTip: 'Torrontés frío a 8°–10°C para calmar el picante; Criollas o tintos jóvenes a 13°–15°C para resaltar su perfil de frutos silvestres.',
    glassware: 'Copa Tulipa para blancos aromáticos o copa estándar de tinto',
    servingTemperature: '8°–10°C (Torrontés) · 13°–15°C (Criollas/Tintos)',
    principle: 'Contraste y corte graso',
    curatedWineIds: [4, 3, 1], // Colomé Torrontés, Cara Sur Criolla Chica, Piedra Infinita
  },
  'pastas-robustas': {
    id: 'pastas-robustas',
    title: 'Pastas Caseras & Salsas Robustas',
    badge: 'Mesa Familiar, Tuco Casero & Herencia Italiana',
    headline: 'Reducción de Tomate, Osobuco & Acidez Viva',
    affinityNote: 'ACIDEZ & REDUCCIÓN',
    dishes: ['Ñoquis de la abuela con estofado', 'Sorrentinos de jamón y mozzarella con fileto', 'Tuco casero'],
    recommendedVarieties: ['bonarda', 'cabernet-franc', 'tempranillo', 'merlot', 'ancellotta'],
    sommelierNote:
      'La acidez natural del tomate maduro cocinado a fuego lento y la riqueza de las pastas caseras demandan tintos con buena acidez gastronómica y fruta viva. La Bonarda argentina y el Cabernet Franc abrazan el tuco sin saturar ni eclipsar la masa artesanal.',
    serviceTip: 'Servir a 15°–16°C. Ligeramente refrescados ganan tensión frutal y armonía con salsas especiadas.',
    glassware: 'Copa Borgoña o copa de tinto con boca semicerrada',
    servingTemperature: '15°–17°C',
    principle: 'Afinidad ácida',
    curatedWineIds: [2], // El Enemigo Cabernet Franc
  },
  'picadas-quesos': {
    id: 'picadas-quesos',
    title: 'Picadas, Picoteo & Quesos',
    badge: 'Tradición de Campo & Charcutería Artesanal',
    headline: 'Caseína, Fiambres Curados & Fruta Crujiente',
    affinityNote: 'SALITRE & CONTRASTE',
    dishes: ['Picada de fiambres artesanales', 'Quesos duros de Tandil', 'Jamón crudo', 'Aceitunas y frutos secos'],
    recommendedVarieties: ['malbec', 'syrah', 'garnacha', 'criolla-chica', 'rosado-seco'],
    sommelierNote:
      'El salitre de los chacinados nobles y la cremosidad de los quesos de guarda armonizan tanto con tintos carnosos de perfil especiado (Syrah, Malbec) como con Criollas o Rosados secos que cortan el punto graso y hacen eterno el picoteo de sobremesa.',
    serviceTip: 'Servir los tintos a 16°C y los rosados a 9°–11°C mientras la tabla toma temperatura ambiente.',
    glassware: 'Copa Burdeos clásica o copa universal de cata',
    servingTemperature: '10°–12°C (Rosados) · 15°–17°C (Tintos)',
    principle: 'Complemento molecular',
    curatedWineIds: [1, 3], // Piedra Infinita Malbec, Cara Sur Criolla Chica
  },
  'pescados-rio-mar': {
    id: 'pescados-rio-mar',
    title: 'Pescados de Río & Mar',
    badge: 'Aguas Dulces, Atlántico & Cordillera',
    headline: 'Cítricos, Salinidad & Texturas Delicadas',
    affinityNote: 'YODO & EQUILIBRIO',
    dishes: ['Surubí a la parrilla', 'Pacú al limón', 'Rabas', 'Trucha patagónica'],
    recommendedVarieties: ['chardonnay', 'sauvignon-blanc', 'torrontes', 'pinot-gris', 'pinot-noir'],
    sommelierNote:
      'Los pescados grasos de río como pacú o surubí piden blancos untuosos con paso por madera o Sauvignon Blanc con filo cítrico. Para truchas patagónicas, un Pinot Noir de zona fría o un Chardonnay de altura brindan la sintonía textural ideal.',
    serviceTip: 'Blancos frescos a 8°–10°C; Chardonnay con roble a 11°–12°C; Pinot Noir patagónico a 13°–14°C.',
    glassware: 'Copa de vino blanco esbelta o copa Borgoña para Pinot Noir',
    servingTemperature: '8°–11°C (Blancos) · 13°–14°C (Pinot Noir)',
    principle: 'Sinergia sápida y de textura',
    curatedWineIds: [4], // Colomé Torrontés
  },
  'cocina-urbana': {
    id: 'cocina-urbana',
    title: 'Cocina Urbana & Gourmet',
    badge: 'Bodegón Contemporáneo & Cocina de Autor',
    headline: 'Cocciones al Disco, Verdeo & Elegancia Cárnica',
    affinityNote: 'PROFUNDIDAD & EMULSIÓN',
    dishes: ['Ojo de bife con papas rústicas', 'Cordero patagónico al disco', 'Pollo al verdeo'],
    recommendedVarieties: ['cabernet-sauvignon', 'petit-verdot', 'pinot-noir', 'viognier', 'chardonnay'],
    sommelierNote:
      'Platos con salsas untuosas, emulsiones de verdeo y fondos de cocción profunda requieren vinos con presencia y elegancia. Desde la corpulencia de un Cabernet Sauvignon o Petit Verdot para el cordero, hasta la untuosidad de un Viognier o Chardonnay para aves en cremas.',
    serviceTip: 'Servir tintos a 16°–18°C y blancos gastronómicos a 10°–12°C para apreciar todas sus capas aromáticas.',
    glassware: 'Copa Burdeos amplia o Copa Montrachet',
    servingTemperature: '11°–12°C (Blancos) · 16°–18°C (Tintos)',
    principle: 'Complemento molecular',
    curatedWineIds: [1, 2], // Piedra Infinita Malbec, El Enemigo Cabernet Franc
  },
  'dulces-criollos': {
    id: 'dulces-criollos',
    title: 'Dulces & Postres Criollos',
    badge: 'Sobremesa Criolla & Tradición Porteña',
    headline: 'Dulce de Leche, Almíbares & Burbuja Cremosa',
    affinityNote: 'DULZOR & EQUILIBRIO',
    dishes: ['Flan casero con dulce de leche', 'Vigilante de queso y batata', 'Alfajores artesanales', 'Postre borracho'],
    recommendedVarieties: ['espumante-dulce', 'moscatel-alejandria', 'moscatel-rosado', 'pedro-gimenez', 'cereza'],
    sommelierNote:
      'El caramelo, el queso y el dulce de leche reclaman un vino que no se apague ante la alta concentración de azúcar. Espumantes dulces método Charmat, blancos de uvas Moscatel y Pedro Giménez aportan burbuja, frescura cítrica y notas melosas que equilibran la sobremesa sin empalagar.',
    serviceTip: 'Servir muy frío, entre 6°C y 8°C. La baja temperatura realza la frescura y templa la sensación dulce en paladar.',
    glassware: 'Copa Tulipa de Espumante o copa pequeña de postre',
    servingTemperature: '6°–8°C',
    principle: 'Equilibrio de dulzor y taninos',
    curatedWineIds: [],
  },
};

/**
 * Matriz consolidada de Cepas Enológicas Argentinas e Internacionales (¿Qué vas a tomar?)
 * 29 cepas con métricas sensoriales precisas
 */
export const WINE_VARIETIES: Record<WineVarietyId, WineVarietyEntity> = {
  // ==========================================
  // 1. TINTOS (13)
  // ==========================================
  malbec: {
    id: 'malbec',
    title: 'Malbec',
    categoryGroup: 'Tintos',
    wineType: 'Tinto',
    body: 'Con cuerpo',
    acidity: 'Media-Alta',
    tannins: 'Sedosos y pulposos',
    headline: 'Potencia Andina, Violetas & Tiza Calcárea',
    agingPotential: '5 a 15 años',
    tanninsScore: 7.5,
    acidityScore: 7.2,
    bodyScore: 8.5,
    flavorProfile: 'Ciruelas negras confitadas, moras silvestres, violetas andinas y leves dejos de cacao.',
    recommendedFoods: ['asado-fuegos', 'picadas-quesos', 'cocina-urbana'],
    sommelierNote:
      'La cepa insignia de la vitivinicultura argentina. Su ataque dulce y taninos redondos funden a la perfección con la proteína animal y el tostado de las brasas sin secar las encías.',
    serviceTip: 'Decantar 20 minutos si proviene de suelos calcáreos de altura. Servir a 16°–18°C.',
    glassware: 'Copa Burdeos',
    servingTemperature: '16°–18°C',
    curatedWineIds: [1], // Piedra Infinita Malbec
  },
  'cabernet-sauvignon': {
    id: 'cabernet-sauvignon',
    title: 'Cabernet Sauvignon',
    categoryGroup: 'Tintos',
    wineType: 'Tinto',
    body: 'Robusto y estructurado',
    acidity: 'Media-Alta',
    tannins: 'Firmes y calcáreos',
    headline: 'Estructura Imponente, Casis & Grafito',
    agingPotential: '8 a 20 años',
    tanninsScore: 9.0,
    acidityScore: 7.5,
    bodyScore: 9.2,
    flavorProfile: 'Casis, pimiento rojo asado, cedro, tabaco y pimienta negra en grano.',
    recommendedFoods: ['asado-fuegos', 'cocina-urbana', 'picadas-quesos'],
    sommelierNote:
      'El rey tinto universal encuentra en Argentina versiones de gran madurez y especiado noble. Su esqueleto tánico pide carnes grasas a las brasas y cocciones largas al disco.',
    serviceTip: 'Servir a 17°–18°C en copa amplia para oxigenar sus notas terciarias.',
    glassware: 'Copa Burdeos grande',
    servingTemperature: '17°–18°C',
    curatedWineIds: [],
  },
  'cabernet-franc': {
    id: 'cabernet-franc',
    title: 'Cabernet Franc',
    categoryGroup: 'Tintos',
    wineType: 'Tinto',
    body: 'Medio',
    acidity: 'Vibrante y filosa',
    tannins: 'Firmes y calcáreos',
    headline: 'Tensión Mineral, Pirazinas Elegantes & Fruta Roja',
    agingPotential: '6 a 12 años',
    tanninsScore: 7.8,
    acidityScore: 8.6,
    bodyScore: 7.5,
    flavorProfile: 'Pimientos dulces horneados, grafito, jarilla, frambuesas y textura mineral de tiza.',
    recommendedFoods: ['pastas-robustas', 'asado-fuegos', 'cocina-urbana'],
    sommelierNote:
      'Cepa estrella del Valle de Uco con acidez vertical, notas herbales y textura de tiza. Marida de manera deslumbrante con salsas de tomate cocidas a fuego lento y cortes vacunos a la parrilla.',
    serviceTip: 'Servir a 15°–17°C para realzar su perfil de frescura pirazínica elegante.',
    glassware: 'Copa Burdeos o Borgoña',
    servingTemperature: '15°–17°C',
    curatedWineIds: [2], // El Enemigo Cabernet Franc
  },
  bonarda: {
    id: 'bonarda',
    title: 'Bonarda',
    categoryGroup: 'Tintos',
    wineType: 'Tinto',
    body: 'Medio',
    acidity: 'Vibrante y filosa',
    tannins: 'Dóciles y amables',
    headline: 'Fruta Golosa, Frescura Viva & Taninos Sedosos',
    agingPotential: '3 a 7 años',
    tanninsScore: 6.0,
    acidityScore: 7.8,
    bodyScore: 6.8,
    flavorProfile: 'Cerezas maduras, granada, higos frescos y una sutil nota especiada anisada.',
    recommendedFoods: ['pastas-robustas', 'asado-fuegos', 'empanadas-regional'],
    sommelierNote:
      'La segunda tinta más plantada de Argentina. Exuberancia de fruta roja, taninos sedosos y gran acidez. Es el acompañante histórico indiscutido de los ñoquis del 29 y el tuco dominical.',
    serviceTip: 'Servir a 14°–16°C; ligeramente refrescada gana vivacidad y trago fluido.',
    glassware: 'Copa estándar de tinto',
    servingTemperature: '14°–16°C',
    curatedWineIds: [],
  },
  syrah: {
    id: 'syrah',
    title: 'Syrah',
    categoryGroup: 'Tintos',
    wineType: 'Tinto',
    body: 'Con cuerpo',
    acidity: 'Media',
    tannins: 'Cárnicos y potentes',
    headline: 'Pimienta Negra, Ahumados & Carnosidad Andina',
    agingPotential: '5 a 12 años',
    tanninsScore: 8.0,
    acidityScore: 6.5,
    bodyScore: 8.4,
    flavorProfile: 'Pimienta negra recién molida, aceitunas negras, cuero noble y compota de arándanos.',
    recommendedFoods: ['asado-fuegos', 'picadas-quesos', 'cocina-urbana'],
    sommelierNote:
      'Sensual, cálido y especiado. En valles como San Juan o Mendoza despliega notas ahumadas y cárnicas que son el maridaje canónico para cordero a la cruz y chacinados de caza.',
    serviceTip: 'Servir a 16°–18°C.',
    glassware: 'Copa Syrah / Burdeos',
    servingTemperature: '16°–18°C',
    curatedWineIds: [],
  },
  merlot: {
    id: 'merlot',
    title: 'Merlot',
    categoryGroup: 'Tintos',
    wineType: 'Tinto',
    body: 'Medio',
    acidity: 'Media',
    tannins: 'Sedosos y pulposos',
    headline: 'Terciopelo en Boca, Ciruelas & Moca',
    agingPotential: '4 a 8 años',
    tanninsScore: 6.2,
    acidityScore: 6.8,
    bodyScore: 7.0,
    flavorProfile: 'Ciruelas rojas, especias dulces, notas de moca y taninos aterciopelados.',
    recommendedFoods: ['pastas-robustas', 'cocina-urbana', 'empanadas-regional'],
    sommelierNote:
      'Elegante y dócil. Su textura redonda y paso amable lo convierten en un comodín para empanadas criollas al horno de barro y pastas rellenas con salsas suaves.',
    serviceTip: 'Servir a 15°–17°C.',
    glassware: 'Copa estándar de tinto',
    servingTemperature: '15°–17°C',
    curatedWineIds: [],
  },
  'pinot-noir': {
    id: 'pinot-noir',
    title: 'Pinot Noir',
    categoryGroup: 'Tintos',
    wineType: 'Tinto',
    body: 'Ligero',
    acidity: 'Vibrante y filosa',
    tannins: 'Sedosos y pulposos',
    headline: 'Elegancia Patagónica, Frutos Rojos & Tierra Húmeda',
    agingPotential: '4 a 10 años',
    tanninsScore: 4.8,
    acidityScore: 8.5,
    bodyScore: 5.2,
    flavorProfile: 'Frutillas silvestres, tierra mojada, hongos de pino y un fondo sutil de té negro.',
    recommendedFoods: ['pescados-rio-mar', 'cocina-urbana', 'pastas-robustas'],
    sommelierNote:
      'La aristócrata de la Patagonia y valles fríos. De paladar sutil, etéreo y fresco, es uno de los pocos tintos capaces de armonizar a la perfección con truchas y hongos silvestres.',
    serviceTip: 'Servir fresco entre 13°C y 15°C para potenciar su elegancia floral.',
    glassware: 'Copa Borgoña de balón ancho',
    servingTemperature: '13°–15°C',
    curatedWineIds: [],
  },
  tannat: {
    id: 'tannat',
    title: 'Tannat',
    categoryGroup: 'Tintos',
    wineType: 'Tinto',
    body: 'Robusto y estructurado',
    acidity: 'Media-Alta',
    tannins: 'Firmes y calcáreos',
    headline: 'Fuerza Calchaquí, Cacao Amargo & Agarre Tánico',
    agingPotential: '8 a 18 años',
    tanninsScore: 9.5,
    acidityScore: 7.6,
    bodyScore: 9.4,
    flavorProfile: 'Moras negras, grafito, chocolate amargo, café tostado y notas minerales profundas.',
    recommendedFoods: ['asado-fuegos', 'cocina-urbana'],
    sommelierNote:
      'Potente, oscuro y de gran agarre tánico. En los Valles Calchaquíes y Salta alcanza una madurez redonda que doma cortes de carne muy grasos como el vacío a la llama o la entraña.',
    serviceTip: 'Decantar al menos 40 minutos. Servir a 17°–18°C.',
    glassware: 'Copa Burdeos amplia',
    servingTemperature: '17°–18°C',
    curatedWineIds: [],
  },
  garnacha: {
    id: 'garnacha',
    title: 'Garnacha',
    categoryGroup: 'Tintos',
    wineType: 'Tinto',
    body: 'Medio',
    acidity: 'Media-Alta',
    tannins: 'Dóciles y amables',
    headline: 'Frambuesas Crujientes, Trago Ágil & Flor Silvestre',
    agingPotential: '3 a 6 años',
    tanninsScore: 5.5,
    acidityScore: 7.5,
    bodyScore: 6.4,
    flavorProfile: 'Frambuesas crujientes, cáscara de naranja, pimienta rosa y flores silvestres.',
    recommendedFoods: ['picadas-quesos', 'empanadas-regional', 'pastas-robustas'],
    sommelierNote:
      'Fruta roja brillante y trago sumamente ágil. Ideal para picadas de quesos semiduros, tablas de jamón serrano y platos mediterráneos con aceite de oliva virgen extra.',
    serviceTip: 'Servir refrescada a 14°–15°C.',
    glassware: 'Copa estándar o Borgoña',
    servingTemperature: '14°–15°C',
    curatedWineIds: [],
  },
  tempranillo: {
    id: 'tempranillo',
    title: 'Tempranillo',
    categoryGroup: 'Tintos',
    wineType: 'Tinto',
    body: 'Medio',
    acidity: 'Media',
    tannins: 'Estructurados y envolventes',
    headline: 'Herencia Tradicional, Higos Secos & Roble Integrado',
    agingPotential: '5 a 12 años',
    tanninsScore: 7.2,
    acidityScore: 6.8,
    bodyScore: 7.5,
    flavorProfile: 'Cerezas maduras, cuero fino, vainilla especiada, hojas de tabaco y clavo de olor.',
    recommendedFoods: ['pastas-robustas', 'asado-fuegos', 'picadas-quesos'],
    sommelierNote:
      'Herencia hispana en suelos mendocinos. Aporta taninos envolventes y notas a higos y tabaco que maridan con guisados de ternera, estofados y embutidos secos.',
    serviceTip: 'Servir a 16°–17°C.',
    glassware: 'Copa Burdeos',
    servingTemperature: '16°–17°C',
    curatedWineIds: [],
  },
  'petit-verdot': {
    id: 'petit-verdot',
    title: 'Petit Verdot',
    categoryGroup: 'Tintos',
    wineType: 'Tinto',
    body: 'Robusto y estructurado',
    acidity: 'Vibrante y filosa',
    tannins: 'Firmes y calcáreos',
    headline: 'Intensidad Violácea, Arándanos & Tensión',
    agingPotential: '7 a 15 años',
    tanninsScore: 8.8,
    acidityScore: 8.2,
    bodyScore: 9.0,
    flavorProfile: 'Arándanos, violetas concentradas, pimienta negra, grafito y mentol.',
    recommendedFoods: ['asado-fuegos', 'cocina-urbana'],
    sommelierNote:
      'Estructura implacable, color violáceo profundo y acidez tensa. Ideal para carnes de caza, cordero al disco y comidas contundentes de invierno.',
    serviceTip: 'Servir a 17°–18°C con oxigenación previa.',
    glassware: 'Copa Burdeos de cáliz amplio',
    servingTemperature: '17°–18°C',
    curatedWineIds: [],
  },
  'aspirant-bouschet': {
    id: 'aspirant-bouschet',
    title: 'Aspirant Bouschet',
    categoryGroup: 'Tintos',
    wineType: 'Tinto',
    body: 'Con cuerpo',
    acidity: 'Media-Alta',
    tannins: 'Cárnicos y potentes',
    headline: 'Cepa Tintorera Patrimonial, Humo & Densidad',
    agingPotential: '4 a 8 años',
    tanninsScore: 8.2,
    acidityScore: 7.4,
    bodyScore: 8.6,
    flavorProfile: 'Frutos negros del bosque, especias terrosas, toque ahumado y pulpa densa.',
    recommendedFoods: ['asado-fuegos', 'cocina-urbana'],
    sommelierNote:
      'Cepa tintorera patrimonial rescatada en viñedos antiguos de cuyo. Su color impenetrable y textura rústica la hacen una opción apasionante para carnes ahumadas a leña.',
    serviceTip: 'Servir a 16°–17°C.',
    glassware: 'Copa Burdeos',
    servingTemperature: '16°–17°C',
    curatedWineIds: [],
  },
  ancellotta: {
    id: 'ancellotta',
    title: 'Ancellotta',
    categoryGroup: 'Tintos',
    wineType: 'Tinto',
    body: 'Con cuerpo',
    acidity: 'Media',
    tannins: 'Sedosos y pulposos',
    headline: 'Color Opulento, Moras Confitadas & Suavidad',
    agingPotential: '4 a 9 años',
    tanninsScore: 6.8,
    acidityScore: 6.5,
    bodyScore: 8.2,
    flavorProfile: 'Mermelada de moras, higos maduros, cacao dulce y notas tostadas.',
    recommendedFoods: ['pastas-robustas', 'asado-fuegos'],
    sommelierNote:
      'De origen italiano con gran auge en el este mendocino. Aporta color profundo, fruta golosa y taninos amables que acompañan platos de pasta con salsas cárnicas.',
    serviceTip: 'Servir a 16°–17°C.',
    glassware: 'Copa estándar de tinto',
    servingTemperature: '16°–17°C',
    curatedWineIds: [],
  },

  // ==========================================
  // 2. BLANCOS (9)
  // ==========================================
  torrontes: {
    id: 'torrontes',
    title: 'Torrontés',
    categoryGroup: 'Blancos',
    wineType: 'Blanco',
    body: 'Ligero',
    acidity: 'Vibrante y filosa',
    headline: 'Floral Inconfundible, Cítrico Seco & Altura Calchaquí',
    agingPotential: '1 a 3 años',
    acidityScore: 8.8,
    bodyScore: 5.0,
    flavorProfile: 'Jazmines frescos, cáscara de pomelo rosado, flores blancas y mineralidad salina.',
    recommendedFoods: ['empanadas-regional', 'pescados-rio-mar'],
    sommelierNote:
      'La única variedad autóctona de jerarquía mundial originaria de Argentina. Su nariz floral exuberante engaña un paladar seco, ágil y cítrico, compañero mítico de las empanadas salteñas.',
    serviceTip: 'Servir frío entre 8°C y 10°C.',
    glassware: 'Copa Tulipa de blanco',
    servingTemperature: '8°–10°C',
    curatedWineIds: [4], // Colomé Torrontés
  },
  chardonnay: {
    id: 'chardonnay',
    title: 'Chardonnay',
    categoryGroup: 'Blancos',
    wineType: 'Blanco',
    body: 'Con cuerpo',
    acidity: 'Media-Alta',
    headline: 'Untuosidad Mantecosa, Avellanas & Brioche',
    agingPotential: '4 a 10 años',
    acidityScore: 7.6,
    bodyScore: 8.0,
    flavorProfile: 'Manzanas doradas, ananá maduro, manteca clarificada, brioche y avellanas tostadas.',
    recommendedFoods: ['pescados-rio-mar', 'cocina-urbana'],
    sommelierNote:
      'La reina de las blancas. En zonas altas de Mendoza y Patagonia ofrece tensión mineral o untuosidad mantecosa con crianza en roble, perfecta para salmón, surubí o pollo al verdeo.',
    serviceTip: 'Servir a 10°–12°C para apreciar los matices de la madera y las lías.',
    glassware: 'Copa Montrachet de cáliz amplio',
    servingTemperature: '10°–12°C',
    curatedWineIds: [],
  },
  'sauvignon-blanc': {
    id: 'sauvignon-blanc',
    title: 'Sauvignon Blanc',
    categoryGroup: 'Blancos',
    wineType: 'Blanco',
    body: 'Ligero',
    acidity: 'Vibrante y filosa',
    headline: 'Cuchillo Cítrico, Ruda & Pedernal Andino',
    agingPotential: '1 a 3 años',
    acidityScore: 9.4,
    bodyScore: 4.8,
    flavorProfile: 'Ruda, maracuyá ácido, espárragos frescos, lima y pedernal.',
    recommendedFoods: ['pescados-rio-mar', 'picadas-quesos'],
    sommelierNote:
      'Cuchillo cítrico y frescura herbal implacable. Su acidez punzante limpia la grasa en rabas, ceviches y quesos de cabra tiernos.',
    serviceTip: 'Servir bien frío entre 7°C y 9°C.',
    glassware: 'Copa Tulipa esbelta',
    servingTemperature: '7°–9°C',
    curatedWineIds: [],
  },
  'pinot-gris': {
    id: 'pinot-gris',
    title: 'Pinot Gris',
    categoryGroup: 'Blancos',
    wineType: 'Blanco',
    body: 'Ligero',
    acidity: 'Media-Alta',
    headline: 'Sutileza Cristalina, Peras & Textura Sedosa',
    agingPotential: '2 a 4 años',
    acidityScore: 7.4,
    bodyScore: 5.6,
    flavorProfile: 'Peras maduras, durazno blanco, notas florales tenues y textura sedosa.',
    recommendedFoods: ['pescados-rio-mar', 'picadas-quesos'],
    sommelierNote:
      'Fresco, delicado y con una sedosidad particular en paladar. Excelente con pescados blancos a la plancha y aperitivos ligeros.',
    serviceTip: 'Servir a 8°–10°C.',
    glassware: 'Copa de vino blanco clásica',
    servingTemperature: '8°–10°C',
    curatedWineIds: [],
  },
  viognier: {
    id: 'viognier',
    title: 'Viognier',
    categoryGroup: 'Blancos',
    wineType: 'Blanco',
    body: 'Medio',
    acidity: 'Media',
    headline: 'Damasco Turco, Azahar & Volumen Sedoso',
    agingPotential: '2 a 5 años',
    acidityScore: 6.2,
    bodyScore: 7.2,
    flavorProfile: 'Damasco turco, flores blancas de azahar, miel suave y textura envolvente.',
    recommendedFoods: ['cocina-urbana', 'pescados-rio-mar'],
    sommelierNote:
      'Gran volumen en boca y notas de frutas de carozo maduras. Acompaña con armonía pollo al verdeo, pastas con crema y carnes blancas especiadas.',
    serviceTip: 'Servir a 9°–11°C.',
    glassware: 'Copa de vino blanco amplia',
    servingTemperature: '9°–11°C',
    curatedWineIds: [],
  },
  albarino: {
    id: 'albarino',
    title: 'Albariño',
    categoryGroup: 'Blancos',
    wineType: 'Blanco',
    body: 'Medio',
    acidity: 'Vibrante y filosa',
    headline: 'Brisa Atlántica, Salinidad & Limas Frescas',
    agingPotential: '2 a 4 años',
    acidityScore: 8.9,
    bodyScore: 6.2,
    flavorProfile: 'Damasco fresco, cáscara de lima, salinidad marina y fondo floral blanco.',
    recommendedFoods: ['pescados-rio-mar', 'empanadas-regional'],
    sommelierNote:
      'Cepa atlántica cultivada con éxito en zonas costeras y valles de altura argentinos. Su nervio ácido y perfil salino realzan frutos de mar y pesca frita.',
    serviceTip: 'Servir a 8°–10°C.',
    glassware: 'Copa Tulipa',
    servingTemperature: '8°–10°C',
    curatedWineIds: [],
  },
  semillon: {
    id: 'semillon',
    title: 'Semillón',
    categoryGroup: 'Blancos',
    wineType: 'Blanco',
    body: 'Medio',
    acidity: 'Media-Alta',
    headline: 'Cera de Abejas, Manzanas & Rescate Histórico',
    agingPotential: '5 a 15 años',
    acidityScore: 7.8,
    bodyScore: 7.4,
    flavorProfile: 'Miel de azahar, cera de abejas, manzana verde, té blanco y notas secas de avellana.',
    recommendedFoods: ['pescados-rio-mar', 'empanadas-regional', 'cocina-urbana'],
    sommelierNote:
      'El gran clásico blanco argentino redescubierto de parrales antiguos de Río Negro y Uco. Ofrece una untuosidad seca y mineral inigualable para la mesa.',
    serviceTip: 'Servir a 10°–12°C.',
    glassware: 'Copa de vino blanco amplia',
    servingTemperature: '10°–12°C',
    curatedWineIds: [],
  },
  chenin: {
    id: 'chenin',
    title: 'Chenin',
    categoryGroup: 'Blancos',
    wineType: 'Blanco',
    body: 'Ligero',
    acidity: 'Vibrante y filosa',
    headline: 'Membrillo Crujiente, Tradición Sanrafaelina & Nervio',
    agingPotential: '2 a 5 años',
    acidityScore: 8.7,
    bodyScore: 5.4,
    flavorProfile: 'Membrillo fresco, manzana ácida, flores silvestres y notas cítricas crujientes.',
    recommendedFoods: ['pescados-rio-mar', 'picadas-quesos'],
    sommelierNote:
      'Cultivada tradicionalmente en San Rafael (Mendoza). Destaca por su filo ácido natural y versatilidad gastronómica para tablas y pescados.',
    serviceTip: 'Servir a 8°–10°C.',
    glassware: 'Copa clásica de blanco',
    servingTemperature: '8°–10°C',
    curatedWineIds: [],
  },
  'ugni-blanc': {
    id: 'ugni-blanc',
    title: 'Ugni Blanc',
    categoryGroup: 'Blancos',
    wineType: 'Blanco',
    body: 'Ligero',
    acidity: 'Vibrante y filosa',
    headline: 'Frescura Lineal, Limón Sutil & Trago Directo',
    agingPotential: '1 a 2 años',
    acidityScore: 8.6,
    bodyScore: 4.6,
    flavorProfile: 'Limón sutil, manzana verde, hierba recién cortada y final seco y limpio.',
    recommendedFoods: ['pescados-rio-mar', 'picadas-quesos'],
    sommelierNote:
      'Tradicional cepa de frescura ligera y trago directo. Ideal como aperitivo veraniego y para acompañar frituras de mar y tapas simples.',
    serviceTip: 'Servir muy frío entre 7°C y 9°C.',
    glassware: 'Copa clásica de blanco',
    servingTemperature: '7°–9°C',
    curatedWineIds: [],
  },

  // ==========================================
  // 3. CRIOLLAS / OTRAS / ROSADOS (7)
  // ==========================================
  'criolla-chica': {
    id: 'criolla-chica',
    title: 'Criolla Chica',
    categoryGroup: 'Criollas / Rosados',
    wineType: 'Tinto',
    body: 'Ligero',
    acidity: 'Vibrante y filosa',
    tannins: 'Dóciles y amables',
    headline: 'Patrimonio Autóctono, Frutilla Silvestre & Trago Fluido',
    agingPotential: '2 a 4 años',
    tanninsScore: 4.2,
    acidityScore: 8.4,
    bodyScore: 4.8,
    flavorProfile: 'Frutillas silvestres, té negro, hierbas de cerro y jugo puro sin astringencia.',
    recommendedFoods: ['empanadas-regional', 'picadas-quesos', 'pescados-rio-mar'],
    sommelierNote:
      'El tesoro patrimonial argentino rescatado de parrales centenarios en San Juan, Catamarca y Salta. Su ligereza, color traslúcido y trago fresco son la compañía perfecta para el tapeo criollo.',
    serviceTip: 'Servir refrescada entre 12°C y 14°C.',
    glassware: 'Copa Borgoña o estándar',
    servingTemperature: '12°–14°C',
    curatedWineIds: [3], // Cara Sur Criolla Chica
  },
  'moscatel-rosado': {
    id: 'moscatel-rosado',
    title: 'Moscatel Rosado',
    categoryGroup: 'Criollas / Rosados',
    wineType: 'Rosado',
    body: 'Ligero',
    acidity: 'Media',
    headline: 'Pétalos de Rosa, Perfume Embriagador & Delicadeza',
    agingPotential: '1 a 3 años',
    acidityScore: 6.4,
    bodyScore: 5.0,
    flavorProfile: 'Pétalos de rosa, uvas moscatel frescas, cáscara de naranja confitada y almíbar liviano.',
    recommendedFoods: ['dulces-criollos', 'picadas-quesos'],
    sommelierNote:
      'Cepa histórica criolla de perfume embriagador y delicadeza dulce. Maravillosa junto a postres con fruta o queso y dulce de batata.',
    serviceTip: 'Servir frío a 8°–10°C.',
    glassware: 'Copa Tulipa',
    servingTemperature: '8°–10°C',
    curatedWineIds: [],
  },
  'moscatel-alejandria': {
    id: 'moscatel-alejandria',
    title: 'Moscatel de Alejandría',
    categoryGroup: 'Criollas / Rosados',
    wineType: 'Blanco',
    body: 'Medio',
    acidity: 'Media',
    headline: 'Miel de Azahar, Mandarina & Dulzor Noble',
    agingPotential: '1 a 3 años',
    acidityScore: 6.2,
    bodyScore: 6.5,
    flavorProfile: 'Miel de flores, uvas frescas de mesa, azahar y dejos cítricos de mandarina.',
    recommendedFoods: ['dulces-criollos', 'empanadas-regional'],
    sommelierNote:
      'Aromática por excelencia y antepasada directa del Torrontés. En versiones secas o dulces eleva platos especiados y postres tradicionales criollos.',
    serviceTip: 'Servir a 7°–9°C.',
    glassware: 'Copa Tulipa',
    servingTemperature: '7°–9°C',
    curatedWineIds: [],
  },
  'pedro-gimenez': {
    id: 'pedro-gimenez',
    title: 'Pedro Giménez',
    categoryGroup: 'Criollas / Rosados',
    wineType: 'Blanco',
    body: 'Ligero',
    acidity: 'Media-Alta',
    headline: 'Sencillez Cuyana, Durazno Blanco & Pureza',
    agingPotential: '1 a 3 años',
    acidityScore: 7.5,
    bodyScore: 5.2,
    flavorProfile: 'Flores de campo, durazno blanco, notas herbáceas y final seco refrescante.',
    recommendedFoods: ['dulces-criollos', 'picadas-quesos', 'pescados-rio-mar'],
    sommelierNote:
      'La uva blanca más plantada de Cuyo. Redescubierta hoy en vinificaciones de mínima intervención que revelan un vino ligero, seco y de inmensa frescura gastronómica.',
    serviceTip: 'Servir a 8°–10°C.',
    glassware: 'Copa de vino blanco',
    servingTemperature: '8°–10°C',
    curatedWineIds: [],
  },
  cereza: {
    id: 'cereza',
    title: 'Cereza',
    categoryGroup: 'Criollas / Rosados',
    wineType: 'Rosado',
    body: 'Ligero',
    acidity: 'Media',
    headline: 'Granada Jugosa, Melón Rosado & Trago Popular',
    agingPotential: '1 a 2 años',
    acidityScore: 6.5,
    bodyScore: 4.8,
    flavorProfile: 'Cerezas frescas, jugo de granada, melón rosado y trago ligero.',
    recommendedFoods: ['dulces-criollos', 'picadas-quesos'],
    sommelierNote:
      'Cepa criolla de bayas grandes y rosadas. Elaborada como rosado o naranjo brinda una experiencia jugosa, sin pretensiones y sumamente refrescante para la picada.',
    serviceTip: 'Servir frío a 8°–10°C.',
    glassware: 'Copa estándar o de rosado',
    servingTemperature: '8°–10°C',
    curatedWineIds: [],
  },
  'rosado-seco': {
    id: 'rosado-seco',
    title: 'Rosado Seco',
    categoryGroup: 'Criollas / Rosados',
    wineType: 'Rosado',
    body: 'Ligero',
    acidity: 'Media-Alta',
    headline: 'Frutillas Frescas, Mineralidad & Versatilidad',
    agingPotential: '1 a 3 años',
    acidityScore: 7.6,
    bodyScore: 5.2,
    flavorProfile: 'Frutillas frescas, pomelo rosado, flores rojas y toque mineral crocante.',
    recommendedFoods: ['picadas-quesos', 'pescados-rio-mar'],
    sommelierNote:
      'Elaborado mayormente a base de Malbec o Pinot Noir. Aporta la frescura crujiente de un blanco con la tenue estructura frutal de un tinto, ideal para tablas de fiambres y tapas de verano.',
    serviceTip: 'Servir a 9°–11°C.',
    glassware: 'Copa de vino blanco',
    servingTemperature: '9°–11°C',
    curatedWineIds: [],
  },
  'espumante-dulce': {
    id: 'espumante-dulce',
    title: 'Espumante Dulce / Charmat',
    categoryGroup: 'Criollas / Rosados',
    wineType: 'Espumante',
    body: 'Ligero',
    acidity: 'Media-Alta',
    headline: 'Burbujas Finas, Azahar & Cierre Dulce Equilibrado',
    agingPotential: '1 a 2 años',
    acidityScore: 7.9,
    bodyScore: 5.4,
    flavorProfile: 'Flores de azahar, duraznos blancos en almíbar, burbuja cremosa y final dulce balanceado.',
    recommendedFoods: ['dulces-criollos'],
    sommelierNote:
      'Burbujas finas y chispeantes con dulzor equilibrado por una fresca acidez. Es el cierre soñado junto al flan con dulce de leche, alfajores santafesinos o tortas de hojaldre.',
    serviceTip: 'Servir muy frío entre 6°C y 8°C en copa flauta o tulipa estilizada.',
    glassware: 'Copa Tulipa de Espumante',
    servingTemperature: '6°–8°C',
    curatedWineIds: [],
  },
};

/**
 * Listado de todas las categorías de comida para selectores y navegación
 */
export const FOOD_CATEGORY_LIST: FoodPairingEntity[] = Object.values(FOOD_PAIRINGS);

/**
 * Listado de todas las cepas y estilos para selectores y navegación
 */
export const WINE_VARIETY_LIST: WineVarietyEntity[] = Object.values(WINE_VARIETIES);

/**
 * Obtiene la entidad gastronómica por id
 */
export function getFoodPairing(id: FoodCategoryId): FoodPairingEntity {
  return FOOD_PAIRINGS[id];
}

/**
 * Obtiene la entidad enológica por id
 */
export function getWineVariety(id: WineVarietyId): WineVarietyEntity {
  return WINE_VARIETIES[id];
}

/**
 * Obtiene las botellas curadas asociadas a una lista de IDs de catálogo
 */
export function getCuratedWinesForPairing(ids: number[]): CuratedWine[] {
  if (!ids || ids.length === 0) return [];
  return CURATED_WINES.filter((wine) => ids.includes(wine.id));
}
