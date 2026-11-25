import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { money } from '../utils/money';

/**
 * Carrito de compras de la tienda: ajusta cantidades, quita juegos y
 * continúa al punto de venta con todo ya cargado (?checkout=1).
 */
export default function CartPage() {
  const { items, setQuantity, removeItem, clear, count, total } = useCart();
  const navigate = useNavigate();

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Carrito de compras</h1>
          <p className="muted">
            {count
              ? `${count} ${count === 1 ? 'unidad' : 'unidades'} en el carrito`
              : 'Aún no has agregado juegos.'}
          </p>
        </div>
        <div className="row">
          <Link className="btn btn-ghost btn-sm" to="/catalogo">Seguir comprando</Link>
          {items.length > 0 && (
            <button className="btn btn-ghost btn-sm" onClick={clear}>Vaciar carrito</button>
          )}
        </div>
      </div>

      <section className="panel">
        <table>
          <thead>
            <tr>
              <th>Juego</th>
              <th>Precio</th>
              <th>Cantidad</th>
              <th>Subtotal</th>
              <th aria-label="Acciones" />
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.videoGameId}>
                <td>
                  <div className="row">
                    {item.imageUrl && (
                      <img
                        className="game-thumb"
                        src={item.imageUrl}
                        alt=""
                        loading="lazy"
                        onError={(event) => { event.currentTarget.style.display = 'none'; }}
                      />
                    )}
                    <span>{item.title}</span>
                  </div>
                </td>
                <td className="money">{money(item.price)}</td>
                <td>
                  <div className="qty-controls">
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => setQuantity(item.videoGameId, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      aria-label={`Quitar una unidad de ${item.title}`}
                    >
                      −
                    </button>
                    <span className="num">{item.quantity}</span>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => setQuantity(item.videoGameId, item.quantity + 1)}
                      disabled={item.stock != null && item.quantity >= item.stock}
                      aria-label={`Agregar una unidad de ${item.title}`}
                    >
                      +
                    </button>
                  </div>
                </td>
                <td className="money">{money(item.price * item.quantity)}</td>
                <td>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => removeItem(item.videoGameId)}
                  >
                    Quitar
                  </button>
                </td>
              </tr>
            ))}
            {!items.length && (
              <tr>
                <td colSpan="5" className="muted">
                  Tu carrito está vacío.{' '}
                  <Link to="/catalogo">Explora el catálogo</Link> para agregar juegos.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {items.length > 0 && (
          <div className="row cart-summary">
            <div>
              <span className="muted">Total</span>
              <strong className="money" style={{ fontSize: '1.4rem', display: 'block' }}>
                {money(total)}
              </strong>
            </div>
            <button className="btn" onClick={() => navigate('/ventas?checkout=1')}>
              Ir a pagar
            </button>
          </div>
        )}
      </section>
    </>
  );
}
