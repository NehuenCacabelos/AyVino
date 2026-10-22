import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import WineryChecklistCard from '@/features/winery/components/WineryChecklistCard';
import type { WineryResponseDto } from '@/features/winery/components/../types';

describe('WineryChecklistCard', () => {
  const baseWinery: WineryResponseDto = {
    id: 1,
    name: 'Bodega Test',
    locationId: 10,
    status: 'Approved',
    registerDate: '2026-01-01T00:00:00Z',
    description: null,
    foundationYear: null,
    website: null,
    userId: 5,
  };

  it('calculates 40% when account and location are present and others are pending', () => {
    render(
      <MemoryRouter>
        <WineryChecklistCard winery={baseWinery} winesCount={0} />
      </MemoryRouter>
    );

    expect(screen.getByText(/40%/)).toBeInTheDocument();
    expect(screen.getByText('Guía de puesta a punto de tu bodega')).toBeInTheDocument();
    expect(screen.getByText('Completar')).toBeInTheDocument();
    expect(screen.getByText('Agregar')).toBeInTheDocument();
    expect(screen.getByText('Cargar vino')).toBeInTheDocument();
  });

  it('calculates 100% when description, website, foundation year, and wines are present', () => {
    const completeWinery: WineryResponseDto = {
      ...baseWinery,
      foundationYear: 1950,
      description: 'Una semblanza enológica completa y detallada de más de diez caracteres.',
      website: 'https://bodegatest.com',
    };

    render(
      <MemoryRouter>
        <WineryChecklistCard winery={completeWinery} winesCount={3} />
      </MemoryRouter>
    );

    expect(screen.getByText(/100%/)).toBeInTheDocument();
    expect(
      screen.getByText('¡Excelente! Tu bodega cuenta con presencia institucional completa.')
    ).toBeInTheDocument();
    expect(screen.queryByText('Completar')).not.toBeInTheDocument();
    expect(screen.queryByText('Agregar')).not.toBeInTheDocument();
    expect(screen.queryByText('Cargar vino')).not.toBeInTheDocument();
  });
});
