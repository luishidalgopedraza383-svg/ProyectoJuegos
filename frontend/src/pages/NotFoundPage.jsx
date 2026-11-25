import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="panel">
      <h1>404 · Página no encontrada</h1>
      <p className="muted">La dirección solicitada no existe en esta tienda.</p>
      <Link className="btn" to="/">Volver al panel</Link>
    </div>
  );
}
