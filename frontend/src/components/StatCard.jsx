export default function StatCard({ label, value, hint }) {
  return (
    <div className="card">
      <div className="label">{label}</div>
      <div className="value">{value}</div>
      {hint && <div className="muted" style={{ fontSize: '0.78rem' }}>{hint}</div>}
    </div>
  );
}
