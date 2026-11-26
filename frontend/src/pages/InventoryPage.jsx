import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import { useAuth } from '../context/AuthContext';

const movementLabels = {
  entry: 'Entrada (+)',
  exit: 'Salida (−)',
  sale: 'Venta (−)',
  return: 'Devolución (+)',
  adjustment: 'Ajuste',
};

export default function InventoryPage() {
  const { can } = useAuth();
  const canWrite = can('inventory.write');

  const [items, setItems] = useState([]);
  const [movements, setMovements] = useState([]);
  const [form, setForm] = useState({ itemId: '', movementType: 'entry', quantity: 1, reason: '' });
  const [minDrafts, setMinDrafts] = useState({});
  const [stockDrafts, setStockDrafts] = useState({});
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

  useEffect(() => { reload().catch(() => {}); }, [reload]);
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

  // Atajo para aumentar o quitar unidades sin escribir el formulario de movimientos.
  const adjustStock = async (item, movementType) => {
    const quantity = Number(stockDrafts[item.id] ?? '1');
    if (!Number.isInteger(quantity) || quantity <= 0) {
      setError('La cantidad debe ser un número entero mayor a cero.');
      return;
    }
    if (movementType === 'exit' && quantity > item.quantity) {
      setError(`No puedes quitar ${quantity} unidades: solo hay ${item.quantity} disponibles.`);
      return;
    }

    setError('');
    setMessage('');
    try {
      await api(`/inventory/${item.id}/movements`, {
        method: 'POST',
        body: JSON.stringify({
          movementType,
          quantity,
          reason: `${movementType === 'entry' ? 'Aumento' : 'Descuento'} de stock · ${item.game?.title || item.id}`,
        }),
      });
      setStockDrafts({ ...stockDrafts, [item.id]: '1' });
      setMessage(
        `${movementType === 'entry' ? 'Aumentadas' : 'Quitadas'} ${quantity} `
        + `unidades de ${item.game?.title}.`,
      );
      await reload();
    } catch (err) { setError(err.message); }
  };

  const saveMin = async (item) => {
    const value = Number(minDrafts[item.id] ?? item.minQuantity);
    if (!Number.isInteger(value) || value < 0) {
      setError('El stock mínimo debe ser un número entero mayor o igual a cero.');
      return;
    }
    setError('');
    setMessage('');
    try {
      await api(`/inventory/${item.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ minQuantity: value }),
      });
      setMessage(`Stock mínimo de ${item.game?.title} actualizado a ${value}.`);
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

      {canWrite && (
        <section className="panel">
          <h2>Registrar movimiento</h2>
          <form className="form-grid" onSubmit={submit}>
            <div>
              <label>Videojuego</label>
              <select value={form.itemId} onChange={(e) => setForm({ ...form, itemId: e.target.value })} required>
                <option value="">Seleccione...</option>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.game?.title}{item.game?.isActive === false ? ' (inactivo)' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Tipo</label>
              <select value={form.movementType} onChange={(e) => setForm({ ...form, movementType: e.target.value })}>
                <option value="entry">Entrada (sumar stock)</option>
                <option value="exit">Salida (quitar stock)</option>
                <option value="adjustment">Ajuste (personalizado)</option>
              </select>
            </div>
            <div><label>Cantidad</label><input type="number" min="1" step="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required /></div>
            <div><label>Motivo</label><input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} required /></div>
            <button className="btn" type="submit">Guardar</button>
          </form>
        </section>
      )}

      <section className="panel">
        <h2>Existencias</h2>
        <table>
          <thead>
            <tr>
              <th>Juego</th><th>Tipo</th><th>Disponible</th><th>Mínimo</th><th>Estado</th>
              {canWrite && <th>Stock mínimo</th>}
              {canWrite && <th>Ajustar stock</th>}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const low = item.quantity <= item.minQuantity;
              return (
                <tr key={item.id}>
                  <td>
                    {item.game?.title}
                    {item.game?.isActive === false && <span className="badge warn">Inactivo</span>}
                  </td>
                  <td>{item.itemType === 'digital_key' ? 'Clave digital' : 'Copia física'}</td>
                  <td className="num">{item.quantity}</td>
                  <td className="num">{item.minQuantity}</td>
                  <td><span className={`badge ${low ? 'warn' : 'ok'}`}>{low ? 'Stock bajo' : 'OK'}</span></td>
                  {canWrite && (
                    <td>
                      <div className="row">
                        <input
                          type="number"
                          min="0"
                          style={{ width: '90px' }}
                          value={minDrafts[item.id] ?? item.minQuantity}
                          onChange={(e) => setMinDrafts({ ...minDrafts, [item.id]: e.target.value })}
                        />
                        <button className="btn btn-ghost btn-sm" onClick={() => saveMin(item)}>Guardar</button>
                      </div>
                    </td>
                  )}
                  {canWrite && (
                    <td>
                      <div className="row">
                        <input
                          type="number"
                          min="1"
                          step="1"
                          aria-label={`Cantidad a ajustar de ${item.game?.title}`}
                          style={{ width: '80px' }}
                          value={stockDrafts[item.id] ?? '1'}
                          onChange={(e) => setStockDrafts({ ...stockDrafts, [item.id]: e.target.value })}
                        />
                        <button className="btn btn-ghost btn-sm" onClick={() => adjustStock(item, 'entry')}>
                          + Aumentar
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => adjustStock(item, 'exit')}
                          disabled={item.quantity <= 0}
                        >
                          − Quitar
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
            {!items.length && <tr><td colSpan={canWrite ? 7 : 5} className="muted">No hay ítems de inventario.</td></tr>}
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
                <td>{movementLabels[movement.movementType] || movement.movementType}</td>
                <td className="num">{movement.quantity > 0 ? `+${movement.quantity}` : movement.quantity}</td>
                <td>{movement.reason}</td>
              </tr>
            ))}
            {!movements.length && <tr><td colSpan="5" className="muted">No hay movimientos registrados.</td></tr>}
          </tbody>
        </table>
      </section>
    </>
  );
}
