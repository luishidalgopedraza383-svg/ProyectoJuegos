import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Solo se muestran si se activan explícitamente para una demo local.
// Al ser false por defecto, Vite elimina también las credenciales del bundle.
const showDemoAccounts = import.meta.env.VITE_SHOW_DEMO_ACCOUNTS === 'true';

const demoAccounts = showDemoAccounts ? [
  { label: 'Administrador', email: 'admin@proyectojuegos.local', password: 'Admin2026!' },
  { label: 'Gerente', email: 'gerente@proyectojuegos.local', password: 'Gerente2026!' },
  { label: 'Vendedor', email: 'vendedor@proyectojuegos.local', password: 'Vendedor2026!' },
  { label: 'Cajero', email: 'cajero@proyectojuegos.local', password: 'Cajero2026!' },
  { label: 'Comprador 1', email: 'comprador1@proyectojuegos.local', password: 'Comprador2026!' },
  { label: 'Comprador 2', email: 'comprador2@proyectojuegos.local', password: 'Comprador2026!' },
] : [];

export default function LoginPage() {
  const { session, profile, login, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  // 'from' puede ser un objeto de react-router o una ruta completa con query
  // (así la compra directa conserva /ventas?game=... tras iniciar sesión).
  const from = location.state?.from;
  const requestedPath = typeof from === 'string'
    ? from
    : from?.pathname
      ? `${from.pathname}${from.search || ''}`
      : undefined;

  // Al iniciar sesión volvemos a la dirección que el usuario pidió; si entró
  // directo a /login lo llevamos a la primera pantalla válida para su rol
  // (un comprador empieza en el catálogo, no en un POS vacío).
  useEffect(() => {
    if (!session) return;
    const permissions = profile?.permissions || [];
    const fallback = permissions.includes('reports.read')
      ? '/panel'
      : profile?.role?.name === 'comprador'
        ? '/catalogo'
        : permissions.includes('sales.write')
          ? '/ventas'
          : permissions.includes('catalog.read') ? '/catalogo' : '/';
    navigate(requestedPath || fallback, { replace: true });
  }, [session, profile, requestedPath, navigate]);

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
        <span className="login-badge">TU VIBE, TU JUEGO</span>
        <div className="brand">PLAY<span>VIBE</span></div>
        <p className="muted">Claves digitales de Xbox y PC con atención en punto de venta.</p>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={onSubmit}>
          <div>
            <label htmlFor="email">Correo</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="username" placeholder="tu@correo.com" />
          </div>
          <div>
            <label htmlFor="password">Contraseña</label>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" placeholder="••••••••" />
          </div>
          <button className="btn" type="submit" disabled={busy}>
            {busy ? 'Sintonizando...' : 'Entrar a PlayVibe'}
          </button>
        </form>

        <p className="muted login-register-link">
          ¿No tienes cuenta? <Link to="/registro">Crear cuenta / Billetera ficticia</Link>
        </p>

        <div className="login-benefits">
          <span>Stock en vivo</span>
          <span>Pago simulado</span>
          <span>Claves al instante</span>
        </div>

        {showDemoAccounts && (
          <div className="demo-accounts">
            <p className="muted" style={{ fontSize: '0.8rem' }}>
              Cuentas demo (clic para autocompletar):
            </p>
            <div className="row">
              {demoAccounts.map((account) => (
                <button key={account.email} type="button" className="btn btn-ghost btn-sm" onClick={() => fill(account)}>
                  {account.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
