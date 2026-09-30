/**
 * Módulo de Autenticación de AyVino (Feature Module).
 * Exporta tipos, contexto/hooks y componentes públicos del módulo.
 */

export * from './types';
export * from './context/AuthContext';
export { default as AuthDrawer } from './components/AuthDrawer';
export { default as AuthModal } from './components/AuthModal';
export { default as ProtectedRoute, type ProtectedRouteProps } from './components/ProtectedRoute';
export * from './api/authApi';
