import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/', label: 'Panel', end: true },
  { to: '/catalogo', label: 'Catálogo' },
  { to: '/ventas', label: 'Punto de venta' },
  { to: '/historial', label: 'Historial de ventas' },
  { to: '/inventario', label: 'Inventario' },
  { to: '/clientes', label: 'Clientes' },
  { to: '/reportes', label: 'Reportes' },
];

export default function Layout() {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">PROYECTO <span>JUEGOS</span></div>
        <nav className="nav">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end}>{link.label}</NavLink>
          ))}
        </nav>
        <div className="spacer" />
        <div>
          <p className="muted" style={{ fontSize: '0.8rem', marginBottom: 0 }}>{profile?.displayName || 'Usuario'}</p>
          <button className="btn btn-ghost btn-sm" onClick={onLogout}>Cerrar sesión</button>
        </div>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
