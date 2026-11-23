'use strict';

const ApiError = require('../utils/ApiError');

const serializeSequelize = (error) => {
  if (error.name === 'SequelizeValidationError') {
    return {
      status: 400,
      message: 'Error de validación de datos',
      details: error.errors.map((item) => ({ field: item.path, message: item.message })),
    };
  }
  if (error.name === 'SequelizeUniqueConstraintError') {
    return {
      status: 409,
      message: 'El registro ya existe',
      details: error.errors.map((item) => ({ field: item.path, message: item.message })),
    };
  }
  if (error.name === 'SequelizeForeignKeyConstraintError') {
    return { status: 400, message: 'Referencia inválida en los datos enviados' };
  }
  return null;
};

module.exports = function errorHandler(err, req, res, _next) {
  let status = err.status || 500;
  let message = err.message || 'Error interno del servidor';
  let details = err.details;

  const sequelized = serializeSequelize(err);
  if (sequelized) {
    status = sequelized.status;
    message = sequelized.message;
    details = sequelized.details;
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    status = 401;
    message = 'Token de acceso inválido o expirado';
    details = undefined;
  }

  if (status >= 500) {
    console.error(`[${req.id}] ${err.name}: ${err.message}`);
    message = 'Error interno del servidor';
    details = undefined;
  }

  res.status(status).json({
    error: {
      code: err instanceof ApiError ? err.name : 'ERROR',
      message,
      details,
      requestId: req.id,
    },
  });
};
