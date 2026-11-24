'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define('InventoryMovement', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    inventoryItemId: { type: DataTypes.UUID, allowNull: false, references: { model: 'inventory_items', key: 'id' } },
    movementType: {
      type: DataTypes.ENUM('entry', 'exit', 'adjustment', 'sale', 'return'),
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        // Validador propio: la BD ya tiene CHECK (quantity <> 0) como respaldo.
        notZero(value) {
          if (Number(value) === 0) throw new Error('La cantidad no puede ser cero');
        },
      },
    },
    reason: { type: DataTypes.STRING(200) },
    referenceId: { type: DataTypes.UUID },
    createdBy: { type: DataTypes.UUID, references: { model: 'users', key: 'id' } },
  }, { tableName: 'inventory_movements' });
