'use strict';

const path = require('path');
require('dotenv').config();

const nodeEnv = process.env.NODE_ENV || 'development';

// En producción deben venir del entorno; en desarrollo se permite un valor por defecto
// para que el proyecto arranque sin configuración previa.
const requiredInProduction = ['DATABASE_URL', 'JWT_SECRET', 'CORS_ORIGIN'];

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
  dbSsl: String(process.env.DB_SSL || '').toLowerCase() === 'true',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-cambiar-en-produccion',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  // Portadas subidas desde el panel. En Docker es un volumen persistente.
  uploadDir: process.env.UPLOAD_DIR || path.resolve(__dirname, '..', '..', 'uploads'),
  maxUploadBytes: Number(process.env.MAX_UPLOAD_BYTES || 2 * 1024 * 1024),
  rateLimit: {
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 900000),
    max: Number(process.env.RATE_LIMIT_MAX || 300),
  },
  requestTimeoutMs: Number(process.env.REQUEST_TIMEOUT_MS || 15000),
};
