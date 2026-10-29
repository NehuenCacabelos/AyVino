import { RouterProvider } from 'react-router-dom';
import { router } from './routes/AppRoutes';

/**
 * Entrada Principal de la Aplicación AyVino.
 * Configura la navegación mediante el proveedor de Data Routers de React Router.
 */
export default function App() {
  return <RouterProvider router={router} />;
}
