import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import { useAuth } from '../context/AuthContext';
import { money } from '../utils/money';

export default function SalesPage() {
  // Sin sales.cancel (rol comprador) solo se consultan las compras propias:
  // el backend además limita el listado a las ventas del usuario.
  const { can } = useAuth();
  const canCancel = can('sales.cancel');
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

  const keysOf = (sale) => (sale.details || []).flatMap((detail) => detail.digitalKeys || []);

  return (
    <>
      <div className="topbar">
        <div>
          <h1>{canCancel ? 'Ventas' : 'Mis compras'}</h1>
          <p className="muted">{canCancel ? 'Historial de transacciones' : 'Historial de tus compras'}</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={reload}>Recargar</button>
      </div>

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <section className="panel">
        <table>
          <thead><tr><th>Código</th><th>Fecha</th><th>Cliente</th><th>Vendedor</th><th>Total</th><th>Claves digitales</th><th>Estado</th><th></th></tr></thead>
          <tbody>
            {sales.map((sale) => (
              <tr key={sale.id}>
                <td className="num">{sale.code}</td>
                <td className="num">{new Date(sale.createdAt).toLocaleString('es-CO')}</td>
                <td>{sale.customer?.email || 'Mostrador'}</td>
                <td>{sale.seller?.displayName}</td>
                <td className="money">{money(sale.total)}</td>
                <td>
                  {keysOf(sale).length
                    ? keysOf(sale).map((key) => <code className="digital-key" key={key}>{key}</code>)
                    : <span className="muted">—</span>}
                </td>
                <td><span className={`badge ${sale.status === 'completed' ? 'ok' : 'warn'}`}>{sale.status}</span></td>
                <td>
                  {sale.status === 'completed' && canCancel && (
                    <button className="btn btn-danger btn-sm" onClick={() => cancel(sale)}>Anular</button>
                  )}
                </td>
              </tr>
            ))}
            {!sales.length && (
              <tr><td colSpan="8" className="muted">{canCancel ? 'No hay ventas registradas.' : 'Todavía no has comprado nada.'}</td></tr>
            )}
          </tbody>
        </table>
      </section>
    </>
  );
}
