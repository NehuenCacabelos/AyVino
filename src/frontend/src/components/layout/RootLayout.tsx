import { Outlet } from 'react-router-dom';
import { AuthProvider } from '../../features/auth';
import ScrollToTop from './ScrollToTop';

/**
 * RootLayout Component
 * Componente contenedor raíz para la arquitectura Data Router (createBrowserRouter).
 * Aloja los proveedores que requieren acceso a hooks del router (como AuthProvider que usa useNavigate
 * y ScrollToTop que usa useLocation), garantizando que estén siempre dentro del contexto de enrutamiento.
 */
export default function RootLayout() {
  return (
    <AuthProvider>
      <ScrollToTop />
      <Outlet />
    </AuthProvider>
  );
}

