import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import WineryBlock from '@/features/dashboard/components/WineryBlock';
import type { DashboardWine } from '@/types/wine';

const createMockWines = (count: number): DashboardWine[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `wine-${i + 1}`,
    name: `Vino Test ${i + 1}`,
    winery: 'Bodega Catena',
    region: 'Mendoza',
    varietal: 'Malbec',
    vintage: 2020 + (i % 4),
    rating: 4.5,
    bottle: 'red-burgundy',
  }));

describe('WineryBlock Component (Carrusel)', () => {
  beforeEach(() => {
    // Simular resolución de pantalla de escritorio (>= 1024px)
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1280,
    });
  });

  it('muestra solo los primeros 4 vinos en la vista inicial de escritorio', () => {
    const wines = createMockWines(7);

    render(
      <MemoryRouter>
        <WineryBlock
          name="Bodega Catena"
          region="Mendoza"
          initials="BC"
          total={7}
          wines={wines}
        />
      </MemoryRouter>
    );

    // Los primeros 4 deben estar visibles
    expect(screen.getByText('Vino Test 1')).toBeInTheDocument();
    expect(screen.getByText('Vino Test 2')).toBeInTheDocument();
    expect(screen.getByText('Vino Test 3')).toBeInTheDocument();
    expect(screen.getByText('Vino Test 4')).toBeInTheDocument();

    // Los vinos 5, 6 y 7 no deben estar en la primera página
    expect(screen.queryByText('Vino Test 5')).not.toBeInTheDocument();
    expect(screen.queryByText('Vino Test 6')).not.toBeInTheDocument();
    expect(screen.queryByText('Vino Test 7')).not.toBeInTheDocument();
  });

  it('navega a los siguientes vinos al presionar la flecha siguiente y permite regresar con la flecha anterior', () => {
    const wines = createMockWines(6);

    render(
      <MemoryRouter>
        <WineryBlock
          name="Bodega Catena"
          region="Mendoza"
          initials="BC"
          total={6}
          wines={wines}
        />
      </MemoryRouter>
    );

    // Flecha anterior no debe existir en la página inicial
    expect(screen.queryByRole('button', { name: /ver vinos anteriores/i })).not.toBeInTheDocument();

    // Flecha siguiente debe estar presente
    const nextBtn = screen.getByRole('button', { name: /ver vinos siguientes/i });
    expect(nextBtn).toBeInTheDocument();

    // Avanzar a la siguiente página
    fireEvent.click(nextBtn);

    // Ahora deben verse los vinos 5 y 6
    expect(screen.getByText('Vino Test 5')).toBeInTheDocument();
    expect(screen.getByText('Vino Test 6')).toBeInTheDocument();
    expect(screen.queryByText('Vino Test 1')).not.toBeInTheDocument();

    // Flecha siguiente desaparece en la última página
    expect(screen.queryByRole('button', { name: /ver vinos siguientes/i })).not.toBeInTheDocument();

    // Flecha anterior aparece y permite retroceder
    const prevBtn = screen.getByRole('button', { name: /ver vinos anteriores/i });
    expect(prevBtn).toBeInTheDocument();

    fireEvent.click(prevBtn);

    // Vuelve a la primera página
    expect(screen.getByText('Vino Test 1')).toBeInTheDocument();
    expect(screen.queryByText('Vino Test 5')).not.toBeInTheDocument();
  });

  it('permite navegar haciendo clic en los puntos (dots) de paginación', () => {
    const wines = createMockWines(6);

    render(
      <MemoryRouter>
        <WineryBlock
          name="Bodega Catena"
          region="Mendoza"
          initials="BC"
          total={6}
          wines={wines}
        />
      </MemoryRouter>
    );

    const dots = screen.getAllByRole('tab');
    expect(dots).toHaveLength(2); // 6 vinos con pageSize 4 = 2 páginas

    // Clic en la segunda página
    fireEvent.click(dots[1]);

    expect(screen.getByText('Vino Test 5')).toBeInTheDocument();
    expect(screen.queryByText('Vino Test 1')).not.toBeInTheDocument();
  });

  it('no muestra flechas ni indicadores de puntos si la bodega tiene 4 o menos vinos', () => {
    const wines = createMockWines(3);

    render(
      <MemoryRouter>
        <WineryBlock
          name="Bodega Catena"
          region="Mendoza"
          initials="BC"
          total={3}
          wines={wines}
        />
      </MemoryRouter>
    );

    expect(screen.queryByRole('button', { name: /ver vinos siguientes/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /ver vinos anteriores/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
  });

  it('ejecuta los callbacks onAddToCellar y onToggleFavorite correctamente', () => {
    const wines = createMockWines(2);
    const onAddToCellar = vi.fn();
    const onToggleFavorite = vi.fn();

    render(
      <MemoryRouter>
        <WineryBlock
          name="Bodega Catena"
          region="Mendoza"
          initials="BC"
          total={2}
          wines={wines}
          onAddToCellar={onAddToCellar}
          onToggleFavorite={onToggleFavorite}
        />
      </MemoryRouter>
    );

    const cellarBtns = screen.getAllByRole('button', { name: /añadir a cava/i });
    fireEvent.click(cellarBtns[0]);
    expect(onAddToCellar).toHaveBeenCalledWith(wines[0]);

    const favBtn = screen.getByRole('button', { name: `Añadir ${wines[0].name} a deseados` });
    fireEvent.click(favBtn);
    expect(onToggleFavorite).toHaveBeenCalledWith(wines[0], true);
  });

  it('renderiza la imagen del vino en el contenedor rectangular 3:4 interior cuando tiene imageUrl', () => {
    const wineWithImage: DashboardWine = {
      id: 'wine-img-1',
      name: 'Vino con Foto',
      winery: 'Bodega Catena',
      region: 'Mendoza',
      varietal: 'Malbec',
      vintage: 2021,
      rating: 4.8,
      bottle: 'red-burgundy',
      imageUrl: 'https://example.com/rutini.jpg',
    };

    render(
      <MemoryRouter>
        <WineryBlock
          name="Bodega Catena"
          region="Mendoza"
          initials="BC"
          total={1}
          wines={[wineWithImage]}
        />
      </MemoryRouter>
    );

    const img = screen.getByRole('img', { name: 'Vino con Foto' });
    expect(img).toBeInTheDocument();
    expect(img).toHaveClass('w-full', 'h-full', 'object-cover');
    expect(img.parentElement).toHaveClass('aspect-[3/4]', 'rounded-xl', 'overflow-hidden');
  });
});

