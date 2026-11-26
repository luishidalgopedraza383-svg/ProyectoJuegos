'use strict';

const crypto = require('crypto');
const { nodeEnv, jwtExpiresIn } = require('../config/env');
const ApiError = require('./ApiError');

const SESSION_COOKIE = 'pj_session';
const CSRF_COOKIE = 'pj_csrf';
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

const DURATION_UNITS = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };

// JWT_EXPIRES_IN admite valores como 8h, 30m, 1d. Si el formato cambia, se
// mantiene la duración por defecto para no cerrar sesiones antes de tiempo.
const durationMs = (value) => {
  const match = /^(\d+)\s*([smhd])$/i.exec(String(value || '').trim());
  if (!match) return 8 * DURATION_UNITS.h;
  return Number(match[1]) * DURATION_UNITS[match[2].toLowerCase()];
};

const parseCookies = (header = '') => String(header).split(';').reduce((result, part) => {
  const separator = part.indexOf('=');
  if (separator === -1) return result;
  const name = part.slice(0, separator).trim();
  const raw = part.slice(separator + 1).trim();
  if (!name) return result;
  try {
    result[name] = decodeURIComponent(raw);
  } catch (_error) {
    result[name] = raw;
  }
  return result;
}, {});

const baseOptions = () => ({
  path: '/',
  sameSite: 'lax',
  secure: nodeEnv === 'production',
  maxAge: durationMs(jwtExpiresIn),
});

// La cookie de sesión no es legible por JavaScript; la de CSRF sí, para que
// el frontend pueda devolverla en la cabecera X-CSRF-Token.
const setSessionCookies = (res, token) => {
  const csrfToken = crypto.randomBytes(24).toString('hex');
  const options = baseOptions();
  res.cookie(SESSION_COOKIE, token, { ...options, httpOnly: true });
  res.cookie(CSRF_COOKIE, csrfToken, { ...options, httpOnly: false });
  return csrfToken;
};

const clearSessionCookies = (res) => {
  const options = baseOptions();
  res.clearCookie(SESSION_COOKIE, { ...options, httpOnly: true });
  res.clearCookie(CSRF_COOKIE, { ...options, httpOnly: false });
};

const assertCsrf = (req) => {
  const cookieToken = parseCookies(req.headers.cookie)[CSRF_COOKIE];
  const headerToken = req.headers['x-csrf-token'];
  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    throw ApiError.forbidden('Token CSRF inválido o ausente');
  }
};

module.exports = {
  SESSION_COOKIE,
  CSRF_COOKIE,
  SAFE_METHODS,
  durationMs,
  parseCookies,
  setSessionCookies,
  clearSessionCookies,
  assertCsrf,
};
