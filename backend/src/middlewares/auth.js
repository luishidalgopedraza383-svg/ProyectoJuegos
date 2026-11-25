'use strict';

const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/env');
const authService = require('../services/authService');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const authenticate = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw ApiError.unauthorized('Se requiere un token Bearer');
  }

  let claims;
  try {
    claims = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] });
  } catch (_error) {
    throw ApiError.unauthorized('Token de acceso inválido o expirado');
  }

  // La identidad se deriva del JWT (sub), nunca de un userId enviado por el cliente.
  const profile = await authService.findProfileByAuthId(claims.sub);
  if (!profile) {
    throw ApiError.forbidden('El usuario no tiene un perfil activo en Proyecto Juegos');
  }

  req.user = {
    id: profile.id,
    authUserId: profile.authUserId,
    email: profile.email,
    displayName: profile.displayName,
    // Misma forma que toPublicProfile (login): { name, description }.
    // El frontend siempre lee profile.role.name, también tras recargar (F5).
    role: profile.role ? { name: profile.role.name, description: profile.role.description } : null,
    permissions: (profile.role?.permissions || []).map((permission) => permission.code),
  };
  req.tokenClaims = claims;

  next();
});

const requirePermission = (...codes) => (req, _res, next) => {
  const granted = req.user?.permissions || [];
  const allowed = codes.every((code) => granted.includes(code));
  if (!allowed) {
    return next(ApiError.forbidden(`Se requiere el permiso: ${codes.join(', ')}`));
  }
  return next();
};

module.exports = { authenticate, requirePermission };
