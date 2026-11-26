import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import { useAuth } from '../context/AuthContext';
import WalletModal from '../components/WalletModal';
import BankBadge from '../components/BankBadge';
import { money } from '../utils/money';

const emptyForm = { email: '', firstName: '', lastName: '', phone: '' };

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [walletTab, setWalletTab] = useState(false);
  const { can, profile } = useAuth();
  const allowTargetEmail = can('customers.write') || can('sales.write');

  const reload = useCallback(async () => {
    const [customerResponse, walletResponse] = await Promise.all([
      api('/customers?limit=100'),
      api(allowTargetEmail ? '/wallets/all' : '/wallets/me'),
    ]);
    setCustomers(customerResponse.items);
    setWallets(walletResponse.items);
  }, [allowTargetEmail]);

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

  const onWalletDone = async () => {
    setMessage('Billetera creada/recargada. El cliente queda vinculado al usuario.');
    await reload();
  };

  // Los clientes nuevos tienen userId; los antiguos pueden no tenerlo.
  const walletByUser = new Map(wallets.filter((wallet) => wallet.userId).map((wallet) => [wallet.userId, wallet]));

  return (
    <>
      <div className="topbar">
        <div><h1>Clientes</h1><p className="muted">Clientes, puntos y billeteras ficticias</p></div>
        <div className="row">
          <button className="btn btn-ghost btn-sm" onClick={reload}>Recargar</button>
          <button className="btn btn-sm" onClick={() => setWalletTab('create')}>+ Crear cuenta / Billetera ficticia</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setWalletTab('deposit')}>Recargar saldo</button>
        </div>
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
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Usuario</th>
              <th>Banco / Cuenta</th>
              <th>Tarjeta de prueba</th>
              <th>Saldo</th>
              <th>Teléfono</th>
              <th>Puntos</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => {
              const wallet = walletByUser.get(customer.userId);
              return (
                <tr key={customer.id}>
                  <td>{customer.firstName} {customer.lastName}</td>
                  <td>{customer.email}</td>
                  <td>{customer.user?.displayName || customer.user?.email || '—'}</td>
                  <td>
                    {wallet ? (
                      <>
                        <div className="row"><BankBadge code={wallet.bank} compact /> {wallet.bankName}</div>
                        <div className="hint num">{wallet.accountNumber}</div>
                      </>
                    ) : '—'}
                  </td>
                  <td className="num">{wallet?.card?.cardNumber || '—'}</td>
                  <td className="money">{wallet ? money(wallet.balance) : '—'}</td>
                  <td className="num">{customer.phone || '—'}</td>
                  <td className="num">{customer.points}</td>
                </tr>
              );
            })}
            {!customers.length && <tr><td colSpan="8" className="muted">No hay clientes registrados.</td></tr>}
          </tbody>
        </table>
      </section>

      <WalletModal
        key={walletTab || 'closed'}
        open={Boolean(walletTab)}
        initialTab={walletTab || 'create'}
        allowTargetEmail={allowTargetEmail}
        defaultHolder={profile?.displayName || ''}
        onClose={() => setWalletTab(false)}
        onDone={onWalletDone}
      />
    </>
  );
}
