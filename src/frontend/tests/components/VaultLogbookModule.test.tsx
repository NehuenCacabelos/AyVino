import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import VaultLogbookModule from '../../src/features/cava/components/VaultLogbookModule';
import type { TastingLogEntry } from '../../src/features/cava/types';

const sampleEntries: TastingLogEntry[] = [
  {
    id: 1,
    wineId: 10,
    wineName: 'Cheval des Andes',
    wineryName: 'Cheval des Andes',
    vintageYear: 2016,
    uncorkDate: '14 de marzo de 2025',
    notes: 'Increíble profundidad y sedosidad.',
    ratingValue: 5,
    personalImageId: 'img-personal-1',
  },
  {
    id: 2,
    wineId: 20,
    wineName: 'Catena Zapata Adrianna',
    wineryName: 'Catena Zapata',
    vintageYear: 2018,
    uncorkDate: '28 de diciembre de 2024',
    notes: 'Tensión ácida y mineralidad.',
    ratingValue: 4,
    vintageImageId: 'img-vintage-2',
  },
  {
    id: 3,
    wineId: 30,
    wineName: 'Vino Sin Calificar',
    wineryName: 'Bodega Simple',
    vintageYear: null,
    uncorkDate: '10 de enero de 2025',
    notes: null,
    ratingValue: null,
  },
];

describe('VaultLogbookModule Component (Vista 6: Bitácora Real)', () => {
  it('returns null and renders nothing when entries array is empty', () => {
    const { container } = render(<VaultLogbookModule entries={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders latest tasting note with real data: name, year, winery, date, notes and rating', () => {
    render(<VaultLogbookModule entries={sampleEntries} />);

    expect(screen.getByText(/Historial de Descorches/i)).toBeInTheDocument();
    expect(screen.getByText('Cheval des Andes 2016')).toBeInTheDocument();
    expect(screen.getByText('· Cheval des Andes')).toBeInTheDocument();
    expect(screen.getByText('14 de marzo de 2025')).toBeInTheDocument();
    expect(screen.getByText(/Increíble profundidad y sedosidad/i)).toBeInTheDocument();
    expect(
      screen.getByLabelText(/Puntaje: 5 de 5 estrellas/i)
    ).toBeInTheDocument();
  });

  it('opens modal on clicking "Ver N notas registradas" and lists all entries', () => {
    render(<VaultLogbookModule entries={sampleEntries} />);

    const openBtn = screen.getByRole('button', {
      name: /Ver 3 notas registradas/i,
    });
    fireEvent.click(openBtn);

    expect(
      screen.getByRole('heading', {
        name: /Bitácora de Catas & Descorches \(3\)/i,
      })
    ).toBeInTheDocument();

    expect(screen.getByText('Catena Zapata Adrianna 2018')).toBeInTheDocument();
    expect(screen.getByText('28 de diciembre de 2024')).toBeInTheDocument();
    expect(screen.getByText(/Tensión ácida y mineralidad/i)).toBeInTheDocument();

    expect(screen.getByText('Vino Sin Calificar')).toBeInTheDocument();
    expect(screen.getByText('10 de enero de 2025')).toBeInTheDocument();
  });

  it('shows "Cargar más notas" button when hasMore is true and triggers onLoadMore', () => {
    const onLoadMore = vi.fn();

    render(
      <VaultLogbookModule
        entries={sampleEntries}
        hasMore={true}
        onLoadMore={onLoadMore}
      />
    );

    const openBtn = screen.getByRole('button', {
      name: /Ver 3 notas registradas/i,
    });
    fireEvent.click(openBtn);

    const loadMoreBtn = screen.getByRole('button', {
      name: /Cargar más notas/i,
    });
    expect(loadMoreBtn).toBeInTheDocument();
    fireEvent.click(loadMoreBtn);

    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });
});
