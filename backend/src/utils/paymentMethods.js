'use strict';

// Reglas puras para elegir los medios de pago que puede usar un usuario en
// el punto de venta. Se separan del servicio para probarlas sin base de datos.

// El banco de una cuenta puede guardarse como código ('BCP') o como nombre
// ('Banco Sol'); se comparan en mayúsculas para cubrir ambos formatos.
const matchesBank = (method, bank) => {
  const value = String(bank || '').trim().toUpperCase();
  return method.code.toUpperCase() === value || method.name.toUpperCase() === value;
};

// Siempre Tarjeta; de los bancos, solo los que coinciden con alguna cuenta
// desde la que se pueda debitar. Así nadie ve un banco con el que no pagará.
const filterPayableMethods = (methods, banks) => methods.filter(
  (method) => method.code === 'CARD' || banks.some((bank) => matchesBank(method, bank)),
);

module.exports = { matchesBank, filterPayableMethods };
