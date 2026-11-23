import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAutoRefresh } from '../hooks/useAutoRefresh';

const emptyForm = { email: '', firstName: '', lastName: '', phone: '' };

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    const response = await api('/customers?limit=100');
    setCustomers(response.items);
  }, []);

  useEffect(() => { reload(); }, [reload]);
  useAutoRefresh(reload, { intervalMs: 30000 });

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    try {
      await api('/customers', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setForm(emptyForm);
      setMessage('Cliente creado correctamente.');
      await reload();
    } catch (err) { setError(err.message); }
  };

  return (
    <>
      <div className="topbar">
        <div><h1>Clientes</h1><p className="muted">Clientes y programa de puntos</p></div>
        <button className="btn btn-ghost btn-sm" onClick={reload}>Recargar</button>
      </div>

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <section className="panel">
        <h2>Nuevo cliente</h2>
        <form className="form-grid" onSubmit={submit}>
          <div><label>Correo</label><input type="email" name="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></div>
          <div><label>Nombre</label><input name="firstName" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required /></div>
          <div><label>Apellido</label><input name="lastName" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} /></div>
          <div><label>Teléfono</label><input name="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <button className="btn" type="submit">Guardar</button>
        </form>
      </section>

      <section className="panel">
        <table>
          <thead><tr><th>Nombre</th><th>Correo</th><th>Teléfono</th><th>Puntos</th></tr></thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id}>
                <td>{customer.firstName} {customer.lastName}</td>
                <td>{customer.email}</td>
                <td className="num">{customer.phone || '—'}</td>
                <td className="num">{customer.points}</td>
              </tr>
            ))}
            {!customers.length && <tr><td colSpan="4" className="muted">No hay clientes registrados.</td></tr>}
          </tbody>
        </table>
      </section>
    </>
  );
}
