import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Protege una ruta por sesión y, opcionalmente, por permisos.
 * Sin children funciona como ruta anidada (renderiza <Outlet />).
 */
export default function ProtectedRoute({ children, permissions = [] }) {
  const { session, loading, can } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="login-wrap"><p className="muted">Cargando sesión...</p></div>;
  }

  if (!session) {
    // Guardamos la URL solicitada para volver a ella después del login.
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const allowed = permissions.every((code) => can(code));
  if (!allowed) {
    // Si la cuenta no tiene el permiso, la llevamos a su pantalla inicial real.
    const home = can('reports.read') ? '/panel' : can('sales.write') ? '/ventas' : '/catalogo';
    return <Navigate to={home} replace />;
  }

  return children ?? <Outlet />;
}
