'use strict';

require('dotenv').config();

const nodeEnv = process.env.NODE_ENV || 'development';
const requiredInProduction = [
  'DATABASE_URL',
  'SUPABASE_JWT_SECRET',
  'CORS_ORIGIN',
];

if (nodeEnv === 'production') {
  const missing = requiredInProduction.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Variables de entorno obligatorias ausentes: ${missing.join(', ')}`);
  }
}

module.exports = {
  nodeEnv,
  port: Number(process.env.PORT || 4000),
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.SUPABASE_JWT_SECRET,
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  rateLimit: {
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 900000),
    max: Number(process.env.RATE_LIMIT_MAX || 300),
  },
  requestTimeoutMs: Number(process.env.REQUEST_TIMEOUT_MS || 15000),
};
