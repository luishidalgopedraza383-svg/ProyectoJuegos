import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAutoRefresh } from '../hooks/useAutoRefresh';

export default function SalesPage() {
  const [sales, setSales] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    const response = await api('/sales?limit=100');
    setSales(response.items);
  }, []);

  useEffect(() => { reload(); }, [reload]);
  useAutoRefresh(reload, { intervalMs: 15000 });

  const cancel = async (sale) => {
    const reason = window.prompt(`Motivo de anulación de la venta ${sale.code}:`);
    if (!reason) return;
    setError('');
    try {
      await api(`/sales/${sale.id}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) });
      setMessage(`Venta ${sale.code} anulada.`);
      await reload();
    } catch (err) { setError(err.message); }
  };

  const money = (value) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);

  return (
    <>
      <div className="topbar">
        <div><h1>Ventas</h1><p className="muted">Historial de transacciones</p></div>
        <button className="btn btn-ghost btn-sm" onClick={reload}>Recargar</button>
      </div>

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <section className="panel">
        <table>
          <thead><tr><th>Código</th><th>Fecha</th><th>Cliente</th><th>Vendedor</th><th>Total</th><th>Estado</th><th></th></tr></thead>
          <tbody>
            {sales.map((sale) => (
              <tr key={sale.id}>
                <td className="num">{sale.code}</td>
                <td className="num">{new Date(sale.createdAt).toLocaleString('es-CO')}</td>
                <td>{sale.customer?.email || 'Mostrador'}</td>
                <td>{sale.seller?.displayName}</td>
                <td className="money">{money(sale.total)}</td>
                <td><span className={`badge ${sale.status === 'completed' ? 'ok' : 'warn'}`}>{sale.status}</span></td>
                <td>
                  {sale.status === 'completed' && <button className="btn btn-danger btn-sm" onClick={() => cancel(sale)}>Anular</button>}
                </td>
              </tr>
            ))}
            {!sales.length && <tr><td colSpan="7" className="muted">No hay ventas registradas.</td></tr>}
          </tbody>
        </table>
      </section>
    </>
  );
}
