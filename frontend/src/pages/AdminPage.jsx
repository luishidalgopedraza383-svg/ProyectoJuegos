import { NavLink } from 'react-router-dom';
import AdminCatalogPage from './AdminCatalogPage';
import InventoryPage from './InventoryPage';
import { useAuth } from '../context/AuthContext';

const tabs = [
  { to: '/admin/juegos', label: 'Juegos y precios' },
  { to: '/admin/stock', label: 'Stock y movimientos' },
];

export default function AdminPage({ section }) {
  const { profile } = useAuth();

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Administración</h1>
          <p className="muted">
            {profile?.displayName || 'Administrador'} · edición de catálogo e inventario
          </p>
        </div>
        <span className="badge">{profile?.role?.name || 'admin'}</span>
      </div>

      <nav className="panel row" aria-label="Secciones de administración">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) => `btn ${isActive ? '' : 'btn-ghost'} btn-sm`}
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>

      {section === 'stock' ? <InventoryPage /> : <AdminCatalogPage />}
    </>
  );
}
