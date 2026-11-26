'use strict';

const { DataTypes } = require('sequelize');

// Cliente del programa de puntos. Los creados desde una billetera ficticia
// quedan vinculados al usuario dueño de esa cuenta (user_id).
module.exports = (sequelize) =>
  sequelize.define('Customer', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
      unique: true,
      field: 'user_id',
      references: { model: 'users', key: 'id' },
    },
    email: { type: DataTypes.STRING(255), allowNull: false, unique: true, validate: { isEmail: true } },
    firstName: { type: DataTypes.STRING(100), allowNull: false },
    lastName: { type: DataTypes.STRING(100) },
    phone: { type: DataTypes.STRING(30) },
    points: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, validate: { min: 0 } },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  }, { tableName: 'customers' });
