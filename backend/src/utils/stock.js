'use strict';

// Cantidad firmada que se aplica al stock según el tipo de movimiento:
// las entradas suman, las salidas restan (el usuario siempre indica una
// cantidad positiva) y los ajustes respetan el signo enviado.
const signedQuantity = (movementType, quantity) => {
  if (movementType === 'entry') return Math.abs(quantity);
  if (movementType === 'exit') return -Math.abs(quantity);
  return quantity;
};

module.exports = { signedQuantity };
