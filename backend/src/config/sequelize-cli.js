'use strict';

require('dotenv').config();

const useSsl = String(process.env.DB_SSL || '').toLowerCase() === 'true';
const dialectOptions = useSsl ? { ssl: { require: true, rejectUnauthorized: false } } : {};

const base = { url: process.env.DATABASE_URL, dialect: 'postgres', logging: false, dialectOptions };

module.exports = {
  development: { ...base },
  production: { ...base },
};
