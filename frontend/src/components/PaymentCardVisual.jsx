import BankBadge from './BankBadge';
import { money } from '../utils/money';

const grouped = (value) => String(value || '').replace(/(\d{4})(?=\d)/g, '$1 ');

/** Tarjeta visual de la billetera ficticia con datos completos de prueba. */
export default function PaymentCardVisual({ card = null, account = null, owner = null, label = 'Ficticia · demo' }) {
  const source = card || account;
  if (!source) return null;

  const code = card?.brand || account?.bank;
  const number = card?.cardNumber || card?.maskedNumber || account?.accountNumber || account?.maskedNumber;

  return (
    <div className="payment-card">
      <div className="payment-card__head">
        <BankBadge code={code} />
        <span className="payment-card__tag">{label}</span>
      </div>
      <div className="payment-card__number num">{grouped(number)}</div>
      <div className="payment-card__meta">
        {owner && (
          <div><span>Comprador</span><strong>{owner.displayName || owner.email}</strong></div>
        )}
        <div><span>Titular</span><strong>{source.holder}</strong></div>
        {card && <div><span>Vence</span><strong>{card.expiry}</strong></div>}
        {card && <div><span>CVV</span><strong>{card.cvv || '•••'}</strong></div>}
        <div><span>Saldo</span><strong className="money">{money(source.balance)}</strong></div>
      </div>
    </div>
  );
}
