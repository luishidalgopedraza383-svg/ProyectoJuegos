import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { session, login, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  if (session) return <Navigate to="/" replace />;

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
        <p className="muted">Gestión de tienda de videojuegos</p>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={onSubmit}>
          <div>
            <label htmlFor="email">Correo</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label htmlFor="password">Contraseña</label>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button className="btn" type="submit" disabled={busy}>{busy ? 'Ingresando...' : 'Ingresar'}</button>
        </form>
      </div>
    </div>
  );
}
