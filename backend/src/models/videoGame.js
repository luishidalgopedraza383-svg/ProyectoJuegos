'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define('VideoGame', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    title: { type: DataTypes.STRING(180), allowNull: false },
    description: { type: DataTypes.TEXT },
    sku: { type: DataTypes.STRING(40), allowNull: false, unique: true },
    categoryId: { type: DataTypes.UUID, references: { model: 'categories', key: 'id' } },
    genreId: { type: DataTypes.UUID, references: { model: 'genres', key: 'id' } },
    platformId: { type: DataTypes.UUID, references: { model: 'platforms', key: 'id' } },
    price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: { min: 10, max: 60, isInt: { msg: 'El precio debe ser un número entero' } },
    },
    currency: { type: DataTypes.CHAR(3), allowNull: false, defaultValue: 'USD' },
    releaseDate: { type: DataTypes.DATEONLY },
    ageRating: { type: DataTypes.STRING(10) },
    imageUrl: { type: DataTypes.STRING(500), allowNull: true, field: 'image_url' },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  }, {
    tableName: 'video_games',
    indexes: [{ fields: ['title'] }, { fields: ['isActive'] }],
  });
