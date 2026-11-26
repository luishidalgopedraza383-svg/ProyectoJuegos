// Bancos disponibles en el formulario de billetera ficticia. Los códigos son
// los mismos que el backend guarda en payment_cards / bank_accounts.
export const BANKS = [
  { code: 'BCP', name: 'BCP', short: 'BCP', color: '#e11d48' },
  { code: 'BNB', name: 'BNB', short: 'BNB', color: '#3b82f6' },
  { code: 'ECONOMICO', name: 'Banco Económico', short: 'BE', color: '#f59e0b' },
  { code: 'UNION', name: 'Banco Unión', short: 'BU', color: '#ef4444' },
  { code: 'MERCANTIL', name: 'Mercantil Santa Cruz', short: 'MSC', color: '#8b5cf6' },
];

export const bankByCode = (code) => BANKS.find((bank) => bank.code === String(code || '').toUpperCase());

export const bankName = (code) => bankByCode(code)?.name || code || 'Banco';
export const bankShort = (code) => bankByCode(code)?.short || 'PV';
export const bankColor = (code) => bankByCode(code)?.color || '#5fa77d';
