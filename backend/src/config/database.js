'use strict';

const { Sequelize } = require('sequelize');
const { databaseUrl, nodeEnv } = require('./env');

const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres',
  logging: false,
  define: {
    underscored: true,
    freezeTableName: true,
  },
  dialectOptions:
    nodeEnv === 'production'
      ? { ssl: { require: true, rejectUnauthorized: false } }
      : {},
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

module.exports = sequelize;
