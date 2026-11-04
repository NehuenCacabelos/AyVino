import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import RegisterPage from '@/pages/RegisterPage';
import AccountPage from '@/pages/AccountPage';
import * as userApi from '@/features/users/api/userApi';
import * as authModule from '@/features/auth';

vi.mock('@/features/users/api/userApi', async (importOriginal) => {
  const actual = await importOriginal<typeof userApi>();
  return {
    ...actual,
    checkUsernameAvailabilityApi: vi.fn(),
    getCurrentUserApi: vi.fn(),
    updateProfileApi: vi.fn(),
    uploadAvatarApi: vi.fn(),
    deleteAvatarApi: vi.fn(),
    changePasswordApi: vi.fn(),
  };
});

vi.mock('@/features/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof authModule>();
  return {
    ...actual,
    useAuth: vi.fn(),
  };
});

describe('RegisterPage and AccountPage - Bloque B', () => {
  const mockRegister = vi.fn();
  const mockUpdateUserContext = vi.fn();
  const mockLogout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (authModule.useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      user: {
        id: 1,
        username: 'sommelier_juan',
        email: 'juan@ayvino.com',
        role: 'User',
        registerDate: '2026-01-01',
        isActive: true,
        bio: 'Amante del Pinot Noir',
        birthDate: '1990-05-15',
        gender: 'Male',
        avatarImageId: 'avatar123',
      },
      register: mockRegister,
      updateUserContext: mockUpdateUserContext,
      logout: mockLogout,
    });

    (userApi.getCurrentUserApi as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 1,
      username: 'sommelier_juan',
      email: 'juan@ayvino.com',
      role: 'User',
      registerDate: '2026-01-01',
      isActive: true,
      bio: 'Amante del Pinot Noir',
      birthDate: '1990-05-15',
      gender: 'Male',
      avatarImageId: 'avatar123',
    });
  });

  it('RegisterPage verifies username availability on blur and renders birthDate & gender', async () => {
    (userApi.checkUsernameAvailabilityApi as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(true);

    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    );

    const userInput = screen.getByLabelText(/nombre de usuario/i);
    expect(userInput).toBeDefined();

    // BirthDate and gender inputs should be rendered
    expect(screen.getByLabelText(/fecha de nacimiento/i)).toBeDefined();
    expect(screen.getByLabelText(/género/i)).toBeDefined();

    // Trigger onBlur
    fireEvent.change(userInput, { target: { value: 'nuevo_usuario' } });
    fireEvent.blur(userInput);

    await waitFor(() => {
      expect(userApi.checkUsernameAvailabilityApi).toHaveBeenCalledWith('nuevo_usuario');
      expect(screen.getByText(/nombre de usuario disponible/i)).toBeDefined();
    });
  });

  it('AccountPage renders birthDate & gender inputs and triggers file picker on avatar button click', async () => {
    render(
      <MemoryRouter>
        <AccountPage />
      </MemoryRouter>
    );

    // Check birthDate and gender inputs
    const birthDateInput = await screen.findByLabelText(/fecha de nacimiento/i);
    const genderSelect = screen.getByLabelText(/género/i);

    expect(birthDateInput).toBeDefined();
    expect((birthDateInput as HTMLInputElement).value).toBe('1990-05-15');
    expect((genderSelect as HTMLSelectElement).value).toBe('Male');

    // Check avatar button with accessible label
    const avatarBtn = screen.getByRole('button', { name: /cambiar foto de perfil/i });
    expect(avatarBtn).toBeDefined();

    // Clicking avatar triggers file input click
    const fileInput = screen.getByLabelText(/cargar foto de perfil/i) as HTMLInputElement;
    const fileClickSpy = vi.spyOn(fileInput, 'click');

    fireEvent.click(avatarBtn);
    expect(fileClickSpy).toHaveBeenCalled();
  });
});
