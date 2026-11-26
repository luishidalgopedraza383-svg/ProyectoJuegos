import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import { money } from '../utils/money';

export default function ReportsPage() {
  const [summary, setSummary] = useState(null);
  const [top, setTop] = useState([]);
  const [byDay, setByDay] = useState([]);

  const reload = useCallback(async () => {
    const [summaryData, topData, dayData] = await Promise.all([
      api('/reports/summary'),
      api('/reports/top-games'),
      api('/reports/sales-by-day'),
    ]);
    setSummary(summaryData);
    setTop(topData.items);
    setByDay(dayData.items);
  }, []);

  useEffect(() => { reload(); }, [reload]);
  useAutoRefresh(reload, { intervalMs: 30000 });

  return (
    <>
      <div className="topbar">
        <div><h1>Reportes</h1><p className="muted">Indicadores de ventas e inventario</p></div>
        <button className="btn btn-ghost btn-sm" onClick={reload}>Recargar</button>
      </div>

      <div className="cards">
        <div className="card"><div className="label">Ingresos</div><div className="value">{money(summary?.revenue)}</div></div>
        <div className="card"><div className="label">Ventas</div><div className="value">{summary?.completedSales ?? '—'}</div></div>
        <div className="card"><div className="label">Stock bajo</div><div className="value">{summary?.lowStockItems ?? '—'}</div></div>
      </div>

      {top[0] && (
        <section className="panel top-game">
          <div>
            <span className="eyebrow">Juego más comprado</span>
            <h2>{top[0].game?.title || '—'}</h2>
            <p className="muted">
              {top[0].unitsSold} unidades vendidas · {money(top[0].revenue)} en ingresos
            </p>
          </div>
          <span className="top-game__rank">#1</span>
        </section>
      )}

      <section className="panel">
        <h2>Ventas por día</h2>
        <table>
          <thead><tr><th>Fecha</th><th>Ventas</th><th>Ingresos</th></tr></thead>
          <tbody>
            {byDay.map((row) => (
              <tr key={row.day}>
                <td className="num">{row.day}</td>
                <td className="num">{row.sales}</td>
                <td className="money">{money(row.revenue)}</td>
              </tr>
            ))}
            {!byDay.length && <tr><td colSpan="3" className="muted">Sin datos en el período.</td></tr>}
          </tbody>
        </table>
      </section>

      <section className="panel">
        <h2>Top videojuegos</h2>
        <table>
          <thead><tr><th>Juego</th><th>Unidades</th><th>Ingresos</th></tr></thead>
          <tbody>
            {top.map((row) => (
              <tr key={row.videoGameId}>
                <td>{row.game?.title}</td>
                <td className="num">{row.unitsSold}</td>
                <td className="money">{money(row.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
