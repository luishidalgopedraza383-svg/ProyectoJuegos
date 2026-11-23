'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define('SaleDetail', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    saleId: { type: DataTypes.UUID, allowNull: false, references: { model: 'sales', key: 'id' } },
    videoGameId: { type: DataTypes.UUID, allowNull: false, references: { model: 'video_games', key: 'id' } },
    quantity: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1 } },
    unitPrice: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    discount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    subtotal: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  }, { tableName: 'sale_details' });
