'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define('LoyaltyMovement', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    customerId: { type: DataTypes.UUID, allowNull: false, references: { model: 'customers', key: 'id' } },
    points: { type: DataTypes.INTEGER, allowNull: false, validate: { notEqual: 0 } },
    concept: { type: DataTypes.STRING(160), allowNull: false },
    referenceId: { type: DataTypes.UUID },
  }, { tableName: 'loyalty_movements' });
