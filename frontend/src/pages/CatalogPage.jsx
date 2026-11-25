import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import { useAuth } from '../context/AuthContext';
import { slugify } from '../utils/slug';
import GameCard from '../components/GameCard';

/**
 * Catálogo de consulta y compra. No tiene controles de edición:
 * la administración del catálogo vive en /admin/juegos.
 */
export default function CatalogPage() {
  const { can, session } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const platform = searchParams.get('plataforma') || '';
  const genre = searchParams.get('genero') || '';

  const [games, setGames] = useState([]);
  const [meta, setMeta] = useState({ platforms: [], genres: [] });
  const [search, setSearch] = useState('');

  const reload = useCallback(async () => {
    // Siempre el endpoint público: activos con stock y solo datos de compra.
    const [catalog, taxonomy] = await Promise.all([
      api('/public/games?limit=100'),
      api('/public/games/meta'),
    ]);
    setGames(catalog.items);
    setMeta(taxonomy);
  }, []);

  useEffect(() => { reload().catch(() => {}); }, [reload]);
  useAutoRefresh(reload, { intervalMs: 60000 });

  const visibleGames = useMemo(() => games.filter((game) => {
    const matchesPlatform = !platform || slugify(game.platform?.name) === platform;
    const matchesGenre = !genre || slugify(game.genre?.name) === genre;
    const haystack = `${game.title} ${game.genre?.name || ''}`.toLowerCase();
    const matchesSearch = !search || haystack.includes(search.toLowerCase());
    return matchesPlatform && matchesGenre && matchesSearch;
  }), [games, platform, genre, search]);

  const setFilters = (next) => {
    const params = {};
    if (next.plataforma) params.plataforma = next.plataforma;
    if (next.genero) params.genero = next.genero;
    setSearchParams(params);
  };

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Catálogo</h1>
          <p className="muted">Portadas, detalles y existencias de claves digitales Xbox y PC en PlayVibe</p>
        </div>
        <div className="row">
          {can('catalog.write') && (
            <Link className="btn btn-ghost btn-sm" to="/admin/juegos">Administrar juegos</Link>
          )}
          <button className="btn btn-ghost btn-sm" onClick={reload}>Recargar</button>
        </div>
      </div>

      {!session && (
        <div className="alert alert-success">
          Estás viendo el catálogo público. Para comprar inicia sesión; el stock mostrado es el disponible en tienda.
        </div>
      )}

      <section className="panel">
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

        <div className="filter-block">
          <label htmlFor="catalog-search">Buscar</label>
          <input
            id="catalog-search"
            type="search"
            placeholder="Buscar por título o género..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Buscar juegos por título o género"
          />
        </div>
      </section>

      <section className="cards store-grid" aria-label="Juegos disponibles">
        {visibleGames.map((game) => <GameCard key={game.id} game={game} />)}
        {!visibleGames.length && (
          <div className="panel">No hay juegos disponibles con esos filtros.</div>
        )}
      </section>
    </>
  );
}
