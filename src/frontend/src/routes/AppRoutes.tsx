import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
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
 * Configuración Central de Rutas de la Aplicación (AyVino).
 * Integra rutas públicas (Landing, Login, Register, Terms), protegidas generales
 * (Dashboard, Catálogo) y protegidas por rol de bodega/administrador.
 * Cada vista se carga de forma diferida con React.lazy para optimizar el bundle inicial.
 */
export default function AppRoutes() {
  const { isAuthenticated, user } = useAuth();
  const homePath = user?.role === 'Winery' ? '/bodega/dashboard' : '/dashboard';

  return (
    <Suspense fallback={<RouteFallbackLoader />}>
      <Routes>
        {/* Ruta Raíz: Landing para visitantes, Homepage/Dashboard para usuarios autenticados */}
        <Route
          path="/"
          element={isAuthenticated ? <Navigate to={homePath} replace /> : <Landing />}
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/terms" element={<TermsPage />} />

        {/* Ruta Protegida: Dashboard Principal Post-Login */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Ruta Protegida: Mi Cava Personal */}
        <Route
          path="/cava"
          element={
            <ProtectedRoute>
              <CavaPage />
            </ProtectedRoute>
          }
        />

        {/* Ruta Protegida: Recomendaciones y Maridajes */}
        <Route
          path="/maridaje"
          element={
            <ProtectedRoute>
              <PairingPage />
            </ProtectedRoute>
          }
        />

        {/* Alias /app hacia /dashboard */}
        <Route path="/app" element={<Navigate to="/dashboard" replace />} />

        {/* Ruta Protegida General: Catálogo */}
        <Route
          path="/catalogo"
          element={
            <ProtectedRoute>
              <CatalogPage />
            </ProtectedRoute>
          }
        />

        {/* Ruta Protegida: Gestión de Cuenta y Perfil */}
        <Route
          path="/cuenta"
          element={
            <ProtectedRoute>
              <AccountPage />
            </ProtectedRoute>
          }
        />

        {/* Ruta Pública: Perfil de Usuario por Username */}
        <Route path="/perfil/:username" element={<ProfilePage />} />

        {/* Redirección /perfil: hacia perfil propio si está logueado, o /login si no */}
        <Route
          path="/perfil"
          element={
            isAuthenticated && user?.username ? (
              <Navigate to={`/perfil/${user.username}`} replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Ruta Protegida Exclusiva para Bodegas y Administradores */}
        <Route
          path="/bodega/dashboard"
          element={
            <ProtectedRoute allowedRoles={['Winery', 'Admin']}>
              <WineryDashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Fallback 404: Redirigir a inicio */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
