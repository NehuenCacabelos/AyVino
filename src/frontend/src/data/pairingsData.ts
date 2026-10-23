import { CURATED_WINES } from '../features/wines/data/curatedWines';
import type { CuratedWine } from '../types/wine';

/**
 * Taxonomía cerrada de categorías gastronómicas
 */
export type FoodCategoryId =
  | 'carnes-rojas'
  | 'pastas-rojas'
  | 'pastas-blancas'
  | 'aves'
  | 'pescados-mariscos'
  | 'quesos-tablas'
  | 'postres-chocolates';

/**
 * Taxonomía cerrada de cepas y estilos enológicos
 */
export type WineVarietyId =
  | 'malbec'
  | 'cabernet-sauvignon'
  | 'cabernet-franc'
  | 'bonarda'
  | 'syrah'
  | 'pinot-noir'
  | 'merlot'
  | 'blend-tinto'
  | 'sangiovese'
  | 'chardonnay'
  | 'viognier'
  | 'torrontes'
  | 'sauvignon-blanc'
  | 'pinot-grigio'
  | 'rosado-seco'
  | 'criolla-chica'
  | 'espumante-dulce'
  | 'oporto-fortificado';

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
}

export interface WineVarietyEntity {
  id: WineVarietyId;
  title: string;
  wineType: 'Tinto' | 'Blanco' | 'Rosado' | 'Espumante' | 'Fortificado';
  body: 'Ligero' | 'Medio' | 'Con cuerpo' | 'Robusto y estructurado';
  acidity: 'Baja' | 'Media' | 'Media-Alta' | 'Vibrante y filosa';
  tannins?: 'Sedosos y pulposos' | 'Firmes y calcáreos' | 'Dóciles y amables' | 'Cárnicos y especiados' | 'Estructurados y envolventes';
  flavorProfile: string;
  recommendedFoods: FoodCategoryId[];
  sommelierNote: string;
  serviceTip: string;
  glassware: string;
  servingTemperature: string;
  curatedWineIds: number[];
}

/**
 * Matriz consolidada de Maridaje Gastronómico (¿Qué vas a comer?)
 */
