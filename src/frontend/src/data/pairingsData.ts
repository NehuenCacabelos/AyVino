/**
 * pairingsData.ts
 * Base de conocimiento técnico-enológica de AyVino.
 * Especificación de dominio estricta basada en Guía de Maridajes y Armonización de Vinos Argentinos.
 */

import malbecGrapeImg from '../assets/pairings/Malbec_grapes.jpg';
import cabernetFrancGrapeImg from '../assets/pairings/Cabernet_Franc.jpg';
import cabernetSauvignonGrapeImg from '../assets/pairings/Cabernet_Sauvignon.jpg';
import pinotNoirGrapeImg from '../assets/pairings/Pinot_Noir.jpg';
import torrontesGrapeImg from '../assets/pairings/Torrontes.JPG';
import chardonnayGrapeImg from '../assets/pairings/Chardonnay.jpg';
import bonardaGrapeImg from '../assets/pairings/Bonarda_Grape.jpg';
import syrahGrapeImg from '../assets/pairings/Sirah_Grapes.jpg';
import merlotGrapeImg from '../assets/pairings/Merlot.jpg';
import sauvignonBlancGrapeImg from '../assets/pairings/Sauvignon_Blanc.jpg';

// Fotografía editorial de platos gastronómicos (assets locales)
import asadoTiraFoodImg from '../assets/pairings/foods/asado_tira.png';
import milanesaFritaFoodImg from '../assets/pairings/foods/milanesa_frita.png';
import empanadasFoodImg from '../assets/pairings/foods/empanadas.png';
import pastasFoodImg from '../assets/pairings/foods/pastas.png';
import truchaFoodImg from '../assets/pairings/foods/trucha.png';
import locroFoodImg from '../assets/pairings/foods/locro.png';

export const LOCAL_FOOD_IMAGES = {
  asadoTira: asadoTiraFoodImg,
  milanesaFrita: milanesaFritaFoodImg,
  empanadas: empanadasFoodImg,
  pastas: pastasFoodImg,
  trucha: truchaFoodImg,
  locro: locroFoodImg,
};

export type WineCategoryId = 'tinto' | 'blanco' | 'rosado' | 'naranjo';

export type FoodFamilyId =
  | 'fuegos'
  | 'ollas-y-guisos'
  | 'pastas'
  | 'rio-y-mar'
  | 'clasicos-urbanos'
  | 'quesos-charcuteria';

export interface WitnessBottle {
  label: string;
  winery: string;
  region: string;
  vintage?: string;
  catalogWineId?: number;
}

export interface PairingLink {
  id: string;           // ID destino ('bife-de-chorizo' o 'malbec')
  label: string;        // Texto visible
  styleAnchor?: string; // Ancla opcional de estilo ('inox', 'crianza', 'altura', 'tradicional')
}

export interface PairingClash {
  target: string;
  reason: string;
}

export interface FoodRecommendationStat {
  label: string;
  value: string;
}

export interface EnrichedFoodRecommendation {
  id: string;
  title: string;
  description: string;
  badge?: string;
  stats?: FoodRecommendationStat[];
  imageUrl?: string;
  matchPercentage?: string;
  styleAnchor?: string;
  isFeatured?: boolean;
}

export interface EnrichedChemicalClash {
  target: string;
  chemicalTitle: string;
  reason: string;
  suggestedWineId?: string;
  suggestedWineLabel?: string;
}

export interface ServiceTipMetadata {
  label: string;
  value: string;
}

export interface PairingMetric {
  label: string;
  percentage: number;
  variant?: 'amber' | 'wine' | 'zinc';
}

export interface WineStyleProfile {
  styleId: string;
  styleName: string;
  acidity: string;
  body: string;
  tannins?: string;
  servingTemperature: string;
  glassware: string;
  serviceTip: string;
  serviceTipTitle?: string;
  serviceMetadata?: ServiceTipMetadata;
  practicalTip?: string;
  rationaleQuestion?: string;
  chemicalRationale: string;
  pairingMetrics?: PairingMetric[];
  affinities: PairingLink[];
  contrasts: PairingLink[];
  clashes: PairingClash[];
  enrichedAffinities?: EnrichedFoodRecommendation[];
  enrichedContrasts?: EnrichedFoodRecommendation[];
  enrichedClashes?: EnrichedChemicalClash[];
  witnessBottles: WitnessBottle[];
}

export interface WineVarietyEntry {
  id: string;
  name: string;
  category: WineCategoryId;
  tagline: string;
  originNote?: string;
  /** Etiqueta breve estilo revista (ej: INSIGNIA AR, HERBAL & TENAZ) */
  shortTag?: string;
  /** URL de imagen del racimo o uva para la cabecera de la ficha */
  grapeImageUrl?: string;
  styles: WineStyleProfile[];
}

export interface DishPairingEntry {
  id: string;
  familyId: FoodFamilyId;
  name: string;
  tagline: string;
  /** URL de imagen del plato elaborado para la cabecera de la ficha */
  foodImageUrl?: string;
  servingTemperature: string;
  glassware: string;
  serviceTip: string;
  chemicalRationale: string;
  affinities: PairingLink[];
  contrasts: PairingLink[];
  clashes: PairingClash[];
  witnessBottles: WitnessBottle[];
}

export interface FoodFamilyInfo {
  id: FoodFamilyId;
  title: string;
  name: string;
  tagline: string;
  /** URL de imagen representativa de la categoría gastronómica */
  foodImageUrl?: string;
  servingTemperature: string;
  glassware: string;
  serviceTip: string;
  chemicalRationale: string;
  affinities: PairingLink[];
  contrasts: PairingLink[];
  clashes: PairingClash[];
  witnessBottles: WitnessBottle[];
}

export const MAIN_WINE_IDS: string[] = [
  'malbec',
  'cabernet-franc',
  'cabernet-sauvignon',
  'pinot-noir',
  'torrontes',
  'chardonnay',
  'bonarda',
];

export const FOOD_FAMILIES: FoodFamilyInfo[] = [
  {
    id: 'fuegos',
    title: 'Fuegos & Brasas',
    name: 'Fuegos & Brasas',
    tagline: 'Cortes vacunos a la parrilla, achuras crocantes y embutidos a la leña.',
    foodImageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=1200&q=85&auto=format&fit=crop',
    servingTemperature: '16 °C a 18 °C',
    glassware: 'Copa Burdeos clásica de cáliz amplio',
    serviceTip: 'Servir los tintos a temperatura fresca de cava para fundir la grasa caliente sin saturar el paladar.',
    chemicalRationale:
      'Las cocciones a la brasa combinan altas temperaturas, caramelización de Maillard y humo de leña con grasas animales y colágeno. Exigen tintos estructurados con taninos activos que precipiten las proteínas salivales o vinos de acidez vibrante (naranjos, espumosos) para achuras y embutidos.',
    affinities: [
      { id: 'malbec', label: 'Malbec Tradicional (Crianza)' },
      { id: 'cabernet-sauvignon', label: 'Cabernet Sauvignon' },
      { id: 'syrah', label: 'Syrah Cálido y Especiado' },
    ],
    contrasts: [
      { id: 'cabernet-franc', label: 'Cabernet Franc de Altura' },
      { id: 'naranjos', label: 'Vinos Naranjos Macerados' },
    ],
    clashes: [
      { target: 'Blancos jóvenes sin madera', reason: 'la grasa caliente y el humo superan el cuerpo ligero del vino' },
      { target: 'Espumantes dulces', reason: 'choque repulsivo de sacarosa con la grasa cárnica ahumada' },
    ],
    witnessBottles: [
      { winery: 'Cadus Wines', label: 'Single Vineyard Finca Las Torcazas Malbec', region: 'Luján de Cuyo', vintage: '2021', catalogWineId: 101 },
      { winery: 'Susana Balbo Wines', label: 'Signature Cabernet Sauvignon', region: 'Valle de Uco', vintage: '2021', catalogWineId: 105 },
      { winery: 'Dante Robino', label: "The President's Malbec", region: 'Perdriel, Luján de Cuyo', vintage: '2020', catalogWineId: 132 },
    ],
  },
  {
    id: 'ollas-y-guisos',
    title: 'Ollas & Guisados',
    name: 'Ollas & Guisados',
    tagline: 'Cocciones lentas criollas, fondos concentrados, legumbres y almidones.',
    foodImageUrl: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=1200&q=85&auto=format&fit=crop',
    servingTemperature: '15 °C a 17 °C',
    glassware: 'Copa Burdeos o copa Tulipán amplia',
    serviceTip: 'Para guisos densos de maíz (locro), un blanco aromático frío contrasta el espesor; para lentejas, un blend de guarda.',
    chemicalRationale:
      'Las preparaciones de olla concentran almidones gelatinizados, colágenos solubilizados y especias como pimentón y comino. Funcionan por afinidad con tintos evolucionados de guarda (taninos polimerizados) o por contraste con blancos de alta acidez como Torrontés.',
    affinities: [
      { id: 'blends-de-guarda', label: 'Blend Gran Reserva de Guarda' },
      { id: 'malbec', label: 'Malbec Tradicional (Crianza)' },
    ],
    contrasts: [
      { id: 'torrontes', label: 'Torrontés Seco de Altura' },
      { id: 'bonarda', label: 'Bonarda Joven' },
    ],
    clashes: [
      { target: 'Blancos delicados neutros sin acidez', reason: 'anulados por la densidad del caldo' },
      { target: 'Tintos muy jóvenes y astringentes', reason: 'aspereza desagradable con legumbres y tubérculos' },
    ],
    witnessBottles: [
      { winery: 'Flechas de los Andes', label: 'Gran Corte', region: 'Valle de Uco', vintage: '2019', catalogWineId: 118 },
      { winery: 'Nido del Tigre', label: 'Blanco de Jardín Torrontés Centenario', region: 'Cafayate, Salta', vintage: '2023', catalogWineId: 120 },
    ],
  },
  {
    id: 'pastas',
    title: 'Pastas & Masas',
    name: 'Pastas & Masas',
    tagline: 'Salsas de tomate perita, masas al huevo rellenas y reducciones con setas silvestres.',
    foodImageUrl: 'https://images.unsplash.com/photo-1551183053-bf91798d9c60?w=1200&q=85&auto=format&fit=crop',
    servingTemperature: '14 °C a 16 °C',
    glassware: 'Copa Burdeos mediana o Borgoña',
    serviceTip: 'Alinear la acidez del vino con la del tomate o la untuosidad láctica de la crema.',
    chemicalRationale:
      'El ácido cítrico y málico del tomate concentrado requiere tintos jugosos de acidez viva (Bonarda, Cabernet Franc) para evitar asperezas. Las pastas rellenas con hongos y cremas demandan notas terrosas de sotobosque (Pinot Noir) o Chardonnay con crianza en roble.',
    affinities: [
      { id: 'bonarda', label: 'Bonarda Joven y Frutal' },
      { id: 'pinot-noir', label: 'Pinot Noir Complejo' },
      { id: 'chardonnay', label: 'Chardonnay con Barrica', styleAnchor: 'crianza' },
    ],
    contrasts: [
      { id: 'cabernet-franc', label: 'Cabernet Franc de Terruño' },
      { id: 'merlot', label: 'Merlot Sedoso' },
    ],
    clashes: [
      { target: 'Blancos dulces', reason: 'efecto agridulce discordante con salsas saladas y tomate' },
      { target: 'Tintos hiper-tánicos con madera verde', reason: 'la acidez de la salsa magnifica la astringencia' },
    ],
    witnessBottles: [
      { winery: 'Altos Las Hormigas', label: 'Colonia Las Liebres Bonarda', region: 'Mendoza', vintage: '2022', catalogWineId: 109 },
      { winery: 'Domaine Nico', label: 'Le Paradis Pinot Noir', region: 'Gualtallary', vintage: '2020', catalogWineId: 112 },
    ],
  },
  {
    id: 'rio-y-mar',
    title: 'Río, Mar & Costas',
    name: 'Río, Mar & Costas',
    tagline: 'Salmónidos patagónicos, pesca de río a las brasas y cocina marina nikkei.',
    foodImageUrl: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=1200&q=85&auto=format&fit=crop',
    servingTemperature: '8 °C a 12 °C',
    glassware: 'Copa Borgoña amplia o Tulipán de blancos',
    serviceTip: 'Servir en frapera; evitar totalmente tintos de alta graduación con taninos secantes.',
    chemicalRationale:
      'Las grasas omega-3 y el yodo marino provocan oxidación férrica con taninos condensados, generando un regusto metálico rancio. Requieren blancos de buena textura (Chardonnay con roble para salmónidos), rosados versátiles o tintos etéreos de clima frío (Pinot Noir).',
    affinities: [
      { id: 'chardonnay', label: 'Chardonnay (Inox o Crianza)' },
      { id: 'rosados', label: 'Rosé Gastronómico' },
      { id: 'sauvignon-blanc', label: 'Sauvignon Blanc Mineral' },
    ],
    contrasts: [
      { id: 'pinot-noir', label: 'Pinot Noir Ligero' },
      { id: 'torrontes', label: 'Torrontés Seco de Altura' },
    ],
    clashes: [
      { target: 'Cabernet Sauvignon o Malbec concentrado', reason: 'choque violento de tanino y yodo que genera sabor a óxido metálico' },
      { target: 'Vinos con crianza pesada en roble nuevo', reason: 'tapan por completo la delicadeza del pescado' },
    ],
    witnessBottles: [
      { winery: 'Terrazas de los Andes', label: 'Grand Chardonnay', region: 'Valle de Uco', vintage: '2021', catalogWineId: 125 },
      { winery: 'Bodega Renacer', label: 'Punto Final Orgánico Rosé Malbec', region: 'Luján de Cuyo', vintage: '2023', catalogWineId: 127 },
      { winery: 'Rosell Boher', label: 'Antonieta Pinot Noir Rosé', region: 'Valle de Uco', vintage: '2022', catalogWineId: 128 },
    ],
  },
  {
    id: 'clasicos-urbanos',
    title: 'Clásicos Urbanos',
    name: 'Clásicos Urbanos',
    tagline: 'Empanadas de carne a cuchillo, milanesas fritas crocantes y pizza porteña al molde.',
    foodImageUrl: 'https://images.unsplash.com/photo-1576662712957-9c79ae1280f8?w=1200&q=85&auto=format&fit=crop',
    servingTemperature: '13 °C a 15 °C',
    glassware: 'Copa Tulipán amplia o Burdeos fresca',
    serviceTip: 'Tintos fluidos y bebibles servidos ligeramente frescos (14 °C).',
    chemicalRationale:
      'Preparaciones con fritura, masa horneada y queso derretido. La grasa superficial y la salinidad piden vinos jugosos con fruta primaria, buena acidez gastronómica y taninos amables que limpien sin saturar.',
    affinities: [
      { id: 'malbec', label: 'Malbec Joven o Tradicional' },
      { id: 'bonarda', label: 'Bonarda Frutal' },
      { id: 'cabernet-sauvignon', label: 'Cabernet Sauvignon' },
    ],
    contrasts: [
      { id: 'torrontes', label: 'Torrontés Seco de Altura' },
      { id: 'sauvignon-blanc', label: 'Sauvignon Blanc Mineral' },
    ],
    clashes: [
      { target: 'Tintos pesados con crianza extrema en madera', reason: 'secan el rebozado crocante y compiten con la masa' },
      { target: 'Vinos dulces de postre', reason: 'incompatibilidad digestiva con frituras y queso caliente' },
    ],
    witnessBottles: [
      { winery: 'Conclave Wines', label: 'Conclave Nocturno Malbec', region: 'Mendoza', vintage: '2022', catalogWineId: 135 },
      { winery: 'Altos Las Hormigas', label: 'Terroir Orgánico Malbec', region: 'Luján de Cuyo', vintage: '2021', catalogWineId: 104 },
    ],
  },
  {
    id: 'quesos-charcuteria',
    title: 'Quesos & Charcutería',
    name: 'Quesos & Charcutería',
    tagline: 'Quesos maduros estacionados, embutidos curados y sobremesas prolongadas.',
    foodImageUrl: 'https://images.unsplash.com/photo-1452195100486-9cc805987862?w=1200&q=85&auto=format&fit=crop',
    servingTemperature: '16 °C a 18 °C',
    glassware: 'Copa Burdeos Gran Reserva',
    serviceTip: 'Decantar vinos con más de 10 años de estiba en botella.',
    chemicalRationale:
      'Las proteínas concentradas y la salinidad de los quesos duros (tirosina) funden con los taninos pulidos de vinos añejados en roble, creando una sensación suntuosa en la sobremesa.',
    affinities: [
      { id: 'blends-de-guarda', label: 'Blend Gran Reserva de Guarda' },
      { id: 'naranjos', label: 'Vinos Naranjos Macerados' },
    ],
    contrasts: [
      { id: 'cabernet-franc', label: 'Cabernet Franc de Terruño' },
    ],
    clashes: [
      { target: 'Tintos jóvenes muy livianos', reason: 'la salinidad del queso curado anula la fruta ligera' },
      { target: 'Blancos excesivamente cítricos', reason: 'reacción ácida desagradable con la sal' },
    ],
    witnessBottles: [
      { winery: 'Bodegas López', label: 'Montchenot Gran Reserva 15 Años', region: 'Maipú, Mendoza', vintage: '2008', catalogWineId: 119 },
    ],
  },
];

