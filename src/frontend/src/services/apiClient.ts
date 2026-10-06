import axios, { type InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Instancia centralizada de Axios configurada para la API de AyVino.
 * Inyecta automáticamente el token JWT en las cabeceras de autorización.
 */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: import.meta.env.VITE_API_TIMEOUT || 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: unknown) => {
    return Promise.reject(error);
  }
);

/**
 * Interceptor de respuesta para capturar errores 401 (expiración o token inválido),
 * reintentar la renovación del token y notificar al frontend mediante el evento
 * 'auth:unauthorized' en caso de fallo, desacoplando la redirección del transporte HTTP.
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401) {
      const requestUrl = originalRequest?.url || '';
      const isAuthEndpoint =
        requestUrl.includes('/auth/login') || requestUrl.includes('/auth/refresh');

      // Intentar refresco solo si no es un endpoint de autenticación y no se ha reintentado
      if (!isAuthEndpoint && !originalRequest._retry) {
        const refreshToken = localStorage.getItem('refreshToken');

        if (refreshToken) {
          originalRequest._retry = true;
          try {
            const refreshResponse = await axios.post<{
              accessToken: string;
              refreshToken?: string;
            }>(`${API_BASE_URL}/auth/refresh`, { refreshToken });

            const { accessToken, refreshToken: newRefreshToken } = refreshResponse.data;

            localStorage.setItem('accessToken', accessToken);
            if (newRefreshToken) {
              localStorage.setItem('refreshToken', newRefreshToken);
            }

            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            }

            return apiClient(originalRequest);
          } catch {
            // Si la renovación falla, purgar el almacenamiento y emitir evento de desautorización
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.dispatchEvent(new CustomEvent('auth:unauthorized'));
            return Promise.reject(error);
          }
        }
      }

      // Si no hay refresh token o falló fuera de login, purgar y emitir evento de desautorización
      if (!isAuthEndpoint) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;

