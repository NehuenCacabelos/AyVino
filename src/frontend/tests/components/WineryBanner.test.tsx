import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import WineryBanner from '@/features/winery/components/WineryBanner';

describe('WineryBanner Component', () => {
  it('renderiza el degradado institucional determinista por defecto cuando no hay bannerUrl', () => {
    render(<WineryBanner wineryName="Bodega Catena Zapata" />);

    expect(screen.getByTestId('winery-banner-theme')).toBeInTheDocument();
    expect(screen.queryByTestId('winery-banner-custom')).not.toBeInTheDocument();
  });

  it('renderiza la imagen oficial cuando se provee bannerUrl válida', () => {
    const bannerUrl = 'https://storage.ayvino.com/banners/catena-banner.webp';
    render(<WineryBanner wineryName="Bodega Catena Zapata" bannerUrl={bannerUrl} />);

    const customContainer = screen.getByTestId('winery-banner-custom');
    expect(customContainer).toBeInTheDocument();

    const img = screen.getByRole('img', { name: /banner de bodega catena zapata/i });
    expect(img).toHaveAttribute('src', bannerUrl);
  });

  it('hace fallback elegante al degradado determinista si la imagen falla al cargar (onError)', () => {
    const brokenUrl = 'https://broken.domain.com/banners/missing.jpg';
    render(<WineryBanner wineryName="Bodega Zuccardi" bannerUrl={brokenUrl} />);

    const img = screen.getByRole('img');
    fireEvent.error(img);

    expect(screen.getByTestId('winery-banner-theme')).toBeInTheDocument();
    expect(screen.queryByTestId('winery-banner-custom')).not.toBeInTheDocument();
  });
});
