'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define('InventoryItem', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    videoGameId: { type: DataTypes.UUID, allowNull: false, references: { model: 'video_games', key: 'id' } },
    itemType: {
      type: DataTypes.ENUM('digital_key', 'physical_copy'),
      allowNull: false,
      defaultValue: 'digital_key',
    },
    quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, validate: { min: 0 } },
    minQuantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 5, validate: { min: 0 } },
    location: { type: DataTypes.STRING(80) },
  }, { tableName: 'inventory_items' });