export const FOOD_FAMILIES_MAP: Record<string, FoodFamilyInfo> = FOOD_FAMILIES.reduce(
  (acc, fam) => {
    acc[fam.id] = fam;
    return acc;
  },
  {} as Record<string, FoodFamilyInfo>
);


/**
 * 13 Varietales y Estilos Insignia Argentinos
 */
export const WINE_VARIETIES: Record<string, WineVarietyEntry> = {
  malbec: {
    id: 'malbec',
    name: 'Malbec',
    category: 'tinto',
    shortTag: 'INSIGNIA AR',
    tagline: 'Cepa emblema de Argentina; desde perfiles golosos y aterciopelados con notas a ciruela pasa y vainilla, hasta expresiones minerales, austeras y filosas de extrema altura sobre lechos calcáreos.',
    originNote: 'Primera Zona (Luján de Cuyo / Maipú) y Valle de Uco (Gualtallary, Paraje Altamira).',
    grapeImageUrl: malbecGrapeImg,
    styles: [
      {
        styleId: 'tradicional',
        styleName: 'Perfil Tradicional (Primera Zona / Crianza)',
        acidity: 'Media y redonda',
        body: 'Pleno, carnoso y envolvente',
        tannins: 'Dulces, pulposos y maduros',
        servingTemperature: '16 °C a 18 °C',
        glassware: 'Copa Burdeos clásica de cáliz amplio',
        serviceTip: 'Decantar 30 minutos para oxigenar descriptores terciarios de roble y fruta madura.',
        serviceTipTitle: 'Oxigenación y Temperatura Óptima',
        serviceMetadata: { label: 'APERTURA AROMÁTICA', value: '30 MIN' },
        practicalTip: '¿Sin decantador? Descorchá la botella 45 minutos antes y serví media copa: al bajar el nivel por debajo del cuello, entra mucho más aire y el vino se abre solo.',
        rationaleQuestion: '¿Por qué el Malbec es el rey indiscutido de las brasas argentinas?',
        chemicalRationale:
          'El paso por barrica le da al Malbec taninos dóciles y suaves que abrazan la grasa y los jugos de la carne asada. En lugar de raspar la boca, limpia el paladar entre bocado y bocado, haciendo que cada corte a las brasas se sienta más sabroso y tierno.',
        pairingMetrics: [
          { label: 'AFINIDAD GRASA', percentage: 96, variant: 'amber' },
          { label: 'BALANCE TÁNICO', percentage: 92, variant: 'wine' },
          { label: 'NOTAS DE CRIANZA', percentage: 85, variant: 'zinc' },
        ],
        affinities: [
          { id: 'asado-tira', label: 'Asado de tira a las brasas' },
          { id: 'bife-de-chorizo', label: 'Bife de chorizo' },
          { id: 'fideos-tuco-estofado', label: 'Fideos con tuco y estofado' },
        ],
        enrichedAffinities: [
          {
            id: 'asado-tira',
            title: 'Asado de tira a las brasas',
            badge: 'MARIDAJE PERFECTO',
            description:
              'Costillar dorado a fuego lento sobre leña de quebracho colorado. La caramelización exterior (Reacción de Maillard) sella en paralelo con el tostado de roble francés del vino.',
            stats: [
              { label: 'Intensidad', value: 'Alta' },
              { label: 'Grasa', value: '4/5' },
            ],
            imageUrl: LOCAL_FOOD_IMAGES.asadoTira,
            isFeatured: true,
          },
          {
            id: 'bife-de-chorizo',
            title: 'Bife de chorizo con chimichurri suave',
            description:
              'Textura jugosa al corte inglés que potencia la dulzura de los taninos sin opacar notas de ciruela fresca.',
            matchPercentage: 'Afinidad 94%',
          },
          {
            id: 'fideos-tuco-estofado',
            title: 'Fideos caseros con tuco y estofado de ternera',
            description:
              'Cocción lenta de 4 horas con hoja de laurel; la acidez del tomate maduro se ensambla con la estructura del Malbec.',
            matchPercentage: 'Afinidad 90%',
          },
        ],
        contrasts: [
          { id: 'milanesa-frita', label: 'Milanesa frita tradicional' },
          { id: 'empanadas-carne-cuchillo', label: 'Empanadas de carne a cuchillo' },
        ],
        enrichedContrasts: [
          {
            id: 'milanesa-frita',
            title: 'Milanesa frita tradicional',
            badge: 'LIMPIEZA DE PALADAR',
            description:
              'El apanado crujiente y frito crea una capa lipídica en lengua; la frescura y moderada acidez del Malbec actúa como bisturí limpiador en cada bocado.',
            stats: [
              { label: 'Efecto', value: 'Corte de Fritura' },
              { label: 'Textura', value: 'Crocante' },
            ],
            imageUrl: LOCAL_FOOD_IMAGES.milanesaFrita,
            isFeatured: true,
          },
          {
            id: 'empanadas-carne-cuchillo',
            title: 'Empanadas mendocinas de carne a cuchillo',
            description:
              'Masa al horno de barro con comino, pimentón dulce y cebolla confitada. El jugo interno dialoga con la fruta roja del varietal.',
            matchPercentage: 'Balance 95%',
          },
          {
            id: 'tabla-quesos-duros',
            title: 'Queso Reggianito madurado & frutos secos',
            description:
              'Los cristales de tirosina y la pasta dura realzan las notas de cuero y cacao del Malbec con crianza prolongada.',
            matchPercentage: 'Salinidad 91%',
          },
        ],
        clashes: [
          { target: 'Sushi y rolls crudos', reason: 'reacción férrica de taninos con el yodo que genera sabor metálico amargo' },
          { target: 'Ceviches cítricos', reason: 'el ácido ascórbico y acético anula la fruta y exacerba la astringencia' },
          { target: 'Comidas con picante extremo', reason: 'el alcohol amplifica la capsaicina generando sensación de ardor incontrolable' },
        ],
        enrichedClashes: [
          {
            target: 'Sushi & Pescados Crudos',
            chemicalTitle: 'Reacción férrica',
            reason:
              'Los taninos interactúan de manera destructiva con los aceites de pescado y el yodo marino, generando una explosión metálica amarga e insípida en el fondo del paladar.',
            suggestedWineId: 'pinot-noir',
            suggestedWineLabel: 'Pinot Noir o Torrontés',
          },
          {
            target: 'Ceviches cítricos y vinagretas punzantes',
            chemicalTitle: 'Colapso de acidez',
            reason:
              'El ácido cítrico hiperconcentrado supera la estructura del tinto, apagando inmediatamente el bouquet frutal y dejando únicamente una sensación rasposa y seca.',
            suggestedWineId: 'sauvignon-blanc',
            suggestedWineLabel: 'Sauvignon Blanc de altura',
          },
          {
            target: 'Currys picantes y chiles habaneros',
            chemicalTitle: 'Multiplicador de fuego',
            reason:
              'La capsaicina amplifica la percepción alcohólica del Malbec (14.5%+), provocando una sensación de quemazón sofocante en vez de armonía.',
            suggestedWineId: 'torrontes',
            suggestedWineLabel: 'Torrontés Dulce Natural',
          },
        ],
        witnessBottles: [
          { winery: 'Cadus Wines', label: 'Single Vineyard Finca Las Torcazas Malbec', region: 'Luján de Cuyo, Mendoza', vintage: '2021', catalogWineId: 101 },
          { winery: 'Bodega Monteviejo', label: 'Lindaflor Malbec', region: 'Valle de Uco, Mendoza', vintage: '2020', catalogWineId: 102 },
        ],
      },
      {
        styleId: 'altura',
        styleName: 'Perfil de Altura (Valle de Uco / Suelo Calcáreo)',
        acidity: 'Vibrante, tensa y filosa',
        body: 'Medio-Pleno con trago vertical',
        tannins: 'Calcáreos, finos y con textura de tiza',
        servingTemperature: '15 °C a 17 °C',
        glassware: 'Copa Borgoña o Burdeos de boca afinada',
        serviceTip: 'Servir fresco (15 °C) para enaltecer la tensión mineral y la frescura herbal.',
        serviceTipTitle: 'Tensión Calcárea y Servicio',
        serviceMetadata: { label: 'TEMPERATURA ÓPTIMA', value: '15 °C' },
        practicalTip: 'En días cálidos, dale 15 a 20 minutos en la puerta de la heladera antes de servir (unos 15 °C). Ese toque fresco despierta su textura mineral y suaviza el alcohol.',
        rationaleQuestion: '¿Cómo interactúa la mineralidad calcárea con la carne vacuna?',
        chemicalRationale:
          'El frío de las alturas le da a este Malbec una frescura vibrante y una textura mineral única (como una tiza fina). Esa frescura funciona como un cuchillo filoso: corta al instante la grasa de cortes intensos como el ojo de bife, dejando la boca limpia y lista para otro bocado.',
        pairingMetrics: [
          { label: 'AFINIDAD GRASA', percentage: 90, variant: 'amber' },
          { label: 'TENSIÓN MINERAL', percentage: 95, variant: 'zinc' },
          { label: 'BALANCE TÁNICO', percentage: 88, variant: 'wine' },
        ],
        affinities: [
          { id: 'ojo-de-bife', label: 'Ojo de bife a la leña' },
          { id: 'matrimonio', label: 'Matrimonio (chorizo y morcilla)' },
        ],
        contrasts: [
          { id: 'pizza-al-molde', label: 'Pizza al molde porteña' },
          { id: 'achuras', label: 'Mollejas y achuras crocantes' },
        ],
        clashes: [
          { target: 'Pescados blancos hervidos', reason: 'la textura de tiza y la acidez tapan la delicadeza del pescado magro' },
          { target: 'Postres dulces', reason: 'el contraste con azúcar genera sensación amarga e híper-astringente' },
        ],
        witnessBottles: [
          { winery: 'Zorzal Wines', label: 'Espontáneo Suelo Grava Gualtallary Malbec', region: 'Gualtallary, Valle de Uco', vintage: '2022', catalogWineId: 103 },
          { winery: 'Altos Las Hormigas', label: 'Terroir Orgánico Malbec', region: 'Luján de Cuyo, Mendoza', vintage: '2021', catalogWineId: 104 },
        ],
      },
    ],
  },

  'cabernet-sauvignon': {
    id: 'cabernet-sauvignon',
    name: 'Cabernet Sauv.',
    category: 'tinto',
    shortTag: 'ESTRUCTURA',
    tagline: 'Estructura arquitectónica, pirazinas nobles, cassis y una columna vertebral tánica imbatible.',
    originNote: 'San Carlos, Tupungato y terruños tradicionales de San Rafael.',
    grapeImageUrl: cabernetSauvignonGrapeImg,
    styles: [
      {
        styleId: 'reserva',
        styleName: 'Reserva Estructurado',
        acidity: 'Media-alta y firme',
        body: 'Robusto y estructurado',
        tannins: 'Firmes, densos y secantes',
        servingTemperature: '16 °C a 18 °C',
        glassware: 'Copa Burdeos clásica',
        serviceTip: 'Decantar 40 minutos para integrar pirazinas y abrir capas balsámicas.',
        serviceTipTitle: 'Decantación y Apertura de Capas',
        serviceMetadata: { label: 'APERTURA EN DECANTER', value: '40 MIN' },
        practicalTip: 'Si no tenés decanter, trasvasalo despacio a una jarra de vidrio limpia 30 minutos antes. El contacto con el aire doma sus taninos firmes y despierta aromas a frutos negros.',
        rationaleQuestion: '¿Por qué la estructura del Cabernet doma las carnes más intensas?',
        chemicalRationale:
          'Tiene cuerpo robusto y taninos con carácter que necesitan platos contundentes. La grasa y la proteína de carnes como el asado de tira o el cordero suavizan su fuerza en boca, mientras que sus notas a pimiento asado y especias combinan a la perfección con el humo de las brasas.',
        pairingMetrics: [
          { label: 'ESTRUCTURA TÁNICA', percentage: 98, variant: 'wine' },
          { label: 'AFINIDAD PROTEICA', percentage: 94, variant: 'amber' },
          { label: 'COMPLEJIDAD HERBAL', percentage: 85, variant: 'zinc' },
        ],
        affinities: [
          { id: 'asado-tira', label: 'Asado de tira a las brasas' },
          { id: 'cordero-patagonico', label: 'Cordero patagónico' },
          { id: 'pastel-de-papas', label: 'Pastel de papas tradicional' },
        ],
        contrasts: [
          { id: 'empanadas-carne-cuchillo', label: 'Empanadas de carne a cuchillo' },
        ],
        clashes: [
          { target: 'Mariscos crudos y ostras', reason: 'los taninos condensados generan sabor a óxido ferroso' },
          { target: 'Quesos frescos sin madurar', reason: 'la caseína sin curar no resiste la potencia tánica' },
        ],
        witnessBottles: [
          { winery: 'Susana Balbo Wines', label: 'Signature Cabernet Sauvignon', region: 'Valle de Uco, Mendoza', vintage: '2021', catalogWineId: 105 },
          { winery: 'Bodega Simonassi', label: 'Colección San Rafael Cabernet Sauvignon', region: 'San Rafael, Mendoza', vintage: '2020', catalogWineId: 106 },
        ],
      },
    ],
  },

  'cabernet-franc': {
    id: 'cabernet-franc',
    name: 'Cabernet Franc',
    category: 'tinto',
    shortTag: 'HERBAL & TENAZ',
    tagline: 'Elegancia herbal, notas de grafito, pimienta rosa y una acidez gastronómica eléctrica.',
    originNote: 'Gualtallary, Paraje Altamira y San Patricio del Chañar.',
    grapeImageUrl: cabernetFrancGrapeImg,
    styles: [
      {
        styleId: 'terroir',
        styleName: 'Expresión de Terruño',
        acidity: 'Alta y jugosa',
        body: 'Medio a pleno',
        tannins: 'Finos, granulosos y lineales',
        servingTemperature: '15 °C a 17 °C',
        glassware: 'Copa Burdeos estilizada',
        serviceTip: 'Servir a 16 °C para preservar las sutiles notas de hierbas de montaña y grafito.',
        serviceTipTitle: 'Preservación de Hierbas y Frescura',
        serviceMetadata: { label: 'TEMPERATURA DE SERVICIO', value: '16 °C' },
        practicalTip: 'Evitá beberlo a temperatura ambiente si hace calor. 15 minutos en la puerta de la heladera resaltan sus aromas herbales y pimienta sin perder cuerpo.',
        rationaleQuestion: '¿Por qué la acidez viva del Franc potencia salsas con tomate y vegetales asados?',
        chemicalRationale:
          'Es más ágil y elegante que el Cabernet Sauvignon, con una frescura natural que despierta el apetito. Es el compañero perfecto para platos con salsa de tomate casera (como unas pastas con tuco) o verduras asadas, realzando los sabores sin taparlos.',
        pairingMetrics: [
          { label: 'ACIDEZ GASTRONÓMICA', percentage: 94, variant: 'amber' },
          { label: 'AFINIDAD PIRAZÍNICA', percentage: 91, variant: 'zinc' },
          { label: 'FINURA TÁNICA', percentage: 87, variant: 'wine' },
        ],
        affinities: [
          { id: 'fideos-tuco-estofado', label: 'Fideos con tuco y estofado' },
          { id: 'bife-de-chorizo', label: 'Bife de chorizo' },
        ],
        contrasts: [
          { id: 'tabla-quesos-duros', label: 'Tabla de quesos duros estacionados' },
          { id: 'pizza-al-molde', label: 'Pizza al molde porteña' },
        ],
        clashes: [
          { target: 'Pescados con crema pesada', reason: 'las pirazinas y la acidez herbal colisionan con la grasa láctica' },
          { target: 'Platos agridulces intensos', reason: 'la fructosa desequilibra su acidez tensa' },
        ],
        witnessBottles: [
          { winery: 'Aleanna (El Enemigo)', label: 'El Enemigo Cabernet Franc', region: 'Gualtallary, Mendoza', vintage: '2021', catalogWineId: 107 },
          { winery: 'Finca Decero', label: 'Mini Ediciones Cabernet Franc', region: 'Agrelo, Luján de Cuyo', vintage: '2020', catalogWineId: 108 },
        ],
      },
    ],
  },

  bonarda: {
    id: 'bonarda',
    name: 'Bonarda',
    category: 'tinto',
    shortTag: 'FRUTA JUGOSA',
    tagline: 'La gran revelación de fruta roja jugosa (frutilla, cereza silvestre), taninos dóciles y trago ágil.',
    originNote: 'Zona Este de Mendoza (Rivadavia, San Martín) y Valle de Calingasta.',
    grapeImageUrl: bonardaGrapeImg,
    styles: [
      {
        styleId: 'fresco',
        styleName: 'Trago Jugoso y Frutal',
        acidity: 'Media-alta, fresca y amable',
        body: 'Medio y fluido',
        tannins: 'Dóciles, redondos y pulposos',
        servingTemperature: '13 °C a 15 °C',
        glassware: 'Copa Borgoña o Tulipán amplia',
        serviceTip: 'Darle 20 minutos de heladera antes de servir para realzar la crocancia de la fruta.',
        serviceTipTitle: 'Golpe de Frío y Fruta Viva',
        serviceMetadata: { label: 'TIEMPO EN HELADERA', value: '20 MIN' },
        practicalTip: 'El gran secreto de la Bonarda es tomarla fresca. 20 a 25 minutos de heladera previa hacen que la fruta roja estalle en la boca y el trago sea súper ágil.',
        rationaleQuestion: '¿Por qué la fruta pura y baja astringencia de la Bonarda brillan con pastas y pizzas?',
        chemicalRationale:
          'Pura fruta roja jugosa y trago amable. Al no tener taninos que sequen la boca, acompaña sin vueltas comidas cotidianas como una pizza al molde, unas milanesas o fideos caseros, refrescando cada bocado con sencillez y alegría.',
        pairingMetrics: [
          { label: 'FLUIDEZ Y TRAGO', percentage: 96, variant: 'amber' },
          { label: 'ACIDEZ FRUTAL', percentage: 90, variant: 'zinc' },
          { label: 'DOCILIDAD TÁNICA', percentage: 86, variant: 'wine' },
        ],
        affinities: [
          { id: 'fideos-tuco-estofado', label: 'Fideos con tuco y estofado' },
          { id: 'pizza-al-molde', label: 'Pizza al molde porteña' },
        ],
        contrasts: [
          { id: 'milanesa-frita', label: 'Milanesa frita tradicional' },
        ],
        clashes: [
          { target: 'Cortes con grasa dura hiper-cocidos', reason: 'carece de tanino suficiente para precipitar la albúmina densa' },
          { target: 'Platos con anchoas saladas puras', reason: 'genera regusto metálico por incompatibilidad iónica' },
        ],
        witnessBottles: [
          { winery: 'Altos Las Hormigas', label: 'Colonia Las Liebres Bonarda Clásica', region: 'Mendoza', vintage: '2022', catalogWineId: 109 },
          { winery: 'Zuccardi Valle de Uco', label: 'Emma Zuccardi Bonarda', region: 'Altamira, San Carlos', vintage: '2021', catalogWineId: 110 },
        ],
      },
    ],
  },

  'pinot-noir': {
    id: 'pinot-noir',
    name: 'Pinot Noir',
    category: 'tinto',
    shortTag: 'PATAGONIA',
    tagline: 'Textura de terciopelo, acidez tensa, frutas rojas del bosque y notas terrosas de sotobosque.',
    originNote: 'Patagonia (Río Negro, Neuquén, Chubut) y zonas extremas de Uco (Gualtallary).',
    grapeImageUrl: pinotNoirGrapeImg,
    styles: [
      {
        styleId: 'patagonico',
        styleName: 'Elegancia de Clima Frío',
        acidity: 'Tensa, vibrante y mineral',
        body: 'Ligero a medio, con gran fluidez',
        tannins: 'Delicados, sedosos y pulidos',
        servingTemperature: '13 °C a 15 °C',
        glassware: 'Copa Borgoña de cáliz ancho (para oxigenar ésteres delicados)',
        serviceTip: 'Temperatura fresca constante; nunca beberlo tibio.',
        serviceTipTitle: 'Oxigenación Delicada y Temperatura Constante',
        serviceMetadata: { label: 'TEMPERATURA CONSTANTE', value: '14 °C' },
        practicalTip: 'Temperatura fresca constante (14 °C). Si está a temperatura ambiente, dale 30 minutos de heladera. Si se enfría de más, entibiá el cáliz de la copa con las palmas de las manos.',
        rationaleQuestion: '¿Cómo logra un tinto sutil armonizar con pescados grasos y cordero patagónico?',
        chemicalRationale:
          'Es un tinto suave, fluido y lleno de elegancia. Su acidez refrescante equilibra las grasas saludables de pescados como el salmón o la trucha y acaricia la terneza de carnes como el cordero, sin tapar jamás la sutileza del plato.',
        pairingMetrics: [
          { label: 'LIMPIEZA LIPÍDICA', percentage: 93, variant: 'amber' },
          { label: 'SUTILEZA TÁNICA', percentage: 95, variant: 'wine' },
          { label: 'REGUSTO DE BOSQUE', percentage: 89, variant: 'zinc' },
        ],
        affinities: [
          { id: 'cordero-patagonico', label: 'Cordero patagónico' },
          { id: 'salmon-trucha-patagonica', label: 'Salmón rosado y trucha patagónica' },
          { id: 'pastas-rellenas-cordero-hongos', label: 'Pastas rellenas con hongos' },
          { id: 'risotto-hongos', label: 'Risotto de hongos y vegetales' },
        ],
        contrasts: [
          { id: 'pescado-rio-parrilla', label: 'Pescado de río a la parrilla' },
        ],
        clashes: [
          { target: 'Asado de tira con grasa quemada a la llama', reason: 'la rusticidad de la brasa aplasta los aromas primarios del Pinot' },
          { target: 'Curry picante o chiles', reason: 'anula la fruta sutil y provoca ardor desmedido' },
        ],
        witnessBottles: [
          { winery: 'Familia Schroeder', label: 'Saurus Barrel Fermented Pinot Noir', region: 'San Patricio del Chañar, Neuquén', vintage: '2021', catalogWineId: 111 },
          { winery: 'Domaine Nico', label: 'Le Paradis Pinot Noir', region: 'Gualtallary, Tupungato', vintage: '2020', catalogWineId: 112 },
          { winery: 'Puramun (José Galante)', label: 'Puramun Reserva Pinot Noir', region: 'Valle de Uco, Mendoza', vintage: '2022', catalogWineId: 113 },
        ],
      },
    ],
  },

  syrah: {
    id: 'syrah',
    name: 'Syrah',
    category: 'tinto',
    shortTag: 'ESPECIADO',
    tagline: 'Pimienta negra recién molida, aceitunas negras, notas cárnicas y taninos envolventes.',
    originNote: 'Valles de San Juan (Tulum, Pedernal) y este mendocino.',
    grapeImageUrl: syrahGrapeImg,
    styles: [
      {
        styleId: 'especiado',
        styleName: 'Cálido y Especiado',
        acidity: 'Media a equilibrada',
        body: 'Pleno, cálido y untuoso',
        tannins: 'Envolventes y corpulentos',
        servingTemperature: '16 °C a 18 °C',
        glassware: 'Copa Burdeos amplia',
        serviceTip: 'Servir a 17 °C para balancear la calidez del tenor alcohólico.',
        serviceTipTitle: 'Atemperado y Concentración Especiada',
        serviceMetadata: { label: 'TEMPERATURA DE SERVICIO', value: '17 °C' },
        practicalTip: 'Descorchalo apenas prendas el fuego o prepares la tabla. Si la noche está calurosa, 10 minutos de heladera bastan para atemperarlo a 17 °C sin matar sus aromas a pimienta.',
        rationaleQuestion: '¿Por qué las notas especiadas del Syrah son ideales para achuras y embutidos?',
        chemicalRationale:
          'Se destaca por sus aromas a pimienta negra recién molida y su cuerpo generoso. Ese perfil especiado y envolvente se complementa a la perfección con achuras crujientes, embutidos y carnes sazonadas, creando un choque de sabores sabroso y bien criollo.',
        pairingMetrics: [
          { label: 'AFINIDAD ESPECIADA', percentage: 97, variant: 'zinc' },
          { label: 'VOLUMEN Y CUERPO', percentage: 92, variant: 'wine' },
          { label: 'COMPENSACIÓN GRASA', percentage: 89, variant: 'amber' },
        ],
        affinities: [
          { id: 'achuras', label: 'Mollejas y achuras crocantes' },
          { id: 'matrimonio', label: 'Matrimonio (chorizo y morcilla)' },
        ],
        contrasts: [
          { id: 'bondiola-cerdo', label: 'Bondiola y cortes de cerdo' },
        ],
        clashes: [
          { target: 'Pescados blancos hervidos', reason: 'la corpulencia del vino aniquila la carne blanca' },
          { target: 'Postres lácteos con crema pastelera', reason: 'la astringencia especiada genera sabor rancio' },
        ],
        witnessBottles: [
          { winery: 'Finca Las Moras', label: 'Mora Negra Syrah-Bonarda', region: 'Valle de Pedernal, San Juan', vintage: '2019', catalogWineId: 114 },
          { winery: 'Bodega Trapiche', label: 'Iscay Syrah-Viognier', region: 'Gualtallary, Mendoza', vintage: '2018', catalogWineId: 115 },
        ],
      },
    ],
  },

  merlot: {
    id: 'merlot',
    name: 'Merlot',
    category: 'tinto',
    shortTag: 'SEDOSO',
    tagline: 'Textura sedosa, taninos dulces, fruta roja madura y notas balsámicas de bosque.',
    originNote: 'Alto Valle de Río Negro, Valle de Uco y Luján de Cuyo.',
    grapeImageUrl: merlotGrapeImg,
    styles: [
      {
        styleId: 'sedoso',
        styleName: 'Equilibrio y Untuosidad',
        acidity: 'Media-alta integrada',
        body: 'Medio a pleno',
        tannins: 'Sedosos, dulces y aterciopelados',
        servingTemperature: '15 °C a 17 °C',
        glassware: 'Copa Burdeos clásica',
        serviceTip: 'Excelente temperatura a 16 °C para resaltar sus notas de ciruela y trufa.',
        serviceTipTitle: 'Expresión Balsámica y Fruta Madura',
        serviceMetadata: { label: 'TEMPERATURA ÓPTIMA', value: '16 °C' },
        practicalTip: 'Con abrirlo 20 minutos antes de comer alcanza para que respire. Si el ambiente supera los 22 °C, un toque de 15 minutos en la heladera mantiene su textura aterciopelada.',
        rationaleQuestion: '¿Por qué la redondez esférica del Merlot complementa carnes de cerdo y hongos?',
        chemicalRationale:
          'Es un vino redondo y suave como el terciopelo. Esa textura amable envuelve la grasa de carnes como la bondiola de cerdo o platos con salsas cremosas y hongos, dejando un final en boca placentero y reconfortante.',
        pairingMetrics: [
          { label: 'SEDOSIDAD TÁNICA', percentage: 95, variant: 'wine' },
          { label: 'EMULSIÓN DE GRASA', percentage: 91, variant: 'amber' },
          { label: 'AFINIDAD TERROSA', percentage: 88, variant: 'zinc' },
        ],
        affinities: [
          { id: 'bondiola-cerdo', label: 'Bondiola y cortes de cerdo' },
          { id: 'pastas-rellenas-cordero-hongos', label: 'Pastas rellenas con hongos' },
          { id: 'merluza-negra', label: 'Merluza negra patagónica' },
        ],
        contrasts: [
          { id: 'risotto-hongos', label: 'Risotto de hongos y vegetales' },
        ],
        clashes: [
          { target: 'Ceviches con limón crudo', reason: 'la acidez cítrica descompone la textura sedosa del vino' },
          { target: 'Quesos hipermaduros picantes', reason: 'tapan las sutilezas balsámicas del varietal' },
        ],
        witnessBottles: [
          { winery: 'Finca La Anita', label: 'Anita by Finca La Anita Merlot', region: 'Agrelo, Luján de Cuyo', vintage: '2020', catalogWineId: 116 },
          { winery: 'Bodega Otronia', label: '45 Rugientes Merlot Extremo', region: 'Sarmiento, Chubut', vintage: '2021', catalogWineId: 117 },
        ],
      },
    ],
  },

  'blends-de-guarda': {
    id: 'blends-de-guarda',
    name: 'Blends de Guarda',
    category: 'tinto',
    shortTag: 'GRAN RESERVA',
    tagline: 'Complejidad terciaria: notas de cuero noble, tabaco rubio, cedro y cacao en una arquitectura magistral.',
    originNote: 'Valles tradicionales de Mendoza y Calchaquíes.',
    grapeImageUrl: cabernetSauvignonGrapeImg,
    styles: [
      {
        styleId: 'gran-reserva',
        styleName: 'Gran Reserva Evolucionado',
        acidity: 'Sostenida y equilibrada',
        body: 'Voluminoso, amplio y profundo',
        tannins: 'Polimerizados, nobles y de larga persistencia',
        servingTemperature: '16 °C a 18 °C',
        glassware: 'Copa Burdeos Gran Reserva',
        serviceTip: 'Decantar 45 a 60 minutos previos; imprescindible servir a 17 °C.',
        serviceTipTitle: 'Decantación Prolongada y Oxigenación',
        serviceMetadata: { label: 'TIEMPO EN DECANTER', value: '50 MIN' },
        practicalTip: 'Descorchalo 1 hora antes de la comida. Al servir la primera copa, hacelo con caída suave desde cierta altura para que el vino "respire" al chocar con las paredes del cristal.',
        rationaleQuestion: '¿Por qué la complejidad terciaria de guarda es insustituible para guisos y cocciones lentas?',
        chemicalRationale:
          'El tiempo de guarda afinó sus taninos y sumó aromas profundos a cuero, tabaco y cacao. Pide platos de olla cocinados a fuego lento, como un guiso de lentejas o un puchero de bodegón, donde los sabores concentrados se funden con la nobleza del vino.',
        pairingMetrics: [
          { label: 'PERSISTENCIA Y VOLUMEN', percentage: 98, variant: 'wine' },
          { label: 'POLIMERIZACIÓN TÁNICA', percentage: 96, variant: 'zinc' },
          { label: 'BALANCE LIPÍDICO', percentage: 90, variant: 'amber' },
        ],
        affinities: [
          { id: 'guiso-de-lentejas', label: 'Guiso de lentejas de olla' },
          { id: 'puchero-bodegon', label: 'Puchero de bodegón' },
          { id: 'tabla-quesos-duros', label: 'Tabla de quesos duros estacionados' },
        ],
        contrasts: [
          { id: 'asado-tira', label: 'Asado de tira a las brasas' },
        ],
        clashes: [
          { target: 'Pescados y mariscos de todo tipo', reason: 'choque catastrófico de taninos terciarios con yodo' },
          { target: 'Platos ligeros al vapor', reason: 'el vino aniquila cualquier matiz delicado' },
        ],
        witnessBottles: [
          { winery: 'Flechas de los Andes', label: 'Gran Corte (Malbec-Syrah-Cabernet Franc)', region: 'Vista Flores, Tunuyán', vintage: '2019', catalogWineId: 118 },
          { winery: 'Bodegas López', label: 'Montchenot Gran Reserva 15 Años', region: 'Maipú, Mendoza', vintage: '2008', catalogWineId: 119 },
        ],
      },
    ],
  },

  torrontes: {
    id: 'torrontes',
    name: 'Torrontés',
    category: 'blanco',
    shortTag: 'AROMÁTICO SALTA',
    tagline: 'Cepa autóctona argentina; exuberancia floral (azahar, jazmín) con una entrada filosa y estrictamente seca en boca.',
    originNote: 'Valles Calchaquíes (Cafayate, Cachi) y Famatina (La Rioja).',
    grapeImageUrl: torrontesGrapeImg,
    styles: [
      {
        styleId: 'calchaqui',
        styleName: 'Seco y Expresivo de Altura',
        acidity: 'Filosa, cítrica y lineal',
        body: 'Ligero a medio, con entrada crujiente',
        servingTemperature: '8 °C a 10 °C',
        glassware: 'Copa Tulipán o degustación blanca',
        serviceTip: 'Servir en frapera a 9 °C; no dejar que tome temperatura ambiente para evitar amargor terpénico.',
        serviceTipTitle: 'Control Estricto de Temperatura',
        serviceMetadata: { label: 'SERVICIO EN FRAPERA', value: '9 °C' },
        practicalTip: '¿Frapera express en 10 minutos? Sumergí la botella en un bowl con agua, cubitos de hielo y un puñado de sal gruesa. Enfría el doble de rápido que el freezer sin alterar los aromas.',
        rationaleQuestion: '¿Por qué el contraste entre perfume exuberante y boca seca vence al picante y la grasa?',
        chemicalRationale:
          'En nariz promete dulzura por sus aromas a flores y durazno, pero al beberlo es seco, fresco y chispeante. Esa frescura limpia al instante el aceite de empanadas fritas y apaga la sensación de picor de platos norteños como el locro.',
        pairingMetrics: [
          { label: 'CONTRASTE DE PICOR', percentage: 95, variant: 'amber' },
          { label: 'TENSIÓN CÍTRICA', percentage: 93, variant: 'zinc' },
          { label: 'DESENGRASANTE', percentage: 91, variant: 'wine' },
        ],
        affinities: [
          { id: 'sushi-nikkei', label: 'Sushi y rolls nikkei' },
        ],
        contrasts: [
          { id: 'empanadas-carne-cuchillo', label: 'Empanadas de carne a cuchillo' },
          { id: 'locro-criollo', label: 'Locro criollo tradicional' },
        ],
        clashes: [
          { target: 'Carnes rojas a las brasas', reason: 'ausencia total de taninos deja el paladar grasoso e indefenso' },
          { target: 'Postres muy azucarados', reason: 'la acidez seca del vino se transforma en amargor desagradable' },
        ],
        witnessBottles: [
          { winery: 'Nido del Tigre', label: 'Blanco de Jardín Torrontés Centenario', region: 'Cafayate, Salta', vintage: '2023', catalogWineId: 120 },
          { winery: 'El Esteco', label: 'Old Vines 1946 Torrontés', region: 'Valles Calchaquíes', vintage: '2022', catalogWineId: 121 },
        ],
      },
    ],
  },

  'sauvignon-blanc': {
    id: 'sauvignon-blanc',
    name: 'Sauvignon Blanc',
    category: 'blanco',
    shortTag: 'CÍTRICO & MINERAL',
    tagline: 'Herbáceo, cítrico, notas de ruda y pasto fresco cortado con acidez vertical y mineral.',
    originNote: 'Gualtallary (Tupungato) y Costa Atlántica (Chapadmalal).',
    grapeImageUrl: sauvignonBlancGrapeImg,
    styles: [
      {
        styleId: 'mineral',
        styleName: 'Acidez Tensa y Marina',
        acidity: 'Eléctrica, cítrica y filosa',
        body: 'Ligero y sumamente ágil',
        servingTemperature: '8 °C a 10 °C',
        glassware: 'Copa Sauvignon Blanc de boca estrecha',
        serviceTip: '1 hora en heladera antes de servir.',
        serviceTipTitle: 'Enfriado y Conservación Marina',
        serviceMetadata: { label: 'TIEMPO EN FRÍO', value: '60 MIN' },
        practicalTip: 'Mantenelo entre 8 °C y 9 °C. Si vas a tomarlo al aire libre, envolvé la botella en un repasador húmedo frío para que no se caliente en la mesa y mantenga su filo cítrico.',
        rationaleQuestion: '¿Por qué la frescura cítrica del Sauvignon Blanc es ideal para frituras y mariscos?',
        chemicalRationale:
          'Es eléctrico, cítrico y muy refrescante. Su acidez actúa exactamente como exprimir unas gotas de limón fresco sobre mariscos, rabas o pescados: disuelve cualquier sensación grasa y despierta el paladar al instante.',
        pairingMetrics: [
          { label: 'ACIDEZ MÁLICA VIVA', percentage: 96, variant: 'amber' },
          { label: 'CORTE DE ACEITE', percentage: 94, variant: 'wine' },
          { label: 'MINERALIDAD', percentage: 90, variant: 'zinc' },
        ],
        affinities: [
          { id: 'sushi-nikkei', label: 'Sushi y rolls nikkei' },
          { id: 'paella-mariscos', label: 'Paella y arroces con mariscos' },
        ],
        contrasts: [
          { id: 'locro-criollo', label: 'Locro criollo tradicional' },
          { id: 'milanesa-frita', label: 'Milanesa frita tradicional' },
        ],
        clashes: [
          { target: 'Cortes vacunos con costra de grasa caliente', reason: 'el ácido filoso choca con el colágeno provocando sabor agrio' },
          { target: 'Salsas cremosas pesadas de queso azul', reason: 'rompe la emulsión de forma desagradable' },
        ],
        witnessBottles: [
          { winery: 'Zorzal Wines', label: 'Eggo Blanc de Calcáreo Sauvignon Blanc', region: 'Gualtallary, Mendoza', vintage: '2022', catalogWineId: 122 },
          { winery: 'Bodega Salentein', label: 'Primus Sauvignon Blanc', region: 'Valle de Uco, Mendoza', vintage: '2021', catalogWineId: 123 },
        ],
      },
    ],
  },

  chardonnay: {
    id: 'chardonnay',
    name: 'Chardonnay',
    category: 'blanco',
    shortTag: 'CRIANZA & MANTECA',
    tagline: 'La versatilidad reina: desde frescura mineral y cítrica hasta la voluptuosidad mantecosa de la crianza en roble.',
    originNote: 'Gualtallary, San Pablo y valles patagónicos.',
    grapeImageUrl: chardonnayGrapeImg,
    styles: [
      {
        styleId: 'inox',
        styleName: 'Sin Madera (Joven & Mineral)',
        acidity: 'Tensa, málica y crujiente',
        body: 'Medio y fluido',
        servingTemperature: '8 °C a 10 °C',
        glassware: 'Copa Tulipán para blancos jóvenes',
        serviceTip: 'Mantener en frapera fresca.',
        serviceTipTitle: 'Frescura Mineral y Servicio Ligero',
        serviceMetadata: { label: 'TEMPERATURA DE SERVICIO', value: '9 °C' },
        practicalTip: 'Directo de la heladera a la copa (unos 8-9 °C). Es conveniente servir de a medias copas para que no gane temperatura en la mesa y mantenga su textura crujiente.',
        rationaleQuestion: '¿Por qué un blanco puro sin roble respeta la sutileza de preparaciones marinas?',
        chemicalRationale:
          'Pura fruta fresca como manzana verde y pera, sin paso por madera. Al ser tan ágil y limpio, acompaña platos frescos como sushi, mariscos y pescados a la plancha dejando que el sabor del mar sea el protagonista.',
        pairingMetrics: [
          { label: 'FINURA Y LIGEREZA', percentage: 94, variant: 'zinc' },
          { label: 'ACIDEZ LIMPIADORA', percentage: 91, variant: 'amber' },
          { label: 'ARMONÍA YODO/SAL', percentage: 88, variant: 'wine' },
        ],
        affinities: [
          { id: 'sushi-nikkei', label: 'Sushi y rolls nikkei' },
          { id: 'paella-mariscos', label: 'Paella y arroces con mariscos' },
        ],
        contrasts: [
          { id: 'pescado-rio-parrilla', label: 'Pescado de río a la parrilla' },
        ],
        clashes: [
          { target: 'Carnes rojas a las brasas', reason: 'cuerpo insuficiente para lidiar con grasas pesadas' },
          { target: 'Guisos de olla concentrados', reason: 'queda completamente borrado por los jugos espesos' },
        ],
        witnessBottles: [
          { winery: 'Catena Zapata', label: 'Appellation Tupungato Chardonnay', region: 'Tupungato, Valle de Uco', vintage: '2022', catalogWineId: 124 },
        ],
      },
      {
        styleId: 'crianza',
        styleName: 'Con Madera (Crianza en Roble & Untuoso)',
        acidity: 'Media, untuosa y cremosa',
        body: 'Pleno, mantecoso y envolvente',
        servingTemperature: '10 °C a 12 °C',
        glassware: 'Copa Borgoña ancha para oxigenar ésteres terciarios',
        serviceTip: 'No enfriar en exceso (nunca a menos de 10 °C) para no opacar las notas tostadas.',
        serviceTipTitle: 'Temperatura Templada para Ésteres',
        serviceMetadata: { label: 'TEMPERATURA MÍNIMA', value: '11 °C' },
        practicalTip: 'No lo sirvas helado. Si estuvo en la heladera, retiralo 20 minutos antes de descorchar (11-12 °C): el frío excesivo "duerme" la manteca y los aromas nobles de la barrica.',
        rationaleQuestion: '¿Por qué la untuosidad y notas de roble del Chardonnay abrazan platos cremosos?',
        chemicalRationale:
          'Su crianza en barrica le regala una textura cremosa, casi mantecosa, con notas a pan tostado y avellana. Es ideal para pescados grasos, pastas con crema o pollo al horno, acompañando la untuosidad del plato con gran elegancia.',
        pairingMetrics: [
          { label: 'AFINIDAD MANTECOSA', percentage: 96, variant: 'amber' },
          { label: 'VOLUMEN EN BOCA', percentage: 93, variant: 'zinc' },
          { label: 'BALANCE ÁCIDO-GRASO', percentage: 89, variant: 'wine' },
        ],
        affinities: [
          { id: 'salmon-trucha-patagonica', label: 'Salmón rosado y trucha patagónica' },
          { id: 'pastas-rellenas-cordero-hongos', label: 'Pastas rellenas con crema u hongos' },
          { id: 'achuras', label: 'Mollejas doradas' },
        ],
        contrasts: [
          { id: 'merluza-negra', label: 'Merluza negra patagónica' },
        ],
        clashes: [
          { target: 'Ceviches con alto jugo de lima', reason: 'el ácido cítrico puro corta la untuosidad láctica generando textura áspera' },
          { target: 'Ensaladas con vinagres crudos', reason: 'choque directo con las notas de barrica' },
        ],
        witnessBottles: [
          { winery: 'Terrazas de los Andes', label: 'Grand Chardonnay', region: 'Gualtallary, Valle de Uco', vintage: '2021', catalogWineId: 125 },
          { winery: 'Catena Zapata', label: 'Adrianna Vineyard White Bones', region: 'Gualtallary, Tupungato', vintage: '2020', catalogWineId: 126 },
        ],
      },
    ],
  },

  rosados: {
    id: 'rosados',
    name: 'Vinos Rosados',
    category: 'rosado',
    shortTag: 'FRESCO & FRUTAL',
    tagline: 'El gran puente gastronómico: la acidez vibrante de un blanco combinada con la suave estructura tánica de un tinto joven.',
    originNote: 'Valle de Uco y Patagonia.',
    grapeImageUrl: pinotNoirGrapeImg,
    styles: [
      {
        styleId: 'gastronomico',
        styleName: 'Rosé Seco Gastronómico',
        acidity: 'Vibrante y refrescante',
        body: 'Ligero a medio con textura en boca',
        tannins: 'Sutiles trazas fenólicas de maceración corta',
        servingTemperature: '9 °C a 12 °C',
        glassware: 'Copa Tulipán o copa Borgoña mediana',
        serviceTip: 'Servir en frapera con agua y cubos de hielo.',
        serviceTipTitle: 'Servicio en Frapera Continua',
        serviceMetadata: { label: 'TEMPERATURA DE CAVA', value: '10 °C' },
        practicalTip: 'Mantenelo en frapera con hielo durante toda la comida. Si no tenés frapera, serví una copa y guardá la botella en la puerta de la heladera entre rondas para cuidar su frescura.',
        rationaleQuestion: '¿Por qué el vino rosado funciona como el comodín perfecto entre tierra y mar?',
        chemicalRationale:
          'Combina la chispa fresca de un vino blanco con el sutil cuerpo de un tinto joven. Es el gran comodín de la mesa: corta la grasa de un choripán o achuras y, al mismo tiempo, respeta la delicadeza de una paella o unas piezas de sushi.',
        pairingMetrics: [
          { label: 'VERSATILIDAD POLIVALENTE', percentage: 95, variant: 'amber' },
          { label: 'ACIDEZ DESENGRASANTE', percentage: 92, variant: 'wine' },
          { label: 'ARMONÍA FLORAL', percentage: 87, variant: 'zinc' },
        ],
        affinities: [
          { id: 'paella-mariscos', label: 'Paella y arroces con mariscos' },
          { id: 'sushi-nikkei', label: 'Sushi y rolls nikkei' },
          { id: 'choripan', label: 'Choripán tradicional' },
        ],
        contrasts: [
          { id: 'achuras', label: 'Mollejas y achuras crocantes' },
          { id: 'milanesa-frita', label: 'Milanesa frita tradicional' },
        ],
        clashes: [
          { target: 'Guisos de olla contundentes', reason: 'el peso del caldo espeso neutraliza los aromas sutiles del rosado' },
          { target: 'Quesos azules híper salados', reason: 'el moho penicillium aplasta la frescura del vino' },
        ],
        witnessBottles: [
          { winery: 'Bodega Renacer', label: 'Punto Final Orgánico Rosé Malbec', region: 'Luján de Cuyo, Mendoza', vintage: '2023', catalogWineId: 127 },
          { winery: 'Rosell Boher', label: 'Antonieta Pinot Noir Rosé', region: 'Valle de Uco, Mendoza', vintage: '2022', catalogWineId: 128 },
          { winery: 'Bodega Foster Lorca', label: 'Indomable Rosé de Malbec (Espumoso)', region: 'Perdriel, Luján de Cuyo', vintage: 'NV', catalogWineId: 129 },
        ],
      },
    ],
  },

  naranjos: {
    id: 'naranjos',
    name: 'Vinos Naranjos',
    category: 'naranjo',
    shortTag: 'MACERACIÓN & PIEL',
    tagline: 'Blancos vinificados como tintos; fermentados con pieles y orujos, aportando taninos tenues, acidez filosa y textura táctil.',
    originNote: 'Paraje Altamira, Cafayate y Lavalle.',
    grapeImageUrl: torrontesGrapeImg,
    styles: [
      {
        styleId: 'macerado',
        styleName: 'Maceración Prolongada & Textura',
        acidity: 'Alta y punzante',
        body: 'Medio con volumen táctil',
        tannins: 'Textura granulosa fina de hollejo blanco',
        servingTemperature: '10 °C a 12 °C',
        glassware: 'Copa Tulipán amplia o Burdeos mediana',
        serviceTip: 'Servir a temperatura de cava (11 °C) para que los taninos no se sientan rígidos.',
        serviceTipTitle: 'Atemperado de Hollejos',
        serviceMetadata: { label: 'TEMPERATURA DE CAVA', value: '11 °C' },
        practicalTip: 'Temperatura intermedia (11 °C). No lo enfríes tanto como un blanco común porque los taninos de piel blanca se vuelven ásperos: 20 minutos de heladera previa son ideales.',
        rationaleQuestion: '¿Por qué la textura y acidez del vino naranjo son el secreto para limpiar achuras grasas?',
        chemicalRationale:
          'Un blanco fermentado con las pieles de la uva, como si fuera tinto. Eso le da un cuerpo y una textura únicas que desengrasan como nada las achuras crocantes (mollejas, chinchulines), refrescando la boca sin tapar el sabor del asado.',
        pairingMetrics: [
          { label: 'EMULSIÓN GLANDULAR', percentage: 97, variant: 'amber' },
          { label: 'AGRESIVIDAD TÁNICA TENUE', percentage: 91, variant: 'wine' },
          { label: 'TEXTURA TÁCTIL', percentage: 89, variant: 'zinc' },
        ],
        affinities: [
          { id: 'achuras', label: 'Mollejas y achuras crocantes' },
          { id: 'tabla-quesos-duros', label: 'Tabla de quesos duros estacionados' },
        ],
        contrasts: [
          { id: 'bife-de-chorizo', label: 'Bife de chorizo' },
          { id: 'choripan', label: 'Choripán tradicional' },
        ],
        clashes: [
          { target: 'Postres dulces de repostería', reason: 'los taninos rústicos de piel blanca chocan con el almíbar y azúcar' },
          { target: 'Pescados blancos hervidos', reason: 'la textura de pieles oculta la suavidad del pescado magro' },
        ],
        witnessBottles: [
          { winery: 'Bodega Luigi Bosca', label: 'Apuntes Naranjo', region: 'Luján de Cuyo, Mendoza', vintage: '2022', catalogWineId: 130 },
          { winery: 'Matias Riccitelli', label: 'Torrontés Brutal Naranjo', region: 'Cafayate, Salta', vintage: '2021', catalogWineId: 131 },
        ],
      },
    ],
  },
};

