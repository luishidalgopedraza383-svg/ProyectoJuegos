'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define('Sale', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    code: { type: DataTypes.STRING(30), allowNull: false, unique: true },
    cashShiftId: { type: DataTypes.UUID, allowNull: false, references: { model: 'cash_shifts', key: 'id' } },
    customerId: { type: DataTypes.UUID, references: { model: 'customers', key: 'id' } },
    sellerId: { type: DataTypes.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
    subtotal: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    discount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    total: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    status: {
      type: DataTypes.ENUM('completed', 'cancelled', 'returned'),
      allowNull: false,
      defaultValue: 'completed',
    },
    cancelledAt: { type: DataTypes.DATE },
    cancelReason: { type: DataTypes.STRING(300) },
  }, {
    tableName: 'sales',
    indexes: [{ fields: ['status'] }, { fields: ['createdAt'] }],
  });
