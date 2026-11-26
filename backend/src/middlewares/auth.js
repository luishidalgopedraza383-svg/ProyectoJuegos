'use strict';

const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/env');
const authService = require('../services/authService');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { SESSION_COOKIE, SAFE_METHODS, parseCookies, assertCsrf } = require('../utils/cookies');

// Se acepta Bearer para clientes API y, como forma principal en el navegador,
// la cookie HttpOnly de sesión. Las peticiones con cookie que cambian estado
// deben reenviar el token CSRF en X-CSRF-Token.
const readCredentials = (req) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme === 'Bearer' && token) return { token, fromCookie: false };

  const cookieToken = parseCookies(req.headers.cookie)[SESSION_COOKIE];
  return { token: cookieToken || null, fromCookie: Boolean(cookieToken) };
};

const authenticate = asyncHandler(async (req, _res, next) => {
  const { token, fromCookie } = readCredentials(req);
  if (!token) throw ApiError.unauthorized('Se requiere una sesión activa');

  if (fromCookie && !SAFE_METHODS.has(req.method)) assertCsrf(req);

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
