import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import WineCard from '@/features/wines/components/WineCard';
import DashboardWineCard from '@/features/dashboard/components/DashboardWineCard';
import VaultWineCard from '@/features/cava/components/VaultWineCard';
import WineDetailView from '@/features/wines/components/WineDetailView';
import { imageUrl, WINE_IMAGE_VERSION } from '@/lib/image';
import type { CuratedWine, DashboardWine } from '@/types/wine';
import type { CellarWine } from '@/features/cava/types';
import type { EditorialWine } from '@/features/wines/data/editorialWines';

vi.mock('@/features/auth', () => ({
  useAuth: () => ({
    user: { id: 1, username: 'Test User', role: 'User' },
    isAuthenticated: true,
  }),
}));

describe('Bloque U12 - Presentación y Uniformidad de Imágenes de Vinos', () => {
  const sampleCuratedWine: CuratedWine = {
    id: 101,
    name: 'Gran Reserva Malbec',
    winery: 'Bodega La Esperanza',
    grape: 'Malbec',
    vintage: '2021',
    region: 'Valle de Uco, Mendoza',
    rating: 4.8,
    reviewCount: 35,
    imageUrl: imageUrl('vintage-guid-101', 'card')!,
    sourceType: 'Official',
    isOfficial: true,
  };

  const sampleDashboardWine: DashboardWine = {
    id: '101',
    name: 'Gran Reserva Malbec',
    winery: 'Bodega La Esperanza',
    region: 'Valle de Uco, Mendoza',
    varietal: 'Malbec',
    vintage: 2021,
    rating: 4.8,
    bottle: 'red-burgundy',
    imageUrl: imageUrl('vintage-guid-101', 'card')!,
  };

  const sampleCellarWine: CellarWine = {
    id: 'vault-101',
    name: 'Gran Reserva Malbec 2021',
    winery: 'Bodega La Esperanza',
    region: 'Valle de Uco',
    varietal: 'Malbec',
    vintage: 2021,
    rating: 96,
    units: 2,
    location: 'Estante A3',
    temperatureConst: '15°C CONSTANTE',
    agingStatus: 'optimal',
    agingStatusLabel: 'Ventana Óptima',
    isJewel: true,
    bottle: 'red-burgundy',
    imageUrl: imageUrl('vintage-guid-101', 'card')!,
  };

  const sampleEditorialWine: EditorialWine = {
    id: '101',
    name: 'Gran Reserva Malbec',
    type: 'Red',
    description: 'Vino icono de altura.',
    winery: {
      name: 'Bodega La Esperanza',
      region: 'Valle de Uco',
      latitude: -33.5,
      longitude: -69.2,
      bannerUrl: 'https://example.com/banner.jpg',
    },
    vintages: [
      {
        id: 'v-2021',
        wineId: '101',
        year: 2021,
        alcoholContent: '14.5% Vol.',
        servingTemperature: '16°C - 18°C',
        agingAdvice: 'Guarda potencial 10 años.',
        grapes: [{ variety: 'Malbec', percentage: 100 }],
        imageId: 'img-detail-uuid',
        imageUrl: null,
      },
    ],
    pairings: [],
    reviews: [],
  };

  describe('1. Variantes y helper imageUrl', () => {
    it('construye URLs con variante card, detail y thumb usando la versión vigente', () => {
      const id = 'sample-uuid-42';
      expect(imageUrl(id, 'card')).toBe(`/api/images/${id}?variant=card&v=${WINE_IMAGE_VERSION}`);
      expect(imageUrl(id, 'detail')).toBe(`/api/images/${id}?variant=detail&v=${WINE_IMAGE_VERSION}`);
      expect(imageUrl(id, 'thumb')).toBe(`/api/images/${id}?variant=thumb&v=${WINE_IMAGE_VERSION}`);
    });

    it('variante ausente o desconocida cae en card, y bottle mantiene compatibilidad', () => {
      const id = 'sample-uuid-42';
      expect(imageUrl(id)).toBe(`/api/images/${id}?variant=card&v=${WINE_IMAGE_VERSION}`);
      expect(imageUrl(id, 'bottle')).toBe(`/api/images/${id}?variant=bottle&v=${WINE_IMAGE_VERSION}`);
      expect(imageUrl(id, 'desconocida' as unknown as Parameters<typeof imageUrl>[1])).toBe(`/api/images/${id}?variant=card&v=${WINE_IMAGE_VERSION}`);
    });

    it('id vacío o nulo retorna null para activar el fallback del componente', () => {
      expect(imageUrl(null)).toBeNull();
      expect(imageUrl(undefined)).toBeNull();
      expect(imageUrl('')).toBeNull();
      expect(imageUrl('   ')).toBeNull();
    });

    it('garantiza que ninguna variante de vino genere cadenas prohibidas', () => {
      const id = 'sample-uuid-42';
      const variants = ['card', 'detail', 'thumb', 'bottle', undefined] as const;
      variants.forEach((v) => {
        const url = imageUrl(id, v)!;
        expect(url).not.toContain('e_make_transparent');
        expect(url).not.toContain('background_removal');
        expect(url).not.toContain('bgremoval');
        expect(url).not.toContain('b_transparent');
      });
    });
  });

  describe('2. WineCard (Catálogo y Landing)', () => {
    it('renderiza el contenedor con proporción fija 4:5, fondo blanco (#fff) y object-contain', () => {
      render(<WineCard wine={sampleCuratedWine} />);

      const container = screen.getByTestId('wine-card-image-container');
      expect(container).toHaveClass('aspect-[4/5]');
      expect(container).toHaveClass('bg-white');
      expect(container).toHaveClass('overflow-hidden');

      const img = screen.getByAltText(sampleCuratedWine.name);
      expect(img).toHaveClass('object-contain');
      expect(img).toHaveClass('w-full');
      expect(img).toHaveClass('h-full');
      expect(img).toHaveAttribute('src', expect.stringContaining('variant=card'));
    });

    it('muestra el fallback de silueta si la imagen falla por onError', () => {
      render(<WineCard wine={sampleCuratedWine} />);

      const img = screen.getByAltText(sampleCuratedWine.name);
      fireEvent.error(img);

      expect(screen.getByTestId('wine-card-fallback')).toBeInTheDocument();
      expect(screen.queryByAltText(sampleCuratedWine.name)).not.toBeInTheDocument();
    });

    it('muestra el fallback directamente si el vino no tiene imageUrl', () => {
      const wineWithoutImg: CuratedWine = { ...sampleCuratedWine, imageUrl: undefined };
      render(<WineCard wine={wineWithoutImg} />);

      expect(screen.getByTestId('wine-card-fallback')).toBeInTheDocument();
    });
  });

  describe('3. DashboardWineCard', () => {
    it('mantiene la proporción 4:5 con fondo blanco y usa variante card', () => {
      render(
        <MemoryRouter>
          <DashboardWineCard wine={sampleDashboardWine} />
        </MemoryRouter>
      );

      const container = screen.getByTestId('dashboard-card-image-container');
      expect(container).toHaveClass('aspect-[4/5]');
      expect(container).toHaveClass('bg-white');

      const img = screen.getByAltText(sampleDashboardWine.name);
      expect(img).toHaveAttribute('src', expect.stringContaining('variant=card'));
      expect(img).toHaveClass('object-contain');
    });

    it('muestra el fallback si la imagen falla', () => {
      render(
        <MemoryRouter>
          <DashboardWineCard wine={sampleDashboardWine} />
        </MemoryRouter>
      );

      const img = screen.getByAltText(sampleDashboardWine.name);
      fireEvent.error(img);

      expect(screen.getByTestId('dashboard-card-fallback')).toBeInTheDocument();
    });
  });

  describe('4. VaultWineCard (Cava)', () => {
    it('mantiene la proporción 4:5 con fondo blanco y usa variante card', () => {
      render(
        <MemoryRouter>
          <VaultWineCard
            wine={sampleCellarWine}
            onOpenDetails={vi.fn()}
            onUncork={vi.fn()}
          />
        </MemoryRouter>
      );

      const container = screen.getByTestId('vault-card-image-container');
      expect(container).toHaveClass('aspect-[4/5]');
      expect(container).toHaveClass('bg-white');

      const img = screen.getByAltText(sampleCellarWine.name);
      expect(img).toHaveAttribute('src', expect.stringContaining('variant=card'));
      expect(img).toHaveClass('object-contain');
    });
  });

  describe('5. WineDetailView (Ficha de Vino)', () => {
    it('renderiza el escenario con proporción 4:5, fondo blanco y variante detail', () => {
      render(
        <MemoryRouter>
          <WineDetailView wine={sampleEditorialWine} />
        </MemoryRouter>
      );

      const stage = screen.getByTestId('wine-detail-stage');
      expect(stage).toHaveClass('aspect-[4/5]');
      expect(stage).toHaveClass('bg-white');
      expect(stage).toHaveClass('rounded-2xl');

      const img = screen.getByAltText(/Gran Reserva Malbec Cosecha 2021/i);
      expect(img).toHaveAttribute('src', expect.stringContaining('variant=detail'));
      expect(img).toHaveClass('object-contain');
    });

    it('muestra el fallback de silueta dentro del escenario si la imagen de la ficha falla', () => {
      render(
        <MemoryRouter>
          <WineDetailView wine={sampleEditorialWine} />
        </MemoryRouter>
      );

      const img = screen.getByAltText(/Gran Reserva Malbec Cosecha 2021/i);
      fireEvent.error(img);

      expect(screen.getByTestId('wine-detail-fallback')).toBeInTheDocument();
      expect(screen.queryByAltText(/Gran Reserva Malbec Cosecha 2021/i)).not.toBeInTheDocument();
    });
  });
});
