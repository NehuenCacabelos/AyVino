import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import WineryLogo from '@/features/winery/components/WineryLogo';
import { getWineryInitials } from '@/features/winery/utils/wineryUtils';

describe('WineryLogo Component', () => {
  it('correctly calculates winery initials with getWineryInitials', () => {
    expect(getWineryInitials('Bodega Catena Zapata')).toBe('BC');
    expect(getWineryInitials('Rutini')).toBe('RU');
    expect(getWineryInitials('')).toBe('BO');
    expect(getWineryInitials(null)).toBe('BO');
  });

  it('renders monogram fallback with initials when src is not provided', () => {
    render(<WineryLogo src={null} name="Bodega Salentein" size="md" />);

    expect(screen.getByText('BS')).toBeInTheDocument();
  });

  it('renders img element when valid src is provided', () => {
    render(
      <WineryLogo
        src="https://example.supabase.co/storage/v1/object/public/ayvino-media/wineries/logo.png"
        name="Bodega Salentein"
        size="lg"
      />,
    );

    const img = screen.getByRole('img', { name: /Logo oficial de Bodega Salentein/i });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute(
      'src',
      'https://example.supabase.co/storage/v1/object/public/ayvino-media/wineries/logo.png',
    );
  });

  it('falls back to initials monogram if the image fails to load', () => {
    render(
      <WineryLogo
        src="https://example.com/broken-logo.png"
        name="Zuccardi Valle de Uco"
        size="md"
      />,
    );

    const img = screen.getByRole('img');
    fireEvent.error(img);

    expect(screen.getByText('ZV')).toBeInTheDocument();
  });
});
