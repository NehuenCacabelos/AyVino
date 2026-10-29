/* eslint-disable react-refresh/only-export-components */
import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import RootLayout from '../components/layout/RootLayout';
import AppLayout from '../components/layout/AppLayout';
import RouteErrorElement from '../components/layout/RouteErrorElement';
import { ProtectedRoute, useAuth } from '../features/auth';

// Carga diferida de vistas: cada página genera un chunk independiente en Vite
const Landing = lazy(() => import('../pages/Landing'));
const LoginPage = lazy(() => import('../pages/LoginPage'));
const RegisterPage = lazy(() => import('../pages/RegisterPage'));
const TermsPage = lazy(() => import('../pages/TermsPage'));
const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const CavaPage = lazy(() => import('../pages/CavaPage'));
const PairingPage = lazy(() => import('../pages/PairingPage'));
const CatalogPage = lazy(() => import('../pages/CatalogPage'));
const WineDetailPage = lazy(() => import('../pages/WineDetailPage'));
const WineryDashboardPage = lazy(() => import('../pages/WineryDashboardPage'));
const AccountPage = lazy(() => import('../pages/AccountPage'));
const ProfilePage = lazy(() => import('../pages/ProfilePage'));

/**
 * Indicador de carga sobrio para transiciones entre rutas.
 * Renderizado durante la descarga del chunk de cada vista lazy.
 */
function RouteFallbackLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f0f11]">
      <div
        role="status"
        aria-label="Cargando vista..."
        className="w-7 h-7 border-2 border-neutral-800 border-t-[#6b1d28] rounded-full animate-spin"
      />
    </div>
  );
}

/**
 * Componente de resolución para la raíz:
 * Dirige a los usuarios autenticados hacia su respectivo dashboard y a los visitantes hacia la Landing.
 */
function RootIndexRoute() {
  const { isAuthenticated, user } = useAuth();
  const homePath = user?.role === 'Winery' ? '/bodega/dashboard' : '/dashboard';
  return isAuthenticated ? <Navigate to={homePath} replace /> : <Landing />;
}

/**
 * Componente de resolución para /perfil:
 * Redirige al perfil propio si hay sesión activa, o a /login si no.
 */
function ProfileRedirectRoute() {
  const { isAuthenticated, user } = useAuth();
  return isAuthenticated && user?.username ? (
    <Navigate to={`/perfil/${user.username}`} replace />
  ) : (
    <Navigate to="/login" replace />
  );
}

/**
 * Configuración Central de Rutas de AyVino (Data Router v7).
 * Integra jerarquía de Layouts compartidos con <Outlet />, contención con errorElement,
 * code-splitting lazy y guardias de autenticación desacopladas.
 */
export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <RouteErrorElement />,
    children: [
      {
        path: '/',
        element: (
          <Suspense fallback={<RouteFallbackLoader />}>
            <RootIndexRoute />
          </Suspense>
        ),
      },
      {
        path: '/login',
        element: (
          <Suspense fallback={<RouteFallbackLoader />}>
            <LoginPage />
          </Suspense>
        ),
      },
      {
        path: '/register',
        element: (
          <Suspense fallback={<RouteFallbackLoader />}>
            <RegisterPage />
          </Suspense>
        ),
      },
      {
        path: '/terms',
        element: (
          <Suspense fallback={<RouteFallbackLoader />}>
            <TermsPage />
          </Suspense>
        ),
      },

      // Rutas protegidas bajo el Layout Compartido con Outlet y estado de stock unificado
      {
        element: (
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        ),
        children: [
          {
            path: '/dashboard',
            element: (
              <Suspense fallback={<RouteFallbackLoader />}>
                <DashboardPage />
              </Suspense>
            ),
          },
          {
            path: '/cava',
            element: (
              <Suspense fallback={<RouteFallbackLoader />}>
                <CavaPage />
              </Suspense>
            ),
          },
          {
            path: '/maridaje',
            element: (
              <Suspense fallback={<RouteFallbackLoader />}>
                <PairingPage />
              </Suspense>
            ),
          },
          {
            path: '/catalogo',
            element: (
              <Suspense fallback={<RouteFallbackLoader />}>
                <CatalogPage />
              </Suspense>
            ),
          },
          {
            path: '/vinos/:id',
            element: (
              <Suspense fallback={<RouteFallbackLoader />}>
                <WineDetailPage />
              </Suspense>
            ),
          },
          {
            path: '/cuenta',
            element: (
              <Suspense fallback={<RouteFallbackLoader />}>
                <AccountPage />
              </Suspense>
            ),
          },
          {
            path: '/app',
            element: <Navigate to="/dashboard" replace />,
          },
        ],
      },

      // Rutas de Perfil
      {
        path: '/perfil/:username',
        element: (
          <Suspense fallback={<RouteFallbackLoader />}>
            <ProfilePage />
          </Suspense>
        ),
      },
      {
        path: '/perfil',
        element: (
          <Suspense fallback={<RouteFallbackLoader />}>
            <ProfileRedirectRoute />
          </Suspense>
        ),
      },

      // Ruta de Bodega / Administración
      {
        path: '/bodega/dashboard',
        element: (
          <ProtectedRoute allowedRoles={['Winery', 'Admin']}>
            <Suspense fallback={<RouteFallbackLoader />}>
              <WineryDashboardPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },

      // Fallback 404
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);

export default function AppRoutes() {
  return null;
}
