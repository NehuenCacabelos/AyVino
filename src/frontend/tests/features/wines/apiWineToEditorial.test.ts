import { describe, it, expect } from 'vitest';
import {
  apiWineToEditorial,
  mapPairingCategoryToIcon,
} from '@/features/wines/adapters/apiWineToEditorial';
import type {
  WineResponseDto,
  WineVintageResponseDto,
  WineryResponseDto,
  GrapeResponseDto,
} from '@/features/winery/types';
import type { ReviewResponseDto } from '@/features/wines/types/review';

describe('apiWineToEditorial Adapter', () => {
  const mockWine: WineResponseDto = {
    id: 10,
    name: 'Gran Corte Reserva',
    wineType: 'Red',
    description: 'Vino de guarda en roble.',
    wineryId: 5,
    wineryNameText: 'Bodega Terruño',
    locationId: 1,
    sourceType: 'Official',
    duplicateOfWineId: null,
    averageRating: 4.8,
    reviewCount: 15,
  };

  const mockWinery: WineryResponseDto = {
    id: 5,
    name: 'Bodega Terruño',
    description: 'Bodega centenaria.',
    locationId: 1,
    foundationYear: 1920,
    website: 'https://terruno.com',
    userId: 2,
    status: 'Approved',
    registerDate: new Date('2020-01-01'),
    location: {
      regionName: 'Valle de Uco',
      stateName: 'Mendoza',
    },
  };

  const mockVintages: WineVintageResponseDto[] = [
    {
      id: 101,
      wineId: 10,
      year: 2021,
      alcoholContent: 14.5,
      servingTemperature: 17,
      agingAdvice: '15 años en cava fresca.',
      imageId: '11111111-1111-1111-1111-111111111111' as unknown as import('crypto').UUID,
      approvalStatus: 'Approved',
      uploadedByUserId: 2,
      registerDate: new Date('2022-01-01'),
      averageRating: 4.9,
      reviewCount: 10,
      grapes: [
        { grapeId: 1, percentage: 70 },
        { grapeId: 2, percentage: 30 },
      ],
    },
  ];

  const mockGrapes: GrapeResponseDto[] = [
    { id: 1, name: 'Malbec', colorType: 'Red' },
    { id: 2, name: 'Cabernet Franc', colorType: 'Red' },
  ];

  const mockPairings = [
    { id: 1, name: 'Asado criollo', category: 'Meat' },
    { id: 2, name: 'Trucha a la plancha', category: 'Fish' },
    { id: 3, name: 'Queso provoleta', category: 'Cheese' },
    { id: 4, name: 'Sorrentinos', category: 'Pasta' },
  ];

  const mockReviews: ReviewResponseDto[] = [
    {
      id: 501,
      userId: 7,
      userName: 'Luciano Sommelier',
      wineVintageId: 101,
      vintageYear: 2021,
      rating: 5,
      comment: 'Complejo, con notas de frutos negros y cedro.',
      createdAt: '2025-03-01T12:00:00Z',
      updatedAt: null,
    },
  ];

  it('adapta un vino completo con todas sus propiedades', () => {
    const result = apiWineToEditorial(
      mockWine,
      mockVintages,
      mockWinery,
      mockPairings,
      mockGrapes,
      mockReviews
    );

    expect(result.id).toBe('10');
    expect(result.name).toBe('Gran Corte Reserva');
    expect(result.type).toBe('Red');
    expect(result.winery?.name).toBe('Bodega Terruño');
    expect(result.winery?.foundedYear).toBe(1920);
    expect(result.winery?.region).toBe('Valle de Uco, Mendoza');
    expect(result.winery?.websiteUrl).toBe('https://terruno.com');

    // Cosecha
    expect(result.vintages).toHaveLength(1);
    expect(result.vintages[0].year).toBe(2021);
    expect(result.vintages[0].alcoholContent).toBe('14.5% Vol.');
    expect(result.vintages[0].servingTemperature).toBe('17°C');
    expect(result.vintages[0].grapes).toEqual([
      { variety: 'Malbec', percentage: 70 },
      { variety: 'Cabernet Franc', percentage: 30 },
    ]);

    // Maridajes
    expect(result.pairings).toHaveLength(4);
    expect(result.pairings[0]).toEqual({ id: '1', name: 'Asado criollo', icon: 'flame' });
    expect(result.pairings[1]).toEqual({ id: '2', name: 'Trucha a la plancha', icon: 'utensils' });
    expect(result.pairings[2]).toEqual({ id: '3', name: 'Queso provoleta', icon: 'sparkles' });
    expect(result.pairings[3]).toEqual({ id: '4', name: 'Sorrentinos', icon: 'soup' });

    // Reseñas
    expect(result.reviews).toHaveLength(1);
    expect(result.reviews[0].userName).toBe('Luciano Sommelier');
    expect(result.reviews[0].rating).toBe(5);
    expect(result.reviews[0].createdAt).toBe('2025-03-01');
  });

  it('soporta vino sin imagen (imageId nulo)', () => {
    const vintagesWithoutImg = [
      {
        ...mockVintages[0],
        imageId: null,
      },
    ];

    const result = apiWineToEditorial(
      mockWine,
      vintagesWithoutImg,
      mockWinery,
      mockPairings,
      mockGrapes,
      mockReviews
    );

    expect(result.vintages[0].imageId).toBeNull();
    expect(result.vintages[0].imageUrl).toBeNull();
  });

  it('soporta vino sin uvas cargadas (array vacío)', () => {
    const vintagesWithoutGrapes = [
      {
        ...mockVintages[0],
        grapes: [],
      },
    ];

    const result = apiWineToEditorial(
      mockWine,
      vintagesWithoutGrapes,
      mockWinery,
      mockPairings,
      mockGrapes,
      mockReviews
    );

    expect(result.vintages[0].grapes).toEqual([]);
  });

  it('soporta vino sin maridajes asociados', () => {
    const result = apiWineToEditorial(
      mockWine,
      mockVintages,
      mockWinery,
      [],
      mockGrapes,
      mockReviews
    );

    expect(result.pairings).toEqual([]);
  });

  it('soporta vino sin reseñas registradas', () => {
    const result = apiWineToEditorial(
      mockWine,
      mockVintages,
      mockWinery,
      mockPairings,
      mockGrapes,
      []
    );

    expect(result.reviews).toEqual([]);
  });

  it('adapta correctamente tipo de vino Orange', () => {
    const orangeWine = { ...mockWine, wineType: 'Orange' };
    const result = apiWineToEditorial(
      orangeWine,
      mockVintages,
      mockWinery,
      mockPairings,
      mockGrapes,
      mockReviews
    );

    expect(result.type).toBe('Orange');
  });

  it('mapea categorías de maridajes desconocidas o nulas al ícono por defecto utensils', () => {
    expect(mapPairingCategoryToIcon(undefined)).toBe('utensils');
    expect(mapPairingCategoryToIcon('Desconocida')).toBe('utensils');
    expect(mapPairingCategoryToIcon('Meat')).toBe('flame');
    expect(mapPairingCategoryToIcon('Fish')).toBe('utensils');
    expect(mapPairingCategoryToIcon('Dessert')).toBe('sparkles');
    expect(mapPairingCategoryToIcon('Vegetarian')).toBe('soup');
  });
});