/**
 * 22 Platos Concretos Tradicionales
 */
export const DISH_PAIRINGS: Record<string, DishPairingEntry> = {
  // --- FUEGOS ---
  'asado-tira': {
    id: 'asado-tira',
    familyId: 'fuegos',
    name: 'Asado de tira a las brasas',
    tagline: 'Corte emblemático con hueso, grasa perimetral y colágeno fundido a fuego lento de leña.',
    servingTemperature: '16 °C a 18 °C',
    glassware: 'Copa Burdeos clásica de cáliz amplio',
    serviceTip: 'Temperatura de cava fresca; decantar el tinto para no generar choque térmico con la carne caliente.',
    chemicalRationale:
      'La grasa intramuscular densa y la costra crocante de Maillard exigen taninos activos y buena graduación alcohólica que emulsionen los lípidos calientes y limpien el paladar tras cada bocado.',
    affinities: [
      { id: 'malbec', label: 'Malbec Tradicional (Crianza)', styleAnchor: 'tradicional' },
      { id: 'cabernet-sauvignon', label: 'Cabernet Sauvignon Reserva' },
    ],
    contrasts: [
      { id: 'cabernet-franc', label: 'Cabernet Franc de Altura' },
      { id: 'blends-de-guarda', label: 'Blend Gran Reserva' },
    ],
    clashes: [
      { target: 'Blancos jóvenes sin madera', reason: 'acidez y cuerpo insuficientes ante la grasa densa del corte' },
      { target: 'Espumantes dulces o demi-sec', reason: 'el azúcar residual colisiona desagradablemente con la grasa caliente y el humo' },
    ],
    witnessBottles: [
      { winery: 'Bodega Dante Robino', label: "The President's Malbec", region: 'Perdriel, Luján de Cuyo', vintage: '2020', catalogWineId: 132 },
      { winery: 'Cadus Wines', label: 'Single Vineyard Finca Las Torcazas Malbec', region: 'Luján de Cuyo', vintage: '2021', catalogWineId: 101 },
    ],
  },

  'bife-de-chorizo': {
    id: 'bife-de-chorizo',
    familyId: 'fuegos',
    name: 'Bife de chorizo',
    tagline: 'Corte tierno y jugoso de bife angosto con pestaña lateral de grasa dorada a la parrilla.',
    servingTemperature: '16 °C a 18 °C',
    glassware: 'Copa Burdeos clásica',
    serviceTip: 'Servir a punto jugoso para que los jugos de la carne interactúen con la fruta del vino.',
    chemicalRationale:
      'La abundancia de mioglobina y proteínas solubles requiere un tinto con taninos envolventes pero no ásperos, que armonicen con el jugo cárnico sin opacar su terneza.',
    affinities: [
      { id: 'malbec', label: 'Malbec Tradicional (Crianza)', styleAnchor: 'tradicional' },
      { id: 'cabernet-franc', label: 'Cabernet Franc de Terruño' },
    ],
    contrasts: [
      { id: 'naranjos', label: 'Vino Naranjo estructurado' },
      { id: 'malbec', label: 'Malbec de Altura (Calcáreo)', styleAnchor: 'altura' },
    ],
    clashes: [
      { target: 'Blancos ligeros neutros', reason: 'anulados inmediatamente por la densidad proteica' },
      { target: 'Cosechas tardías dulces', reason: 'choque azúcares-sal que desfigura la carne' },
    ],
    witnessBottles: [
      { winery: 'Cadus Wines', label: 'Single Vineyard Finca Las Torcazas Malbec', region: 'Luján de Cuyo', vintage: '2021', catalogWineId: 101 },
    ],
  },

  'ojo-de-bife': {
    id: 'ojo-de-bife',
    familyId: 'fuegos',
    name: 'Ojo de bife a la leña',
    tagline: 'Centro de bife ancho con notable veteado de grasa intramuscular que se funde en cocción.',
    servingTemperature: '16 °C a 18 °C',
    glassware: 'Copa Burdeos o Borgoña amplia',
    serviceTip: 'Decantar 30 minutos previos para abrir los aromas del vino.',
    chemicalRationale:
      'La alta infiltración lipídica interna (marmoleado) requiere taninos finos y calcáreos con acidez viva que disuelvan la grasa sin saturar las papilas gustativas.',
    affinities: [
      { id: 'malbec', label: 'Malbec de Altura (Calcáreo)', styleAnchor: 'altura' },
      { id: 'cabernet-sauvignon', label: 'Cabernet Sauvignon' },
    ],
    contrasts: [
      { id: 'cabernet-franc', label: 'Cabernet Franc de Altura' },
    ],
    clashes: [
      { target: 'Blancos jóvenes del año', reason: 'los jugos de la grasa intramuscular sepultan el vino' },
      { target: 'Espumantes dulces', reason: 'incompatibilidad grasa-sacarosa' },
    ],
    witnessBottles: [
      { winery: 'Bodega Monteviejo', label: 'Lindaflor Malbec', region: 'Valle de Uco, Mendoza', vintage: '2020', catalogWineId: 102 },
    ],
  },

  achuras: {
    id: 'achuras',
    familyId: 'fuegos',
    name: 'Mollejas y achuras crocantes',
    tagline: 'Mollejas al limón, chinchulines dorados y riñones crocantes al fuego vivo.',
    servingTemperature: '10 °C a 12 °C',
    glassware: 'Copa Tulipán amplia o Borgoña',
    serviceTip: 'Servir el vino frío para potenciar el efecto desengrasante entre bocados.',
    chemicalRationale:
      'La grasa glandular crocante y el toque cítrico del limón destruyen los tintos maderosos tánicos. Exigen vinos con acidez punzante, textura tánica tenue o burbujas que emulsionen la grasa.',
    affinities: [
      { id: 'naranjos', label: 'Vinos Naranjos Macerados' },
      { id: 'chardonnay', label: 'Chardonnay Crianza en Roble', styleAnchor: 'crianza' },
    ],
    contrasts: [
      { id: 'rosados', label: 'Rosé Seco Gastronómico' },
      { id: 'syrah', label: 'Syrah Cálido y Especiado' },
    ],
    clashes: [
      { target: 'Tintos Gran Reserva con mucha madera', reason: 'los taninos secantes se vuelven amargos frente al limón y la grasa superficial' },
      { target: 'Vinos dulces de postre', reason: 'choque directo con el perfil salino de las achuras' },
    ],
    witnessBottles: [
      { winery: 'Bodega Luigi Bosca', label: 'Apuntes Naranjo', region: 'Luján de Cuyo', vintage: '2022', catalogWineId: 130 },
    ],
  },

  choripan: {
    id: 'choripan',
    familyId: 'fuegos',
    name: 'Choripán tradicional',
    tagline: 'Embutido puro de cerdo y vaca asado a la mariposa con chimichurri en pan crujiente.',
    servingTemperature: '10 °C a 13 °C',
    glassware: 'Copa Tulipán o degustación',
    serviceTip: 'Bebidas frescas con chispa ácida o burbujas.',
    chemicalRationale:
      'El embutido caliente posee alto tenor graso y salinidad, condimentado con hierbas y vinagre del chimichurri. La acidez tensa y las burbujas limpian el paladar de inmediato.',
    affinities: [
      { id: 'rosados', label: 'Rosé de Malbec (Espumoso o Seco)' },
      { id: 'bonarda', label: 'Bonarda Joven y Frutal' },
    ],
    contrasts: [
      { id: 'naranjos', label: 'Vino Naranjo' },
    ],
    clashes: [
      { target: 'Tintos corpulentos de más de 15 años', reason: 'la rusticidad grasa del chorizo anula la complejidad terciaria' },
      { target: 'Blancos dulces', reason: 'el vinagre del chimichurri genera sabor agrio' },
    ],
    witnessBottles: [
      { winery: 'Foster Lorca', label: 'Indomable Rosé de Malbec', region: 'Luján de Cuyo', vintage: 'NV', catalogWineId: 129 },
    ],
  },

  matrimonio: {
    id: 'matrimonio',
    familyId: 'fuegos',
    name: 'Matrimonio (chorizo y morcilla)',
    tagline: 'Dúo parrillero de sabores intensos, notas especiadas, sangre cocida y pimentón.',
    servingTemperature: '14 °C a 16 °C',
    glassware: 'Copa Burdeos mediana',
    serviceTip: 'Servir a temperatura fresca.',
    chemicalRationale:
      'La morcilla aporta notas metálicas nobles de hierro y especias dulces (canela, nuez moscada), mientras el chorizo suma grasa cárnica. Requiere tintos frescos de trago ágil pero con suficiente consistencia.',
    affinities: [
      { id: 'malbec', label: 'Malbec de Altura (Calcáreo)', styleAnchor: 'altura' },
      { id: 'syrah', label: 'Syrah Especiado' },
    ],
    contrasts: [
      { id: 'bonarda', label: 'Bonarda Frutal' },
    ],
    clashes: [
      { target: 'Blancos neutros ligeros', reason: 'la intensidad del hierro de la morcilla los desaparece' },
      { target: 'Espumantes dulces', reason: 'choque de sabores grotesco con la grasa' },
    ],
    witnessBottles: [
      { winery: 'Zorzal Wines', label: 'Espontáneo Suelo Grava Gualtallary Malbec', region: 'Gualtallary', vintage: '2022', catalogWineId: 103 },
    ],
  },

  'cordero-patagonico': {
    id: 'cordero-patagonico',
    familyId: 'fuegos',
    name: 'Cordero patagónico al asador',
    tagline: 'Carne magra, sabor intenso y aromático gracias a las pasturas de la estepa austral.',
    servingTemperature: '14 °C a 16 °C',
    glassware: 'Copa Borgoña de cáliz amplio',
    serviceTip: 'Maridaje por identidad regional (terruño patagónico).',
    chemicalRationale:
      'La grasa del cordero tiene un punto de fusión más alto y aromas almizclados y terrosos que encuentran resonancia perfecta con los terpenos y notas de sotobosque del Pinot Noir o la firmeza de un Cabernet.',
    affinities: [
      { id: 'pinot-noir', label: 'Pinot Noir Patagónico' },
      { id: 'cabernet-sauvignon', label: 'Cabernet Sauvignon' },
    ],
    contrasts: [
      { id: 'merlot', label: 'Merlot de Zona Fría' },
    ],
    clashes: [
      { target: 'Blancos ligeros florales', reason: 'la potencia del cordero tapa completamente el vino' },
      { target: 'Vinos con azúcar residual', reason: 'la grasa densa no admite dulzores almibarados' },
    ],
    witnessBottles: [
      { winery: 'Familia Schroeder', label: 'Saurus Barrel Fermented Pinot Noir', region: 'San Patricio del Chañar', vintage: '2021', catalogWineId: 111 },
    ],
  },

  'bondiola-cerdo': {
    id: 'bondiola-cerdo',
    familyId: 'fuegos',
    name: 'Bondiola y cortes de cerdo a la brasa',
    tagline: 'Carne suculenta con grasa dulce entreverada y caramelización exterior.',
    servingTemperature: '15 °C a 17 °C',
    glassware: 'Copa Burdeos clásica',
    serviceTip: 'Un tinto sedoso acompaña la textura sin secar la carne.',
    chemicalRationale:
      'La grasa porcina es más suave y menos densa que la vacuna. Un tinto de taninos sedosos y maduros (Merlot o Syrah) la redondea perfectamente sin la aspereza de taninos secantes.',
    affinities: [
      { id: 'merlot', label: 'Merlot Sedoso y Frutal' },
      { id: 'syrah', label: 'Syrah Cálido' },
    ],
    contrasts: [
      { id: 'bonarda', label: 'Bonarda Joven' },
    ],
    clashes: [
      { target: 'Tintos de extrema extracción tánica', reason: 'secan la delicadeza del cerdo' },
      { target: 'Blancos sin cuerpo', reason: 'la grasa porcina los supera' },
    ],
    witnessBottles: [
      { winery: 'Finca La Anita', label: 'Anita by Finca La Anita Merlot', region: 'Agrelo, Luján de Cuyo', vintage: '2020', catalogWineId: 116 },
    ],
  },

  // --- OLLAS Y GUISOS ---
  'locro-criollo': {
    id: 'locro-criollo',
    familyId: 'ollas-y-guisos',
    name: 'Locro criollo tradicional',
    tagline: 'Guiso patrio espeso de maíz blanco partido, porotos, patitas de cerdo, panceta y salsita picante (quiquirimichi).',
    servingTemperature: '8 °C a 10 °C',
    glassware: 'Copa Tulipán para blancos aromáticos',
    serviceTip: 'Servir blanco o rosado bien frío para contrastar la temperatura y untuosidad del guiso.',
    chemicalRationale:
      'El almidón gelatinizado del maíz y los colágenos del cerdo generan una untuosidad envolvente y caliente. Un blanco aromático y seco de alta acidez (Torrontés o Sauvignon Blanc) corta el almidón y neutraliza el ají picante.',
    affinities: [
      { id: 'torrontes', label: 'Torrontés Seco de Altura' },
      { id: 'sauvignon-blanc', label: 'Sauvignon Blanc Mineral' },
    ],
    contrasts: [
      { id: 'bonarda', label: 'Bonarda Joven (fresco a 13 °C)' },
      { id: 'rosados', label: 'Rosé Gastronómico' },
    ],
    clashes: [
      { target: 'Tintos con alta crianza en roble y alcohol', reason: 'el alcohol potencia el picor del quiquirimichi y la madera choca con el zapallo' },
      { target: 'Blancos mantecosos con maloláctica', reason: 'duplican la pesadez láctica del guiso' },
    ],
    witnessBottles: [
      { winery: 'Nido del Tigre', label: 'Blanco de Jardín Torrontés Centenario', region: 'Cafayate, Salta', vintage: '2023', catalogWineId: 120 },
    ],
  },

  'guiso-de-lentejas': {
    id: 'guiso-de-lentejas',
    familyId: 'ollas-y-guisos',
    name: 'Guiso de lentejas de olla',
    tagline: 'Cocción profunda y untuosa con chorizo colorado, panceta ahumada y fondo de carne concentrado.',
    servingTemperature: '16 °C a 18 °C',
    glassware: 'Copa Burdeos Gran Reserva',
    serviceTip: 'Decantar el vino 30 minutos; el guiso caliente pide tintos con volumen y estructura.',
    chemicalRationale:
      'Las lentejas aportan almidones y textura sápida terrosa, mientras el chorizo colorado aporta pimentón ahumado. Un blend maduro de guarda ofrece notas terciarias que espejan la densidad del fondo de cocción.',
    affinities: [
      { id: 'blends-de-guarda', label: 'Blend Gran Reserva de Guarda' },
      { id: 'syrah', label: 'Syrah Especiado' },
    ],
    contrasts: [
      { id: 'cabernet-franc', label: 'Cabernet Franc de Terruño' },
    ],
    clashes: [
      { target: 'Blancos jóvenes ligeros', reason: 'se pierden completamente en la densidad del caldo' },
      { target: 'Espumantes dulces', reason: 'desfigura el pimentón ahumado' },
    ],
    witnessBottles: [
      { winery: 'Flechas de los Andes', label: 'Gran Corte', region: 'Valle de Uco', vintage: '2019', catalogWineId: 118 },
    ],
  },

  'puchero-bodegon': {
    id: 'puchero-bodegon',
    familyId: 'ollas-y-guisos',
    name: 'Puchero de bodegón',
    tagline: 'Osobuco con caracú, panceta, chorizo, choclo, garbanzos y verduras hervidas en su propio caldo denso.',
    servingTemperature: '15 °C a 17 °C',
    glassware: 'Copa Burdeos tradicional',
    serviceTip: 'Servir a temperatura de bodega fresca.',
    chemicalRationale:
      'El caracú (médula ósea) y la cocción húmeda aportan gelatina y grasas untuosas pero sin la costra crocante de la parrilla. Pide un tinto de taninos envolventes y trago franco que acompañe sin raspar.',
    affinities: [
      { id: 'blends-de-guarda', label: 'Blend Gran Reserva' },
      { id: 'malbec', label: 'Malbec Tradicional (Crianza)', styleAnchor: 'tradicional' },
    ],
    contrasts: [
      { id: 'bonarda', label: 'Bonarda Jugosa' },
    ],
    clashes: [
      { target: 'Blancos ácidos filosos sin madera', reason: 'el caldo caliente anula los aromas cítricos' },
      { target: 'Tintos hiper-jóvenes astringentes', reason: 'aspereza desagradable con las verduras hervidas' },
    ],
    witnessBottles: [
      { winery: 'Ricardo Santos', label: 'El Malbec de Ricardo Santos', region: 'Russell, Maipú', vintage: '2021', catalogWineId: 133 },
    ],
  },

  'pastel-de-papas': {
    id: 'pastel-de-papas',
    familyId: 'ollas-y-guisos',
    name: 'Pastel de papas tradicional',
    tagline: 'Capas de puré de papas gratinado con manteca y nuez moscada sobre picadillo de carne especiada.',
    servingTemperature: '15 °C a 17 °C',
    glassware: 'Copa Burdeos clásica',
    serviceTip: 'Un tinto jugoso y equilibrado.',
    chemicalRationale:
      'La cremosidad del puré suaviza la carne picada sazonada. Un Cabernet Sauvignon con taninos integrados o un Malbec jugoso sostienen la estructura sin opacar la dulzura de la papa gratinada.',
    affinities: [
      { id: 'cabernet-sauvignon', label: 'Cabernet Sauvignon Equilibrado' },
      { id: 'malbec', label: 'Malbec Tradicional', styleAnchor: 'tradicional' },
    ],
    contrasts: [
      { id: 'bonarda', label: 'Bonarda Frutal' },
    ],
    clashes: [
      { target: 'Blancos sin cuerpo', reason: 'la consistencia del puré los diluye' },
      { target: 'Tintos verdes con sobre-extracción', reason: 'chocan con la nuez moscada y el gratinado' },
    ],
    witnessBottles: [
      { winery: 'Bodega Simonassi', label: 'Cabernet Sauvignon San Rafael', region: 'San Rafael', vintage: '2020', catalogWineId: 106 },
    ],
  },

  // --- PASTAS ---
  'fideos-tuco-estofado': {
    id: 'fideos-tuco-estofado',
    familyId: 'pastas',
    name: 'Fideos con tuco y estofado',
    tagline: 'Tallarines caseros al huevo con salsa de tomate perita cocida a fuego lento y trozos de carne estofada.',
    servingTemperature: '15 °C a 17 °C',
    glassware: 'Copa Burdeos mediana',
    serviceTip: 'Servir a 16 °C; la acidez del vino debe vibrar con la del tomate.',
    chemicalRationale:
      'La salsa de tomate posee acidez málica y cítrica natural más glutamato umami. Los tintos con acidez viva y fruta crujiente (Bonarda, Cabernet Franc) acompañan la acidez del tomate sin dejar sensación amarga.',
    affinities: [
      { id: 'bonarda', label: 'Bonarda Joven y Frutal' },
      { id: 'cabernet-franc', label: 'Cabernet Franc de Terruño' },
    ],
    contrasts: [
      { id: 'malbec', label: 'Malbec Tradicional', styleAnchor: 'tradicional' },
    ],
    clashes: [
      { target: 'Blancos dulces o licorosos', reason: 'el dulzor con tomate ácido genera un efecto agridulce discordante' },
      { target: 'Tintos con taninos secantes y verdes', reason: 'la acidez del tomate exacerba la astringencia del tanino' },
    ],
    witnessBottles: [
      { winery: 'Finca Las Moras', label: 'Mora Negra Blend', region: 'San Juan', vintage: '2019', catalogWineId: 114 },
    ],
  },

  'pastas-rellenas-cordero-hongos': {
    id: 'pastas-rellenas-cordero-hongos',
    familyId: 'pastas',
    name: 'Pastas rellenas con hongos y cordero',
    tagline: 'Raviolones o sorrentinos rellenos de carne braseada con reducción de setas y fondo de crema.',
    servingTemperature: '14 °C a 16 °C',
    glassware: 'Copa Borgoña ancha',
    serviceTip: 'Servir en copa ancha para apreciar la complejidad de hongos y sotobosque.',
    chemicalRationale:
      'Los hongos contienen 1-octen-3-ol y alto contenido de umami, que combinan a nivel molecular con las notas terrosas del Pinot Noir o la untuosidad de un Chardonnay fermentado en barrica.',
    affinities: [
      { id: 'pinot-noir', label: 'Pinot Noir Complejo' },
      { id: 'chardonnay', label: 'Chardonnay Crianza en Roble', styleAnchor: 'crianza' },
    ],
    contrasts: [
      { id: 'merlot', label: 'Merlot Sedoso' },
    ],
    clashes: [
      { target: 'Blancos jóvenes de acidez filosa', reason: 'rompen la cremosidad de la salsa' },
      { target: 'Tintos tánicos duros', reason: 'secan la delicadeza del relleno' },
    ],
    witnessBottles: [
      { winery: 'Domaine Nico', label: 'Le Paradis Pinot Noir', region: 'Gualtallary', vintage: '2020', catalogWineId: 112 },
    ],
  },

  'risotto-hongos': {
    id: 'risotto-hongos',
    familyId: 'pastas',
    name: 'Risotto de hongos y setas silvestres',
    tagline: 'Arroz carnaroli mantecado con queso parmesano, hongos secos hidratados y caldo vegetal aromático.',
    servingTemperature: '14 °C a 16 °C',
    glassware: 'Copa Borgoña',
    serviceTip: 'Servir a temperatura fresca.',
    chemicalRationale:
      'La cremosidad del almidón de arroz emulsionado con manteca y la terrosidad fúngica demandan un vino suave, de acidez gastronómica y sin aristas tánicas.',
    affinities: [
      { id: 'pinot-noir', label: 'Pinot Noir Elegante' },
      { id: 'merlot', label: 'Merlot Sedoso' },
    ],
    contrasts: [
      { id: 'chardonnay', label: 'Chardonnay con Barrica', styleAnchor: 'crianza' },
    ],
    clashes: [
      { target: 'Cabernet Sauvignon hiper-joven', reason: 'la astringencia corta bruscamente la textura mantecosa del risotto' },
      { target: 'Espumantes dulces', reason: 'incompatibilidad con el umami de las setas' },
    ],
    witnessBottles: [
      { winery: 'Puramun', label: 'Puramun Pinot Noir', region: 'Valle de Uco', vintage: '2022', catalogWineId: 113 },
    ],
  },

  // --- RÍO Y MAR ---
  'salmon-trucha-patagonica': {
    id: 'salmon-trucha-patagonica',
    familyId: 'rio-y-mar',
    name: 'Salmón rosado y trucha patagónica',
    tagline: 'Pescados de aguas frías con tenor graso noble, cocidos a la plancha o sellados al horno.',
    servingTemperature: '10 °C a 13 °C',
    glassware: 'Copa Borgoña amplia',
    serviceTip: 'El puente perfecto entre un blanco con volumen o un tinto etéreo.',
    chemicalRationale:
      'Poseen alto tenor de grasas insaturadas omega-3. Un Chardonnay con roble aporta notas lácticas y mantecosas que espejan el bocado, mientras un Pinot Noir ligero aporta acidez y taninos ultra-suaves sin provocar sabor metálico.',
    affinities: [
      { id: 'chardonnay', label: 'Chardonnay Crianza en Roble', styleAnchor: 'crianza' },
      { id: 'pinot-noir', label: 'Pinot Noir Patagónico' },
    ],
    contrasts: [
      { id: 'rosados', label: 'Rosé Gastronómico' },
    ],
    clashes: [
      { target: 'Cabernet Sauvignon o Malbec concentrado', reason: 'los taninos condensados reaccionan con el aceite de pescado provocando gusto a hierro oxidado' },
      { target: 'Vinos de cosecha tardía', reason: 'arruinan la sutileza de la carne rosada' },
    ],
    witnessBottles: [
      { winery: 'Terrazas de los Andes', label: 'Grand Chardonnay', region: 'Valle de Uco', vintage: '2021', catalogWineId: 125 },
    ],
  },

  'pescado-rio-parrilla': {
    id: 'pescado-rio-parrilla',
    familyId: 'rio-y-mar',
    name: 'Pescado de río a la parrilla (Surubí / Pacú)',
    tagline: 'Pescados autóctonos del Litoral asados a la leña con piel crocante y carne suave.',
    servingTemperature: '12 °C a 14 °C',
    glassware: 'Copa Borgoña o Tulipán amplia',
    serviceTip: 'Servir un tinto sutil refrescado o blanco de buen volumen.',
    chemicalRationale:
      'El Pacú y el Surubí tienen carne grasa pero no yodada marina. Las notas ahumadas de la leña permiten maridar con tintos sutiles de tanino aterciopelado (Pinot Noir) o Chardonnay fresco.',
    affinities: [
      { id: 'pinot-noir', label: 'Pinot Noir Ligero' },
    ],
    contrasts: [
      { id: 'chardonnay', label: 'Chardonnay Inox (Sin madera)', styleAnchor: 'inox' },
      { id: 'rosados', label: 'Rosé Seco' },
    ],
    clashes: [
      { target: 'Tintos corpulentos con mucha madera', reason: 'aniquilan la delicadeza de la carne de río' },
      { target: 'Vinos fortificados o dulces', reason: 'incompatibilidad total con la grasa del río' },
    ],
    witnessBottles: [
      { winery: 'Catena Zapata', label: 'La Linterna Finca Las Piedras Pinot Noir', region: 'Río Negro', vintage: '2019', catalogWineId: 134 },
    ],
  },

  'merluza-negra': {
    id: 'merluza-negra',
    familyId: 'rio-y-mar',
    name: 'Merluza negra patagónica',
    tagline: 'Pescado de aguas profundas del Atlántico Sur, textura sedosa incomparable y alto tenor lipídico noble.',
    servingTemperature: '12 °C a 15 °C',
    glassware: 'Copa Borgoña amplia',
    serviceTip: 'Maridaje de alta gastronomía.',
    chemicalRationale:
      'La densidad grasa mantecosa de la merluza negra resiste tintos de clima frío con taninos dóciles (Merlot patagónico) o blancos de montaña de extraordinaria estructura.',
    affinities: [
      { id: 'merlot', label: 'Merlot de Clima Frío' },
      { id: 'chardonnay', label: 'Chardonnay Crianza en Roble', styleAnchor: 'crianza' },
    ],
    contrasts: [
      { id: 'pinot-noir', label: 'Pinot Noir Complejo' },
    ],
    clashes: [
      { target: 'Tintos tánicos y secantes de zonas cálidas', reason: 'generan amargor desagradable' },
      { target: 'Blancos jóvenes excesivamente cítricos', reason: 'desfiguran la textura suntuosa de la merluza' },
    ],
    witnessBottles: [
      { winery: 'Bodega Otronia', label: '45 Rugientes Merlot', region: 'Chubut', vintage: '2021', catalogWineId: 117 },
    ],
  },

  'sushi-nikkei': {
    id: 'sushi-nikkei',
    familyId: 'rio-y-mar',
    name: 'Sushi y cocina nikkei',
    tagline: 'Niguiris, rolls con pesca fresca, palta, toques cítricos, soja y salsa acebichada.',
    servingTemperature: '8 °C a 10 °C',
    glassware: 'Copa Tulipán o copa Borgoña mediana',
    serviceTip: 'Vino bien frío que actúe de comodín en cada bocado.',
    chemicalRationale:
      'La combinación de pescado crudo, vinagre de arroz (shari), picante del wasabi y salinidad de la soja descarta cualquier tinto tánico. Exige acidez fresca, trago ágil y versatilidad.',
    affinities: [
      { id: 'rosados', label: 'Rosé de Malbec Orgánico' },
      { id: 'torrontes', label: 'Torrontés Seco de Altura' },
      { id: 'sauvignon-blanc', label: 'Sauvignon Blanc Mineral' },
    ],
    contrasts: [
      { id: 'chardonnay', label: 'Chardonnay Inox (Sin madera)', styleAnchor: 'inox' },
    ],
    clashes: [
      { target: 'Tintos tintos tánicos (Cabernet, Malbec reserva)', reason: 'la reacción de taninos con el pescado crudo y la soja genera regusto metálico rancio' },
      { target: 'Vinos con crianza pesada en roble', reason: 'tapan el shari y el pescado blanco' },
    ],
    witnessBottles: [
      { winery: 'Bodega Renacer', label: 'Punto Final Orgánico Rosé Malbec', region: 'Luján de Cuyo', vintage: '2023', catalogWineId: 127 },
    ],
  },

  'paella-mariscos': {
    id: 'paella-mariscos',
    familyId: 'rio-y-mar',
    name: 'Paella y arroces con mariscos',
    tagline: 'Arroz al azafrán con langostinos, calamares, mejillones y pimientos pochados.',
    servingTemperature: '9 °C a 12 °C',
    glassware: 'Copa Tulipán amplia',
    serviceTip: 'Servir en frapera a temperatura constante.',
    chemicalRationale:
      'El azafrán aporta notas especiadas terrosas y los mariscos aportan yodo y salinidad. Un rosado con estructura o un blanco mineral acompañan la textura del arroz sin generar choques férricos.',
    affinities: [
      { id: 'rosados', label: 'Rosé de Pinot Noir Estructurado' },
      { id: 'sauvignon-blanc', label: 'Sauvignon Blanc Cítrico' },
    ],
    contrasts: [
      { id: 'chardonnay', label: 'Chardonnay Inox', styleAnchor: 'inox' },
    ],
    clashes: [
      { target: 'Tintos de gran cuerpo y taninos marcados', reason: 'los mejillones y calamares producen amargor metálico con el tanino' },
      { target: 'Vinos licorosos o dulces', reason: 'choque de azúcar con la salinidad marina' },
    ],
    witnessBottles: [
      { winery: 'Rosell Boher', label: 'Antonieta Pinot Noir Rosé', region: 'Valle de Uco', vintage: '2022', catalogWineId: 128 },
    ],
  },

  // --- CLÁSICOS URBANOS ---
  'empanadas-carne-cuchillo': {
    id: 'empanadas-carne-cuchillo',
    familyId: 'clasicos-urbanos',
    name: 'Empanadas de carne a cuchillo',
    tagline: 'Relleno jugoso de carne cortada a cuchillo, cebolla de verdeo, huevo duro, comino y ají molido.',
    servingTemperature: '15 °C a 17 °C',
    glassware: 'Copa Burdeos clásica',
    serviceTip: 'Servir recién salidas del horno de barro o fritas.',
    chemicalRationale:
      'El jugo de cocción caliente y el comino demandan un tinto con taninos estructurados que absorban la grasa cárnica, o bien un Torrontés seco por contraste regional que corte el relleno jugoso.',
    affinities: [
      { id: 'cabernet-sauvignon', label: 'Cabernet Sauvignon Estructurado' },
      { id: 'malbec', label: 'Malbec Tradicional', styleAnchor: 'tradicional' },
    ],
    contrasts: [
      { id: 'torrontes', label: 'Torrontés Seco de Altura' },
    ],
    clashes: [
      { target: 'Blancos sin acidez ni nervio', reason: 'quedan totalmente desdibujados por la grasa del picadillo' },
      { target: 'Vinos de postre dulces', reason: 'arruinan la combinación con el comino y el ají' },
    ],
    witnessBottles: [
      { winery: 'Susana Balbo Wines', label: 'Signature Cabernet Sauvignon', region: 'Valle de Uco', vintage: '2021', catalogWineId: 105 },
    ],
  },

  'milanesa-frita': {
    id: 'milanesa-frita',
    familyId: 'clasicos-urbanos',
    name: 'Milanesa frita tradicional',
    tagline: 'Corte vacuno fino rebozado en pan rallado crujiente frito en aceite limpio, con gotas de limón.',
    servingTemperature: '13 °C a 15 °C',
    glassware: 'Copa Tulipán amplia o Burdeos fresca',
    serviceTip: 'Un tinto jugoso y fresco sin madera pesada.',
    chemicalRationale:
      'El rebozado frito crujiente aporta grasa superficial en boca. Un Malbec joven de trago fluido o un blanco filoso cortan el aceite caliente sin saturar las papilas gustativas.',
    affinities: [
      { id: 'malbec', label: 'Malbec Tradicional (Joven)', styleAnchor: 'tradicional' },
      { id: 'bonarda', label: 'Bonarda Frutal' },
    ],
    contrasts: [
      { id: 'sauvignon-blanc', label: 'Sauvignon Blanc Mineral' },
      { id: 'rosados', label: 'Rosé Gastronómico' },
    ],
    clashes: [
      { target: 'Tintos corpulentos con mucha crianza en roble nuevo', reason: 'la astringencia excesiva seca el rebozado' },
      { target: 'Vinos licorosos dulces', reason: 'choque graso-azucarado indigesto' },
    ],
    witnessBottles: [
      { winery: 'Conclave Wines', label: 'Conclave Nocturno Malbec', region: 'Mendoza', vintage: '2022', catalogWineId: 135 },
    ],
  },

  'pizza-al-molde': {
    id: 'pizza-al-molde',
    familyId: 'clasicos-urbanos',
    name: 'Pizza porteña al molde de muzzarella',
    tagline: 'Masa alta y esponjosa al molde con abundante queso muzzarella dorado, salsa de tomate y orégano.',
    servingTemperature: '12 °C a 14 °C',
    glassware: 'Copa Tulipán amplia o vaso de bodegón',
    serviceTip: 'Servir el tinto ligeramente refrescado (20 min de heladera).',
    chemicalRationale:
      'La muzzarella derretida aporta abundante grasa láctea caliente y salinidad, mientras el tomate aporta acidez. Tintos amables con fruta viva y acidez activa (Bonarda, Malbec orgánico) o vino blanco con soda limpian el paladar sin amargar.',
    affinities: [
      { id: 'bonarda', label: 'Bonarda Joven y Frutal' },
      { id: 'malbec', label: 'Malbec de Altura (Calcáreo)', styleAnchor: 'altura' },
    ],
    contrasts: [
      { id: 'cabernet-franc', label: 'Cabernet Franc de Terruño' },
    ],
    clashes: [
      { target: 'Cabernet Sauvignon con tanino astringente', reason: 'la caseína derretida choca con el tanino secante generando sabor amargo rancio' },
      { target: 'Blancos neutros sin acidez', reason: 'la masa y la muzzarella los anulan' },
    ],
    witnessBottles: [
      { winery: 'Altos Las Hormigas', label: 'Terroir Orgánico Malbec', region: 'Luján de Cuyo', vintage: '2021', catalogWineId: 104 },
    ],
  },

  // --- QUESOS Y CHARCUTERÍA ---
  'tabla-quesos-duros': {
    id: 'tabla-quesos-duros',
    familyId: 'quesos-charcuteria',
    name: 'Tabla de quesos maduros y duros (Sobremesa)',
    tagline: 'Parmesano, Sardo estacionado, Provolone curado y Gouda añejo cortados en lascas.',
    servingTemperature: '16 °C a 18 °C',
    glassware: 'Copa Burdeos Gran Reserva',
    serviceTip: 'El maridaje de sobremesa por excelencia.',
    chemicalRationale:
      'Los quesos de pasta dura han perdido agua y concentrado proteínas, grasas y cristales de tirosina. Los taninos polimerizados de vinos evolucionados de guarda funden la grasa y equilibran la alta salinidad del queso.',
    affinities: [
      { id: 'blends-de-guarda', label: 'Blend Gran Reserva de Guarda' },
      { id: 'naranjos', label: 'Vinos Naranjos Macerados' },
    ],
    contrasts: [
      { id: 'cabernet-franc', label: 'Cabernet Franc de Terruño' },
    ],
    clashes: [
      { target: 'Tintos jóvenes ligeros', reason: 'la salinidad del queso curado arrasa con la fruta ligera del vino' },
      { target: 'Blancos jóvenes muy cítricos', reason: 'el choque ácido-salino genera sensación metálica' },
    ],
    witnessBottles: [
      { winery: 'Bodegas López', label: 'Montchenot Gran Reserva 15 Años', region: 'Maipú, Mendoza', vintage: '2008', catalogWineId: 119 },
    ],
  },
};

