import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BANKS } from '../utils/banks';
import PaymentCardVisual from '../components/PaymentCardVisual';

const emptyForm = {
  fullName: '',
  email: '',
  password: '',
  bank: 'BCP',
  initialBalance: 100,
};

export default function RegisterPage() {
  const { register, error } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [wallet, setWallet] = useState(null);
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState('');

  const change = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const onSubmit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setLocalError('');
    const result = await register({
      fullName: form.fullName,
      email: form.email,
      password: form.password,
      bank: form.bank,
      initialBalance: Number(form.initialBalance),
    });
    setBusy(false);
    if (result) setWallet(result.wallet);
    else setLocalError('Revisa los datos e inténtalo de nuevo.');
  };

  return (
    <div className="login-wrap">
      <div className="card login-card register-card">
        <span className="login-badge">CREA TU BILLETERA</span>
        <div className="brand">PLAY<span>VIBE</span></div>
        <p className="muted">
          Regístrate y recibe una cuenta bancaria y una tarjeta de prueba para comprar en la tienda.
        </p>

        {(error || localError) && <div className="alert alert-error">{error || localError}</div>}

        {wallet ? (
          <div className="register-success">
            <div className="alert alert-success">¡Cuenta creada! Ya puedes iniciar sesión y comprar.</div>
            <h3>Tu tarjeta ficticia</h3>
            <PaymentCardVisual card={wallet.card} account={wallet} label="Billetera ficticia" />
            <p className="hint">Número de cuenta: <span className="num">{wallet.accountNumber}</span></p>
            <div className="row">
              <Link className="btn" to="/catalogo">Entrar a la tienda</Link>
              <Link className="btn btn-ghost" to="/ventas">Ir al punto de venta</Link>
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit}>
            <div>
              <label htmlFor="register-name">Nombre completo del titular</label>
              <input
                id="register-name"
                value={form.fullName}
                onChange={(event) => change('fullName', event.target.value)}
                placeholder="Ej. Juan Pérez"
                minLength={3}
                maxLength={120}
                required
              />
            </div>
            <div>
              <label htmlFor="register-email">Correo</label>
              <input
                id="register-email"
                type="email"
                value={form.email}
                onChange={(event) => change('email', event.target.value)}
                autoComplete="username"
                placeholder="tu@correo.com"
                required
              />
            </div>
            <div>
              <label htmlFor="register-password">Contraseña</label>
              <input
                id="register-password"
                type="password"
                value={form.password}
                onChange={(event) => change('password', event.target.value)}
                autoComplete="new-password"
                placeholder="Mínimo 6 caracteres"
                minLength={6}
                required
              />
            </div>
            <div>
              <label htmlFor="register-bank">Banco</label>
              <select
                id="register-bank"
                value={form.bank}
                onChange={(event) => change('bank', event.target.value)}
              >
                {BANKS.map((bank) => <option key={bank.code} value={bank.code}>{bank.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="register-balance">Saldo inicial (USD)</label>
              <input
                id="register-balance"
                type="number"
                min="1"
                max="1000000"
                step="1"
                value={form.initialBalance}
                onChange={(event) => change('initialBalance', event.target.value)}
                required
              />
              <div className="quick-amounts">
                {[100, 500, 1000].map((value) => (
                  <button
                    type="button"
                    key={value}
                    className={`btn btn-ghost btn-sm${Number(form.initialBalance) === value ? ' is-active' : ''}`}
                    onClick={() => change('initialBalance', value)}
                  >
                    ${value}
                  </button>
                ))}
              </div>
            </div>

            <p className="hint">
              Datos ficticios solo para la demo: se generan cuenta, tarjeta de 16 dígitos, vencimiento y CVV.
            </p>
            <button className="btn" type="submit" disabled={busy}>
              {busy ? 'Creando cuenta...' : 'Crear cuenta y tarjeta'}
            </button>
          </form>
        )}

        <div className="login-benefits">
          <span>Cuenta y tarjeta al instante</span>
          <span>Recargas cuando quieras</span>
          <span>Compra con saldo ficticio</span>
        </div>

        <p className="muted register-login-link">
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
}
