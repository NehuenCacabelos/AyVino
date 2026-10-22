import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import WineryQuickActions from '@/features/winery/components/WineryQuickActions';

describe('WineryQuickActions', () => {
  it('renders all standard quick actions and explores catalog when winery is not approved', () => {
    render(
      <MemoryRouter>
        <WineryQuickActions wineryId={5} isApproved={false} />
      </MemoryRouter>
    );

    expect(screen.getByText('Accesos Rápidos')).toBeInTheDocument();
    expect(screen.getByText('Publicar etiqueta')).toBeInTheDocument();
    expect(screen.getByText('Reclamar vinos comunitarios')).toBeInTheDocument();
    expect(screen.getByText('Editar perfil de bodega')).toBeInTheDocument();
    expect(screen.getByText('Explorar catálogo general')).toBeInTheDocument();

    const links = screen.getAllByRole('link');
    expect(links.some((l) => l.getAttribute('href') === '/bodega/vinos')).toBe(true);
    expect(links.some((l) => l.getAttribute('href') === '/bodega/reclamar')).toBe(true);
    expect(links.some((l) => l.getAttribute('href') === '/bodega/perfil')).toBe(true);
    expect(links.some((l) => l.getAttribute('href') === '/catalogo')).toBe(true);
  });

  it('renders "Ver perfil público" pointing to /bodegas/:id when approved', () => {
    render(
      <MemoryRouter>
        <WineryQuickActions wineryId={42} isApproved={true} />
      </MemoryRouter>
    );

    expect(screen.getByText('Ver perfil público')).toBeInTheDocument();
    const links = screen.getAllByRole('link');
    expect(links.some((l) => l.getAttribute('href') === '/bodegas/42')).toBe(true);
  });
});