/**
 * Helpers y selectores en memoria
 */
export function getWineVariety(id?: string | null): WineVarietyEntry | undefined {
  if (!id) return undefined;
  return WINE_VARIETIES[id];
}

export function getDishPairing(id?: string | null): DishPairingEntry | undefined {
  if (!id) return undefined;
  return DISH_PAIRINGS[id];
}

export function getAllWineVarieties(): WineVarietyEntry[] {
  return Object.values(WINE_VARIETIES);
}

export function getAllDishPairings(): DishPairingEntry[] {
  return Object.values(DISH_PAIRINGS);
}

export function getFoodFamily(id?: string | null): FoodFamilyInfo | undefined {
  if (!id) return undefined;
  return FOOD_FAMILIES_MAP[id];
}

export function getDishesByFamily(familyId: FoodFamilyId): DishPairingEntry[] {
  return Object.values(DISH_PAIRINGS).filter((dish) => dish.familyId === familyId);
}

/**
 * Resuelve recomendaciones enriquecidas de afinidad con fallback automático
 */
export function getEnrichedAffinities(style: WineStyleProfile): EnrichedFoodRecommendation[] {
  if (style.enrichedAffinities && style.enrichedAffinities.length > 0) {
    return style.enrichedAffinities;
  }

  return style.affinities.map((link, idx) => {
    const dish = DISH_PAIRINGS[link.id];
    const isFeatured = idx === 0;

    let fallbackImage = LOCAL_FOOD_IMAGES.asadoTira;
    if (dish?.familyId === 'clasicos-urbanos') fallbackImage = LOCAL_FOOD_IMAGES.milanesaFrita;
    else if (dish?.familyId === 'pastas') fallbackImage = LOCAL_FOOD_IMAGES.pastas;
    else if (dish?.familyId === 'rio-y-mar') fallbackImage = LOCAL_FOOD_IMAGES.trucha;
    else if (dish?.familyId === 'ollas-y-guisos') fallbackImage = LOCAL_FOOD_IMAGES.locro;

    return {
      id: link.id,
      title: dish?.name ?? link.label,
      description:
        dish?.tagline ??
        dish?.chemicalRationale ??
        'Armonización organoléptica de alta fidelidad basada en perfiles cromáticos y de textura.',
      badge: isFeatured ? 'MARIDAJE PERFECTO' : undefined,
      stats: isFeatured
        ? [
            { label: 'Temperatura', value: dish?.servingTemperature ?? '16 °C' },
            { label: 'Copa', value: dish?.glassware?.split(' ')[0] ?? 'Burdeos' },
          ]
        : undefined,
      imageUrl: dish?.foodImageUrl ?? fallbackImage,
      matchPercentage: isFeatured ? undefined : `Afinidad ${95 - idx * 3}%`,
      styleAnchor: link.styleAnchor,
      isFeatured,
    };
  });
}

