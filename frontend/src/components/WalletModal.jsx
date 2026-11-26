import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { BANKS } from '../utils/banks';
import PaymentCardVisual from './PaymentCardVisual';

/**
 * Modal reutilizable desde Ventas y Clientes.
 * - create: alta de cuenta y tarjeta ficticia.
 * - deposit: recarga rápida de cualquier billetera creada.
 */
export default function WalletModal({
  open,
  onClose,
  onDone,
  initialTab = 'create',
  allowTargetEmail = false,
  defaultHolder = '',
}) {
  const [tab, setTab] = useState(initialTab);
  const [form, setForm] = useState({ holder: defaultHolder, email: '', bank: 'BCP', initialBalance: 100 });
  const [wallets, setWallets] = useState([]);
  const [depositId, setDepositId] = useState('');
  const [amount, setAmount] = useState(50);
  const [created, setCreated] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const loadWallets = async () => {
    const response = await api(allowTargetEmail ? '/wallets/all' : '/wallets/me');
    setWallets(response.items);
    setDepositId((current) => (
      response.items.some((wallet) => wallet.id === current) ? current : (response.items[0]?.id || '')
    ));
  };

  useEffect(() => {
    if (!open) return;
    setTab(initialTab);
    setForm({ holder: defaultHolder, email: '', bank: 'BCP', initialBalance: 100 });
    setCreated(null);
    setMessage('');
    setError('');
    loadWallets().catch((err) => setError(err.message));
  }, [open, initialTab, defaultHolder, allowTargetEmail]);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const submitCreate = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const body = {
        holder: form.holder,
        bank: form.bank,
        initialBalance: Number(form.initialBalance),
      };
      if (allowTargetEmail && form.email.trim()) body.email = form.email.trim();
      const response = await api('/wallets', { method: 'POST', body: JSON.stringify(body) });
      setCreated(response.wallet);
      setMessage('Billetera creada: cuenta, tarjeta y cliente vinculados.');
      await loadWallets();
      if (onDone) await onDone(response.wallet);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const submitDeposit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const response = await api(`/wallets/${depositId}/deposit`, {
        method: 'POST',
        body: JSON.stringify({ amount: Number(amount) }),
      });
      setMessage(`Recarga registrada. Saldo actual: ${response.wallet.balance} USD.`);
      await loadWallets();
      if (onDone) await onDone(response.wallet);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const selectedWallet = wallets.find((wallet) => wallet.id === depositId) || null;

  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="wallet-modal-title">
        <div className="modal__head">
          <div>
            <span className="eyebrow">Billetera ficticia</span>
            <h2 id="wallet-modal-title">Crear cuenta / Recargar</h2>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>

        <div className="tabs" role="tablist" aria-label="Acciones de billetera">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'create'}
            className={`tab${tab === 'create' ? ' is-active' : ''}`}
            onClick={() => { setTab('create'); setError(''); setMessage(''); }}
          >
            Crear billetera
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'deposit'}
            className={`tab${tab === 'deposit' ? ' is-active' : ''}`}
            onClick={() => { setTab('deposit'); setError(''); setMessage(''); }}
          >
            Recargar saldo
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {message && <div className="alert alert-success">{message}</div>}

        {tab === 'create' && (
          <form className="modal__body" onSubmit={submitCreate}>
            <div>
              <label htmlFor="wallet-holder">Nombre completo del titular</label>
              <input
                id="wallet-holder"
                value={form.holder}
                onChange={(event) => setForm({ ...form, holder: event.target.value })}
                placeholder="Ej. Juan Pérez"
                required
                minLength={3}
                maxLength={80}
              />
            </div>

            {allowTargetEmail && (
              <div>
                <label htmlFor="wallet-email">Correo del comprador (opcional)</label>
                <input
                  id="wallet-email"
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                  placeholder="Ej. comprador@correo.com"
                />
                <p className="hint">
                  Si el correo pertenece a un comprador registrado, la cuenta se crea para él. Si se deja vacío, se crea uno demo automáticamente.
                </p>
              </div>
            )}

            <div>
              <label htmlFor="wallet-bank">Banco</label>
              <select
                id="wallet-bank"
                value={form.bank}
                onChange={(event) => setForm({ ...form, bank: event.target.value })}
              >
                {BANKS.map((bank) => (
                  <option key={bank.code} value={bank.code}>{bank.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="wallet-balance">Saldo inicial (USD)</label>
              <input
                id="wallet-balance"
                type="number"
                min="1"
                max="1000000"
                step="1"
                value={form.initialBalance}
                onChange={(event) => setForm({ ...form, initialBalance: event.target.value })}
                required
              />
              <div className="quick-amounts">
                {[100, 500, 1000].map((value) => (
                  <button
                    type="button"
                    key={value}
                    className={`btn btn-ghost btn-sm${Number(form.initialBalance) === value ? ' is-active' : ''}`}
                    onClick={() => setForm({ ...form, initialBalance: value })}
                  >
                    ${value}
                  </button>
                ))}
              </div>
            </div>

            <p className="hint">
              Se generarán automáticamente número de cuenta, tarjeta de 16 dígitos, vencimiento y CVV.
            </p>
            <button className="btn" type="submit" disabled={busy}>
              {busy ? 'Guardando...' : 'Crear cuenta y tarjeta'}
            </button>
          </form>
        )}

        {tab === 'deposit' && (
          <form className="modal__body" onSubmit={submitDeposit}>
            <div>
              <label htmlFor="wallet-select">Billetera a recargar</label>
              <select
                id="wallet-select"
                value={depositId}
                onChange={(event) => setDepositId(event.target.value)}
                required
              >
                <option value="">Seleccione...</option>
                {wallets.map((wallet) => (
                  <option key={wallet.id} value={wallet.id}>
                    {wallet.bankName} · {wallet.holder} · {wallet.accountNumber.slice(-4)} · {wallet.balance} USD
                  </option>
                ))}
              </select>
              {!wallets.length && <p className="hint">Aún no hay billeteras. Crea una en la pestaña anterior.</p>}
            </div>

            {selectedWallet && (
              <PaymentCardVisual account={selectedWallet} card={selectedWallet.card} label="Saldo actual" />
            )}

            <div>
              <label htmlFor="deposit-amount">Monto a depositar (USD)</label>
              <input
                id="deposit-amount"
                type="number"
                min="1"
                max="1000000"
                step="1"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                required
              />
              <div className="quick-amounts">
                {[50, 100, 500].map((value) => (
                  <button
                    type="button"
                    key={value}
                    className={`btn btn-ghost btn-sm${Number(amount) === value ? ' is-active' : ''}`}
                    onClick={() => setAmount(value)}
                  >
                    +${value}
                  </button>
                ))}
              </div>
            </div>

            <button className="btn" type="submit" disabled={busy || !depositId}>
              {busy ? 'Recargando...' : 'Depositar en la billetera'}
            </button>
          </form>
        )}

        {created && tab === 'create' && (
          <div className="modal__created">
            <h3>Tu nueva tarjeta de prueba</h3>
            <PaymentCardVisual card={created.card} account={created} label="Billetera ficticia" />
            <p className="hint">Cuenta: {created.accountNumber}</p>
          </div>
        )}
      </div>
    </div>
  );
}
