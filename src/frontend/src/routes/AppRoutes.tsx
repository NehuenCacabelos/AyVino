import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '../features/auth';

// Carga diferida de vistas: cada página genera un chunk independiente en Vite
const Landing = lazy(() => import('../pages/Landing'));
const LoginPage = lazy(() => import('../pages/LoginPage'));
const RegisterPage = lazy(() => import('../pages/RegisterPage'));
const TermsPage = lazy(() => import('../pages/TermsPage'));
const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const CatalogPage = lazy(() => import('../pages/CatalogPage'));
const WineryDashboardPage = lazy(() => import('../pages/WineryDashboardPage'));

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
  return (
    <Suspense fallback={<RouteFallbackLoader />}>
      <Routes>
        {/* Rutas Públicas */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/terms" element={<TermsPage />} />

        {/* Ruta Protegida: Dashboard / Cava Personal Post-Login */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
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
