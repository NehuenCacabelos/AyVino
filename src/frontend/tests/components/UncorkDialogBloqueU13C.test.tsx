import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import UncorkDialog from '../../src/features/dashboard/components/UncorkDialog';
import type { DashboardWine } from '../../src/types/wine';

describe('UncorkDialog - Bloque U13C', () => {
  const mockWine: DashboardWine = {
    id: 'api-item-201',
    name: 'Rutini Cabernet Malbec 2020',
    winery: 'Rutini Wines',
    region: 'Valle de Uco, Mendoza',
    vintage: 2020,
    varietal: 'Cabernet Sauvignon / Malbec',
    units: 3,
    bottle: 'bordeaux',
  };

  it('arranca sin valor de calificación por defecto ("Sin calificar")', () => {
    render(<UncorkDialog wine={mockWine} onClose={vi.fn()} />);

    expect(screen.getByTestId('uncork-header-rating')).toHaveTextContent('Sin calificar');
    expect(screen.getByTestId('rating-display-unrated')).toHaveTextContent('Sin calificar');

    // El campo de notas de cata está deshabilitado si no hay puntaje
    const notes = screen.getByLabelText(/Notas de cata e impresiones/i);
    expect(notes).toBeDisabled();
  });

  it('permite calificar con precisión decimal y habilita el campo de notas', () => {
    render(<UncorkDialog wine={mockWine} onClose={vi.fn()} />);

    const slider = screen.getByLabelText(/Puntuación de descorche/i);
    fireEvent.change(slider, { target: { value: '4.3' } });

    expect(screen.getByTestId('uncork-header-rating')).toHaveTextContent('4,3 ★');
    const notes = screen.getByLabelText(/Notas de cata e impresiones/i);
    expect(notes).not.toBeDisabled();
  });

  it('al enviar el formulario, entrega la puntuación decimal normalizada sin redondear a entero', () => {
    const handleSave = vi.fn();
    render(<UncorkDialog wine={mockWine} onClose={vi.fn()} onSave={handleSave} />);

    // Calificar con 4.7
    const slider = screen.getByLabelText(/Puntuación de descorche/i);
    fireEvent.change(slider, { target: { value: '4.7' } });

    const notes = screen.getByLabelText(/Notas de cata e impresiones/i);
    fireEvent.change(notes, { target: { value: 'Maridaje inolvidable.' } });

    const submitBtn = screen.getByRole('button', { name: /REGISTRAR DESCORCHE/i });
    fireEvent.click(submitBtn);

    expect(handleSave).toHaveBeenCalledWith(
      expect.objectContaining({
        wine: mockWine,
        rating: 4.7, // No redondeado a 5
        tastingNotes: 'Maridaje inolvidable.',
      })
    );
  });

  it('permite registrar descorche sin calificación entregando rating: null', () => {
    const handleSave = vi.fn();
    render(<UncorkDialog wine={mockWine} onClose={vi.fn()} onSave={handleSave} />);

    const submitBtn = screen.getByRole('button', { name: /REGISTRAR DESCORCHE/i });
    fireEvent.click(submitBtn);

    expect(handleSave).toHaveBeenCalledWith(
      expect.objectContaining({
        wine: mockWine,
        rating: null,
        tastingNotes: '',
      })
    );
  });
});
