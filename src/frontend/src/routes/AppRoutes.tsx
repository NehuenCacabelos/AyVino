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
const AccountPage = lazy(() => import('../pages/AccountPage'));
const ProfilePage = lazy(() => import('../pages/ProfilePage'));

// Layouts y vistas del área de Bodega
const WineryPublicLayout = lazy(() => import('../features/winery/components/WineryPublicLayout'));
const ForWineriesPage = lazy(() => import('../pages/ForWineriesPage'));
const WineryRegisterPage = lazy(() => import('../pages/WineryRegisterPage'));
const WineryPublicProfileLayout = lazy(() => import('../pages/WineryPublicProfileLayout'));
const WineryPublicOverviewPage = lazy(() => import('../pages/WineryPublicOverviewPage'));
const WineryPublicCatalogPage = lazy(() => import('../pages/WineryPublicCatalogPage'));

const WineryLayout = lazy(() => import('../features/winery/components/WineryLayout'));
const WineryDashboardPage = lazy(() => import('../pages/WineryDashboardPage'));
const WineryOverviewPage = lazy(() => import('../pages/WineryOverviewPage'));
const WineryConfigPage = lazy(() => import('../pages/WineryConfigPage'));
const WineryCatalogPage = lazy(() => import('../pages/WineryCatalogPage'));
const WineryWineDetailPage = lazy(() => import('../pages/WineryWineDetailPage'));
const WineryClaimPage = lazy(() => import('../pages/WineryClaimPage'));

// Layout y vistas del Panel de Administración
const AdminLayout = lazy(() => import('../features/admin/components/AdminLayout'));
const AdminDashboardPage = lazy(() => import('../pages/AdminDashboardPage'));
const AdminWineriesPage = lazy(() => import('../pages/AdminWineriesPage'));
const AdminCitiesPage = lazy(() => import('../pages/AdminCitiesPage'));
const AdminVintagesPage = lazy(() => import('../pages/AdminVintagesPage'));
const AdminUsersPage = lazy(() => import('../pages/AdminUsersPage'));
const AdminGrapesPage = lazy(() => import('../pages/AdminGrapesPage'));
const AdminPairingsPage = lazy(() => import('../pages/AdminPairingsPage'));

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
  const homePath =
    user?.role === 'Admin'
      ? '/admin'
      : user?.role === 'Winery'
        ? '/bodega/dashboard'
        : '/dashboard';
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

      // Registro institucional de Bodega (pantalla inmersiva split-card sin navbar global)
      {
        path: '/bodega/registro',
        element: (
          <Suspense fallback={<RouteFallbackLoader />}>
            <WineryRegisterPage />
          </Suspense>
        ),
      },

      // Vistas Públicas Institucionales de Bodega bajo Layout compartido (WineryPublicLayout)
      {
        element: (
          <Suspense fallback={<RouteFallbackLoader />}>
            <WineryPublicLayout />
          </Suspense>
        ),
        children: [
          {
            path: '/para-bodegas',
            element: (
              <Suspense fallback={<RouteFallbackLoader />}>
                <ForWineriesPage />
              </Suspense>
            ),
          },
          ],
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

      // Rutas de Perfil Público de Bodega (inmersivo con layout propio)
      {
        path: '/bodegas/:id',
        element: (
          <Suspense fallback={<RouteFallbackLoader />}>
            <WineryPublicProfileLayout />
          </Suspense>
        ),
        children: [
          {
            index: true,
            element: (
              <Suspense fallback={<RouteFallbackLoader />}>
                <WineryPublicOverviewPage />
              </Suspense>
            ),
          },
          {
            path: 'catalogo',
            element: (
              <Suspense fallback={<RouteFallbackLoader />}>
                <WineryPublicCatalogPage />
              </Suspense>
            ),
          },
        ],
      },

      // Rutas Protegidas Exclusivas para Bodegas y Administradores
      {
        path: '/bodega',
        element: (
          <ProtectedRoute allowedRoles={['Winery', 'Admin']}>
            <WineryLayout />
          </ProtectedRoute>
        ),
        children: [
          {
            index: true,
            element: <Navigate to="/bodega/dashboard" replace />,
          },
          {
            path: 'dashboard',
            element: (
              <Suspense fallback={<RouteFallbackLoader />}>
                <WineryDashboardPage />
              </Suspense>
            ),
          },
          {
            path: 'perfil',
            element: (
              <Suspense fallback={<RouteFallbackLoader />}>
                <WineryOverviewPage />
              </Suspense>
            ),
          },
          {
            path: 'perfil/editar',
            element: <Navigate to="/bodega/configuracion" replace />,
          },
          {
            path: 'configuracion',
            element: (
              <Suspense fallback={<RouteFallbackLoader />}>
                <WineryConfigPage />
              </Suspense>
            ),
          },
          {
            path: 'vinos',
            element: (
              <Suspense fallback={<RouteFallbackLoader />}>
                <WineryCatalogPage />
              </Suspense>
            ),
          },
          {
            path: 'vinos/:wineId',
            element: (
              <Suspense fallback={<RouteFallbackLoader />}>
                <WineryWineDetailPage />
              </Suspense>
            ),
          },
          {
            path: 'reclamar',
            element: (
              <Suspense fallback={<RouteFallbackLoader />}>
                <WineryClaimPage />
              </Suspense>
            ),
          },
        ],
      },

      // Rutas Protegidas Exclusivas para Administradores
      {
        path: '/admin',
        element: (
          <ProtectedRoute allowedRoles={['Admin']}>
            <Suspense fallback={<RouteFallbackLoader />}>
              <AdminLayout />
            </Suspense>
          </ProtectedRoute>
        ),
        children: [
          {
            index: true,
            element: (
              <Suspense fallback={<RouteFallbackLoader />}>
                <AdminDashboardPage />
              </Suspense>
            ),
          },
          {
            path: 'bodegas',
            element: (
              <Suspense fallback={<RouteFallbackLoader />}>
                <AdminWineriesPage />
              </Suspense>
            ),
          },
          {
            path: 'ciudades',
            element: (
              <Suspense fallback={<RouteFallbackLoader />}>
                <AdminCitiesPage />
              </Suspense>
            ),
          },
          {
            path: 'cosechas',
            element: (
              <Suspense fallback={<RouteFallbackLoader />}>
                <AdminVintagesPage />
              </Suspense>
            ),
          },
          {
            path: 'usuarios',
            element: (
              <Suspense fallback={<RouteFallbackLoader />}>
                <AdminUsersPage />
              </Suspense>
            ),
          },
          {
            path: 'uvas',
            element: (
              <Suspense fallback={<RouteFallbackLoader />}>
                <AdminGrapesPage />
              </Suspense>
            ),
          },
          {
            path: 'maridajes',
            element: (
              <Suspense fallback={<RouteFallbackLoader />}>
                <AdminPairingsPage />
              </Suspense>
            ),
          },
        ],
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
