import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import WineryReadOnlyMap from '@/features/winery/components/WineryReadOnlyMap';
import {
  resolveMapCenter,
  STATIC_PROVINCE_CENTROIDS,
  ARGENTINA_CENTER,
} from '@/features/winery/utils/wineryMapUtils';

// Mock Leaflet and react-leaflet components
vi.mock('react-leaflet', () => ({
  MapContainer: ({
    children,
    center,
    zoom,
  }: {
    children: React.ReactNode;
    center: [number, number];
    zoom: number;
  }) => (
    <div
      data-testid="mock-map-container"
      data-lat={center[0]}
      data-lon={center[1]}
      data-zoom={zoom}
    >
      {children}
    </div>
  ),
  TileLayer: () => <div data-testid="mock-tile-layer" />,
  Marker: ({ position }: { position: [number, number] }) => (
    <div data-testid="mock-marker" data-lat={position[0]} data-lon={position[1]} />
  ),
}));

describe('WineryReadOnlyMap & resolveMapCenter', () => {
  describe('resolveMapCenter', () => {
    it('returns exact precision when mapCenter has exact', () => {
      const res = resolveMapCenter({
        latitude: -34.6037,
        longitude: -58.3816,
        precision: 'exact',
      });
      expect(res.precision).toBe('exact');
      expect(res.zoom).toBe(12);
      expect(res.showMarker).toBe(true);
      expect(res.center).toEqual([-34.6037, -58.3816]);
    });

    it('returns locality precision when mapCenter has locality', () => {
      const res = resolveMapCenter({
        latitude: -45.345,
        longitude: -69.002,
        precision: 'locality',
      });
      expect(res.precision).toBe('locality');
      expect(res.zoom).toBe(10);
      expect(res.showMarker).toBe(true);
      expect(res.center).toEqual([-45.345, -69.002]);
    });

    it('returns province precision without marker when mapCenter has province', () => {
      const res = resolveMapCenter({
        latitude: -43.7886,
        longitude: -68.5264,
        precision: 'province',
      });
      expect(res.precision).toBe('province');
      expect(res.zoom).toBe(6);
      expect(res.showMarker).toBe(false);
      expect(res.center).toEqual([-43.7886, -68.5264]);
    });

    it('resolves static province centroid when coordinates are absent', () => {
      const res = resolveMapCenter(null, null, null, 'Chubut');
      expect(res.precision).toBe('province');
      expect(res.center).toEqual(STATIC_PROVINCE_CENTROIDS.chubut);
      expect(res.showMarker).toBe(false);
      expect(res.zoom).toBe(6);
    });

    it('resolves province from locationLabel if provinceName is not passed', () => {
      const res = resolveMapCenter(null, null, null, null, 'Sarmiento, Chubut');
      expect(res.precision).toBe('province');
      expect(res.center).toEqual(STATIC_PROVINCE_CENTROIDS.chubut);
    });

    it('falls back to Argentina center when no location info is available', () => {
      const res = resolveMapCenter(null, null, null, null, null);
      expect(res.precision).toBe('none');
      expect(res.center).toEqual(ARGENTINA_CENTER);
      expect(res.showMarker).toBe(false);
      expect(res.zoom).toBe(4);
    });
  });

  describe('UI Component Rendering', () => {
    it('always renders the map container, even when coordinates are absent', () => {
      render(
        <WineryReadOnlyMap
          locationLabel="Sarmiento, Chubut"
          provinceName="Chubut"
        />
      );

      expect(screen.getByTestId('winery-map-container')).toBeInTheDocument();
      expect(screen.queryByTestId('winery-map-fallback')).not.toBeInTheDocument();
      expect(screen.getByText('Vista provincial')).toBeInTheDocument();
      expect(screen.queryByTestId('mock-marker')).not.toBeInTheDocument();
    });

    it('renders "Ubicación aproximada" badge and marker when precision is locality', () => {
      render(
        <WineryReadOnlyMap
          mapCenter={{
            latitude: -45.345,
            longitude: -69.002,
            precision: 'locality',
          }}
          locationLabel="Sarmiento, Chubut"
        />
      );

      expect(screen.getByText('Ubicación aproximada')).toBeInTheDocument();
      expect(screen.getByTestId('mock-marker')).toBeInTheDocument();
    });

    it('renders coordinates and marker when precision is exact', () => {
      render(
        <WineryReadOnlyMap
          latitude={-33.05}
          longitude={-68.88}
          locationLabel="Luján de Cuyo, Mendoza"
        />
      );

      expect(screen.getByTestId('mock-marker')).toBeInTheDocument();
      expect(screen.getByText('-33.0500, -68.8800')).toBeInTheDocument();
    });

    it('renders Argentina overview when no location is known', () => {
      render(<WineryReadOnlyMap locationLabel="Sin ubicación" />);

      expect(screen.getByTestId('winery-map-container')).toBeInTheDocument();
      expect(screen.getByText('Vista general')).toBeInTheDocument();
      expect(screen.queryByTestId('mock-marker')).not.toBeInTheDocument();
    });
  });
});
