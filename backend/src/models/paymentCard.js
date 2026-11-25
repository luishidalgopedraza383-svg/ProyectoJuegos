'use strict';

const { DataTypes } = require('sequelize');

// Tarjeta de pago ficticia (demo, marca BCP): una por usuario. El saldo se
// debita en la transacción de la venta y nunca puede quedar negativo.
module.exports = (sequelize) =>
  sequelize.define('PaymentCard', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: { model: 'users', key: 'id' },
    },
    brand: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'BCP' },
    cardNumber: { type: DataTypes.STRING(19), allowNull: false, field: 'card_number' },
    holder: { type: DataTypes.STRING(80), allowNull: false },
    expiry: { type: DataTypes.STRING(7), allowNull: false },
    balance: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  }, { tableName: 'payment_cards' });
