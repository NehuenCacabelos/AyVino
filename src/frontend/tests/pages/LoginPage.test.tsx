import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from '@/pages/LoginPage';

const mockLogin = vi.fn();
const mockNavigate = vi.fn();

vi.mock('@/features/auth', () => ({
  useAuth: () => ({
    login: mockLogin,
    isAuthenticated: false,
    user: null,
  }),
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('LoginPage (/login)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () =>
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

  it('renderiza el botón "Volver" con área accesible de al menos 44px y enlace a /', () => {
    renderComponent();

    const backLink = screen.getByRole('link', { name: /Volver al inicio/i });
    expect(backLink).toBeInTheDocument();
    expect(backLink.getAttribute('href')).toBe('/');
    expect(backLink.className).toContain('min-h-[44px]');
    expect(backLink.className).toContain('cursor-pointer');
  });

  it('renderiza la invitación a productores con enlace hacia /bodegas/registro', () => {
    renderComponent();

    expect(screen.getByText(/Sos productor vitivinícola,/i)).toBeInTheDocument();
    const wineryLink = screen.getByRole('link', { name: /registrá tu bodega/i });
    expect(wineryLink).toBeInTheDocument();
    expect(wineryLink.getAttribute('href')).toBe('/bodegas/registro');
    expect(wineryLink.className).toContain('text-rose-300');
  });

  it('valida campos obligatorios de correo y contraseña', async () => {
    renderComponent();

    const submitBtn = screen.getByRole('button', { name: /Iniciar sesión/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText('El correo es requerido')).toBeInTheDocument();
    expect(screen.getByText('La contraseña es requerida')).toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('ejecuta login exitoso y navega', async () => {
    mockLogin.mockResolvedValueOnce({ id: 1, role: 'User' });
    renderComponent();

    fireEvent.change(screen.getByPlaceholderText(/Correo electrónico/i), {
      target: { value: 'sommelier@ayvino.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Contraseña/i), {
      target: { value: 'Secret123!' },
    });

    const submitBtn = screen.getByRole('button', { name: /Iniciar sesión/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'sommelier@ayvino.com',
        password: 'Secret123!',
      });
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
    });
  });
});
