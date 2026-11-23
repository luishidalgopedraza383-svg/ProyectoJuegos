import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAutoRefresh } from '../hooks/useAutoRefresh';

export default function InventoryPage() {
  const [items, setItems] = useState([]);
  const [movements, setMovements] = useState([]);
  const [form, setForm] = useState({ itemId: '', movementType: 'entry', quantity: 1, reason: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    const [itemsData, movementsData] = await Promise.all([
      api('/inventory'),
      api('/inventory/movements'),
    ]);
    setItems(itemsData.items);
    setMovements(movementsData.items);
  }, []);

  useEffect(() => { reload(); }, [reload]);
  useAutoRefresh(reload, { intervalMs: 15000 });

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    try {
      await api(`/inventory/${form.itemId}/movements`, {
        method: 'POST',
        body: JSON.stringify({
          movementType: form.movementType,
          quantity: Number(form.quantity),
          reason: form.reason,
        }),
      });
      setMessage('Movimiento registrado.');
      setForm({ ...form, quantity: 1, reason: '' });
      await reload();
    } catch (err) { setError(err.message); }
  };

  return (
    <>
      <div className="topbar">
        <div><h1>Inventario</h1><p className="muted">Existencias y movimientos de videojuegos</p></div>
        <button className="btn btn-ghost btn-sm" onClick={reload}>Recargar</button>
      </div>

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <section className="panel">
        <h2>Registrar movimiento</h2>
        <form className="form-grid" onSubmit={submit}>
          <div>
            <label>Videojuego</label>
            <select value={form.itemId} onChange={(e) => setForm({ ...form, itemId: e.target.value })} required>
              <option value="">Seleccione...</option>
              {items.map((item) => <option key={item.id} value={item.id}>{item.game?.title}</option>)}
            </select>
          </div>
          <div>
            <label>Tipo</label>
            <select value={form.movementType} onChange={(e) => setForm({ ...form, movementType: e.target.value })}>
              <option value="entry">Entrada</option>
              <option value="exit">Salida</option>
              <option value="adjustment">Ajuste</option>
            </select>
          </div>
          <div><label>Cantidad</label><input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required /></div>
          <div><label>Motivo</label><input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} required /></div>
          <button className="btn" type="submit">Guardar</button>
        </form>
      </section>

      <section className="panel">
        <h2>Existencias</h2>
        <table>
          <thead><tr><th>Juego</th><th>Tipo</th><th>Disponible</th><th>Mínimo</th><th>Estado</th></tr></thead>
          <tbody>
            {items.map((item) => {
              const low = item.quantity <= item.minQuantity;
              return (
                <tr key={item.id}>
                  <td>{item.game?.title}</td>
                  <td>{item.itemType === 'digital_key' ? 'Llave digital' : 'Copia física'}</td>
                  <td className="num">{item.quantity}</td>
                  <td className="num">{item.minQuantity}</td>
                  <td><span className={`badge ${low ? 'warn' : 'ok'}`}>{low ? 'Stock bajo' : 'OK'}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section className="panel">
        <h2>Últimos movimientos</h2>
        <table>
          <thead><tr><th>Fecha</th><th>Juego</th><th>Tipo</th><th>Cantidad</th><th>Motivo</th></tr></thead>
          <tbody>
            {movements.slice(0, 50).map((movement) => (
              <tr key={movement.id}>
                <td className="num">{new Date(movement.createdAt).toLocaleString('es-CO')}</td>
                <td>{movement.item?.game?.title}</td>
                <td>{movement.movementType}</td>
                <td className="num">{movement.quantity > 0 ? `+${movement.quantity}` : movement.quantity}</td>
                <td>{movement.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
