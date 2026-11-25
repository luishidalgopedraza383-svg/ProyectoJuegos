import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/StatCard';
import { money } from '../utils/money';

export default function DashboardPage() {
  const { can, profile } = useAuth();
  const canSeeReports = can('reports.read');
  const [summary, setSummary] = useState(null);
  const [top, setTop] = useState([]);

  const reload = useCallback(async () => {
    if (!canSeeReports) return;
    const [summaryData, topData] = await Promise.all([
      api('/reports/summary'),
      api('/reports/top-games'),
    ]);
    setSummary(summaryData);
    setTop(topData.items);
  }, [canSeeReports]);

  useEffect(() => { reload(); }, [reload]);
  useAutoRefresh(reload, { intervalMs: 30000 });

  if (!canSeeReports) {
    return (
      <>
        <div className="topbar">
          <div>
            <h1>Bienvenido, {profile?.displayName || 'usuario'}</h1>
            <p className="muted">Tienda de claves digitales Xbox y PC</p>
          </div>
        </div>
        <section className="panel">
          <h2>Accesos rápidos</h2>
          <div className="row">
            {can('sales.write') && <Link className="btn" to="/ventas">Ir al punto de venta</Link>}
            {can('catalog.read') && <Link className="btn btn-ghost" to="/catalogo">Ver catálogo</Link>}
            {can('inventory.read') && <Link className="btn btn-ghost" to="/inventario">Ver inventario</Link>}
            {can('catalog.write') && <Link className="btn btn-ghost" to="/admin/juegos">Administrar juegos</Link>}
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <div className="topbar">
        <div><h1>Panel general</h1><p className="muted">Resumen operativo de PlayVibe</p></div>
        <button className="btn btn-ghost btn-sm" onClick={reload}>Recargar</button>
      </div>

      <div className="cards">
        <StatCard label="Ventas completadas" value={summary?.completedSales ?? '—'} />
        <StatCard label="Ingresos" value={money(summary?.revenue)} />
        <StatCard label="Juegos activos" value={summary?.activeGames ?? '—'} />
        <StatCard label="Clientes" value={summary?.activeCustomers ?? '—'} />
        <StatCard label="Stock bajo" value={summary?.lowStockItems ?? '—'} />
      </div>

      <section className="panel">
        <h2>Títulos más vendidos</h2>
        <table>
          <thead><tr><th>Juego</th><th>SKU</th><th>Unidades</th><th>Ingresos</th></tr></thead>
          <tbody>
            {top.map((row) => (
              <tr key={row.videoGameId}>
                <td>{row.game?.title}</td>
                <td className="num">{row.game?.sku}</td>
                <td className="num">{row.unitsSold}</td>
                <td className="money">{money(row.revenue)}</td>
              </tr>
            ))}
            {!top.length && <tr><td colSpan="4" className="muted">Aún no hay ventas registradas.</td></tr>}
          </tbody>
        </table>
      </section>
    </>
  );
}
