'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define('CashShift', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    cashierId: { type: DataTypes.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
    openedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    closedAt: { type: DataTypes.DATE },
    openingAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    expectedAmount: { type: DataTypes.DECIMAL(12, 2) },
    countedAmount: { type: DataTypes.DECIMAL(12, 2) },
    differenceAmount: { type: DataTypes.DECIMAL(12, 2) },
    status: { type: DataTypes.ENUM('open', 'closed'), allowNull: false, defaultValue: 'open' },
    notes: { type: DataTypes.STRING(300) },
  }, { tableName: 'cash_shifts' });
