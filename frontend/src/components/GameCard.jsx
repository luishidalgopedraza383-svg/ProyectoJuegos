import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { money } from '../utils/money';

/** Tarjeta grande: portada a la izquierda, detalles y compra a la derecha. */
export default function GameCard({ game }) {
  const { session } = useAuth();
  const { addItem, items } = useCart();

  // El endpoint público ya trae stock/itemType; el privado los trae dentro de inventory.
  const stock = game.stock ?? game.inventory?.quantity ?? game.inventory?.[0]?.quantity ?? 0;
  const itemType = game.itemType ?? game.inventory?.itemType ?? game.inventory?.[0]?.itemType;
  const available = game.isActive !== false && stock > 0;
  const inCart = items.find((item) => item.videoGameId === game.id);

  // Compra directa: el POS recibe el juego en ?game= y lo deja listo en el
  // carrito (sin volver a escogerlo). Si no hay sesión, se conserva el destino.
  const buyTarget = `/ventas?game=${game.id}`;
  const buyButton = !available ? (
    <button className="btn" disabled>Sin stock</button>
  ) : session ? (
    <Link className="btn" to={buyTarget}>Comprar</Link>
  ) : (
    <Link className="btn" to="/login" state={{ from: { pathname: '/ventas', search: `?game=${game.id}` } }}>
      Ingresar para comprar
    </Link>
  );

  return (
    <article className="card game-card game-card--wide">
      <div className="game-card__cover">
        <img
          className="game-cover"
          src={game.imageUrl || '/covers/placeholder.svg'}
          alt={`Portada de ${game.title}`}
          loading="lazy"
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = '/covers/placeholder.svg';
          }}
        />
      </div>

      <div className="game-card__body">
        <div className="row game-card__badges">
          <span className="badge">{game.platform?.name || 'Videojuego'}</span>
          <span className={`badge ${stock <= 10 ? 'warn' : 'ok'}`}>
            {stock} uds. disponibles
          </span>
          {game.isActive === false && <span className="badge warn">Inactivo</span>}
        </div>

        <h3>{game.title}</h3>
        <p className="muted game-card__description">
          {game.description || 'Sin descripción registrada.'}
        </p>

        <dl className="game-meta">
          <div><dt>Categoría</dt><dd>{game.category?.name || '—'}</dd></div>
          <div><dt>Género</dt><dd>{game.genre?.name || '—'}</dd></div>
          <div><dt>Clasificación</dt><dd>{game.ageRating || '—'}</dd></div>
          <div><dt>Formato</dt><dd>{itemType === 'digital_key' ? 'Clave digital' : 'Copia física'}</dd></div>
          <div><dt>SKU</dt><dd className="num">{game.sku || '—'}</dd></div>
          <div><dt>Estado</dt><dd>{available ? 'Disponible' : 'No disponible'}</dd></div>
        </dl>

        <div className="game-card__footer">
          <strong className="money">{money(game.price)}</strong>
          <div className="row">
            {available && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => addItem(game)}
              >
                {inCart ? `Añadir otro (${inCart.quantity} en carrito)` : 'Añadir al carrito'}
              </button>
            )}
            {buyButton}
          </div>
        </div>
      </div>
    </article>
  );
}
