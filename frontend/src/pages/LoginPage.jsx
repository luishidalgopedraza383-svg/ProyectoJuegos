import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Cuentas de demostración (1 administrador + 3 usuarios).
const demoAccounts = [
  { label: 'Administrador', email: 'admin@proyectojuegos.local', password: 'Admin2026!' },
  { label: 'Gerente', email: 'gerente@proyectojuegos.local', password: 'Gerente2026!' },
  { label: 'Vendedor', email: 'vendedor@proyectojuegos.local', password: 'Vendedor2026!' },
  { label: 'Cajero', email: 'cajero@proyectojuegos.local', password: 'Cajero2026!' },
];

export default function LoginPage() {
  const { session, login, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  if (session) return <Navigate to="/" replace />;

  const fill = (account) => {
    setEmail(account.email);
    setPassword(account.password);
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setBusy(true);
    await login(email, password);
    setBusy(false);
  };

  return (
    <div className="login-wrap">
      <div className="card login-card">
        <div className="brand">PROYECTO <span>JUEGOS</span></div>
        <p className="muted">Tienda de videojuegos: PlayStation, Xbox y Nintendo</p>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={onSubmit}>
          <div>
            <label htmlFor="email">Correo</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="username" />
          </div>
          <div>
            <label htmlFor="password">Contraseña</label>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
          </div>
          <button className="btn" type="submit" disabled={busy}>{busy ? 'Ingresando...' : 'Ingresar'}</button>
        </form>

        <div style={{ marginTop: '1.1rem' }}>
          <p className="muted" style={{ fontSize: '0.8rem', marginBottom: '0.5rem' }}>
            Cuentas de demostración (clic para autocompletar):
          </p>
          <div className="row">
            {demoAccounts.map((account) => (
              <button key={account.email} type="button" className="btn btn-ghost btn-sm" onClick={() => fill(account)}>
                {account.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
