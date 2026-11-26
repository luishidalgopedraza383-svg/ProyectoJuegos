import { bankColor, bankName, bankShort } from '../utils/banks';

/** Logo ficticio del banco (iniciales + nombre) para tarjetas y listados. */
export default function BankBadge({ code, compact = false }) {
  const name = bankName(code);
  return (
    <span
      className={`bank-badge${compact ? ' bank-badge--compact' : ''}`}
      style={{ '--bank-color': bankColor(code) }}
      title={name}
    >
      <span className="bank-badge__mark">{bankShort(code)}</span>
      {!compact && <span className="bank-badge__name">{name}</span>}
    </span>
  );
}
