import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import { useAuth } from '../context/AuthContext';
import { slugify } from '../utils/slug';
import GameCard from '../components/GameCard';

export default function StorefrontPage() {
  const { session } = useAuth();
  const [games, setGames] = useState([]);
  const [search, setSearch] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const platform = searchParams.get('plataforma') || '';
  const genre = searchParams.get('genero') || '';

  const reload = useCallback(async () => {
    const response = await api('/public/games?limit=100');
    setGames(response.items);
  }, []);

  useEffect(() => { reload().catch(() => {}); }, [reload]);
  useAutoRefresh(reload, { intervalMs: 60000 });

  const platforms = useMemo(() => {
    const names = [...new Set(games.map((game) => game.platform?.name).filter(Boolean))];
    return names.map((name) => ({ name, slug: slugify(name) }));
  }, [games]);

  const genres = useMemo(() => {
    const names = [...new Set(games.map((game) => game.genre?.name).filter(Boolean))];
    return names
      .sort((a, b) => a.localeCompare(b, 'es'))
      .map((name) => ({ name, slug: slugify(name) }));
  }, [games]);

  const visible = useMemo(() => games.filter((game) => {
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
      <section className="hero">
        <p className="eyebrow">PLAYVIBE · TIENDA DE VIDEOJUEGOS</p>
        <h1>Tu próxima partida empieza <span className="accent">aquí</span></h1>
        <p className="muted">
          Claves digitales de Xbox y PC con stock en vivo. Explora sin iniciar sesión; cuando
          quieras comprar, entra con tu cuenta y siente la vibra en el punto de venta.
        </p>
        <div className="row">
          <Link className="btn" to="/catalogo">Explorar catálogo</Link>
          {session
            ? <Link className="btn btn-ghost" to="/ventas">Ir al punto de venta</Link>
            : <Link className="btn btn-ghost" to="/login" state={{ from: { pathname: '/ventas' } }}>
                Iniciar sesión para comprar
              </Link>}
        </div>
      </section>

      <section className="panel">
        <h2>Juegos disponibles</h2>

        <div className="filter-block">
          <span className="filter-label">Plataforma</span>
          <div className="row platform-chips" aria-label="Filtrar por plataforma">
            <button
              className={`btn btn-sm ${platform ? 'btn-ghost' : ''}`}
              onClick={() => setFilters({ plataforma: '', genero: genre })}
            >
              Todas
            </button>
            {platforms.map((item) => (
              <button
                key={item.slug}
                className={`btn btn-sm ${platform === item.slug ? '' : 'btn-ghost'}`}
                onClick={() => setFilters({ plataforma: item.slug, genero: genre })}
              >
                {item.name}
              </button>
            ))}
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
            {genres.map((item) => (
              <button
                key={item.slug}
                className={`btn btn-sm ${genre === item.slug ? '' : 'btn-ghost'}`}
                onClick={() => setFilters({ plataforma: platform, genero: item.slug })}
              >
                {item.name}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-block">
          <label htmlFor="store-search">Buscar</label>
          <input
            id="store-search"
            type="search"
            placeholder="Buscar por título o género..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Buscar juegos por título o género"
          />
        </div>
      </section>

      <section className="cards store-grid">
        {visible.map((game) => <GameCard key={game.id} game={game} />)}
        {!visible.length && (
          <div className="panel">No hay juegos disponibles con esos filtros.</div>
        )}
      </section>
    </>
  );
}
