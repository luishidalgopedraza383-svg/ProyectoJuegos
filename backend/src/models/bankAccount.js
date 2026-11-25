'use strict';

const { DataTypes } = require('sequelize');

// Cuenta bancaria ficticia (demo) usada por el medio de pago Transferencia.
// Igual que la tarjeta, se debita dentro de la transacción de la venta.
module.exports = (sequelize) =>
  sequelize.define('BankAccount', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      field: 'user_id',
      references: { model: 'users', key: 'id' },
    },
    bank: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'BCP' },
    accountNumber: { type: DataTypes.STRING(20), allowNull: false, field: 'account_number' },
    holder: { type: DataTypes.STRING(80), allowNull: false },
    balance: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  }, { tableName: 'bank_accounts' });
