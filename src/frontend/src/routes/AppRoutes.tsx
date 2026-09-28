import { Routes, Route, Navigate } from 'react-router-dom';
import Landing from '../pages/Landing';
import CatalogPage from '../pages/CatalogPage';
import WineryDashboardPage from '../pages/WineryDashboardPage';
import { ProtectedRoute } from '../features/auth';

/**
 * Configuración Central de Rutas de la Aplicación (AyVino).
 * Integra rutas públicas, protegidas generales y protegidas por rol.
 */
export default function AppRoutes() {
  return (
    <Routes>
      {/* Ruta Pública */}
      <Route path="/" element={<Landing />} />

      {/* Ruta Protegida General (cualquier rol autenticado) */}
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

