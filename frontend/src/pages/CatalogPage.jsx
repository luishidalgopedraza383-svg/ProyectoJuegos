import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAutoRefresh } from '../hooks/useAutoRefresh';

const emptyForm = { title: '', sku: '', price: '', description: '' };

export default function CatalogPage() {
  const [games, setGames] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    const response = await api('/games?limit=100');
    setGames(response.items);
  }, []);

  useEffect(() => { reload(); }, [reload]);
  useAutoRefresh(reload, { intervalMs: 30000 });

  const onChange = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  const onCreate = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    try {
      await api('/games', {
        method: 'POST',
        body: JSON.stringify({
          title: form.title,
          sku: form.sku,
          price: Number(form.price),
          description: form.description || undefined,
        }),
      });
      setForm(emptyForm);
      setMessage('Videojuego creado correctamente.');
      await reload();
    } catch (err) {
      setError(err.message);
    }
  };

  const money = (value) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);

  return (
    <>
      <div className="topbar">
        <div><h1>Catálogo</h1><p className="muted">Videojuegos disponibles en la tienda</p></div>
        <button className="btn btn-ghost btn-sm" onClick={reload}>Recargar</button>
      </div>

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <section className="panel">
        <h2>Nuevo videojuego</h2>
        <form className="form-grid" onSubmit={onCreate}>
          <div><label>Título</label><input name="title" value={form.title} onChange={onChange} required /></div>
          <div><label>SKU</label><input name="sku" value={form.sku} onChange={onChange} required /></div>
          <div><label>Precio</label><input name="price" type="number" min="0" step="0.01" value={form.price} onChange={onChange} required /></div>
          <div><label>Descripción</label><input name="description" value={form.description} onChange={onChange} /></div>
          <button className="btn" type="submit">Agregar</button>
        </form>
      </section>

      <section className="panel">
        <table>
          <thead><tr><th>Título</th><th>SKU</th><th>Género</th><th>Plataforma</th><th>Precio</th><th>Stock</th><th>Estado</th></tr></thead>
          <tbody>
            {games.map((game) => (
              <tr key={game.id}>
                <td>{game.title}</td>
                <td className="num">{game.sku}</td>
                <td>{game.genre?.name || '—'}</td>
                <td>{game.platform?.name || '—'}</td>
                <td className="money">{money(game.price)}</td>
                <td className="num">{game.inventory?.quantity ?? '—'}</td>
                <td><span className={`badge ${game.isActive ? 'ok' : 'warn'}`}>{game.isActive ? 'Activo' : 'Inactivo'}</span></td>
              </tr>
            ))}
            {!games.length && <tr><td colSpan="7" className="muted">No hay juegos registrados.</td></tr>}
          </tbody>
        </table>
      </section>
    </>
  );
}
