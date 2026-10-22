import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import WineryKpiRibbon from '@/features/winery/components/WineryKpiRibbon';

describe('WineryKpiRibbon', () => {
  it('renders loading skeletons when isLoading is true', () => {
    const { container } = render(
      <WineryKpiRibbon
        winesCount={0}
        vintagesCount={0}
        approvedVintagesCount={0}
        pendingVintagesCount={0}
        followersCount={null}
        averageRating={null}
        totalReviews={0}
        isWineryApproved={true}
        isLoading={true}
      />
    );

    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders all 4 metrics correctly when approved and populated', () => {
    render(
      <WineryKpiRibbon
        winesCount={12}
        vintagesCount={28}
        approvedVintagesCount={25}
        pendingVintagesCount={3}
        followersCount={145}
        averageRating={4.75}
        totalReviews={89}
        isWineryApproved={true}
      />
    );

    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('Etiquetas')).toBeInTheDocument();

    expect(screen.getByText('28')).toBeInTheDocument();
    expect(screen.getByText('Cosechas')).toBeInTheDocument();
    expect(screen.getByText(/25 activas · 3 en revisión/)).toBeInTheDocument();

    expect(screen.getByText('145')).toBeInTheDocument();
    expect(screen.getByText('Seguidores')).toBeInTheDocument();

    expect(screen.getByText('4.8')).toBeInTheDocument();
    expect(screen.getByText('Puntaje Global')).toBeInTheDocument();
    expect(screen.getByText(/reseñas de la comunidad/)).toBeInTheDocument();
  });

  it('handles pending winery status without throwing and shows awaiting verification for followers', () => {
    render(
      <WineryKpiRibbon
        winesCount={1}
        vintagesCount={1}
        approvedVintagesCount={0}
        pendingVintagesCount={1}
        followersCount={null}
        averageRating={null}
        totalReviews={0}
        isWineryApproved={false}
      />
    );

    expect(screen.getByText('Disponible al aprobarse')).toBeInTheDocument();
    expect(screen.getByText('Sin notas')).toBeInTheDocument();
    expect(screen.getByText('Aguardando primeras catas')).toBeInTheDocument();
  });
});
