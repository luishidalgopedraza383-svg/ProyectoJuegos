'use strict';

// Bancos que se pueden elegir al crear una billetera ficticia. Los códigos
// coinciden con los de payment_methods para que el POS filtre los medios de
// pago disponibles sin traducciones adicionales.

const BANKS = Object.freeze([
  { code: 'BCP', name: 'BCP' },
  { code: 'BNB', name: 'BNB' },
  { code: 'ECONOMICO', name: 'Banco Económico' },
  { code: 'UNION', name: 'Banco Unión' },
  { code: 'MERCANTIL', name: 'Mercantil Santa Cruz' },
]);

const bankByCode = (code) => BANKS.find((bank) => bank.code === String(code || '').trim().toUpperCase());
const isBankCode = (code) => Boolean(bankByCode(code));

module.exports = { BANKS, bankByCode, isBankCode };
