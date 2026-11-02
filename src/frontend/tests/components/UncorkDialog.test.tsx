import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UncorkDialog, {
  type UncorkTargetWine,
} from '../../src/features/dashboard/components/UncorkDialog';
import * as uncorkApi from '../../src/features/cava/api/uncorkApi';
import * as userWinesApi from '../../src/features/userWines';

vi.mock('../../src/features/cava/api/uncorkApi', () => ({
  createUncork: vi.fn(),
  formatUncorkDate: vi.fn((d: string) => {
    const today = new Date().toISOString().split('T')[0];
    if (d === today) return undefined;
    return `${d}T12:00:00.000Z`;
  }),
}));

vi.mock('../../src/features/userWines', () => ({
  getMyWineMarks: vi.fn(),
  markWineAsFavorite: vi.fn(),
  unmarkWineAsFavorite: vi.fn(),
}));

const sampleWineInCellar: UncorkTargetWine = {
  wineId: 10,
  wineVintageId: 25,
  name: 'Catena Zapata Malbec Argentino',
  winery: 'Catena Zapata',
  year: 2021,
  wineType: 'Red',
  bottle: 'red-burgundy',
  cellarId: 3,
  availableUnits: 4,
};

const sampleWineDirect: UncorkTargetWine = {
  wineId: 12,
  wineVintageId: 30,
  name: 'Gran Enemigo Gualtallary',
  winery: 'El Enemigo',
  year: 2019,
  wineType: 'Red',
  bottle: 'red-black',
};