/**
 * Resuelve recomendaciones enriquecidas de contraste con fallback automático
 */
export function getEnrichedContrasts(style: WineStyleProfile): EnrichedFoodRecommendation[] {
  if (style.enrichedContrasts && style.enrichedContrasts.length > 0) {
    return style.enrichedContrasts;
  }

  return style.contrasts.map((link, idx) => {
    const dish = DISH_PAIRINGS[link.id];
    const isFeatured = idx === 0;

    let fallbackImage = LOCAL_FOOD_IMAGES.milanesaFrita;
    if (dish?.familyId === 'fuegos') fallbackImage = LOCAL_FOOD_IMAGES.asadoTira;
    else if (dish?.familyId === 'pastas') fallbackImage = LOCAL_FOOD_IMAGES.pastas;
    else if (dish?.familyId === 'rio-y-mar') fallbackImage = LOCAL_FOOD_IMAGES.trucha;
    else if (dish?.familyId === 'ollas-y-guisos') fallbackImage = LOCAL_FOOD_IMAGES.locro;

    return {
      id: link.id,
      title: dish?.name ?? link.label,
      description:
        dish?.tagline ??
        dish?.chemicalRationale ??
        'Corte de paladar y tensión ácida para restablecer la frescura gustativa.',
      badge: isFeatured ? 'LIMPIEZA DE PALADAR' : undefined,
      stats: isFeatured
        ? [
            { label: 'Efecto', value: 'Corte y Balance' },
            { label: 'Textura', value: 'Equilibrio' },
          ]
        : undefined,
      imageUrl: dish?.foodImageUrl ?? fallbackImage,
      matchPercentage: isFeatured ? undefined : `Balance ${93 - idx * 2}%`,
      styleAnchor: link.styleAnchor,
      isFeatured,
    };
  });
}

