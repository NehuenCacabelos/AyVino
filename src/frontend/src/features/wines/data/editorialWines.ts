import elEnemigoImg from '../../../assets/wines/curated/ElEnemigo-removebg-preview.png';
import piedraInfinitaImg from '../../../assets/wines/curated/PiedraInfinita-removebg-preview.png';
import caraSurImg from '../../../assets/wines/curated/CaraSurCriollaChica-removebg-preview.png';
import loteEspecialImg from '../../../assets/wines/curated/LoteEspecialTorrontes-removebg-preview.png';

export interface WineWineryInfo {
  id: string;
  name: string;
  foundedYear: number;
  websiteUrl?: string;
  region: string;
}

export interface WineGrapeRatio {
  variety: string;
  percentage: number;
}

export interface WineVintageDetail {
  id: string;
  wineId: string;
  year: number;
  imageUrl?: string | null;
  alcoholContent: string;
  servingTemperature: string;
  agingAdvice: string;
  grapes: WineGrapeRatio[];
}

export interface WineReviewItem {
  id: string;
  userName: string;
  vintageYear: number;
  rating: number;
  createdAt: string;
  comment: string;
}

export interface WinePairingItem {
  id: string;
  name: string;
  icon?: string;
}

export interface EditorialWine {
  id: string;
  slug: string;
  name: string;
  type: 'Red' | 'White' | 'Rose' | 'Sparkling';
  description: string;
  wineryNameText: string;
  winery: WineWineryInfo | null;
  pairings: WinePairingItem[];
  vintages: WineVintageDetail[];
  reviews: WineReviewItem[];
}

const MOCK_WINERY_ENEMIGO: WineWineryInfo = {
  id: 'winery-01',
  name: 'Bodega Aleanna — El Enemigo',
  foundedYear: 2007,
  websiteUrl: 'https://www.elenemigowines.com',
  region: 'Gualtallary, Valle de Uco, Mendoza',
};

const MOCK_WINERY_CATENA: WineWineryInfo = {
  id: 'winery-02',
  name: 'Bodega Catena Zapata',
  foundedYear: 1902,
  websiteUrl: 'https://catenazapata.com',
  region: 'Luján de Cuyo & Gualtallary, Mendoza',
};

const MOCK_WINERY_ZUCCARDI: WineWineryInfo = {
  id: 'winery-03',
  name: 'Familia Zuccardi',
  foundedYear: 1963,
  websiteUrl: 'https://zuccardiwines.com',
  region: 'Paraje Altamira, Valle de Uco, Mendoza',
};

const MOCK_WINERY_COLOME: WineWineryInfo = {
  id: 'winery-04',
  name: 'Bodega Colomé',
  foundedYear: 1831,
  websiteUrl: 'https://bodegacolome.com',
  region: 'Molinos, Valles Calchaquíes, Salta',
};

