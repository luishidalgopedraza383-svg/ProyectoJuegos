'use strict';

// Generadores puros de datos ficticios. Los números no pertenecen a ninguna
// cuenta real: solo sirven para la demo del punto de venta.

const crypto = require('crypto');

const randomDigits = (length) => Array.from(
  { length },
  () => crypto.randomInt(0, 10),
).join('');

// Último dígito de Luhn: así la tarjeta de prueba también pasa validaciones
// básicas de formato si se usa en otro lado.
const luhnCheckDigit = (partial) => {
  let sum = 0;
  let double = true;
  for (let index = partial.length - 1; index >= 0; index -= 1) {
    let digit = Number(partial[index]);
    if (double) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    double = !double;
  }
  return (10 - (sum % 10)) % 10;
};

const generateAccountNumber = () => `001${randomDigits(13)}`;
const generateCardNumber = () => {
  const partial = `4${randomDigits(14)}`;
  return `${partial}${luhnCheckDigit(partial)}`;
};
const generateExpiry = (now = new Date()) => `12/${String((now.getFullYear() + 4) % 100).padStart(2, '0')}`;
const generateCvv = () => randomDigits(3);

module.exports = {
  randomDigits,
  generateAccountNumber,
  generateCardNumber,
  generateExpiry,
  generateCvv,
};
