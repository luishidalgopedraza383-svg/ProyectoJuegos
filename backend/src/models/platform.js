'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define('Platform', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    name: { type: DataTypes.STRING(80), allowNull: false, unique: true },
    manufacturer: { type: DataTypes.STRING(80) },
  }, { tableName: 'platforms' });