/**
 * Resuelve alertas químicas enriquecidas con fallback automático
 */
export function getEnrichedClashes(style: WineStyleProfile): EnrichedChemicalClash[] {
  if (style.enrichedClashes && style.enrichedClashes.length > 0) {
    return style.enrichedClashes;
  }

  return style.clashes.map((clash) => {
    let chemicalTitle = 'Alerta Química';
    let suggestedWineId = 'torrontes';
    let suggestedWineLabel = 'Torrontés o Pinot Noir';

    const lowerTarget = clash.target.toLowerCase();
    const lowerReason = clash.reason.toLowerCase();

    if (
      lowerTarget.includes('pescado') ||
      lowerTarget.includes('sushi') ||
      lowerReason.includes('férric') ||
      lowerReason.includes('óxido')
    ) {
      chemicalTitle = 'Reacción férrica';
      suggestedWineId = 'pinot-noir';
      suggestedWineLabel = 'Pinot Noir de clima frío';
    } else if (
      lowerTarget.includes('cítric') ||
      lowerTarget.includes('ceviche') ||
      lowerReason.includes('ácid')
    ) {
      chemicalTitle = 'Colapso de acidez';
      suggestedWineId = 'sauvignon-blanc';
      suggestedWineLabel = 'Sauvignon Blanc de altura';
    } else if (
      lowerTarget.includes('picante') ||
      lowerReason.includes('capsaicina') ||
      lowerReason.includes('ardor')
    ) {
      chemicalTitle = 'Multiplicador de fuego';
      suggestedWineId = 'torrontes';
      suggestedWineLabel = 'Torrontés o Blanco Dulce';
    } else if (lowerTarget.includes('dulce') || lowerReason.includes('azúcar')) {
      chemicalTitle = 'Choque de azúcares';
      suggestedWineId = 'chardonnay';
      suggestedWineLabel = 'Espumante Brut Nature';
    }

    return {
      target: clash.target,
      chemicalTitle,
      reason: clash.reason,
      suggestedWineId,
      suggestedWineLabel,
    };
  });
}

