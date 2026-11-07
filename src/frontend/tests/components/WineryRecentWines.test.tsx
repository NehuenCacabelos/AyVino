import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import WineryRecentWines from '@/features/winery/components/WineryRecentWines';
import type { WineryPublicCatalogWineDto } from '@/features/winery/types';

describe('WineryRecentWines Component', () => {
  it('renders loading skeletons con grilla de 8 tarjetas cuando isLoading es true', () => {
    const { container } = render(
      <MemoryRouter>
        <WineryRecentWines wines={[]} isLoading={true} />
      </MemoryRouter>
    );

    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBe(8);
    expect(screen.queryByText(/Ver todas/i)).not.toBeInTheDocument();
  });

  it('renders empty state cuando no hay etiquetas y permite invocar onOpenCreateModal', () => {
    const onOpenModalMock = vi.fn();

    render(
      <MemoryRouter>
        <WineryRecentWines wines={[]} isLoading={false} onOpenCreateModal={onOpenModalMock} />
      </MemoryRouter>
    );

    expect(screen.getByText('Todavía no publicaste ninguna etiqueta')).toBeInTheDocument();
    const ctaButton = screen.getByText('Cargar primera etiqueta');
    expect(ctaButton).toBeInTheDocument();

    fireEvent.click(ctaButton);
    expect(onOpenModalMock).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(/Ver todas/i)).not.toBeInTheDocument();
  });

  it('renders lista de etiquetas con WineryPublicCatalogCard y muestra "Ver todas (n)" debajo de la grilla', () => {
    const mockWines: WineryPublicCatalogWineDto[] = [
      {
        id: 1,
        name: 'Gran Terruño Malbec',
        wineType: 'Red',
        sourceType: 'Official',
        averageRating: 4.8,
        reviewCount: 32,
        vintages: [
          {
            id: 101,
            year: 2021,
            alcoholContent: 14.5,
            servingTemperature: 16,
            approvalStatus: 'Approved',
            averageRating: 4.8,
            reviewCount: 32,
            grapes: [{ grapeId: 1, grapeName: 'Malbec', percentage: 100 }],
          },
        ],
      },
      {
        id: 2,
        name: 'Chardonnay de Altura',
        wineType: 'White',
        sourceType: 'Official',
        averageRating: null,
        reviewCount: 0,
        vintages: [
          {
            id: 102,
            year: 2022,
            alcoholContent: 13.0,
            servingTemperature: 10,
            approvalStatus: 'Approved',
            averageRating: null,
            reviewCount: 0,
            grapes: [{ grapeId: 2, grapeName: 'Chardonnay', percentage: 100 }],
          },
        ],
      },
    ];

    render(
      <MemoryRouter>
        <WineryRecentWines wines={mockWines} isLoading={false} totalCount={12} />
      </MemoryRouter>
    );

    // Nombres y tipos renderizados por la card
    expect(screen.getByText('Gran Terruño Malbec')).toBeInTheDocument();
    expect(screen.getByText('Tinto')).toBeInTheDocument();
    expect(screen.getByText('Chardonnay de Altura')).toBeInTheDocument();
    expect(screen.getByText('Blanco')).toBeInTheDocument();

    // "Ver todas (n)" debajo de la grilla alineado a la derecha
    const viewAllLink = screen.getByText('Ver todas (12)');
    expect(viewAllLink).toBeInTheDocument();
    expect(viewAllLink.closest('a')).toHaveAttribute('href', '/bodega/vinos');
  });

  it('muestra un máximo de 8 etiquetas en la grilla aunque haya más', () => {
    const manyWines: WineryPublicCatalogWineDto[] = Array.from({ length: 15 }, (_, i) => ({
      id: i + 1,
      name: `Vino Etiqueta #${i + 1}`,
      wineType: 'Red',
      sourceType: 'Official',
      reviewCount: 0,
      vintages: [],
    }));

    render(
      <MemoryRouter>
        <WineryRecentWines wines={manyWines} isLoading={false} totalCount={15} />
      </MemoryRouter>
    );

    expect(screen.getByText('Vino Etiqueta #1')).toBeInTheDocument();
    expect(screen.getByText('Vino Etiqueta #8')).toBeInTheDocument();
    expect(screen.queryByText('Vino Etiqueta #9')).not.toBeInTheDocument();
    expect(screen.getByText('Ver todas (15)')).toBeInTheDocument();
  });
});
