import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import GrapeDistributionCard from '@/features/admin/components/GrapeDistributionCard';
import { getGrapesDistribution } from '@/features/admin/api/adminStatsApi';

vi.mock('@/features/admin/api/adminStatsApi', () => ({
  getGrapesDistribution: vi.fn(),
}));

describe('GrapeDistributionCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('muestra estado de carga mientras espera la respuesta de la API', () => {
    vi.mocked(getGrapesDistribution).mockReturnValueOnce(new Promise(() => {}));

    render(<GrapeDistributionCard />);

    expect(screen.getByText('Desglose de cepa')).toBeInTheDocument();
    expect(screen.getByText('Distribución por varietales')).toBeInTheDocument();
    expect(screen.getByTestId('grape-distribution-loading')).toBeInTheDocument();
  });

  it('muestra el total en el centro, la dona accesible y la leyenda con "% (cantidad)"', async () => {
    vi.mocked(getGrapesDistribution).mockResolvedValueOnce({
      totalVintages: 12,
      grapes: [
        { grapeId: 1, name: 'Malbec', vintageCount: 9 },
        { grapeId: 2, name: 'Cabernet Sauvignon', vintageCount: 3 },
      ],
    });

    render(<GrapeDistributionCard />);

    await waitFor(() => {
      expect(screen.getByText('12')).toBeInTheDocument();
    });

    expect(screen.getByText('cosechas')).toBeInTheDocument();
    expect(screen.getByText('Malbec')).toBeInTheDocument();
    expect(screen.getByText('75% (9)')).toBeInTheDocument();
    expect(screen.getByText('Cabernet Sauvignon')).toBeInTheDocument();
    expect(screen.getByText('25% (3)')).toBeInTheDocument();
    expect(screen.getByText('Una cosecha puede tener más de una uva.')).toBeInTheDocument();

    const chart = screen.getByRole('img', { name: /Distribución por varietales/i });
    expect(chart).toHaveAttribute(
      'aria-label',
      'Distribución por varietales: Malbec 75% (9), Cabernet Sauvignon 25% (3)',
    );
  });

  it('muestra el estado vacío cuando no hay cosechas con uvas cargadas', async () => {
    vi.mocked(getGrapesDistribution).mockResolvedValueOnce({
      totalVintages: 0,
      grapes: [],
    });

    render(<GrapeDistributionCard />);

    await waitFor(() => {
      expect(
        screen.getByText('Todavía no hay cosechas aprobadas con uvas cargadas.'),
      ).toBeInTheDocument();
    });
  });

  it('muestra el estado de error y permite reintentar cargando los datos', async () => {
    vi.mocked(getGrapesDistribution)
      .mockRejectedValueOnce(new Error('Fallo de red'))
      .mockResolvedValueOnce({
        totalVintages: 4,
        grapes: [{ grapeId: 1, name: 'Torrontés', vintageCount: 4 }],
      });

    render(<GrapeDistributionCard />);

    const retryButton = await screen.findByRole('button', { name: /Reintentar/i });
    expect(screen.getByRole('alert')).toBeInTheDocument();

    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(screen.getByText('Torrontés')).toBeInTheDocument();
    });

    expect(screen.getByText('100% (4)')).toBeInTheDocument();
    expect(getGrapesDistribution).toHaveBeenCalledTimes(2);
  });
});
