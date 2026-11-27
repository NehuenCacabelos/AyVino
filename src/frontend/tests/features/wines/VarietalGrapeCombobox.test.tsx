import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useState } from 'react';
import VarietalGrapeCombobox from '@/features/wines/components/VarietalGrapeCombobox';
import type { GrapeResponseDto } from '@/features/winery/types';
import { createNewBlendRow, type BlendRow } from '@/features/winery/utils/grapeBlendUtils';

describe('VarietalGrapeCombobox & Composición Varietal', () => {
  const sampleGrapes: GrapeResponseDto[] = [
    { id: 1, name: 'Malbec', colorType: 'Red', typicalBody: null, typicalTannins: null, typicalAcidity: null, description: null },
    { id: 2, name: 'Cabernet Sauvignon', colorType: 'Red', typicalBody: null, typicalTannins: null, typicalAcidity: null, description: null },
    { id: 3, name: 'Torrontés Riojano', colorType: 'White', typicalBody: null, typicalTannins: null, typicalAcidity: null, description: null },
    { id: 4, name: 'Merlot', colorType: 'Red', typicalBody: null, typicalTannins: null, typicalAcidity: null, description: null },
  ];

  it('muestra el combobox con los atributos de accesibilidad iniciales', () => {
    render(
      <VarietalGrapeCombobox
        grapes={sampleGrapes}
        searchQuery=""
        onSearchChange={vi.fn()}
        onSelectGrape={vi.fn()}
      />
    );

    const combobox = screen.getByRole('combobox', { name: /Buscar uva/i });
    expect(combobox).toBeInTheDocument();
    expect(combobox).toHaveAttribute('aria-expanded', 'false');
    expect(combobox).toHaveAttribute('aria-autocomplete', 'list');
    expect(combobox).toHaveAttribute('aria-controls', 'varietal-grape-listbox');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('al hacer foco o escribir, abre el listbox con las uvas y sus colores', () => {
    render(
      <VarietalGrapeCombobox
        grapes={sampleGrapes}
        searchQuery=""
        onSearchChange={vi.fn()}
        onSelectGrape={vi.fn()}
      />
    );

    const combobox = screen.getByRole('combobox', { name: /Buscar uva/i });
    fireEvent.focus(combobox);

    const listbox = screen.getByRole('listbox', { name: /Catálogo de uvas/i });
    expect(listbox).toBeInTheDocument();
    expect(combobox).toHaveAttribute('aria-expanded', 'true');

    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(4);
    expect(screen.getByText('Malbec')).toBeInTheDocument();
    expect(screen.getAllByText('Red')).toHaveLength(3);
    expect(screen.getByText('Torrontés Riojano')).toBeInTheDocument();
    expect(screen.getByText('White')).toBeInTheDocument();
  });

  it('permite navegar con ArrowDown, ArrowUp y Escape', () => {
    render(
      <VarietalGrapeCombobox
        grapes={sampleGrapes}
        searchQuery=""
        onSearchChange={vi.fn()}
        onSelectGrape={vi.fn()}
      />
    );

    const combobox = screen.getByRole('combobox', { name: /Buscar uva/i });
    fireEvent.focus(combobox);

    const options = screen.getAllByRole('option');
    expect(options[0]).toHaveAttribute('aria-selected', 'true');

    fireEvent.keyDown(combobox, { key: 'ArrowDown' });
    expect(options[1]).toHaveAttribute('aria-selected', 'true');

    fireEvent.keyDown(combobox, { key: 'ArrowUp' });
    expect(options[0]).toHaveAttribute('aria-selected', 'true');

    fireEvent.keyDown(combobox, { key: 'Escape' });
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('cierra el desplegable al hacer clic afuera', () => {
    render(
      <div>
        <span data-testid="outside">Afuera</span>
        <VarietalGrapeCombobox
          grapes={sampleGrapes}
          searchQuery=""
          onSearchChange={vi.fn()}
          onSelectGrape={vi.fn()}
        />
      </div>
    );

    const combobox = screen.getByRole('combobox', { name: /Buscar uva/i });
    fireEvent.focus(combobox);
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByTestId('outside'));
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('muestra mensaje cuando no hay coincidencias', () => {
    render(
      <VarietalGrapeCombobox
        grapes={[]}
        searchQuery="Inexistente"
        onSearchChange={vi.fn()}
        onSelectGrape={vi.fn()}
      />
    );

    const combobox = screen.getByRole('combobox', { name: /Buscar uva/i });
    fireEvent.focus(combobox);

    expect(screen.getByText('No se encontraron uvas con ese nombre')).toBeInTheDocument();
  });

  describe('Flujo de Composición Varietal: primera uva 100%, segunda 0%, no duplicación', () => {
    function VarietalBlendTestHarness() {
      const [blend, setBlend] = useState<BlendRow[]>([]);
      const [search, setSearch] = useState('');
      const [toastMsg, setToastMsg] = useState<string | null>(null);

      const handleSelectGrape = (grape: GrapeResponseDto) => {
        const alreadyExists = blend.some((r) => r.grapeId === grape.id);
        if (alreadyExists) {
          setToastMsg(`La uva "${grape.name}" ya está en la composición varietal.`);
          setSearch('');
          return;
        }

        const newRow = createNewBlendRow(grape.id, blend.length, 'blend-test');
        setBlend((prev) => [...prev, newRow]);
        setSearch('');
      };

      const filteredGrapes = search.trim()
        ? sampleGrapes.filter((g) => g.name.toLowerCase().includes(search.toLowerCase().trim()))
        : sampleGrapes;

      return (
        <div>
          {toastMsg && <div data-testid="toast-message">{toastMsg}</div>}
          <VarietalGrapeCombobox
            grapes={filteredGrapes}
            searchQuery={search}
            onSearchChange={setSearch}
            onSelectGrape={handleSelectGrape}
            selectedGrapeIds={blend.map((r) => r.grapeId)}
          />
          <ul data-testid="blend-list">
            {blend.map((row) => (
              <li key={row.id} data-testid={`blend-row-${row.grapeId}`}>
                Uva ID: {row.grapeId} - Porcentaje: {row.percentage}%
              </li>
            ))}
          </ul>
        </div>
      );
    }

    it('elegir la primera uva crea una fila con 100%', () => {
      render(<VarietalBlendTestHarness />);

      const combobox = screen.getByRole('combobox', { name: /Buscar uva/i });
      fireEvent.focus(combobox);

      // Clic en Malbec (id 1)
      const malbecOption = screen.getByText('Malbec');
      fireEvent.click(malbecOption);

      const row = screen.getByTestId('blend-row-1');
      expect(row).toBeInTheDocument();
      expect(row).toHaveTextContent('Porcentaje: 100%');
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      expect(combobox).toHaveValue('');
    });

    it('elegir una segunda uva crea una fila con 0%', () => {
      render(<VarietalBlendTestHarness />);

      const combobox = screen.getByRole('combobox', { name: /Buscar uva/i });

      // Primera uva: Malbec
      fireEvent.focus(combobox);
      fireEvent.click(screen.getByText('Malbec'));
      expect(screen.getByTestId('blend-row-1')).toHaveTextContent('Porcentaje: 100%');

      // Segunda uva: Cabernet Sauvignon (id 2) vía teclado Enter
      fireEvent.change(combobox, { target: { value: 'Cabernet' } });
      fireEvent.keyDown(combobox, { key: 'Enter' });

      const firstRow = screen.getByTestId('blend-row-1');
      const secondRow = screen.getByTestId('blend-row-2');
      expect(firstRow).toHaveTextContent('Porcentaje: 100%');
      expect(secondRow).toHaveTextContent('Porcentaje: 0%');
      expect(combobox).toHaveValue('');
    });

    it('elegir una uva repetida no duplica y muestra aviso', () => {
      render(<VarietalBlendTestHarness />);

      const combobox = screen.getByRole('combobox', { name: /Buscar uva/i });

      // Primera uva: Malbec
      fireEvent.focus(combobox);
      fireEvent.click(screen.getByText('Malbec'));
      expect(screen.getByTestId('blend-row-1')).toHaveTextContent('Porcentaje: 100%');

      // Intentar agregar Malbec de nuevo
      fireEvent.focus(combobox);
      fireEvent.click(screen.getByText('Malbec'));

      // No se debe duplicar la fila
      const rows = screen.getAllByTestId(/blend-row-/);
      expect(rows).toHaveLength(1);

      // Se debe disparar aviso / toast
      expect(screen.getByTestId('toast-message')).toHaveTextContent(
        'La uva "Malbec" ya está en la composición varietal.'
      );
      expect(combobox).toHaveValue('');
    });
  });
});