export const FOOD_PAIRINGS: Record<FoodCategoryId, FoodPairingEntity> = {
  'carnes-rojas': {
    id: 'carnes-rojas',
    title: 'Carnes Rojas & Brasas',
    badge: 'Cortes Nobles & Fuego',
    dishes: ['Asado de tira', 'Ojo de bife a la leña', 'Cordero patagónico', 'Entraña jugosa'],
    recommendedVarieties: ['malbec', 'cabernet-sauvignon', 'syrah', 'cabernet-franc'],
    sommelierNote:
      'La interacción organoléptica clave es la afinidad entre los taninos polifenólicos del vino y la albúmina de la carne. La grasa intramuscular y el colágeno desnaturalizan los taninos volviéndolos sedosos en boca, mientras que la acidez natural limpia el paladar de la película lipídica, preparando el siguiente bocado.',
    serviceTip: 'Servir entre 16°C y 18°C. Se aconseja decantación previa de 30 minutos en etiquetas de gran concentración.',
    glassware: 'Copa Burdeos de cáliz amplio (favorece la oxigenación y suaviza el impacto alcohólico)',
    servingTemperature: '16°–18°C',
    principle: 'Complemento molecular',
    curatedWineIds: [1, 2], // Piedra Infinita Malbec, El Enemigo Cabernet Franc
  },
  'pastas-rojas': {
    id: 'pastas-rojas',
    title: 'Pastas con Salsas Rojas',
    badge: 'Herencia Italiana & Tomate',
    dishes: ['Tallarines al fileto', 'Tuco de cocción lenta', 'Bolognesa tradicional', 'Lasagna de ternera'],
    recommendedVarieties: ['bonarda', 'sangiovese', 'cabernet-franc', 'merlot'],
    sommelierNote:
      'La alta presencia de ácidos orgánicos (málico y cítrico) del tomate cocido requiere un tinto con acidez viva para evitar que el vino se sienta plano o amargo. La Bonarda argentina y el Cabernet Franc ofrecen fruta roja fresca y tensión lineal que iguala la frescura ácida de la salsa sin aportar taninos astringentes.',
    serviceTip: 'Servir entre 15°C y 17°C para resaltar la fruta roja crujiente sin volatilizar los aromas herbales.',
    glassware: 'Copa Borgoña o copa estándar de tinto con boca semicerrada',
    servingTemperature: '15°–17°C',
    principle: 'Afinidad ácida',
    curatedWineIds: [2], // El Enemigo Cabernet Franc
  },
  'pastas-blancas': {
    id: 'pastas-blancas',
    title: 'Pastas Blancas & Quesos Fundidos',
    badge: 'Emulsiones & Texturas Cremosas',
    dishes: ['Fettuccine Alfredo', 'Sorrentinos cuatro quesos', 'Gnocchi al gorgonzola', 'Carbonara clásica'],
    recommendedVarieties: ['chardonnay', 'viognier', 'pinot-noir'],
    sommelierNote:
      'Las salsas a base de manteca, crema y quesos maduros demandan volumen en boca y untuosidad (aportada por la fermentación maloláctica y crianza en lías de un buen Chardonnay). Si se prefiere tinto, un Pinot Noir de taninos sedosos y notas terrosas contrasta sin enmascarar la sutileza láctea.',
    serviceTip: 'Chardonnay a 10°–12°C para no bloquear su complejidad mantecosa. Pinot Noir fresco a 14°–15°C.',
    glassware: 'Copa Montrachet / Copa Borgoña de cáliz esférico',
    servingTemperature: '10°–12°C (Blancos) · 14°–15°C (Tintos)',
    principle: 'Sinergia sápida y de textura',
    curatedWineIds: [],
  },
  aves: {
    id: 'aves',
    title: 'Aves & Caza Ligera',
    badge: 'Fibras Delicadas & Hierbas',
    dishes: ['Pollo de campo al limón y romero', 'Magret de pato', 'Codorniz asada', 'Pechuga rellena con hongos'],
    recommendedVarieties: ['pinot-noir', 'chardonnay', 'merlot', 'criolla-chica'],
    sommelierNote:
      'Las aves poseen fibras musculares tiernas y grasas ligeras que sucumben ante tintos pesados. Se busca una armonía basada en taninos aterciopelados y frescura de sotobosque. Una Criolla Chica de mínima intervención o un Pinot Noir aportan fruta roja cristalina que realza el toque herbal y el dorado de la piel.',
    serviceTip: 'Servir a 13°–15°C. La baja temperatura resalta la frescura aromática y afina la elegancia en copa.',
    glassware: 'Copa Borgoña amplia (captura volátiles etéreos y florales)',
    servingTemperature: '13°–15°C',
    principle: 'Sinergia sápida y de textura',
    curatedWineIds: [3], // Cara Sur Criolla Chica
  },
  'pescados-mariscos': {
    id: 'pescados-mariscos',
    title: 'Pescados & Frutos de Mar',
    badge: 'Yodo, Mineralidad & Salinidad',
    dishes: ['Ceviche clásico al cilantro', 'Salmón rosado a la plancha', 'Gambas al ajillo', 'Pesca blanca costera'],
    recommendedVarieties: ['torrontes', 'sauvignon-blanc', 'pinot-grigio', 'rosado-seco'],
    sommelierNote:
      'El yodo marino y los ácidos grasos omega-3 producen notas metálicas desagradables en contacto con taninos marcados. El maridaje perfecto exige blancos con acidez cortante que actúe como una gota de limón natural sobre la pieza, limpiando el paladar y elevando los matices salinos y cítricos.',
    serviceTip: 'Servir frío pero no helado, entre 7°C y 10°C, preservando su expresión terpénica y aromática.',
    glassware: 'Copa Tulipa o copa de vino blanco de cáliz esbelto',
    servingTemperature: '7°–10°C',
    principle: 'Contraste y corte graso',
    curatedWineIds: [4], // Lote Especial Torrontés
  },
  'quesos-tablas': {
    id: 'quesos-tablas',
    title: 'Quesos Duros & Charcutería',
    badge: 'Curados, Caseína & Umami',
    dishes: ['Parmesano Reggiano', 'Gouda estacionado', 'Jamón crudo reserva', 'Salame de la colonia'],
    recommendedVarieties: ['cabernet-sauvignon', 'malbec', 'blend-tinto', 'syrah'],
    sommelierNote:
      'Los quesos madurados y fiambres estacionados concentran alta cantidad de caseína, sal y umami. Requieren vinos con peso, taninos firmes y madurez alcohólica para equilibrar la intensa persistencia gustativa sin que el vino desaparezca en el retrogusto.',
    serviceTip: 'Servir a 16°–18°C. Dejar airear el tinto mientras los quesos toman temperatura ambiente (18°–20°C).',
    glassware: 'Copa Burdeos clásica de boca recta',
    servingTemperature: '16°–18°C',
    principle: 'Complemento molecular',
    curatedWineIds: [1, 2], // Piedra Infinita Malbec, El Enemigo Cabernet Franc
  },
  'postres-chocolates': {
    id: 'postres-chocolates',
    title: 'Chocolates & Postres Nobles',
    badge: 'Cacao Puro & Dulzor Estructurado',
    dishes: ['Volcán de chocolate 70%', 'Trufas amargas con flor de sal', 'Torta húmeda de cacao y frambuesas'],
    recommendedVarieties: ['oporto-fortificado', 'espumante-dulce', 'cabernet-sauvignon'],
    sommelierNote:
      'El cacao puro amargo contiene taninos vegetales que compiten con el vino seco, haciéndolo sentir agrio y desbalanceado. La regla áurea del sommelier dicta que el vino debe igualar o superar la concentración dulce del postre (fortificados u Oporto), o bien recurrir a la efervescencia de un espumante dulce que barra la densidad grasa del chocolate.',
    serviceTip: 'Fortificados a 12°–14°C; espumantes dulces muy fríos a 6°–8°C.',
    glassware: 'Copa de Oporto pequeña o Copa Tulipa de Espumante',
    servingTemperature: '6°–8°C (Espumante) · 12°–14°C (Fortificado)',
    principle: 'Equilibrio de dulzor y taninos',
    curatedWineIds: [],
  },
};

