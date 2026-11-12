import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import WineryCatalogRibbon from '@/features/winery/components/WineryCatalogRibbon';
import type { WineryCatalogTotalsDto } from '@/features/winery/types/catalog';

describe('WineryCatalogRibbon', () => {
  const totals: WineryCatalogTotalsDto = {
    labels: 12,
    vintages: 25,
    vintagesApproved: 18,
    vintagesPending: 5,
    vintagesRejected: 2,
  };

  it('cuando la bodega esta pendiente oculta la quinta card y no muestra Borradores ni Rechazadas', () => {
    const { container } = render(
      <WineryCatalogRibbon totals={totals} isWineryPending={true} />
    );

    expect(screen.getByText('Etiquetas')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();

    expect(screen.getByText('Añadas totales')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();

    expect(screen.getByText('Publicadas')).toBeInTheDocument();
    expect(screen.getByText('18')).toBeInTheDocument();

    expect(screen.getByText('En revisión')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();

    // No debe mostrar ni Borradores ni Rechazadas
    expect(screen.queryByText('Borradores')).not.toBeInTheDocument();
    expect(screen.queryByText('Rechazadas')).not.toBeInTheDocument();

    // La grilla debe reacomodarse a 4 columnas
    const gridEl = container.firstElementChild;
    expect(gridEl?.className).toContain('md:grid-cols-4');
  });

  it('cuando la bodega esta aprobada muestra 5 cards incluyendo Rechazadas', () => {
    const { container } = render(
      <WineryCatalogRibbon totals={totals} isWineryPending={false} />
    );

    expect(screen.getByText('Etiquetas')).toBeInTheDocument();
    expect(screen.getByText('Añadas totales')).toBeInTheDocument();
    expect(screen.getByText('Publicadas')).toBeInTheDocument();
    expect(screen.getByText('En revisión')).toBeInTheDocument();

    // Muestra la quinta card de Rechazadas
    expect(screen.getByText('Rechazadas')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.queryByText('Borradores')).not.toBeInTheDocument();

    // La grilla debe mantener 5 columnas
    const gridEl = container.firstElementChild;
    expect(gridEl?.className).toContain('lg:grid-cols-5');
  });
});