export const EDITORIAL_WINES_MAP: Record<string, EditorialWine> = {
  'gran-enemigo-single-vineyard-gualtallary': {
    id: 'wine-01',
    slug: 'gran-enemigo-single-vineyard-gualtallary',
    name: 'Gran Enemigo Single Vineyard Gualtallary',
    type: 'Red',
    description:
      'Nacido a 1.470 metros de altura sobre suelos calcáreos y arenas aluvionales con grava blanca. Una oda pura a la mineralidad, frescura filosa y tensión de altura donde el Cabernet Franc alcanza su máxima expresión junto a una cofermentación salvaje con racimo entero.',
    wineryNameText: 'El Enemigo Wines',
    winery: MOCK_WINERY_ENEMIGO,
    pairings: [
      { id: 'p1', name: 'Ojo de bife a la leña', icon: 'flame' },
      { id: 'p2', name: 'Chivo malargüino braseado', icon: 'utensils' },
      { id: 'p3', name: 'Mollejas crocantes al limón', icon: 'sparkles' },
      { id: 'p4', name: 'Pato confitado con reducción de moras', icon: 'soup' },
    ],
    vintages: [
      {
        id: 'v-2019',
        wineId: 'wine-01',
        year: 2019,
        imageUrl: elEnemigoImg,
        alcoholContent: '13.8% Vol.',
        servingTemperature: '16°C – 18°C',
        agingAdvice:
          '15 a 20 años en cava subterránea termoestabilizada. Consumo cumbre proyectado: 2026–2038.',
        grapes: [
          { variety: 'Cabernet Franc', percentage: 85 },
          { variety: 'Malbec', percentage: 15 },
        ],
      },
      {
        id: 'v-2020',
        wineId: 'wine-01',
        year: 2020,
        imageUrl: elEnemigoImg,
        alcoholContent: '14.2% Vol.',
        servingTemperature: '16°C – 18°C',
        agingAdvice:
          '12 a 18 años. Añada cálida con mayor concentración tánica y redondez aterciopelada.',
        grapes: [
          { variety: 'Cabernet Franc', percentage: 88 },
          { variety: 'Malbec', percentage: 12 },
        ],
      },
      {
        id: 'v-2021',
        wineId: 'wine-01',
        year: 2021,
        imageUrl: elEnemigoImg,
        alcoholContent: '13.5% Vol.',
        servingTemperature: '15°C – 17°C',
        agingAdvice:
          '20+ años. Añada de frescura y acidez soberbia, vertical y de nervio mineral extremo.',
        grapes: [
          { variety: 'Cabernet Franc', percentage: 85 },
          { variety: 'Malbec', percentage: 15 },
        ],
      },
    ],
    reviews: [
      {
        id: 'rev-1',
        userName: 'Mariano S. (Sommelier A.A.S.)',
        vintageYear: 2019,
        rating: 5,
        createdAt: '2025-02-14',
        comment:
          'Mineralidad calcárea pura. Tiza, grafito y zarzamora fresca. La cofermentación con racimo entero aporta un nervio y una electricidad en el paladar medio inigualable.',
      },
      {
        id: 'rev-2',
        userName: 'Valentina Rocca',
        vintageYear: 2019,
        rating: 5,
        createdAt: '2025-01-28',
        comment:
          'Decantado durante 45 minutos antes de servir. Taninos firmes pero pulidos con tiza fina. Un vino de guarda que ya regala momentos inolvidables.',
      },
      {
        id: 'rev-3',
        userName: 'Joaquín de la Torre',
        vintageYear: 2020,
        rating: 4.8,
        createdAt: '2024-12-19',
        comment:
          'La añada 2020 tiene un punto más goloso y cálido, pero mantiene esa tensión y frescura filosa típica de Gualtallary. Extraordinario con mollejas crocantes.',
      },
      {
        id: 'rev-4',
        userName: 'Florencia B.',
        vintageYear: 2019,
        rating: 5,
        createdAt: '2024-11-05',
        comment:
          'Una de las cumbres de la vitivinicultura argentina. Largo, salino y con final herbal a tomillo silvestre.',
      },
      {
        id: 'rev-5',
        userName: 'Gastón V.',
        vintageYear: 2021,
        rating: 4.7,
        createdAt: '2024-09-30',
        comment:
          'Afiladísimo. Necesita guarda pero la pureza de fruta y la vibrante acidez auguran décadas de elegancia.',
      },
      {
        id: 'rev-6',
        userName: 'Elena M.',
        vintageYear: 2020,
        rating: 5,
        createdAt: '2024-08-12',
        comment: 'Estructura monumental. Vale cada minuto de espera en copa.',
      },
      {
        id: 'rev-7',
        userName: 'Pablo D. (Enólogo)',
        vintageYear: 2021,
        rating: 4.2,
        createdAt: '2024-07-22',
        comment:
          'Añada sumamente tensa. Recomiendo decantar al menos 1 hora y servir a 16°C.',
      },
      {
        id: 'rev-8',
        userName: 'Agustina Benítez',
        vintageYear: 2019,
        rating: 3.8,
        createdAt: '2024-06-11',
        comment:
          'Gran complejidad aromática, aunque personalmente encontré la acidez un punto demasiado cortante.',
      },
    ],
  },
  'el-enemigo-cabernet-franc': {
    id: 'wine-02-ee',
    slug: 'el-enemigo-cabernet-franc',
    name: 'El Enemigo Cabernet Franc',
    type: 'Red',
    description:
      'Cofermentado con un toque de Malbec. Crianza en foudres centenarios durante 15 meses. Elegancia rústica con un balance impecable entre la frescura de la altura y la textura de sus taninos minerales.',
    wineryNameText: 'El Enemigo Wines',
    winery: MOCK_WINERY_ENEMIGO,
    pairings: [
      { id: 'p1', name: 'Cordero patagónico al romero', icon: 'flame' },
      { id: 'p2', name: 'Empanadas mendocinas a cuchillo', icon: 'utensils' },
      { id: 'p3', name: 'Pastas caseras con ragú de hongos', icon: 'soup' },
    ],
    vintages: [
      {
        id: 'v-ee-2020',
        wineId: 'wine-02-ee',
        year: 2020,
        imageUrl: elEnemigoImg,
        alcoholContent: '13.5% Vol.',
        servingTemperature: '17°C',
        agingAdvice: '12 a 15 años. Guarda óptima en cava fresca.',
        grapes: [
          { variety: 'Cabernet Franc', percentage: 90 },
          { variety: 'Malbec', percentage: 10 },
        ],
      },
      {
        id: 'v-ee-2021',
        wineId: 'wine-02-ee',
        year: 2021,
        imageUrl: elEnemigoImg,
        alcoholContent: '13.7% Vol.',
        servingTemperature: '16°C – 18°C',
        agingAdvice: '15+ años. Concentración y acidez balanceada.',
        grapes: [
          { variety: 'Cabernet Franc', percentage: 88 },
          { variety: 'Malbec', percentage: 12 },
        ],
      },
    ],
    reviews: [
      {
        id: 'rev-ee-1',
        userName: 'Marcos Calvi',
        vintageYear: 2020,
        rating: 4.8,
        createdAt: '2025-01-15',
        comment:
          'Pimientos asados dulces, grosellas negras y cedro noble. Un clásico que nunca decepciona.',
      },
      {
        id: 'rev-ee-2',
        userName: 'Solange K.',
        vintageYear: 2020,
        rating: 4.9,
        createdAt: '2024-11-20',
        comment: 'Sedoso y largo, con acidez electrizante.',
      },
    ],
  },
  'finca-piedra-infinita': {
    id: 'wine-zuccardi-01',
    slug: 'finca-piedra-infinita',
    name: 'Finca Piedra Infinita Malbec',
    type: 'Red',
    description:
      'Proveniente de suelos aluviales con costra calcárea a 1.100 msnm en Paraje Altamira. Fermentado en piletas de hormigón sin epoxi con levaduras nativas. Posee una frescura vibrante que expresa la pureza extrema del terroir.',
    wineryNameText: 'Familia Zuccardi',
    winery: MOCK_WINERY_ZUCCARDI,
    pairings: [
      { id: 'p-z1', name: 'Chivito andino a las brasas', icon: 'flame' },
      { id: 'p-z2', name: 'Ojo de bife madurado', icon: 'utensils' },
      { id: 'p-z3', name: 'Quesos curados de oveja', icon: 'sparkles' },
    ],
    vintages: [
      {
        id: 'v-pi-2019',
        wineId: 'wine-zuccardi-01',
        year: 2019,
        imageUrl: piedraInfinitaImg,
        alcoholContent: '14.0% Vol.',
        servingTemperature: '16°C',
        agingAdvice:
          '20 a 25 años en cava. Punto culminante de pureza enológica.',
        grapes: [{ variety: 'Malbec', percentage: 100 }],
      },
      {
        id: 'v-pi-2021',
        wineId: 'wine-zuccardi-01',
        year: 2021,
        imageUrl: piedraInfinitaImg,
        alcoholContent: '14.1% Vol.',
        servingTemperature: '16°C',
        agingAdvice: '25+ años. Hormigón puro, sin madera.',
        grapes: [{ variety: 'Malbec', percentage: 100 }],
      },
    ],
    reviews: [
      {
        id: 'rev-z-1',
        userName: 'Santiago M. (Enólogo)',
        vintageYear: 2019,
        rating: 5,
        createdAt: '2025-02-01',
        comment:
          'La definición más precisa de tiza y calcáreo en el Malbec argentino. Persistencia infinita.',
      },
      {
        id: 'rev-z-2',
        userName: 'Martina V.',
        vintageYear: 2019,
        rating: 4.9,
        createdAt: '2024-10-18',
        comment: 'Austero, elegante y de una pureza que conmueve.',
      },
    ],
  },
  'catena-zapata-malbec-argentino': {
    id: 'wine-catena-01',
    slug: 'catena-zapata-malbec-argentino',
    name: 'Catena Zapata Malbec Argentino',
    type: 'Red',
    description:
      'Homenaje a la historia del Malbec en Francia y su posterior auge en Argentina. Fusión de uvas de antiguos viñedos familiares en Angélica (Lunlunta) y Nicasia (Altamira). Fermentación con racimos enteros en barricas de roble francés nuevo.',
    wineryNameText: 'Bodega Catena Zapata',
    winery: MOCK_WINERY_CATENA,
    pairings: [
      { id: 'p-c1', name: 'Bife de chorizo madurado', icon: 'flame' },
      { id: 'p-c2', name: 'Cordero en cocción lenta', icon: 'utensils' },
      { id: 'p-c3', name: 'Trufas de chocolate amargo', icon: 'sparkles' },
    ],
    vintages: [
      {
        id: 'v-cz-2019',
        wineId: 'wine-catena-01',
        year: 2019,
        imageUrl: null,
        alcoholContent: '14.5% Vol.',
        servingTemperature: '16°C – 18°C',
        agingAdvice:
          '15 a 20 años. Barricas francesas de primer uso seleccionadas.',
        grapes: [{ variety: 'Malbec', percentage: 100 }],
      },
      {
        id: 'v-cz-2020',
        wineId: 'wine-catena-01',
        year: 2020,
        imageUrl: null,
        alcoholContent: '14.2% Vol.',
        servingTemperature: '16°C – 18°C',
        agingAdvice: '12 a 18 años. Gran concentración aromática y violetas.',
        grapes: [{ variety: 'Malbec', percentage: 100 }],
      },
    ],
    reviews: [
      {
        id: 'rev-cz-1',
        userName: 'Bernardo Gómez',
        vintageYear: 2019,
        rating: 4.8,
        createdAt: '2025-01-20',
        comment:
          'Aroma embriagador a moras, ciruelas negras, lavanda y moca. Taninos increíblemente granulados y finos.',
      },
      {
        id: 'rev-cz-2',
        userName: 'Lucía P.',
        vintageYear: 2019,
        rating: 4.9,
        createdAt: '2024-12-05',
        comment: 'Complejo, profundo y memorable en cada trago.',
      },
    ],
  },
  'colome-altura-maxima-malbec': {
    id: 'wine-colome-01',
    slug: 'colome-altura-maxima-malbec',
    name: 'Colomé Altura Máxima Malbec',
    type: 'Red',
    description:
      'Cosechado a 3.111 metros sobre el nivel del mar en Payogasta, Salta. Uno de los viñedos comerciales más altos del mundo. La intensa radiación solar ultravioleta produce una piel de uva gruesa y taninos monumentales con frescura andina.',
    wineryNameText: 'Bodega Colomé',
    winery: MOCK_WINERY_COLOME,
    pairings: [
      { id: 'p-col-1', name: 'Empanadas salteñas de matambre', icon: 'flame' },
      { id: 'p-col-2', name: 'Asado de tira a fuego lento', icon: 'utensils' },
      { id: 'p-col-3', name: 'Queso de cabra calchaquí', icon: 'sparkles' },
    ],
    vintages: [
      {
        id: 'v-col-2018',
        wineId: 'wine-colome-01',
        year: 2018,
        imageUrl: null,
        alcoholContent: '15.0% Vol.',
        servingTemperature: '16°C – 18°C',
        agingAdvice: '20+ años. Potencia y guarda extrema de altura.',
        grapes: [{ variety: 'Malbec', percentage: 100 }],
      },
    ],
    reviews: [
      {
        id: 'rev-col-1',
        userName: 'Gonzalo F. (Sommelier)',
        vintageYear: 2018,
        rating: 4.9,
        createdAt: '2025-01-12',
        comment:
          'Intensidad salvaje. Tinta china, especias andinas y una concentración descomunal pero con frescura viva.',
      },
    ],
  },
};