describe('UncorkDialog Component (Vista 6: Descorche)', () => {
  const onClose = vi.fn();
  const onDone = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(userWinesApi.getMyWineMarks).mockResolvedValue({
      isFavorite: false,
      isWishlist: false,
      isInCellar: true,
      hasReviewed: false,
      userRating: null,
    });
    vi.mocked(uncorkApi.createUncork).mockResolvedValue({
      activityId: 100,
      occurredAt: '2026-11-02T12:00:00Z',
      remainingQuantity: 3,
      reviewId: null,
    });
  });

  it('renders wine info, displays cellar mode and units available', () => {
    render(
      <UncorkDialog
        wine={sampleWineInCellar}
        onClose={onClose}
        onDone={onDone}
      />
    );

    expect(screen.getByText('Catena Zapata Malbec Argentino')).toBeInTheDocument();
    expect(screen.getByText('Catena Zapata')).toBeInTheDocument();
    expect(screen.getByText('Cava Privada')).toBeInTheDocument();
    expect(screen.getByText('4 botellas')).toBeInTheDocument();
  });

  it('renders direct uncork mode when cellarId is absent', () => {
    render(
      <UncorkDialog
        wine={sampleWineDirect}
        onClose={onClose}
        onDone={onDone}
      />
    );

    expect(screen.getByText('Gran Enemigo Gualtallary')).toBeInTheDocument();
    expect(screen.getByText('Descorche Directo')).toBeInTheDocument();
    expect(screen.getByText(/Registrando descorche directo/i)).toBeInTheDocument();
  });

  it('rating starts as null and toggles on star click', () => {
    render(
      <UncorkDialog
        wine={sampleWineInCellar}
        onClose={onClose}
        onDone={onDone}
      />
    );

    // Initial state: sin puntuar
    expect(screen.getByText('Sin puntuar')).toBeInTheDocument();

    // Click 4th star
    const star4 = screen.getByRole('button', { name: '4 de 5 estrellas' });
    fireEvent.click(star4);
    expect(screen.getByText('4.0')).toBeInTheDocument();

    // Clicking 4th star again deselects to null
    fireEvent.click(star4);
    expect(screen.getByText('Sin puntuar')).toBeInTheDocument();
  });

  it('comment field is disabled when there is no rating and enabled when rated', () => {
    render(
      <UncorkDialog
        wine={sampleWineInCellar}
        onClose={onClose}
        onDone={onDone}
      />
    );

    const commentInput = screen.getByLabelText(/Notas de cata e impresiones/i);
    expect(commentInput).toBeDisabled();
    expect(
      screen.getByText('Para dejar un comentario, puntuá primero el vino')
    ).toBeInTheDocument();

    // Select rating 5
    const star5 = screen.getByRole('button', { name: '5 de 5 estrellas' });
    fireEvent.click(star5);

    expect(commentInput).toBeEnabled();
    fireEvent.change(commentInput, { target: { value: 'Excelente acidez y final largo.' } });
    expect(commentInput).toHaveValue('Excelente acidez y final largo.');
    expect(screen.getByText(/31\/1000/i)).toBeInTheDocument();
  });

  it('submits uncork without rating or comment with today date (occurredAt null)', async () => {
    render(
      <UncorkDialog
        wine={sampleWineInCellar}
        onClose={onClose}
        onDone={onDone}
      />
    );

    const submitBtn = screen.getByRole('button', { name: /REGISTRAR DESCORCHE/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(uncorkApi.createUncork).toHaveBeenCalledWith({
        wineVintageId: 25,
        cellarId: 3,
        rating: null,
        comment: null,
        occurredAt: null,
      });
    });

    await waitFor(() => {
      expect(onDone).toHaveBeenCalledWith(
        expect.objectContaining({ activityId: 100 })
      );
    });
  });

  it('submits uncork with past date converting to 12:00 local ISO', async () => {
    render(
      <UncorkDialog
        wine={sampleWineInCellar}
        onClose={onClose}
        onDone={onDone}
      />
    );

    // Rate 5 and enter notes
    const star5 = screen.getByRole('button', { name: '5 de 5 estrellas' });
    fireEvent.click(star5);

    const commentInput = screen.getByLabelText(/Notas de cata e impresiones/i);
    fireEvent.change(commentInput, { target: { value: 'Noche de asado inolvidable.' } });

    // Pick past date
    const dateInput = screen.getByLabelText(/Fecha del descorche/i);
    fireEvent.change(dateInput, { target: { value: '2025-05-15' } });

    const submitBtn = screen.getByRole('button', { name: /REGISTRAR DESCORCHE/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(uncorkApi.createUncork).toHaveBeenCalledWith({
        wineVintageId: 25,
        cellarId: 3,
        rating: 5,
        comment: 'Noche de asado inolvidable.',
        occurredAt: '2025-05-15T12:00:00.000Z',
      });
    });
  });

  it('toggles favorite and applies update after successful uncork', async () => {
    vi.mocked(userWinesApi.markWineAsFavorite).mockResolvedValue();

    render(
      <UncorkDialog
        wine={sampleWineInCellar}
        onClose={onClose}
        onDone={onDone}
      />
    );

    await waitFor(() => {
      expect(userWinesApi.getMyWineMarks).toHaveBeenCalledWith(10);
    });

    const favBtn = screen.getByRole('button', { name: 'Marcar como favorito' });
    fireEvent.click(favBtn);

    const submitBtn = screen.getByRole('button', { name: /REGISTRAR DESCORCHE/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(uncorkApi.createUncork).toHaveBeenCalled();
      expect(userWinesApi.markWineAsFavorite).toHaveBeenCalledWith(10);
    });
  });

  it('shows clear error when backend returns 409 conflict (no bottles left)', async () => {
    vi.mocked(uncorkApi.createUncork).mockRejectedValue({
      response: { status: 409, data: { detail: 'No bottles' } },
    });

    render(
      <UncorkDialog
        wine={sampleWineInCellar}
        onClose={onClose}
        onDone={onDone}
      />
    );

    const submitBtn = screen.getByRole('button', { name: /REGISTRAR DESCORCHE/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText('Ya no quedan botellas de este vino en la cava.')
      ).toBeInTheDocument();
    });
    expect(onDone).not.toHaveBeenCalled();
  });
});
