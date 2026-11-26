'use strict';

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const env = require('./config/env');
const requestId = require('./middlewares/requestId');
const errorHandler = require('./middlewares/errorHandler');
const routes = require('./routes');

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({
  origin: env.corsOrigin.split(',').map((origin) => origin.trim()),
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id', 'X-CSRF-Token'],
  credentials: true,
}));
app.use(rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: 'Demasiadas solicitudes. Intente más tarde.' } },
}));
app.use(express.json({ limit: '1mb' }));
app.use(requestId);

// Portadas subidas por el panel. Se montan antes del no-store para que el
// navegador pueda cachearlas (Nginx las proxya en /uploads, mismo origen).
app.use('/uploads', express.static(env.uploadDir, {
  fallthrough: false,
  setHeaders: (res) => res.setHeader('Cache-Control', 'public, max-age=604800'),
}));

// Nunca cachear respuestas del API (datos de venta/inventario en vivo).
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex');
  next();
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'proyecto-juegos-api', timestamp: new Date().toISOString() });
});

app.use(routes);
app.use(errorHandler);

module.exports = app;
