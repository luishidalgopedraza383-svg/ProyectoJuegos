'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define('Category', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    name: { type: DataTypes.STRING(80), allowNull: false, unique: true },
    slug: { type: DataTypes.STRING(80), allowNull: false, unique: true },
  }, { tableName: 'categories' });
