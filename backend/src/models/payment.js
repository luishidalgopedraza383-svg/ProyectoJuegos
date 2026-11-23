'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define('Payment', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    saleId: { type: DataTypes.UUID, allowNull: false, references: { model: 'sales', key: 'id' } },
    paymentMethodId: { type: DataTypes.UUID, allowNull: false, references: { model: 'payment_methods', key: 'id' } },
    amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, validate: { min: 0 } },
    reference: { type: DataTypes.STRING(120) },
  }, { tableName: 'payments' });
