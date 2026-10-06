import { Routes, Route, Navigate } from 'react-router-dom';
import Landing from '../pages/Landing';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import TermsPage from '../pages/TermsPage';
import DashboardPage from '../pages/DashboardPage';
import CatalogPage from '../pages/CatalogPage';
import WineryDashboardPage from '../pages/WineryDashboardPage';
import { ProtectedRoute } from '../features/auth';

/**
 * Configuración Central de Rutas de la Aplicación (AyVino).
 * Integra rutas públicas (Landing, Login, Register, Terms), protegidas generales
 * (Dashboard, Catálogo) y protegidas por rol de bodega/administrador.
 */
export default function AppRoutes() {
  return (
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
  );
}
