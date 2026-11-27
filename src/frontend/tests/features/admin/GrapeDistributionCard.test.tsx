import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
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
    expect(screen.getByText('Distribución por Varietales')).toBeInTheDocument();
    expect(screen.getByTestId('grape-distribution-loading')).toBeInTheDocument();
  });

  it('muestra el total en el centro, subtítulo, dona accesible y leyenda con "% (cantidad)"', async () => {
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
    expect(
      screen.getByText('Participación enológica de las 12 cosechas aprobadas.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Malbec')).toBeInTheDocument();
    expect(screen.getByText('75% (9)')).toBeInTheDocument();
    expect(screen.getByText('Cabernet Sauvignon')).toBeInTheDocument();
    expect(screen.getByText('25% (3)')).toBeInTheDocument();
    expect(screen.getByText('Una cosecha puede tener más de una uva.')).toBeInTheDocument();

    const chart = screen.getByRole('img', { name: /Distribución por Varietales/i });
    expect(chart).toHaveAttribute(
      'aria-label',
      'Distribución por Varietales: Malbec 75% (9), Cabernet Sauvignon 25% (3)',
    );
  });

  it('muestra inicialmente hasta 10 varietales y despliega el resto con "Ver N más"', async () => {
    const grapes = Array.from({ length: 13 }, (_, index) => ({
      grapeId: index + 1,
      name: `Uva ${index + 1}`,
      vintageCount: 20 - index,
    }));

    vi.mocked(getGrapesDistribution).mockResolvedValueOnce({
      totalVintages: 80,
      grapes,
    });

    render(<GrapeDistributionCard />);

    await waitFor(() => {
      expect(screen.getByText('Uva 1')).toBeInTheDocument();
    });

    expect(screen.getByText('Uva 10')).toBeInTheDocument();
    expect(screen.queryByText('Uva 11')).not.toBeInTheDocument();

    const showMoreBtn = screen.getByRole('button', { name: /Ver 3 más/i });
    fireEvent.click(showMoreBtn);

    expect(screen.getByText('Uva 11')).toBeInTheDocument();
    expect(screen.getByText('Uva 13')).toBeInTheDocument();

    const showLessBtn = screen.getByRole('button', { name: /Ver menos/i });
    fireEvent.click(showLessBtn);

    expect(screen.queryByText('Uva 11')).not.toBeInTheDocument();
  });

  it('permite interactuar por hover y click actualizando el centro de la dona', async () => {
    vi.mocked(getGrapesDistribution).mockResolvedValueOnce({
      totalVintages: 10,
      grapes: [
        { grapeId: 1, name: 'Malbec', vintageCount: 7 },
        { grapeId: 2, name: 'Torrontés', vintageCount: 3 },
      ],
    });

    render(<GrapeDistributionCard />);

    await waitFor(() => {
      expect(screen.getByText('10')).toBeInTheDocument();
    });

    const center = screen.getByTestId('grape-donut-center');
    const malbecBtn = screen.getByRole('button', { name: /Malbec/i });
    const torrontesSlice = screen.getByTestId('grape-slice-Torrontés');

    // Hover sobre la leyenda actualiza el centro
    fireEvent.mouseEnter(malbecBtn);
    expect(within(center).getByText('70%')).toBeInTheDocument();
    expect(within(center).getByText('Malbec')).toBeInTheDocument();
    expect(within(center).getByText('7 cosechas')).toBeInTheDocument();

    // Al salir del hover vuelve al total
    fireEvent.mouseLeave(malbecBtn);
    expect(within(center).getByText('10')).toBeInTheDocument();

    // Click en un segmento de la dona lo fija
    fireEvent.click(torrontesSlice);
    expect(within(center).getByText('30%')).toBeInTheDocument();
    expect(within(center).getByText('Torrontés')).toBeInTheDocument();
    expect(within(center).getByText('3 cosechas')).toBeInTheDocument();

    // Click de nuevo lo desfija
    fireEvent.click(torrontesSlice);
    expect(within(center).getByText('10')).toBeInTheDocument();
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
