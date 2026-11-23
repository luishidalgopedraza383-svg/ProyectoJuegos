'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define('Permission', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    code: { type: DataTypes.STRING(80), allowNull: false, unique: true },
    description: { type: DataTypes.STRING(200) },
  }, { tableName: 'permissions' });
