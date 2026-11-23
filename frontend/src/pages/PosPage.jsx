import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAutoRefresh } from '../hooks/useAutoRefresh';

export default function PosPage() {
  const [games, setGames] = useState([]);
  const [methods, setMethods] = useState([]);
  const [shift, setShift] = useState(null);
  const [cart, setCart] = useState([]);
  const [methodId, setMethodId] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    const [catalog, shiftData] = await Promise.all([
      api('/games?limit=100'),
      api('/sales/shifts/me'),
    ]);
    setGames(catalog.items.filter((game) => Number(game.inventory?.quantity) > 0));
    setShift(shiftData.shift);
  }, []);

  useEffect(() => {
    reload().catch(() => {});
    api('/payments/methods').then((data) => setMethods(data.items)).catch(() => {});
  }, [reload]);

  useAutoRefresh(reload, { intervalMs: 15000 });

  const openShift = async () => {
    setError('');
    try {
      await api('/sales/shifts/open', { method: 'POST', body: JSON.stringify({ openingAmount: 0 }) });
      setMessage('Turno abierto.');
      await reload();
    } catch (err) { setError(err.message); }
  };

  const closeShift = async () => {
    setError('');
    try {
      const result = await api('/sales/shifts/close', { method: 'POST', body: JSON.stringify({ countedAmount: 0 }) });
      setMessage(`Turno cerrado. Diferencia: ${result.differenceAmount}`);
      await reload();
    } catch (err) { setError(err.message); }
  };

  const addToCart = (game) => {
    setMessage('');
    setCart((current) => {
      const found = current.find((item) => item.videoGameId === game.id);
      if (found) {
        return current.map((item) => item.videoGameId === game.id
          ? { ...item, quantity: item.quantity + 1 }
          : item);
      }
      return [...current, { videoGameId: game.id, title: game.title, price: Number(game.price), quantity: 1 }];
    });
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const pay = async () => {
    setError('');
    setMessage('');
    if (!shift) { setError('Debes abrir un turno antes de vender.'); return; }
    if (!cart.length) { setError('El carrito está vacío.'); return; }
    if (!methodId) { setError('Selecciona un método de pago.'); return; }

    const snapshot = cart;
    setCart([]); // actualizacion optimista
    try {
      const sale = await api('/sales', {
        method: 'POST',
        body: JSON.stringify({
          cashShiftId: shift.id,
          items: snapshot.map((item) => ({ videoGameId: item.videoGameId, quantity: item.quantity })),
          payments: [{ paymentMethodId: methodId, amount: total }],
        }),
      });
      setMessage(`Venta ${sale.code} registrada por ${sale.total}.`);
      await reload();
    } catch (err) {
      setCart(snapshot);
      setError(err.message);
    }
  };

  const money = (value) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value || 0);

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Punto de venta</h1>
          <p className="muted">
            Turno: {shift ? <span className="badge ok">Abierto</span> : <span className="badge warn">Cerrado</span>}
          </p>
        </div>
        <div className="row">
          <button className="btn btn-ghost btn-sm" onClick={reload}>Recargar</button>
          <button className="btn btn-sm" onClick={shift ? closeShift : openShift}>{shift ? 'Cerrar turno' : 'Abrir turno'}</button>
        </div>
      </div>

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <section className="panel">
        <h2>Videojuegos disponibles</h2>
        <div className="row">
          {games.map((game) => (
            <button key={game.id} className="btn btn-ghost btn-sm" onClick={() => addToCart(game)}>
              {game.title} · {money(game.price)} · stock {game.inventory.quantity}
            </button>
          ))}
          {!games.length && <p className="muted">No hay títulos con stock disponible.</p>}
        </div>
      </section>

      <section className="panel">
        <h2>Carrito</h2>
        <table>
          <thead><tr><th>Juego</th><th>Cantidad</th><th>Precio</th><th>Subtotal</th></tr></thead>
          <tbody>
            {cart.map((item) => (
              <tr key={item.videoGameId}>
                <td>{item.title}</td>
                <td className="num">{item.quantity}</td>
                <td className="money">{money(item.price)}</td>
                <td className="money">{money(item.price * item.quantity)}</td>
              </tr>
            ))}
            {!cart.length && <tr><td colSpan="4" className="muted">Agrega juegos al carrito.</td></tr>}
          </tbody>
        </table>

        <div className="form-grid" style={{ marginTop: '1rem' }}>
          <div>
            <label>Método de pago</label>
            <select value={methodId} onChange={(event) => setMethodId(event.target.value)}>
              <option value="">Seleccione...</option>
              {methods.map((method) => <option key={method.id} value={method.id}>{method.name}</option>)}
            </select>
          </div>
          <div><label>Total</label><div className="money" style={{ fontSize: '1.4rem' }}>{money(total)}</div></div>
          <button className="btn" onClick={pay}>Cobrar</button>
        </div>
      </section>
    </>
  );
}
