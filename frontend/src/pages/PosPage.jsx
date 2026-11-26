import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { money } from '../utils/money';

export default function PosPage() {
  const [games, setGames] = useState([]);
  const [methods, setMethods] = useState([]);
  // El comprador usa sus propias cuentas; el personal elige entre las cuentas
  // de los compradores que atiende (el backend solo expone esas al POS).
  const [cards, setCards] = useState([]);
  const [cardId, setCardId] = useState('');
  const [accounts, setAccounts] = useState([]);
  const [accountId, setAccountId] = useState('');
  const [shift, setShift] = useState(null);
  const [methodId, setMethodId] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [lastSale, setLastSale] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const presetHandled = useRef(false);

  // El carrito es el mismo que usa la tienda (/carrito): se carga en la
  // página y se vacía al cobrar.
  const { items: cart, addItem, setQuantity, removeItem, clear, restore, total } = useCart();
  const { profile } = useAuth();
  const isBuyer = profile?.role?.name === 'comprador';
  const card = cards.find((item) => item.id === cardId) || null;

  const reload = useCallback(async () => {
    const cardRequest = isBuyer
      ? api('/payments/cards/me').then((data) => (data.card ? [data.card] : []))
      : api('/payments/cards').then((data) => data.items);
    const accountRequest = isBuyer
      ? api('/payments/accounts/me').then((data) => (data.account ? [data.account] : []))
      : api('/payments/accounts').then((data) => data.items);
    const [catalog, shiftData, cardsData, accountsData] = await Promise.all([
      api('/games?limit=100'),
      api('/sales/shifts/me'),
      cardRequest,
      accountRequest,
    ]);
    setGames(catalog.items.filter((game) => Number(game.inventory?.quantity) > 0));
    setShift(shiftData.shift);
    setCards(cardsData);
    setAccounts(accountsData);
    // Conserva la cuenta elegida mientras siga disponible tras recargar.
    setCardId((current) => (
      cardsData.some((item) => item.id === current) ? current : (cardsData[0]?.id || '')
    ));
    setAccountId((current) => (
      accountsData.some((item) => item.id === current) ? current : (accountsData[0]?.id || '')
    ));
  }, [isBuyer]);

  useEffect(() => {
    reload().catch(() => {});
    api('/payments/methods').then((data) => {
      setMethods(data.items);
      // Tarjeta queda preseleccionada, pero se puede cambiar a los bancos
      // que el backend ofrece (Tarjeta más el banco de sus cuentas).
      const cardMethod = data.items.find((method) => method.code === 'CARD');
      if (cardMethod) setMethodId((current) => current || cardMethod.id);
    }).catch(() => {});
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
    addItem(game);
  };

  // Compra directa desde el catálogo (?game=id) o llegada desde el carrito
  // (?checkout=1): el título queda listo en el carrito y, si no hay turno
  // abierto, se abre solo para comprar sin pasos extra. Se atiende una sola
  // vez por visita.
  const presetId = searchParams.get('game');
  const fromCart = searchParams.get('checkout') === '1';
  useEffect(() => {
    if ((!presetId && !fromCart) || presetHandled.current || !games.length) return;
    presetHandled.current = true;

    if (presetId) {
      const game = games.find((item) => item.id === presetId);
      if (!game) {
        setError('El juego seleccionado ya no está disponible.');
        return;
      }
      // Ya en el carrito no se duplica: la compra directa solo lo asegura.
      addItem(game, { skipIfExists: true });
    }

    if (!shift) {
      api('/sales/shifts/open', { method: 'POST', body: JSON.stringify({ openingAmount: 0 }) })
        .then(() => reload())
        .catch((err) => setError(err.message));
    }
  }, [presetId, fromCart, games, shift, reload, addItem]);

  const selectedMethod = methods.find((method) => method.id === methodId);
  const needsCard = selectedMethod?.code === 'CARD';
  // Todo lo que no sea Tarjeta debita una cuenta bancaria: los métodos que
  // llegan ya vienen filtrados (Tarjeta más los bancos con cuenta posible).
  const needsAccount = Boolean(selectedMethod) && !needsCard;
  const account = accounts.find((item) => item.id === accountId) || null;

  const pay = async () => {
    setError('');
    setMessage('');
    if (!shift) { setError('Debes abrir un turno antes de comprar.'); return; }
    if (!cart.length) { setError('El carrito está vacío.'); return; }
    if (!methodId) { setError('Selecciona un método de pago.'); return; }
    if (needsCard && !card) {
      setError(isBuyer
        ? 'No tienes una tarjeta registrada para pagar con Tarjeta.'
        : 'Selecciona la tarjeta del comprador con la que vas a cobrar.');
      return;
    }
    if (needsAccount && !account) {
      setError(isBuyer
        ? `No tienes una cuenta bancaria registrada para pagar con ${selectedMethod?.name ?? 'este medio'}.`
        : 'Selecciona la cuenta bancaria del comprador con la que vas a cobrar.');
      return;
    }

    const snapshot = cart;
    clear(); // actualizacion optimista
    try {
      const sale = await api('/sales', {
        method: 'POST',
        body: JSON.stringify({
          cashShiftId: shift.id,
          items: snapshot.map((item) => ({ videoGameId: item.videoGameId, quantity: item.quantity })),
          payments: [{
            paymentMethodId: methodId,
            amount: total,
            ...(needsCard && card ? { cardId: card.id } : {}),
            ...(needsAccount && account ? { bankAccountId: account.id } : {}),
          }],
        }),
      });
      // Una clave distinta por juego vendido; se muestran para entregarlas al cliente.
      setLastSale({
        code: sale.code,
        keys: (sale.details || []).flatMap((detail) => detail.digitalKeys || []),
      });
      setMessage(`Compra ${sale.code} registrada por ${sale.total}. Stock y saldo actualizados.`);
      // La compra ya se atendió: se limpian los parámetros para no repetirla.
      setSearchParams({}, { replace: true });
      await reload();
    } catch (err) {
      restore(snapshot);
      setError(err.message);
    }
  };

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

      {lastSale && (
        <section className="panel receipt">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ margin: 0 }}>Claves digitales · {lastSale.code}</h2>
              <p className="muted" style={{ margin: '0.35rem 0 0' }}>
                Entrégalas al cliente para canjearlas en la plataforma correspondiente.
              </p>
            </div>
            <button
              className="btn btn-ghost btn-sm"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(lastSale.keys.join('\n'));
                  setMessage('Claves copiadas al portapapeles.');
                } catch {
                  setError('No se pudieron copiar. Selecciónalas manualmente.');
                }
              }}
            >
              Copiar claves
            </button>
          </div>
          <div className="key-list">
            {lastSale.keys.map((key) => <code className="digital-key" key={key}>{key}</code>)}
          </div>
        </section>
      )}

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
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0 }}>Carrito</h2>
          <Link className="btn btn-ghost btn-sm" to="/carrito">Ver carrito completo</Link>
        </div>
        <table>
          <thead><tr><th>Juego</th><th>Cantidad</th><th>Precio</th><th>Subtotal</th><th aria-label="Acciones" /></tr></thead>
          <tbody>
            {cart.map((item) => (
              <tr key={item.videoGameId}>
                <td>{item.title}</td>
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
                <td className="money">{money(item.price)}</td>
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
            {!cart.length && <tr><td colSpan="5" className="muted">Agrega juegos al carrito.</td></tr>}
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

        {needsCard && (
          <div className="card-slot">
            <label>
              {isBuyer ? 'Tu tarjeta' : 'Tarjeta del comprador'}
              <select value={cardId} onChange={(event) => setCardId(event.target.value)}>
                <option value="">Seleccione...</option>
                {cards.map((item) => (
                  <option key={item.id} value={item.id}>
                    {isBuyer
                      ? item.maskedNumber
                      : `${item.owner?.displayName || item.holder} · ${item.maskedNumber} · ${money(item.balance)}`}
                  </option>
                ))}
              </select>
            </label>
            {!isBuyer && (
              <p className="muted">El cobro se descuenta de la tarjeta individual del comprador elegido.</p>
            )}
            {card ? (
              <div className="payment-card">
                <div className="payment-card__head">
                  <span className="payment-card__brand">{card.brand}</span>
                  <span className="payment-card__tag">Ficticia · demo</span>
                </div>
                <div className="payment-card__number num">{card.maskedNumber}</div>
                <div className="payment-card__meta">
                  {!isBuyer && card.owner && (
                    <div><span>Comprador</span><strong>{card.owner.displayName}</strong></div>
                  )}
                  <div><span>Titular</span><strong>{card.holder}</strong></div>
                  <div><span>Vence</span><strong>{card.expiry}</strong></div>
                  <div><span>Saldo</span><strong className="money">{money(card.balance)}</strong></div>
                </div>
              </div>
            ) : (
              <p className="muted">
                {isBuyer
                  ? 'No tienes una tarjeta registrada para pagar con Tarjeta.'
                  : 'No hay tarjetas de compradores registradas.'}
              </p>
            )}
          </div>
        )}

        {needsAccount && (
          <div className="card-slot">
            <label>
              {isBuyer ? 'Tu cuenta bancaria' : 'Cuenta del comprador'}
              <select value={accountId} onChange={(event) => setAccountId(event.target.value)}>
                <option value="">Seleccione...</option>
                {accounts.map((item) => (
                  <option key={item.id} value={item.id}>
                    {isBuyer
                      ? `${item.bank} ${item.maskedNumber}`
                      : `${item.owner?.displayName || item.holder} · ${item.bank} ${item.maskedNumber} · ${money(item.balance)}`}
                  </option>
                ))}
              </select>
            </label>
            <p className="muted">
              {`${!isBuyer ? 'El cobro se descuenta de la cuenta individual del comprador elegido. ' : ''}El banco del método no necesita coincidir con el de la cuenta (demo).`}
            </p>
            {account ? (
              <div className="payment-card">
                <div className="payment-card__head">
                  <span className="payment-card__brand">{account.bank}</span>
                  <span className="payment-card__tag">Cuenta ficticia · demo</span>
                </div>
                <div className="payment-card__number num">{account.maskedNumber}</div>
                <div className="payment-card__meta">
                  {!isBuyer && account.owner && (
                    <div><span>Comprador</span><strong>{account.owner.displayName}</strong></div>
                  )}
                  <div><span>Titular</span><strong>{account.holder}</strong></div>
                  <div><span>Saldo</span><strong className="money">{money(account.balance)}</strong></div>
                </div>
              </div>
            ) : (
              <p className="muted">
                {isBuyer
                  ? `No tienes una cuenta bancaria registrada para pagar con ${selectedMethod?.name ?? 'este medio'}.`
                  : 'No hay cuentas bancarias de compradores registradas.'}
              </p>
            )}
          </div>
        )}
      </section>
    </>
  );
}
