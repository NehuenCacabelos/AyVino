import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import {
  WineryShowcaseBlock,
  WineryShowcaseSkeleton,
  WineryShowcaseEmpty,
  WineryShowcaseError,
  type CatalogShowcaseWinery,
} from '@/features/catalog';

describe('WineryShowcaseBlock Component (Bloque C)', () => {
  const sampleWinery: CatalogShowcaseWinery = {
    wineryId: 10,
    wineryName: 'Bodega Catena Zapata',
    location: 'Mendoza, Argentina',
    logoImageId: null,
    isVerified: true,
    wines: [
      {
        id: 101,
        wineryId: 10,
        wineryNameText: 'Bodega Catena Zapata',
        name: 'Catena Alta Malbec',
        description: 'Vino ícono de altura',
        wineType: 'Red',
        locationId: 1,
        sourceType: 'Official',
        duplicateOfWineId: null,
        averageRating: 4.8,
        reviewCount: 12,
        thumbnailImageId: null,
        referenceVintageYear: 2020,
      },
      {
        id: 102,
        wineryId: 10,
        wineryNameText: 'Bodega Catena Zapata',
        name: 'Catena Alta Chardonnay',
        description: 'Blanco fresco de montaña',
        wineType: 'White',
        locationId: 1,
        sourceType: 'Official',
        duplicateOfWineId: null,
        averageRating: 4.5,
        reviewCount: 6,
        thumbnailImageId: null,
        referenceVintageYear: 2021,
      },
    ],
  };

  it('renders winery header, verified badge, and wine cards with data', () => {
    const handleAddToCellar = vi.fn();

    render(
      <MemoryRouter>
        <WineryShowcaseBlock
          winery={sampleWinery}
          onAddToCellar={handleAddToCellar}
        />
      </MemoryRouter>
    );

    // Winery header
    expect(screen.getByText('Bodega Catena Zapata')).toBeInTheDocument();
    expect(screen.getByText('Mendoza, Argentina')).toBeInTheDocument();
    expect(screen.getByText('Oficial')).toBeInTheDocument();

    // Wines
    expect(screen.getByText('Catena Alta Malbec')).toBeInTheDocument();
    expect(screen.getByText('Catena Alta Chardonnay')).toBeInTheDocument();
    expect(screen.getByText('4.8')).toBeInTheDocument();
    expect(screen.getByText('4.5')).toBeInTheDocument();

    // Click "Cava" button
    const cellarButtons = screen.getAllByRole('button', { name: /Cava/i });
    expect(cellarButtons.length).toBe(2);
    fireEvent.click(cellarButtons[0]);
    expect(handleAddToCellar).toHaveBeenCalledWith(sampleWinery.wines[0]);
  });

  it('renders WineryShowcaseSkeleton during loading state', () => {
    render(<WineryShowcaseSkeleton count={2} />);
    const skeleton = screen.getByRole('status', { name: /Cargando catálogo/i });
    expect(skeleton).toBeInTheDocument();
  });

  it('renders WineryShowcaseEmpty when no wines exist', () => {
    render(<WineryShowcaseEmpty message="Todavía no hay vinos en el catálogo" />);
    expect(screen.getByText('Todavía no hay vinos en el catálogo')).toBeInTheDocument();
  });

  it('renders WineryShowcaseError and triggers onRetry callback', () => {
    const handleRetry = vi.fn();
    render(
      <WineryShowcaseError
        message="No pudimos cargar los vinos del catálogo."
        onRetry={handleRetry}
      />
    );

    expect(screen.getByText('No pudimos cargar los vinos del catálogo.')).toBeInTheDocument();
    const retryBtn = screen.getByRole('button', { name: /Reintentar/i });
    fireEvent.click(retryBtn);
    expect(handleRetry).toHaveBeenCalledTimes(1);
  });
});
