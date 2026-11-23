'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define('Role', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    name: { type: DataTypes.STRING(60), allowNull: false, unique: true },
    description: { type: DataTypes.STRING(200) },
  }, { tableName: 'roles' });
