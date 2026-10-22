import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LocationCascadeSelect from '../LocationCascadeSelect';
import * as locationApi from '../../api/locationApi';
import type { StateResponseDto, LocationResponseDto } from '../../types';

vi.mock('../../api/locationApi', () => ({
  getStates: vi.fn(),
  getLocations: vi.fn(),
}));

describe('LocationCascadeSelect', () => {
  const mockStates: StateResponseDto[] = [
    { id: 1, name: 'Mendoza' },
    { id: 2, name: 'San Juan' },
  ];

  const mockLocations: LocationResponseDto[] = [
    { id: 10, cityId: 100, cityName: 'Luján de Cuyo', stateId: 1, stateName: 'Mendoza' },
    { id: 11, cityId: 101, cityName: 'Valle de Uco', stateId: 1, stateName: 'Mendoza' },
    { id: 20, cityId: 102, cityName: 'Valle de Pedernal', stateId: 2, stateName: 'San Juan' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(locationApi.getStates).mockResolvedValue(mockStates);
    vi.mocked(locationApi.getLocations).mockResolvedValue(mockLocations);
  });

  it('renders states and populates location dropdown on state selection', async () => {
    const onChangeMock = vi.fn();

    render(
      <LocationCascadeSelect
        value={null}
        onChange={onChangeMock}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Mendoza')).toBeInTheDocument();
      expect(screen.getByText('San Juan')).toBeInTheDocument();
    });

    // Select Mendoza
    const stateSelect = screen.getByLabelText('Provincia vitivinícola');
    fireEvent.change(stateSelect, { target: { value: '1' } });

    // Location select should now be enabled and have Mendoza locations
    const locationSelect = screen.getByLabelText('Ciudad o terruño de la bodega');
    expect(locationSelect).not.toBeDisabled();
    expect(screen.getByText('Luján de Cuyo')).toBeInTheDocument();
    expect(screen.getByText('Valle de Uco')).toBeInTheDocument();
    expect(screen.queryByText('Valle de Pedernal')).not.toBeInTheDocument();

    // Select Luján de Cuyo
    fireEvent.change(locationSelect, { target: { value: '10' } });

    expect(onChangeMock).toHaveBeenCalledWith(
      10,
      expect.objectContaining({ cityName: 'Luján de Cuyo' })
    );
  });

  it('auto-derives selected state when initial value is provided', async () => {
    render(
      <LocationCascadeSelect
        value={20}
        onChange={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Valle de Pedernal')).toBeInTheDocument();
    });

    const stateSelect = screen.getByLabelText('Provincia vitivinícola') as HTMLSelectElement;
    expect(stateSelect.value).toBe('2'); // San Juan

    const locationSelect = screen.getByLabelText('Ciudad o terruño de la bodega') as HTMLSelectElement;
    expect(locationSelect.value).toBe('20');
  });
});
