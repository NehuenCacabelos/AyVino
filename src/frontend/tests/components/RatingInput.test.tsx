import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RatingInput from '../../src/components/RatingInput';

describe('RatingInput component', () => {
  it('renderiza con valor numérico y estrellas de precisión decimal', () => {
    const handleChange = vi.fn();
    render(<RatingInput value={4.3} onChange={handleChange} />);

    expect(screen.getByTestId('rating-display-value')).toHaveTextContent('4,3 / 5,0 ★');
    const slider = screen.getByLabelText('Seleccionar puntuación decimal');
    expect(slider).toBeInTheDocument();
    expect(slider).toHaveValue('4.3');
  });

  it('permite valor null y muestra "Sin calificar"', () => {
    const handleChange = vi.fn();
    render(<RatingInput value={null} onChange={handleChange} />);

    expect(screen.getByTestId('rating-display-unrated')).toHaveTextContent('Sin calificar');
    expect(screen.queryByTitle('Quitar puntuación')).not.toBeInTheDocument();
  });

  it('permite quitar la puntuación con el botón Quitar', () => {
    const handleChange = vi.fn();
    render(<RatingInput value={4.5} onChange={handleChange} allowClear={true} />);

    const clearBtn = screen.getByTitle('Quitar puntuación');
    fireEvent.click(clearBtn);

    expect(handleChange).toHaveBeenCalledWith(null);
  });

  it('maneja cambios mediante el slider con paso 0.1 y normalización', () => {
    const handleChange = vi.fn();
    render(<RatingInput value={3.0} onChange={handleChange} />);

    const slider = screen.getByLabelText('Seleccionar puntuación decimal');
    fireEvent.change(slider, { target: { value: '4.7' } });

    expect(handleChange).toHaveBeenCalledWith(4.7);
  });

  it('permite navegación accesible por teclado (ArrowRight, ArrowLeft, Home, End, Delete)', () => {
    const handleChange = vi.fn();
    render(<RatingInput value={3.5} onChange={handleChange} />);

    const slider = screen.getByLabelText('Seleccionar puntuación decimal');

    // ArrowRight (+0.1)
    fireEvent.keyDown(slider, { key: 'ArrowRight' });
    expect(handleChange).toHaveBeenCalledWith(3.6);

    // ArrowLeft (-0.1)
    fireEvent.keyDown(slider, { key: 'ArrowLeft' });
    expect(handleChange).toHaveBeenCalledWith(3.4);

    // Home (1.0)
    fireEvent.keyDown(slider, { key: 'Home' });
    expect(handleChange).toHaveBeenCalledWith(1.0);

    // End (5.0)
    fireEvent.keyDown(slider, { key: 'End' });
    expect(handleChange).toHaveBeenCalledWith(5.0);

    // Delete (null)
    fireEvent.keyDown(slider, { key: 'Delete' });
    expect(handleChange).toHaveBeenCalledWith(null);
  });

  it('permite hacer click en las estrellas enteras para fijar el valor', () => {
    const handleChange = vi.fn();
    render(<RatingInput value={null} onChange={handleChange} />);

    const star4 = screen.getByLabelText('4 de 5 estrellas');
    fireEvent.click(star4);

    expect(handleChange).toHaveBeenCalledWith(4.0);
  });

  it('respeta la propiedad disabled deshabilitando slider e interacciones', () => {
    const handleChange = vi.fn();
    render(<RatingInput value={3.0} onChange={handleChange} disabled={true} />);

    const slider = screen.getByLabelText('Seleccionar puntuación decimal');
    expect(slider).toBeDisabled();

    const star2 = screen.getByLabelText('2 de 5 estrellas');
    fireEvent.click(star2);
    expect(handleChange).not.toHaveBeenCalled();
  });
});
