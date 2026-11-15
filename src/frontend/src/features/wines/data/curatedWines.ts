import type { CuratedWine } from '../../../types/wine';

import caraSurImg from '../../../assets/wines/curated/CaraSurCriollaChica-removebg-preview.png';
import elEnemigoImg from '../../../assets/wines/curated/ElEnemigo-removebg-preview.png';
import loteEspecialImg from '../../../assets/wines/curated/LoteEspecialTorrontes-removebg-preview.png';
import piedraInfinitaImg from '../../../assets/wines/curated/PiedraInfinita-removebg-preview.png';

/**
 * Catálogo Curado de Muestra (Landing & Catálogo Abierto)
 * Cada etiqueta vincula su fotografía en alta resolución con fondo transparente
 * y metadatos organolépticos, terroir y servicio representativos del vino argentino.
 */
export const CURATED_WINES: CuratedWine[] = [
  {
    id: 1,
    name: 'Piedra Infinita Malbec',
    winery: 'Zuccardi',
    grape: 'Malbec',
    vintage: '2021',
    region: 'Paraje Altamira, Valle de Uco (Mendoza)',
    imageUrl: piedraInfinitaImg,
    tastingNotes: 'Ciruelas silvestres, tiza mineral, violetas andinas y taninos aterciopelados con persistencia infinita.',
    longDescription:
      'Proveniente de suelos aluviales con costra calcárea a 1.100 msnm. Fermentado en piletas de hormigón sin epoxi con levaduras nativas. Posee una frescura vibrante que expresa la pureza extrema del terroir de Altamira.',
    descriptors: ['Ciruela Negra', 'Tiza Calcárea', 'Violetas', 'Hierbas de Montaña'],
    rating: 4.9,
    reviewCount: 58,
    sourceType: 'Official',
    isOfficial: true,
    aging: 'Sin paso por madera, hormigón puro',
    alcoholContent: 14.0,
    servingTemperature: 16,
    pairing: 'Chivito andino a las brasas, ojo de bife con romero o quesos curados de oveja.',
    altitude: '1.100 msnm · Suelo calcáreo aluvial',
  },
  {
    id: 2,
    name: 'El Enemigo Cabernet Franc',
    winery: 'Bodega Aleanna',
    grape: 'Cabernet Franc',
    vintage: '2020',
    region: 'Gualtallary, Tupungato (Mendoza)',
    imageUrl: elEnemigoImg,
    tastingNotes: 'Pimientos asados dulces, grosellas negras maduras, vainilla noble y acidez lineal electrizante.',
    longDescription:
      'Cofermentado con un toque de Malbec. Crianza en foudres centenarios durante 15 meses. Elegancia rústica con un balance impecable entre la frescura de la altura y la textura de sus taninos minerales.',
    descriptors: ['Pimiento Asado', 'Grosellas', 'Especiado', 'Cedro'],
    rating: 4.8,
    reviewCount: 84,
    sourceType: 'Official',
    isOfficial: true,
    aging: '15 meses en foudres alsacianos centenarios',
    alcoholContent: 13.5,
    servingTemperature: 17,
    pairing: 'Cordero braseado, empanadas mendocinas cortadas a cuchillo y pastas rellenas.',
    altitude: '1.470 msnm · Caliche y gravas profundas',
  },
  {
    id: 3,
    name: 'Cara Sur Criolla Chica',
    winery: 'Cara Sur Viticultores',
    grape: 'Criolla Chica',
    vintage: '2022',
    region: 'Barreal, Valle de Calingasta (San Juan)',
    imageUrl: caraSurImg,
    tastingNotes: 'Frutillas del bosque, té negro, cáscara de naranja y hierbas autóctonas en un trago etéreo y fresco.',
    longDescription:
      'Vino de mínima intervención elaborado a partir de parrales centenarios rescatados en las faldas de la Cordillera de Ansilta. Ligero en color pero profundamente aromático, fluido y gastronómico.',
    descriptors: ['Frutilla Silvestre', 'Té Negro', 'Hierbas Frescas', 'Jugo Puro'],
    rating: 4.7,
    reviewCount: 31,
    sourceType: 'Community',
    isOfficial: false,
    aging: 'Huevos de hormigón y barricas viejas neutras',
    alcoholContent: 12.8,
    servingTemperature: 14,
    pairing: 'Charcutería artesanal, trucha patagónica a la plancha o platos con hongos silvestres.',
    altitude: '1.500 msnm · Clima desértico andino',
  },
  {
    id: 4,
    name: 'Lote Especial Torrontés',
    winery: 'Bodega Colomé',
    grape: 'Torrontés',
    vintage: '2023',
    region: 'Altos Valles Calchaquíes (Salta)',
    imageUrl: loteEspecialImg,
    tastingNotes: 'Jazmín, cáscara de pomelo rosado, flores blancas y un final seco, fresco y cítrico sin dulzores engañosos.',
    longDescription:
      'Nacido a más de 2.300 metros sobre el nivel del mar, bajo el sol más radiante de Argentina. Un Torrontés moderno, vertical, de paladar seco y crocante, que redefine el potencial de la cepa emblema blanca.',
    descriptors: ['Jazmín', 'Pomelo Rosado', 'Flor de Azahar', 'Mineral Salino'],
    rating: 4.6,
    reviewCount: 42,
    sourceType: 'Official',
    isOfficial: true,
    aging: '6 meses sobre lías en tanques de acero inoxidable',
    alcoholContent: 13.5,
    servingTemperature: 10,
    pairing: 'Ceviche clásico, empanadas salteñas de carne picante o sushi de pesca blanca.',
    altitude: '2.300 msnm · Extrema radiación UV y noches frías',
  },
];

