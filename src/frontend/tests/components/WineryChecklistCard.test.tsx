import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import WineryChecklistCard from '@/features/winery/components/WineryChecklistCard';
import type { WineryResponseDto } from '@/features/winery/components/../types';

describe('WineryChecklistCard', () => {
  beforeEach(() => {
    localStorage.clear();
  });

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


  it('calculates 40% when account and logoImageId are present and others are pending', () => {
    const wineryWithLogoImageId: WineryResponseDto = {
      ...baseWinery,
      logoImageId: '123e4567-e89b-12d3-a456-426614174000',
    };

    render(
      <MemoryRouter>
        <WineryChecklistCard winery={wineryWithLogoImageId} winesCount={0} />
      </MemoryRouter>
    );

    expect(screen.getByText(/40%/)).toBeInTheDocument();
  });

  it('calculates 40% when account and logo are present and others are pending', () => {
    const wineryWithLogo: WineryResponseDto = {
      ...baseWinery,
      logoUrl: 'https://example.com/logo.png',
    };

    render(
      <MemoryRouter>
        <WineryChecklistCard winery={wineryWithLogo} winesCount={0} />
      </MemoryRouter>
    );

    expect(screen.getByText(/40%/)).toBeInTheDocument();
    expect(screen.getByText('Guía de puesta a punto de tu bodega')).toBeInTheDocument();
    expect(screen.getByText('Completar')).toBeInTheDocument();
    expect(screen.getByText('Agregar')).toBeInTheDocument();
    expect(screen.getByText('Cargar vino')).toBeInTheDocument();
  });

  it('calculates 100% when logo, description, website, foundation year, and wines are present', () => {
    const completeWinery: WineryResponseDto = {
      ...baseWinery,
      logoUrl: 'https://example.com/logo.png',
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

  it('allows dismissing an incomplete checklist and persists the choice in localStorage', () => {
    const onDismiss = vi.fn();
    render(
      <MemoryRouter>
        <WineryChecklistCard winery={baseWinery} winesCount={0} onDismiss={onDismiss} />
      </MemoryRouter>
    );

    expect(screen.getByText('Guía de puesta a punto de tu bodega')).toBeInTheDocument();

    const closeButton = screen.getByRole('button', { name: /quitar guía de puesta a punto/i });
    fireEvent.click(closeButton);

    expect(screen.queryByText('Guía de puesta a punto de tu bodega')).not.toBeInTheDocument();
    expect(localStorage.getItem('ayvino_winery_checklist_dismissed_1')).toBe('true');
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('allows dismissing a 100% completed checklist via "Entendido, no volver a mostrar" and persists it', () => {
    const completeWinery: WineryResponseDto = {
      ...baseWinery,
      logoUrl: 'https://example.com/logo.png',
      foundationYear: 1950,
      description: 'Una semblanza enológica completa y detallada de más de diez caracteres.',
      website: 'https://bodegatest.com',
    };
    const onDismiss = vi.fn();

    render(
      <MemoryRouter>
        <WineryChecklistCard winery={completeWinery} winesCount={3} onDismiss={onDismiss} />
      </MemoryRouter>
    );

    expect(screen.getByText('¡Puesta a punto completa!')).toBeInTheDocument();

    const ackButton = screen.getByRole('button', { name: /entendido, no volver a mostrar/i });
    fireEvent.click(ackButton);

    expect(screen.queryByText('¡Puesta a punto completa!')).not.toBeInTheDocument();
    expect(localStorage.getItem('ayvino_winery_checklist_dismissed_1')).toBe('true');
    expect(localStorage.getItem('ayvino_winery_checklist_completed_ack_1')).toBe('true');
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('does not render if the winery had previously dismissed the card', () => {
    localStorage.setItem('ayvino_winery_checklist_dismissed_1', 'true');

    const { container } = render(
      <MemoryRouter>
        <WineryChecklistCard winery={baseWinery} winesCount={0} />
      </MemoryRouter>
    );

    expect(container.firstChild).toBeNull();
  });
});
