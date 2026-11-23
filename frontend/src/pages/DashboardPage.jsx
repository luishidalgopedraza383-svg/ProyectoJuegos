import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import StatCard from '../components/StatCard';

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [top, setTop] = useState([]);

  const reload = useCallback(async () => {
    const [summaryData, topData] = await Promise.all([
      api('/reports/summary'),
      api('/reports/top-games'),
    ]);
    setSummary(summaryData);
    setTop(topData.items);
  }, []);

  useEffect(() => { reload(); }, [reload]);
  useAutoRefresh(reload, { intervalMs: 30000 });

  const money = (value) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value || 0);

  return (
    <>
      <div className="topbar">
        <div><h1>Panel general</h1><p className="muted">Resumen operativo de Proyecto Juegos</p></div>
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
