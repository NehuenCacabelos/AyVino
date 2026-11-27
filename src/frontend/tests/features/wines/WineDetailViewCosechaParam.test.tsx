import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import WineDetailView from '@/features/wines/components/WineDetailView';
import type { EditorialWine } from '@/features/wines/data/editorialWines';

vi.mock('@/features/auth', () => ({
  useAuth: () => ({
    user: { id: 1, username: 'admin', role: 'Admin' },
  }),
}));

vi.mock('@/features/wines/hooks/useVintageSensory', () => ({
  useVintageSensory: () => ({
    sensory: null,
    isLoading: false,
    error: null,
    reload: vi.fn(),
  }),
}));

function LocationProbe() {
  const location = useLocation();
  return <span data-testid="location-search">{location.search}</span>;
}

const mockWineWithVintages: EditorialWine = {
  id: '101',
  name: 'Malbec Terroir',
  winery: {
    id: '10',
    name: 'Bodega Andina',
    wineryId: 10,
    region: 'Mendoza',
    country: 'Argentina',
  },
  type: 'Red',
  description: 'Vino con múltiples añadas.',
  region: 'Mendoza',
  country: 'Argentina',
  imageUrl: 'https://test.com/bottle.png',
  vintages: [
    {
      id: '1',
      wineId: '101',
      year: 2021,
      alcoholContent: '14.5% Vol.',
      servingTemperature: '16°C',
      agingAdvice: 'Guarda cosecha 2021.',
      grapes: [{ variety: 'Malbec', percentage: 100 }],
    },
    {
      id: '2',
      wineId: '101',
      year: 2019,
      alcoholContent: '13.8% Vol.',
      servingTemperature: '15°C',
      agingAdvice: 'Guarda cosecha 2019.',
      grapes: [{ variety: 'Malbec', percentage: 100 }],
    },
  ],
  pairings: [],
  reviews: [],
};

describe('WineDetailView query param ?cosecha (Bloque 8)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('con ?cosecha=2019 existente selecciona la cosecha 2019 inicialmente', () => {
    render(
      <MemoryRouter initialEntries={['/vinos/101?cosecha=2019']}>
        <WineDetailView wine={mockWineWithVintages} isRealWine={true} />
        <LocationProbe />
      </MemoryRouter>
    );

    const btn2019 = screen.getByRole('button', { name: '2019' });
    const btn2021 = screen.getByRole('button', { name: '2021' });

    expect(btn2019.className).toContain('bg-neutral-800');
    expect(btn2021.className).not.toContain('bg-neutral-800');
    expect(screen.getByText('13.8% Vol.')).toBeInTheDocument();

    // Al cambiar manualmente de cosecha, no reescribe el query param en la URL
    fireEvent.click(btn2021);
    expect(screen.getByText('14.5% Vol.')).toBeInTheDocument();
    expect(screen.getByTestId('location-search').textContent).toBe('?cosecha=2019');
  });

  it('con ?cosecha inexistente selecciona la primera cosecha', () => {
    render(
      <MemoryRouter initialEntries={['/vinos/101?cosecha=1998']}>
        <WineDetailView wine={mockWineWithVintages} isRealWine={true} />
      </MemoryRouter>
    );

    expect(screen.getByRole('button', { name: '2021' }).className).toContain('bg-neutral-800');
    expect(screen.getByText('14.5% Vol.')).toBeInTheDocument();
  });

  it('sin parámetro ?cosecha selecciona la primera cosecha', () => {
    render(
      <MemoryRouter initialEntries={['/vinos/101']}>
        <WineDetailView wine={mockWineWithVintages} isRealWine={true} />
      </MemoryRouter>
    );

    expect(screen.getByRole('button', { name: '2021' }).className).toContain('bg-neutral-800');
    expect(screen.getByText('14.5% Vol.')).toBeInTheDocument();
  });
});