// Aliases para identificadores alternativos comunes
EDITORIAL_WINES_MAP['gran-enemigo-gualtallary-single-vineyard'] =
  EDITORIAL_WINES_MAP['gran-enemigo-single-vineyard-gualtallary'];
EDITORIAL_WINES_MAP['wine-01'] =
  EDITORIAL_WINES_MAP['gran-enemigo-single-vineyard-gualtallary'];
EDITORIAL_WINES_MAP['wine-02'] =
  EDITORIAL_WINES_MAP['el-enemigo-cabernet-franc'];


/**
 * Normaliza nombres o identificadores en formato slug limpio:
 * "Catena Zapata Malbec Argentino" -> "catena-zapata-malbec-argentino"
 */
export function normalizeWineSlug(val: string): string {
  return val
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Generador enológico de contingencia para cualquier vino del explorador:
 * Garantiza que ninguna etiqueta quede rota o vacía, armando una ficha editorial
 * coherente con sus datos de varietal, añada y terruño.
 */
export function generateEditorialFallback(
  rawIdOrName: string,
  hints?: {
    name?: string;
    winery?: string;
    region?: string;
    varietal?: string;
    vintage?: number;
    rating?: number;
    imageUrl?: string;
  }
): EditorialWine {
  const cleanSlug = normalizeWineSlug(hints?.name || rawIdOrName);
  const wineName = hints?.name || rawIdOrName.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const wineryName = hints?.winery || 'Bodega de Terruño';
  const region = hints?.region || 'Valle de Uco, Mendoza';
  const varietal = hints?.varietal || 'Malbec';
  const vintageYear = hints?.vintage || 2020;
  const rating = hints?.rating || 4.7;

  const isWhite =
    varietal.toLowerCase().includes('blanco') ||
    varietal.toLowerCase().includes('chardonnay') ||
    varietal.toLowerCase().includes('torrontes') ||
    varietal.toLowerCase().includes('sauvignon');

  const isRose =
    varietal.toLowerCase().includes('rose') ||
    varietal.toLowerCase().includes('rosado') ||
    varietal.toLowerCase().includes('criolla');

  const wineType: EditorialWine['type'] = isWhite ? 'White' : isRose ? 'Rose' : 'Red';

  const defaultWinery: WineWineryInfo = {
    id: `winery-${cleanSlug}`,
    name: wineryName,
    foundedYear: 1985,
    region,
    websiteUrl: 'https://ayvino.ar',
  };

  return {
    id: cleanSlug,
    slug: cleanSlug,
    name: wineName,
    type: wineType,
    description: `Elaborado con uvas seleccionadas provenientes de viñedos de altura en ${region}. Fermentación meticulosa con temperatura controlada para preservar la tipicidad del ${varietal} y la mineralidad nativa de sus suelos aluviales.`,
    wineryNameText: wineryName,
    winery: defaultWinery,
    pairings: isWhite
      ? [
          { id: 'fb-p1', name: 'Pesca blanca a la plancha con hierbas', icon: 'utensils' },
          { id: 'fb-p2', name: 'Mollejas doradas al limón', icon: 'sparkles' },
          { id: 'fb-p3', name: 'Risotto de hongos silvestres', icon: 'soup' },
        ]
      : [
          { id: 'fb-p1', name: 'Cortes nobles a la parrilla de quebracho', icon: 'flame' },
          { id: 'fb-p2', name: 'Guiso criollo o estofado de ternera', icon: 'soup' },
          { id: 'fb-p3', name: 'Quesos semiduros y charcutería artesanal', icon: 'utensils' },
        ],
    vintages: [
      {
        id: `v-${cleanSlug}-${vintageYear}`,
        wineId: cleanSlug,
        year: vintageYear,
        imageUrl: hints?.imageUrl || (isWhite ? loteEspecialImg : isRose ? caraSurImg : piedraInfinitaImg),
        alcoholContent: isWhite ? '13.2% Vol.' : '14.2% Vol.',
        servingTemperature: isWhite ? '10°C – 12°C' : '16°C – 18°C',
        agingAdvice: `8 a 15 años en condiciones óptimas de cava (14°C - 16°C). Expresión pura de ${varietal}.`,
        grapes: [{ variety: varietal, percentage: 100 }],
      },
      {
        id: `v-${cleanSlug}-${vintageYear - 1}`,
        wineId: cleanSlug,
        year: vintageYear - 1,
        imageUrl: hints?.imageUrl || (isWhite ? loteEspecialImg : isRose ? caraSurImg : piedraInfinitaImg),
        alcoholContent: isWhite ? '13.0% Vol.' : '14.0% Vol.',
        servingTemperature: isWhite ? '10°C – 12°C' : '16°C – 18°C',
        agingAdvice: `Añada anterior con evolución más compleja y taninos redondeados.`,
        grapes: [{ variety: varietal, percentage: 100 }],
      },
    ],
    reviews: [
      {
        id: `rev-fb-1`,
        userName: 'Guillermo F. (Sommelier)',
        vintageYear,
        rating,
        createdAt: '2025-01-20',
        comment: `Gran fidelidad varietal y frescura en copa. La acidez sostiene un final persistente y muy gastronómico.`,
      },
      {
        id: `rev-fb-2`,
        userName: 'Carla Zanetti',
        vintageYear,
        rating: Math.min(5, Math.max(3, Math.round((rating - 0.2) * 10) / 10)),
        createdAt: '2024-11-14',
        comment: `Excelente estructura y balance. Se disfruta intensamente desde el primer servicio.`,
      },
    ],
  };
}

/**
 * Busca un vino editorial por id o slug en el mapa curado,
 * o genera el modelo de contingencia adecuado.
 */
export function getEditorialWine(idOrSlug: string): EditorialWine {
  const normalized = normalizeWineSlug(idOrSlug);

  if (EDITORIAL_WINES_MAP[normalized]) {
    return EDITORIAL_WINES_MAP[normalized];
  }

  // Buscar por coincidencia parcial en llaves
  for (const key of Object.keys(EDITORIAL_WINES_MAP)) {
    if (key.includes(normalized) || normalized.includes(key)) {
      return EDITORIAL_WINES_MAP[key];
    }
  }

  return generateEditorialFallback(idOrSlug);
}
