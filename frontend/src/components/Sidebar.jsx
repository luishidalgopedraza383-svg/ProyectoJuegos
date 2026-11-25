import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SESSION_LINKS = [
  { to: '/', label: 'Tienda pública', end: true },
  { to: '/panel', label: 'Panel', end: true, permissions: ['reports.read'] },
  { to: '/catalogo', label: 'Catálogo', permissions: ['catalog.read'] },
  { to: '/carrito', label: 'Carrito' },
  { to: '/ventas', label: 'Punto de venta', permissions: ['sales.write'] },
  { to: '/historial', label: 'Historial de ventas', permissions: ['sales.read'] },
  { to: '/inventario', label: 'Inventario', permissions: ['inventory.read'] },
  { to: '/clientes', label: 'Clientes', permissions: ['customers.read'] },
  { to: '/reportes', label: 'Reportes', permissions: ['reports.read'] },
  { to: '/admin/juegos', label: 'Admin · Juegos', permissions: ['catalog.write', 'inventory.write'] },
  { to: '/admin/stock', label: 'Admin · Stock', permissions: ['catalog.write', 'inventory.write'] },
];

const PUBLIC_LINKS = [
  { to: '/', label: 'Tienda', end: true },
  { to: '/catalogo', label: 'Catálogo' },
  { to: '/carrito', label: 'Carrito' },
];

/** Botón para ocultar/mostrar el menú lateral. Se usa dentro y fuera del aside. */
export function SidebarToggle({ hidden, onToggle, compact = false }) {
  return (
    <button
      type="button"
      className={`sidebar-toggle ${compact ? 'sidebar-toggle--compact' : ''}`}
      onClick={onToggle}
      aria-expanded={!hidden}
      aria-controls="main-sidebar"
      title={hidden ? 'Mostrar menú de secciones' : 'Ocultar menú de secciones'}
    >
      <span aria-hidden="true">{hidden ? '☰' : '✕'}</span>
      {!compact && <span>{hidden ? 'Mostrar menú' : 'Ocultar menú'}</span>}
    </button>
  );
}

/** Barra lateral compartida por la vitrina pública y el área privada. */
export default function Sidebar({ hidden, onToggle }) {
  const { session, profile, can, logout } = useAuth();
  const navigate = useNavigate();
  // El comprador empieza en el catálogo; el resto en su pantalla principal.
  const home = can('reports.read')
    ? '/panel'
    : profile?.role?.name === 'comprador'
      ? '/catalogo'
      : can('sales.write') ? '/ventas' : '/catalogo';

  const links = session ? SESSION_LINKS : PUBLIC_LINKS;
  const visibleLinks = links.filter(
    (link) => !link.permissions || link.permissions.every((code) => can(code)),
  );

  const onLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  return (
    <aside id="main-sidebar" className={`sidebar ${hidden ? 'is-hidden' : ''}`} aria-hidden={hidden}>
      <div className="sidebar-brand">
        <Link to={session ? home : '/'} className="brand">PLAY<span>VIBE</span></Link>
        <SidebarToggle hidden={hidden} onToggle={onToggle} compact />
      </div>

      <nav className="nav" aria-label="Secciones">
        {visibleLinks.map((link) => (
          <NavLink key={link.to} to={link.to} end={link.end}>{link.label}</NavLink>
        ))}
      </nav>

      <div className="spacer" />

      <div className="sidebar-user">
        {session ? (
          <>
            <p className="muted" style={{ fontSize: '0.8rem', marginBottom: '0.25rem' }}>
              {profile?.displayName || 'Usuario'}
            </p>
            {profile?.role?.name && (
              <span className="badge" style={{ marginBottom: '0.5rem' }}>{profile.role.name}</span>
            )}
            <button className="btn btn-ghost btn-sm" onClick={onLogout}>Cerrar sesión</button>
          </>
        ) : (
          <>
            <p className="muted" style={{ fontSize: '0.8rem', marginBottom: '0.5rem' }}>
              Explora el catálogo. Para comprar necesitas una cuenta.
            </p>
            <Link className="btn btn-sm" to="/login">Iniciar sesión</Link>
          </>
        )}
      </div>
    </aside>
  );
}
