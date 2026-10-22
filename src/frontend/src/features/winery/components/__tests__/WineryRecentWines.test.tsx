import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import WineryRecentWines from '../WineryRecentWines';
import type { WineResponseDto } from '../../types';

describe('WineryRecentWines', () => {
  it('renders loading skeleton when isLoading is true', () => {
    const { container } = render(
      <MemoryRouter>
        <WineryRecentWines wines={[]} isLoading={true} />
      </MemoryRouter>
    );

    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders empty state when there are no wines', () => {
    render(
      <MemoryRouter>
        <WineryRecentWines wines={[]} isLoading={false} />
      </MemoryRouter>
    );

    expect(screen.getByText('Todavía no publicaste ninguna etiqueta')).toBeInTheDocument();
    expect(screen.getByText('Cargar primera etiqueta')).toBeInTheDocument();
  });

  it('renders wines list with types and names', () => {
    const mockWines: WineResponseDto[] = [
      {
        id: 1,
        name: 'Gran Corte Reserva',
        wineryId: 10,
        wineryNameText: 'Bodega Test',
        description: 'Vino de alta gama',
        wineType: 'Red',
        locationId: 5,
        sourceType: 'Official',
        duplicateOfWineId: null,
        averageRating: 4.8,
        reviewCount: 32,
      },
      {
        id: 2,
        name: 'Chardonnay de Altura',
        wineryId: 10,
        wineryNameText: 'Bodega Test',
        description: 'Fresco y mineral',
        wineType: 'White',
        locationId: 5,
        sourceType: 'Official',
        duplicateOfWineId: null,
        averageRating: null,
        reviewCount: 0,
      },
    ];

    render(
      <MemoryRouter>
        <WineryRecentWines wines={mockWines} isLoading={false} />
      </MemoryRouter>
    );

    expect(screen.getByText('Gran Corte Reserva')).toBeInTheDocument();
    expect(screen.getByText('Tinto')).toBeInTheDocument();
    expect(screen.getByText('4.8')).toBeInTheDocument();

    expect(screen.getByText('Chardonnay de Altura')).toBeInTheDocument();
    expect(screen.getByText('Blanco')).toBeInTheDocument();
    expect(screen.getByText('(0)')).toBeInTheDocument();
  });
});
