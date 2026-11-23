'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define('PromotionGame', {
    promotionId: { type: DataTypes.UUID, primaryKey: true, references: { model: 'promotions', key: 'id' } },
    videoGameId: { type: DataTypes.UUID, primaryKey: true, references: { model: 'video_games', key: 'id' } },
  }, { tableName: 'promotion_games', timestamps: false });
