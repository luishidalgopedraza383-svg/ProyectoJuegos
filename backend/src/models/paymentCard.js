'use strict';

const { DataTypes } = require('sequelize');

// Tarjeta de pago ficticia de una billetera. Un usuario puede tener varias;
// el saldo se debita en la transacción de la venta y nunca queda negativo.
module.exports = (sequelize) =>
  sequelize.define('PaymentCard', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    // Cada tarjeta pertenece a la cuenta de la misma billetera (puede ser NULL
    // en las tarjetas de demostración que existían antes de esta migración).
    bankAccountId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'bank_account_id',
      references: { model: 'bank_accounts', key: 'id' },
    },
    brand: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'BCP' },
    cardNumber: { type: DataTypes.STRING(19), allowNull: false, field: 'card_number' },
    holder: { type: DataTypes.STRING(80), allowNull: false },
    expiry: { type: DataTypes.STRING(7), allowNull: false },
    cvv: { type: DataTypes.STRING(4), allowNull: false, defaultValue: '000' },
    balance: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  }, { tableName: 'payment_cards' });
