import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import { useAuth } from '../context/AuthContext';
import { slugify } from '../utils/slug';
import { money } from '../utils/money';

const emptyForm = {
  title: '', sku: '', price: '', description: '',
  platformId: '', categoryId: '', genreId: '',
};

// Precio en dólares: entero entre 10 y 60, sin decimales.
const readPrice = (raw) => {
  const value = Number(raw);
  return Number.isInteger(value) && value >= 10 && value <= 60 ? value : null;
};

/** Edición de catálogo. Esta vista solo se usa desde /admin/juegos. */
export default function AdminCatalogPage() {
  const { can } = useAuth();
  const canWrite = can('catalog.write');
  const [searchParams, setSearchParams] = useSearchParams();
  const platform = searchParams.get('plataforma') || '';
  const genre = searchParams.get('genero') || '';

  const [games, setGames] = useState([]);
  const [meta, setMeta] = useState({ platforms: [], categories: [], genres: [] });
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    const [catalog, taxonomy] = await Promise.all([
      api('/games?limit=100&onlyActive=false'),
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
    const price = readPrice(form.price);
    if (price === null) {
      setError('El precio debe ser un número entero entre 10 y 60 USD.');
      return;
    }
    try {
      await api('/games', {
        method: 'POST',
        body: JSON.stringify({
          title: form.title,
          sku: form.sku,
          price,
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
      price: String(Number(game.price)),
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
    const price = readPrice(editForm.price);
    if (price === null) {
      setError('El precio debe ser un número entero entre 10 y 60 USD.');
      return;
    }
    try {
      await api(`/games/${editingId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          title: editForm.title,
          sku: editForm.sku,
          price,
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

  const uploadCover = async (game, file) => {
    if (!file) return;
    setError('');
    setMessage('');
    try {
      const formData = new FormData();
      formData.append('image', file);
      await api(`/games/${game.id}/image`, { method: 'POST', body: formData });
      setMessage(`Portada de ${game.title} actualizada.`);
      await reload();
    } catch (err) {
      setError(err.message);
    }
  };

  const removeCover = async (game) => {
    setError('');
    setMessage('');
    try {
      await api(`/games/${game.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ imageUrl: null }),
      });
      setMessage(`Portada de ${game.title} eliminada.`);
      await reload();
    } catch (err) {
      setError(err.message);
    }
  };

  const visibleGames = useMemo(
    () => games.filter((game) => (
      (!platform || slugify(game.platform?.name) === platform)
      && (!genre || slugify(game.genre?.name) === genre)
    )),
    [games, platform, genre],
  );

  const setFilters = (next) => {
    const params = {};
    if (next.plataforma) params.plataforma = next.plataforma;
    if (next.genero) params.genero = next.genero;
    setSearchParams(params);
  };
  const columnCount = 10;

  return (
    <>
      <div className="panel">
        <div className="filter-block">
          <span className="filter-label">Plataforma</span>
          <div className="row platform-chips" aria-label="Filtrar por plataforma">
            <button
              className={`btn btn-sm ${platform ? 'btn-ghost' : ''}`}
              onClick={() => setFilters({ plataforma: '', genero: genre })}
            >
              Todas
            </button>
            {meta.platforms.map((item) => {
              const slug = slugify(item.name);
              return (
                <button
                  key={item.id}
                  className={`btn btn-sm ${platform === slug ? '' : 'btn-ghost'}`}
                  onClick={() => setFilters({ plataforma: slug, genero: genre })}
                >
                  {item.name}
                </button>
              );
            })}
          </div>
        </div>
        <div className="filter-block">
          <span className="filter-label">Género</span>
          <div className="row platform-chips" aria-label="Filtrar por género">
            <button
              className={`btn btn-sm ${genre ? 'btn-ghost' : ''}`}
              onClick={() => setFilters({ plataforma: platform, genero: '' })}
            >
              Todos
            </button>
            {meta.genres.map((item) => {
              const slug = slugify(item.name);
              return (
                <button
                  key={item.id}
                  className={`btn btn-sm ${genre === slug ? '' : 'btn-ghost'}`}
                  onClick={() => setFilters({ plataforma: platform, genero: slug })}
                >
                  {item.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {canWrite && (
        <section className="panel">
          <h2>Nuevo videojuego</h2>
          <p className="muted">Precios en dólares: enteros entre 10 y 60 USD, sin decimales.</p>
          <form className="form-grid" onSubmit={onCreate}>
            <div><label>Título</label><input name="title" value={form.title} onChange={onChange} required /></div>
            <div><label>SKU</label><input name="sku" value={form.sku} onChange={onChange} required /></div>
            <div><label>Precio (USD)</label><input name="price" type="number" min="10" max="60" step="1" placeholder="10 - 60" value={form.price} onChange={onChange} required /></div>
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
        <h2>Administrar títulos</h2>
        <table>
          <thead>
            <tr>
              <th>Portada</th><th>Título</th><th>SKU</th><th>Plataforma</th><th>Categoría</th><th>Género</th>
              <th>Precio</th><th>Stock</th><th>Estado</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {visibleGames.map((game) => (
              <Fragment key={game.id}>
                <tr>
                  <td>
                    <img
                      className="game-thumb"
                      src={game.imageUrl || '/covers/placeholder.svg'}
                      alt={`Portada de ${game.title}`}
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = '/covers/placeholder.svg';
                      }}
                    />
                  </td>
                  <td>{game.title}</td>
                  <td className="num">{game.sku}</td>
                  <td>{game.platform?.name || '—'}</td>
                  <td>{game.category?.name || '—'}</td>
                  <td>{game.genre?.name || '—'}</td>
                  <td className="money">{money(game.price)}</td>
                  <td className="num">{game.inventory?.quantity ?? game.inventory?.[0]?.quantity ?? '—'}</td>
                  <td><span className={`badge ${game.isActive ? 'ok' : 'warn'}`}>{game.isActive ? 'Activo' : 'Inactivo'}</span></td>
                  <td>
                    <div className="row">
                      <button className="btn btn-ghost btn-sm" onClick={() => startEdit(game)}>Editar</button>
                      <label className="btn btn-ghost btn-sm cover-upload">
                        Portada
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          hidden
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            uploadCover(game, file);
                            event.target.value = '';
                          }}
                        />
                      </label>
                      {game.imageUrl && (
                        <button className="btn btn-ghost btn-sm" onClick={() => removeCover(game)}>
                          Quitar portada
                        </button>
                      )}
                      <button className="btn btn-ghost btn-sm" onClick={() => toggleActive(game)}>
                        {game.isActive ? 'Desactivar' : 'Activar'}
                      </button>
                    </div>
                  </td>
                </tr>
                {editingId === game.id && editForm && (
                  <tr>
                    <td colSpan={columnCount}>
                      <form className="form-grid" onSubmit={onSaveEdit}>
                        <div><label>Título</label><input name="title" value={editForm.title} onChange={onEditChange} required /></div>
                        <div><label>SKU</label><input name="sku" value={editForm.sku} onChange={onEditChange} required /></div>
                        <div><label>Precio (USD)</label><input name="price" type="number" min="10" max="60" step="1" placeholder="10 - 60" value={editForm.price} onChange={onEditChange} required /></div>
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
            {!visibleGames.length && (
              <tr><td colSpan={columnCount} className="muted">No hay juegos disponibles con ese filtro.</td></tr>
            )}
          </tbody>
        </table>
      </section>
    </>
  );
}
