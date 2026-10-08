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

/** Origen permitido para inyectar tokens de autorización. */
const apiOrigin = new URL(API_BASE_URL).origin;

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    if (token && config.headers) {
      // Solo inyectar el Bearer token cuando el destino coincide con el host de la API
      const targetUrl = new URL(config.url ?? '', config.baseURL);
      if (targetUrl.origin === apiOrigin) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error: unknown) => {
    return Promise.reject(error);
  }
);

/**
 * Purga completa de tokens y señal global de desautorización.
 */
function purgeAndSignalUnauthorized(): void {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.dispatchEvent(new CustomEvent('auth:unauthorized'));
}

/**
 * Mutex de refresco: promesa compartida que evita disparar múltiples llamadas
 * concurrentes a /auth/refresh cuando varios requests reciben 401 simultáneamente.
 */
let refreshPromise: Promise<string> | null = null;

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
        originalRequest._retry = true;

        try {
          // Reutilizar la promesa existente o crear una nueva para el refresh
          if (!refreshPromise) {
            const storedRefreshToken = localStorage.getItem('refreshToken');
            if (!storedRefreshToken) {
              purgeAndSignalUnauthorized();
              return Promise.reject(error);
            }

            refreshPromise = axios
              .post<{ accessToken: string; refreshToken?: string }>(
                `${API_BASE_URL}/auth/refresh`,
                { refreshToken: storedRefreshToken },
              )
              .then((res) => {
                const { accessToken, refreshToken: newRefreshToken } = res.data;
                localStorage.setItem('accessToken', accessToken);
                if (newRefreshToken) {
                  localStorage.setItem('refreshToken', newRefreshToken);
                }
                return accessToken;
              })
              .finally(() => {
                refreshPromise = null;
              });
          }

          const newAccessToken = await refreshPromise;

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          }

          return apiClient(originalRequest);
        } catch {
          purgeAndSignalUnauthorized();
          return Promise.reject(error);
        }
      }

      // Sin refresh token o ya reintentado fuera de login: purgar y señalizar
      if (!isAuthEndpoint) {
        purgeAndSignalUnauthorized();
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;

