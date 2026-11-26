'use strict';

// Require ESTÁTICO de 'pg' a propósito: Sequelize lo carga por nombre dinámico
// (dialect: 'postgres') y el trazador de dependencias de Vercel (nft) solo
// empaqueta los require con cadena literal. Sin esta línea la función serverless
// falla en producción con "Please install pg package manually".
require('pg');

const { Sequelize } = require('sequelize');
const { databaseUrl, dbSsl } = require('./env');

const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres',
  logging: false,
  define: {
    underscored: true,
    freezeTableName: true,
  },
  // SSL solo si se declara explicitamente (Supabase/ RDS). En Docker contra la
  // base de datos local no aplica.
  dialectOptions: dbSsl ? { ssl: { require: true, rejectUnauthorized: false } } : {},
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

module.exports = sequelize;
