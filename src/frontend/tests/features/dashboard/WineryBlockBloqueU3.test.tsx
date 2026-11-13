import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import WineryBlock from '@/features/dashboard/components/WineryBlock';
import { catalogWineToDashboardWine, type DashboardWine } from '@/types/wine';

const mockWines: DashboardWine[] = [
  {
    id: '101',
    wineryId: 42,
    wineryLogoImageId: 'logo-uuid-42',
    name: 'Gran Reserva Malbec',
    winery: 'Bodega Catena Zapata',
    region: 'Mendoza, Argentina',
    varietal: 'Malbec',
    vintage: '2020',
    rating: 4.8,
    bottle: 'bordeaux',
  },
];

describe('Bloque U3 - WineryBlock Component', () => {
  it('renderiza cabecera con enlace a /bodegas/{id} cuando wineryId está presente', () => {
    const { container } = render(
      <MemoryRouter>
        <WineryBlock
          wineryId={42}
          name="Bodega Catena Zapata"
          region="Mendoza, Argentina"
          initials="CZ"
          total={1}
          wines={mockWines}
        />
      </MemoryRouter>,
    );

    const header = container.querySelector('header');
    expect(header).toBeInTheDocument();

    const wineryLink = within(header!).getByRole('link', { name: /Bodega Catena Zapata/i });
    expect(wineryLink).toBeInTheDocument();
    expect(wineryLink).toHaveAttribute('href', '/bodegas/42');
    expect(wineryLink.className).toContain('group/winery');
    expect(wineryLink.className).toContain('focus-visible:ring-rose-500/80');
  });

  it('renderiza cabecera como texto plano sin enlace cuando wineryId NO está presente', () => {
    render(
      <MemoryRouter>
        <WineryBlock
          name="Vino Comunitario Casero"
          region="Valle de Uco"
          initials="VC"
          total={1}
          wines={[
            {
              id: '999',
              name: 'Casero 2021',
              winery: 'Vino Comunitario Casero',
              region: 'Valle de Uco',
              varietal: 'Criolla',
              vintage: '2021',
              rating: 4.0,
              bottle: 'burgundy',
            },
          ]}
        />
      </MemoryRouter>,
    );

    // No debe haber enlace hacia /bodegas/...
    const wineryLinks = screen.queryAllByRole('link');
    const profileLink = wineryLinks.find((link) =>
      link.getAttribute('href')?.startsWith('/bodegas/'),
    );
    expect(profileLink).toBeUndefined();

    // El nombre se muestra en un h3 sin interactividad de enlace
    const heading = screen.getByRole('heading', { level: 3, name: 'Vino Comunitario Casero' });
    expect(heading).toBeInTheDocument();
    expect(heading.closest('a')).toBeNull();
  });

  it('renderiza imagen de logo cuando logoImageId está presente', () => {
    render(
      <MemoryRouter>
        <WineryBlock
          wineryId={42}
          logoImageId="logo-uuid-42"
          name="Bodega Catena Zapata"
          region="Mendoza, Argentina"
          initials="CZ"
          total={1}
          wines={mockWines}
        />
      </MemoryRouter>,
    );

    const logoImg = screen.getByRole('img', { name: /Logo de Bodega Catena Zapata/i });
    expect(logoImg).toBeInTheDocument();
    expect(logoImg).toHaveAttribute('src', '/api/images/logo-uuid-42?variant=logo');
  });

  it('hace respaldo a iniciales cuando la imagen de logo falla al cargar (onError)', () => {
    render(
      <MemoryRouter>
        <WineryBlock
          wineryId={42}
          logoImageId="broken-logo"
          name="Bodega Catena Zapata"
          region="Mendoza, Argentina"
          initials="CZ"
          total={1}
          wines={mockWines}
        />
      </MemoryRouter>,
    );

    const logoImg = screen.getByRole('img', { name: /Logo de Bodega Catena Zapata/i });
    expect(logoImg).toBeInTheDocument();

    // Disparamos evento de error en la imagen
    fireEvent.error(logoImg);

    // Debe mostrar las iniciales y la imagen ya no debe estar
    expect(screen.queryByRole('img', { name: /Logo de Bodega Catena Zapata/i })).toBeNull();
    expect(screen.getByText('CZ')).toBeInTheDocument();
  });

  it('muestra monograma con iniciales cuando no se proporciona logoImageId', () => {
    render(
      <MemoryRouter>
        <WineryBlock
          wineryId={42}
          name="Bodega Catena Zapata"
          region="Mendoza, Argentina"
          initials="CZ"
          total={1}
          wines={mockWines}
        />
      </MemoryRouter>,
    );

    expect(screen.queryByRole('img', { name: /Logo de/i })).toBeNull();
    expect(screen.getByText('CZ')).toBeInTheDocument();
  });

  it('DashboardWine mapea correctamente wineryId y wineryLogoImageId desde CatalogWineItemDto', () => {
    const dto = {
      id: 50,
      wineryId: 12,
      wineryName: 'Bodega Norton',
      wineryNameText: null,
      wineryLogoImageId: 'norton-logo-img',
      name: 'Norton Malbec Doc',
      description: 'Clásico',
      wineType: 'Red',
      grapeName: 'Malbec',
      regionName: 'Luján de Cuyo',
      stateName: 'Mendoza',
      countryName: 'Argentina',
      defaultVintageYear: 2022,
      bottleKind: 'bordeaux',
      primaryImageId: null,
      ratingAverage: 4.5,
      ratingsCount: 10,
      createdAtUtc: '2024-01-01',
    };

    const dashboardWine = catalogWineToDashboardWine(dto);
    expect(dashboardWine.wineryId).toBe(12);
    expect(dashboardWine.wineryLogoImageId).toBe('norton-logo-img');
    expect(dashboardWine.name).toBe('Norton Malbec Doc');
    expect(dashboardWine.winery).toBe('Bodega Norton');
  });

  it('agrupación por wineryId unifica vinos de la misma bodega y preserva wineryId y logoImageId', () => {
    const wines: DashboardWine[] = [
      {
        id: '1',
        wineryId: 10,
        wineryLogoImageId: 'logo-catena',
        name: 'Catena Alta Malbec',
        winery: 'Catena Zapata',
        region: 'Mendoza',
        varietal: 'Malbec',
        vintage: '2019',
        rating: 4.8,
        bottle: 'bordeaux',
      },
      {
        id: '2',
        wineryId: 10,
        name: 'Catena Zapata Chardonnay',
        winery: 'Catena Zapata',
        region: 'Mendoza',
        varietal: 'Chardonnay',
        vintage: '2020',
        rating: 4.6,
        bottle: 'burgundy',
      },
      {
        id: '3',
        wineryId: undefined, // Vino comunitario
        name: 'Vino Casero de Don Pedro',
        winery: 'Don Pedro',
        region: 'San Juan',
        varietal: 'Syrah',
        vintage: '2021',
        rating: 4.2,
        bottle: 'bordeaux',
      },
    ];

    // Simulación del algoritmo de agrupación de DashboardPage
    const map = new Map<
      string,
      {
        key: string;
        wineryId?: number;
        logoImageId?: string;
        name: string;
        region: string;
        wines: DashboardWine[];
      }
    >();

    wines.forEach((wine) => {
      const wineryName = wine.winery?.trim() || 'Bodega Colección';
      const region = wine.region?.trim() || 'Mendoza, Argentina';
      const groupKey =
        wine.wineryId != null
          ? `winery-id-${wine.wineryId}`
          : `winery-text-${wineryName.toLowerCase()}`;

      const existing = map.get(groupKey);
      if (existing) {
        existing.wines.push(wine);
        if (!existing.logoImageId && wine.wineryLogoImageId) {
          existing.logoImageId = wine.wineryLogoImageId;
        }
      } else {
        map.set(groupKey, {
          key: groupKey,
          wineryId: wine.wineryId,
          logoImageId: wine.wineryLogoImageId,
          name: wineryName,
          region,
          wines: [wine],
        });
      }
    });

    const groups = Array.from(map.values());
    expect(groups).toHaveLength(2);

    const catenaGroup = groups.find((g) => g.wineryId === 10);
    expect(catenaGroup).toBeDefined();
    expect(catenaGroup?.key).toBe('winery-id-10');
    expect(catenaGroup?.wines).toHaveLength(2);
    expect(catenaGroup?.logoImageId).toBe('logo-catena');

    const pedroGroup = groups.find((g) => g.key === 'winery-text-don pedro');
    expect(pedroGroup).toBeDefined();
    expect(pedroGroup?.wineryId).toBeUndefined();
    expect(pedroGroup?.wines).toHaveLength(1);
  });
});
