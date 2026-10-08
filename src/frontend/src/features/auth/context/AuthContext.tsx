/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import type { LoginRequestDto, RegisterRequestDto, UserProfileDto } from '../types';
import { loginApi, registerApi, revokeApi } from '../api/authApi';

export interface AuthContextType {
  user: UserProfileDto | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequestDto) => Promise<void>;
  register: (data: RegisterRequestDto) => Promise<void>;
  loginDemo: (customUser?: Partial<UserProfileDto>) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_KEY = 'user';

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Proveedor de Estado Global de Autenticación de AyVino.
 * Gestiona el ciclo de vida del token JWT, refresco y perfil de usuario.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const navigate = useNavigate();

  // Hidratación perezosa (lazy initialization) síncrona en el primer render
  const [user, setUser] = useState<UserProfileDto | null>(() => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const storedUser = localStorage.getItem(USER_KEY);
      if (token && storedUser) {
        return JSON.parse(storedUser) as UserProfileDto;
      }
    } catch (err) {
      console.error('Error al hidratar el usuario desde localStorage:', err);
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
    return null;
  });

  // Estado derivado: la autenticación se determina directamente desde la presencia de usuario
  const isAuthenticated = user !== null;

  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Escuchar evento personalizado de desautorización (401 desacoplado de Axios)
  useEffect(() => {
    const handleUnauthorized = () => {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      setUser(null);
      navigate('/login', { replace: true });
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, [navigate]);

  const login = useCallback(async (credentials: LoginRequestDto): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await loginApi(credentials);
      localStorage.setItem(TOKEN_KEY, response.accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);
      localStorage.setItem(USER_KEY, JSON.stringify(response.user));

      setUser(response.user);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (data: RegisterRequestDto): Promise<void> => {
    setIsLoading(true);
    try {
      await registerApi(data);
      const loginResponse = await loginApi({ email: data.email, password: data.password });
      localStorage.setItem(TOKEN_KEY, loginResponse.accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, loginResponse.refreshToken);
      localStorage.setItem(USER_KEY, JSON.stringify(loginResponse.user));

      setUser(loginResponse.user);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginDemo = useCallback((customUser?: Partial<UserProfileDto>): void => {
    if (!import.meta.env.DEV) {
      console.warn('loginDemo solo está disponible en entorno de desarrollo.');
      return;
    }

    const demoUser: UserProfileDto = {
      id: customUser?.id ?? 1,
      username: customUser?.username ?? 'Martina Sommelier',
      email: customUser?.email ?? 'sommelier@ayvino.com',
      role: customUser?.role ?? 'User',
      registerDate: new Date().toISOString(),
      isActive: true,
      bio: 'Amante de los terruños andinos y cepas de altura.',
      ...customUser,
    };

    const demoToken = 'demo-jwt-token-ayvino';
    localStorage.setItem(TOKEN_KEY, demoToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, 'demo-refresh-token');
    localStorage.setItem(USER_KEY, JSON.stringify(demoUser));

    setUser(demoUser);
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      if (refreshToken) {
        await revokeApi({ refreshToken });
      }
    } catch (err) {
      console.error('Error al revocar token en el servidor durante logout:', err);
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_KEY);

      setUser(null);
      setIsLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        register,
        loginDemo,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Custom hook para consumir el contexto global de autenticación.
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
}
