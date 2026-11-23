'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define('SaleReturn', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    saleId: { type: DataTypes.UUID, allowNull: false, references: { model: 'sales', key: 'id' } },
    reason: { type: DataTypes.STRING(300), allowNull: false },
    amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    authorizedBy: { type: DataTypes.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
  }, { tableName: 'sale_returns' });
