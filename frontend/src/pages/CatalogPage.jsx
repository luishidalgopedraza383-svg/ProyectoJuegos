import { Fragment, useCallback, useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import { useAuth } from '../context/AuthContext';

const emptyForm = {
  title: '', sku: '', price: '', description: '',
  platformId: '', categoryId: '', genreId: '',
};

export default function CatalogPage() {
  const { can } = useAuth();
  const canWrite = can('catalog.write');

  const [games, setGames] = useState([]);
  const [meta, setMeta] = useState({ platforms: [], categories: [], genres: [] });
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    const [catalog, taxonomy] = await Promise.all([
      api('/games?limit=100'),
      api('/games/meta'),
    ]);
    setGames(catalog.items);
    setMeta(taxonomy);
  }, []);

  useEffect(() => { reload().catch(() => {}); }, [reload]);
  useAutoRefresh(reload, { intervalMs: 30000 });

  const onChange = (event) => setForm({ ...form, [event.target.name]: event.target.value });
  const onEditChange = (event) => setEditForm({ ...editForm, [event.target.name]: event.target.value });

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
          platformId: form.platformId || undefined,
          categoryId: form.categoryId || undefined,
          genreId: form.genreId || undefined,
        }),
      });
      setForm(emptyForm);
      setMessage('Videojuego creado correctamente.');
      await reload();
    } catch (err) {
      setError(err.message);
    }
  };

  const startEdit = (game) => {
    setError('');
    setMessage('');
    setEditingId(game.id);
    setEditForm({
      title: game.title,
      sku: game.sku,
      price: String(game.price),
      description: game.description || '',
      platformId: game.platform?.id || '',
      categoryId: game.category?.id || '',
      genreId: game.genre?.id || '',
      isActive: Boolean(game.isActive),
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const onSaveEdit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    try {
      await api(`/games/${editingId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          title: editForm.title,
          sku: editForm.sku,
          price: Number(editForm.price),
          description: editForm.description || null,
          platformId: editForm.platformId || null,
          categoryId: editForm.categoryId || null,
          genreId: editForm.genreId || null,
          isActive: editForm.isActive,
        }),
      });
      setMessage('Videojuego actualizado correctamente.');
      cancelEdit();
      await reload();
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleActive = async (game) => {
    setError('');
    setMessage('');
    try {
      await api(`/games/${game.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !game.isActive }),
      });
      setMessage(`${game.title} ${game.isActive ? 'desactivado' : 'activado'}.`);
      await reload();
    } catch (err) {
      setError(err.message);
    }
  };

  const money = (value) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);

  return (
    <>
      <div className="topbar">
        <div><h1>Catálogo</h1><p className="muted">Videojuegos de PlayStation, Xbox, Nintendo y PC</p></div>
        <button className="btn btn-ghost btn-sm" onClick={reload}>Recargar</button>
      </div>

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {canWrite && (
        <section className="panel">
          <h2>Nuevo videojuego</h2>
          <form className="form-grid" onSubmit={onCreate}>
            <div><label>Título</label><input name="title" value={form.title} onChange={onChange} required /></div>
            <div><label>SKU</label><input name="sku" value={form.sku} onChange={onChange} required /></div>
            <div><label>Precio (COP)</label><input name="price" type="number" min="0" step="100" value={form.price} onChange={onChange} required /></div>
            <div>
              <label>Plataforma</label>
              <select name="platformId" value={form.platformId} onChange={onChange}>
                <option value="">Sin plataforma</option>
                {meta.platforms.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </div>
            <div>
              <label>Categoría</label>
              <select name="categoryId" value={form.categoryId} onChange={onChange}>
                <option value="">Sin categoría</option>
                {meta.categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </div>
            <div>
              <label>Género</label>
              <select name="genreId" value={form.genreId} onChange={onChange}>
                <option value="">Sin género</option>
                {meta.genres.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </div>
            <div><label>Descripción</label><input name="description" value={form.description} onChange={onChange} /></div>
            <button className="btn" type="submit">Agregar</button>
          </form>
        </section>
      )}

      <section className="panel">
        <h2>Inventario de títulos</h2>
        <table>
          <thead>
            <tr>
              <th>Título</th><th>SKU</th><th>Plataforma</th><th>Categoría</th>
              <th>Precio</th><th>Stock</th><th>Estado</th>
              {canWrite && <th>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {games.map((game) => (
              <Fragment key={game.id}>
                <tr>
                  <td>{game.title}</td>
                  <td className="num">{game.sku}</td>
                  <td>{game.platform?.name || '—'}</td>
                  <td>{game.category?.name || '—'}</td>
                  <td className="money">{money(game.price)}</td>
                  <td className="num">{game.inventory?.quantity ?? '—'}</td>
                  <td><span className={`badge ${game.isActive ? 'ok' : 'warn'}`}>{game.isActive ? 'Activo' : 'Inactivo'}</span></td>
                  {canWrite && (
                    <td>
                      <div className="row">
                        <button className="btn btn-ghost btn-sm" onClick={() => startEdit(game)}>Editar</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => toggleActive(game)}>
                          {game.isActive ? 'Desactivar' : 'Activar'}
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
                {editingId === game.id && editForm && (
                  <tr>
                    <td colSpan={canWrite ? 8 : 7}>
                      <form className="form-grid" onSubmit={onSaveEdit}>
                        <div><label>Título</label><input name="title" value={editForm.title} onChange={onEditChange} required /></div>
                        <div><label>SKU</label><input name="sku" value={editForm.sku} onChange={onEditChange} required /></div>
                        <div><label>Precio (COP)</label><input name="price" type="number" min="0" step="100" value={editForm.price} onChange={onEditChange} required /></div>
                        <div>
                          <label>Plataforma</label>
                          <select name="platformId" value={editForm.platformId} onChange={onEditChange}>
                            <option value="">Sin plataforma</option>
                            {meta.platforms.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                          </select>
                        </div>
                        <div>
                          <label>Categoría</label>
                          <select name="categoryId" value={editForm.categoryId} onChange={onEditChange}>
                            <option value="">Sin categoría</option>
                            {meta.categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                          </select>
                        </div>
                        <div>
                          <label>Género</label>
                          <select name="genreId" value={editForm.genreId} onChange={onEditChange}>
                            <option value="">Sin género</option>
                            {meta.genres.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                          </select>
                        </div>
                        <div><label>Descripción</label><input name="description" value={editForm.description} onChange={onEditChange} /></div>
                        <div>
                          <label>Estado</label>
                          <select name="isActive" value={editForm.isActive ? '1' : '0'} onChange={(e) => setEditForm({ ...editForm, isActive: e.target.value === '1' })}>
                            <option value="1">Activo</option>
                            <option value="0">Inactivo</option>
                          </select>
                        </div>
                        <div className="row">
                          <button className="btn" type="submit">Guardar</button>
                          <button className="btn btn-ghost" type="button" onClick={cancelEdit}>Cancelar</button>
                        </div>
                      </form>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
            {!games.length && (
              <tr><td colSpan={canWrite ? 8 : 7} className="muted">No hay juegos registrados.</td></tr>
            )}
          </tbody>
        </table>
      </section>
    </>
  );
}