/**
 * Matriz consolidada de Cepas Enológicas (¿Qué vas a tomar?)
 */
export const WINE_VARIETIES: Record<WineVarietyId, WineVarietyEntity> = {
  malbec: {
    id: 'malbec',
    title: 'Malbec',
    wineType: 'Tinto',
    body: 'Con cuerpo',
    acidity: 'Media-Alta',
    tannins: 'Sedosos y pulposos',
    flavorProfile: 'Ciruelas negras confitadas, moras silvestres, violetas andinas y leves dejos de cacao.',
    recommendedFoods: ['carnes-rojas', 'quesos-tablas'],
    sommelierNote:
      'La cepa emblema de Argentina. Su ataque dulce y taninos redondos funden a la perfección con la proteína animal y el sabor tostado de las brasas sin secar las encías.',
    serviceTip: 'Decantar 20 minutos si proviene de suelos calcáreos de altura. Servir a 16°–18°C.',
    glassware: 'Copa Burdeos',
    servingTemperature: '16°–18°C',
    curatedWineIds: [1], // Piedra Infinita Malbec
  },
  'cabernet-sauvignon': {
    id: 'cabernet-sauvignon',
    title: 'Cabernet Sauvignon',
    wineType: 'Tinto',
    body: 'Robusto y estructurado',
    acidity: 'Media-Alta',
    tannins: 'Firmes y calcáreos',
    flavorProfile: 'Casis, pimiento rojo asado, cedro, tabaco y pimienta negra en grano.',
    recommendedFoods: ['carnes-rojas', 'quesos-tablas', 'postres-chocolates'],
    sommelierNote:
      'La estructura fenólica más poderosa del reino vitivinícola. Su carga tánica y acidez sostenida le otorgan capacidad de guarda y resistencia ante grasas potentes y quesos muy curados.',
    serviceTip: 'Servir a 17°–18°C en copa de gran apertura para facilitar la evolución de aromas terciarios.',
    glassware: 'Copa Burdeos grande',
    servingTemperature: '17°–18°C',
    curatedWineIds: [],
  },
  'cabernet-franc': {
    id: 'cabernet-franc',
    title: 'Cabernet Franc',
    wineType: 'Tinto',
    body: 'Medio',
    acidity: 'Vibrante y filosa',
    tannins: 'Firmes y calcáreos',
    flavorProfile: 'Pimientos dulces horneados, grafito, jarilla, frambuesas y textura mineral de tiza.',
    recommendedFoods: ['pastas-rojas', 'carnes-rojas', 'quesos-tablas'],
    sommelierNote:
      'Cepa en auge en terroirs de altura como Gualtallary. Su acidez lineal electrizante y textura granulosa maridan con salsas complejas de tomate, hierbas andinas y cortes con cocción a fuego lento.',
    serviceTip: 'Servir a 16°C. No sobrecalentar para conservar su carácter pirazínico elegante y fresco.',
    glassware: 'Copa Burdeos o Borgoña',
    servingTemperature: '15°–17°C',
    curatedWineIds: [2], // El Enemigo Cabernet Franc
  },
  bonarda: {
    id: 'bonarda',
    title: 'Bonarda',
    wineType: 'Tinto',
    body: 'Medio',
    acidity: 'Vibrante y filosa',
    tannins: 'Dóciles y amables',
    flavorProfile: 'Cerezas maduras, granada, higos frescos y una sutil nota especiada anisada.',
    recommendedFoods: ['pastas-rojas'],
    sommelierNote:
      'La reina de la mesa italiana adaptada al este y norte mendocino. Su fruta exuberante y taninos amables abrazan pastas con salsas de tomate y carnes estofadas sin fatigar el paladar.',
    serviceTip: 'Servir a 14°–16°C; ligeramente refrescado gana en tensión y elegancia gastronómica.',
    glassware: 'Copa estándar de tinto',
    servingTemperature: '14°–16°C',
    curatedWineIds: [],
  },
  syrah: {
    id: 'syrah',
    title: 'Syrah',
    wineType: 'Tinto',
    body: 'Con cuerpo',
    acidity: 'Media',
    tannins: 'Cárnicos y especiados',
    flavorProfile: 'Pimienta negra recién molida, aceitunas negras, cuero noble y compota de arándanos.',
    recommendedFoods: ['carnes-rojas', 'quesos-tablas'],
    sommelierNote:
      'Su perfil cárnico, ahumado y balsámico es el compañero natural del cordero asado, carnes silvestres y tablas con embutidos de alta curación.',
    serviceTip: 'Servir a 16°–18°C en copa con cáliz envolvente.',
    glassware: 'Copa Syrah / Burdeos',
    servingTemperature: '16°–18°C',
    curatedWineIds: [],
  },
  'pinot-noir': {
    id: 'pinot-noir',
    title: 'Pinot Noir',
    wineType: 'Tinto',
    body: 'Ligero',
    acidity: 'Vibrante y filosa',
    tannins: 'Sedosos y pulposos',
    flavorProfile: 'Frutillas silvestres, tierra mojada, hongos de pino y un fondo sutil de té negro.',
    recommendedFoods: ['aves', 'pastas-blancas'],
    sommelierNote:
      'Elegancia pura de climas fríos como la Patagonia o zonas altas de Tupungato. Por su liviandad tánica no compite con carnes blancas ni pastas con crema, actuando como un puente aromático perfecto.',
    serviceTip: 'Servir entre 13°C y 15°C para salvaguardar sus aromas primarios florales y terrosos.',
    glassware: 'Copa Borgoña de balón ancho',
    servingTemperature: '13°–15°C',
    curatedWineIds: [],
  },
  merlot: {
    id: 'merlot',
    title: 'Merlot',
    wineType: 'Tinto',
    body: 'Medio',
    acidity: 'Media',
    tannins: 'Sedosos y pulposos',
    flavorProfile: 'Ciruelas rojas, especias dulces, notas de moca y taninos aterciopelados.',
    recommendedFoods: ['aves', 'pastas-rojas'],
    sommelierNote:
      'Un tinto versátil de boca redonda y taninos maduros que acompaña aves de caza, risottos y pastas caseras.',
    serviceTip: 'Servir a 15°–17°C.',
    glassware: 'Copa estándar de tinto',
    servingTemperature: '15°–17°C',
    curatedWineIds: [],
  },
  'blend-tinto': {
    id: 'blend-tinto',
    title: 'Blend Tinto de Guarda',
    wineType: 'Tinto',
    body: 'Robusto y estructurado',
    acidity: 'Media-Alta',
    tannins: 'Estructurados y envolventes',
    flavorProfile: 'Capas de fruta negra, especias complejas, chocolate amargo y roble integrado.',
    recommendedFoods: ['carnes-rojas', 'quesos-tablas'],
    sommelierNote:
      'La complejidad del corte (Malbec, Cabernet y Petit Verdot) requiere preparaciones gastronómicas de alta intensidad y cocción lenta a las brasas.',
    serviceTip: 'Servir a 17°–18°C con decantación de 40 minutos.',
    glassware: 'Copa Burdeos',
    servingTemperature: '17°–18°C',
    curatedWineIds: [],
  },
  sangiovese: {
    id: 'sangiovese',
    title: 'Sangiovese',
    wineType: 'Tinto',
    body: 'Medio',
    acidity: 'Vibrante y filosa',
    tannins: 'Firmes y calcáreos',
    flavorProfile: 'Guindas ácidas, hojas de té, orégano silvestre y notas térreas.',
    recommendedFoods: ['pastas-rojas'],
    sommelierNote:
      'Cepa toscana por antonomasia. Su acidez punzante resalta la pulpa del tomate y neutraliza el aceite de oliva virgen extra.',
    serviceTip: 'Servir a 15°–16°C.',
    glassware: 'Copa estándar de tinto',
    servingTemperature: '15°–16°C',
    curatedWineIds: [],
  },
  chardonnay: {
    id: 'chardonnay',
    title: 'Chardonnay',
    wineType: 'Blanco',
    body: 'Con cuerpo',
    acidity: 'Media-Alta',
    flavorProfile: 'Manzanas doradas, ananá maduro, manteca clarificada, brioche y avellanas tostadas.',
    recommendedFoods: ['pastas-blancas', 'aves'],
    sommelierNote:
      'Cuando posee fermentación en barrica y trabajo sobre lías, el Chardonnay aporta una textura grasa que armoniza por mimetismo con salsas cremosas y carnes blancas.',
    serviceTip: 'Servir a 10°–12°C para apreciar los matices de la madera y las lías.',
    glassware: 'Copa Montrachet de cáliz amplio',
    servingTemperature: '10°–12°C',
    curatedWineIds: [],
  },
  viognier: {
    id: 'viognier',
    title: 'Viognier',
    wineType: 'Blanco',
    body: 'Medio',
    acidity: 'Media',
    flavorProfile: 'Damasco turco, flores blancas de azahar, miel de azahar y textura sedosa en boca.',
    recommendedFoods: ['pastas-blancas'],
    sommelierNote:
      'Blanco aromático con baja acidez y gran volumen graso en boca. Su toque floral contrasta deliciosamente con quesos suaves y salsas de cuatro quesos.',
    serviceTip: 'Servir a 9°–11°C.',
    glassware: 'Copa de vino blanco',
    servingTemperature: '9°–11°C',
    curatedWineIds: [],
  },
  torrontes: {
    id: 'torrontes',
    title: 'Torrontés',
    wineType: 'Blanco',
    body: 'Ligero',
    acidity: 'Vibrante y filosa',
    flavorProfile: 'Jazmines frescos, cáscara de pomelo rosado, flores blancas y mineralidad salina.',
    recommendedFoods: ['pescados-mariscos'],
    sommelierNote:
      'Nacido en los valles calchaquíes a gran altitud. En boca es seco y cortante, un contrapunto perfecto para ceviches, pescados marinados y mariscos al vapor.',
    serviceTip: 'Servir a 8°–10°C.',
    glassware: 'Copa Tulipa de blanco',
    servingTemperature: '8°–10°C',
    curatedWineIds: [4], // Lote Especial Torrontés
  },
  'sauvignon-blanc': {
    id: 'sauvignon-blanc',
    title: 'Sauvignon Blanc',
    wineType: 'Blanco',
    body: 'Ligero',
    acidity: 'Vibrante y filosa',
    flavorProfile: 'Ruda, maracuyá ácido, espárragos frescos, lima y pedernal.',
    recommendedFoods: ['pescados-mariscos'],
    sommelierNote:
      'Un bisturí de frescura. Su acidez cítrica atraviesa el paladar, disolviendo cualquier residuo oleoso de pescados grasos como el salmón o mariscos fritos.',
    serviceTip: 'Servir entre 7°C y 9°C en copa flauta o tulipa.',
    glassware: 'Copa Tulipa',
    servingTemperature: '7°–9°C',
    curatedWineIds: [],
  },
  'pinot-grigio': {
    id: 'pinot-grigio',
    title: 'Pinot Grigio',
    wineType: 'Blanco',
    body: 'Ligero',
    acidity: 'Media-Alta',
    flavorProfile: 'Peras verdes, melón blanco, toques florales y final crocante.',
    recommendedFoods: ['pescados-mariscos'],
    sommelierNote:
      'Ligero, sutil y seco. Acompaña mariscos a la plancha y pescados de roca sin alterar su sabor original.',
    serviceTip: 'Servir a 7°–9°C.',
    glassware: 'Copa de vino blanco clásica',
    servingTemperature: '7°–9°C',
    curatedWineIds: [],
  },
  'rosado-seco': {
    id: 'rosado-seco',
    title: 'Rosado Seco',
    wineType: 'Rosado',
    body: 'Ligero',
    acidity: 'Media-Alta',
    flavorProfile: 'Frutillas frescas, granada, cítricos suaves y toque mineral.',
    recommendedFoods: ['pescados-mariscos'],
    sommelierNote:
      'Une la frescura de un blanco con una leve presencia tánica que sostiene frutos de mar condimentados y pescados a la plancha.',
    serviceTip: 'Servir a 9°–11°C.',
    glassware: 'Copa de vino blanco',
    servingTemperature: '9°–11°C',
    curatedWineIds: [],
  },
  'criolla-chica': {
    id: 'criolla-chica',
    title: 'Criolla Chica',
    wineType: 'Tinto',
    body: 'Ligero',
    acidity: 'Vibrante y filosa',
    tannins: 'Dóciles y amables',
    flavorProfile: 'Frutillas del bosque, té negro, hierbas silvestres y jugo puro sin astringencia.',
    recommendedFoods: ['aves'],
    sommelierNote:
      'Vino patrimonial de parrales antiguos. Su paso etéreo y fresca acidez es la compañía soñada para aves grilladas y truchas patagónicas.',
    serviceTip: 'Servir refrescado a 13°–14°C.',
    glassware: 'Copa Borgoña o estándar',
    servingTemperature: '13°–14°C',
    curatedWineIds: [3], // Cara Sur Criolla Chica
  },
  'espumante-dulce': {
    id: 'espumante-dulce',
    title: 'Espumante Dulce / Charmat',
    wineType: 'Espumante',
    body: 'Ligero',
    acidity: 'Media-Alta',
    flavorProfile: 'Flores de azahar, duraznos blancos en almíbar, burbuja cremosa y final dulce balanceado.',
    recommendedFoods: ['postres-chocolates'],
    sommelierNote:
      'El gas carbónico y el azúcar natural equilibran la densidad lipídica del chocolate y las masas dulces.',
    serviceTip: 'Servir muy frío entre 6°C y 8°C en copa flauta o tulipa estilizada.',
    glassware: 'Copa Tulipa de Espumante',
    servingTemperature: '6°–8°C',
    curatedWineIds: [],
  },
  'oporto-fortificado': {
    id: 'oporto-fortificado',
    title: 'Vino Fortificado / Tipo Oporto',
    wineType: 'Fortificado',
    body: 'Robusto y estructurado',
    acidity: 'Media',
    flavorProfile: 'Ciruelas secas, higos en almíbar, nueces, toffee y calidez alcohólica envolvente.',
    recommendedFoods: ['postres-chocolates'],
    sommelierNote:
      'El compañero legendario del chocolate oscuro al 70%. Su dulzura licorosa y alcohol generoso abrazan los taninos vegetales del cacao.',
    serviceTip: 'Servir a 12°–14°C en copa pequeña para concentrar aromas nobles.',
    glassware: 'Copa de Oporto',
    servingTemperature: '12°–14°C',
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

