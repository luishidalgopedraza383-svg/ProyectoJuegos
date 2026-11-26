import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import Sidebar, { SidebarToggle } from './Sidebar';
import { useSidebarVisibility } from '../hooks/useSidebarVisibility';

export default function PublicLayout() {
  const { session, profile, can, logout } = useAuth();
  const { count } = useCart();
  const { hidden, toggle } = useSidebarVisibility();
  const navigate = useNavigate();
  const home = can('reports.read') ? '/panel' : can('sales.write') ? '/ventas' : '/catalogo';

  const onLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  return (
    <div className={`public-shell ${hidden ? 'sidebar-hidden' : ''}`}>
      <Sidebar hidden={hidden} onToggle={toggle} />

      <div className="public-content">
        <header className="store-header">
          <div className="row">
            <SidebarToggle hidden={hidden} onToggle={toggle} />
            <Link to="/" className="brand">PLAY<span>VIBE</span></Link>
          </div>
          <nav className="store-nav" aria-label="Acciones de la tienda">
            <Link to="/carrito" className="btn btn-ghost btn-sm">
              Carrito{count > 0 ? ` (${count})` : ''}
            </Link>
            {session ? (
              <>
                <Link to={home} className="btn btn-ghost btn-sm">Mi panel</Link>
                <span className="badge">{profile?.role?.name}</span>
                <button className="btn btn-ghost btn-sm" onClick={onLogout}>Cerrar sesión</button>
              </>
            ) : (
              <>
                <Link className="btn btn-ghost btn-sm" to="/registro">Crear cuenta</Link>
                <Link className="btn btn-sm" to="/login">Iniciar sesión</Link>
              </>
            )}
          </nav>
        </header>

        <main className="store-main"><Outlet /></main>

        <footer className="store-footer">
          <strong>PLAYVIBE</strong> · Xbox · PC — Catálogo público de claves digitales. Para comprar necesitas una cuenta.
        </footer>
      </div>
    </div>
  );
}
