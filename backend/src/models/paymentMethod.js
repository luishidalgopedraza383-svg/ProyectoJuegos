'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define('PaymentMethod', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    code: { type: DataTypes.STRING(40), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(80), allowNull: false },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  }, { tableName: 'payment_methods' });
