'use strict';

// Hash de contraseñas con scrypt (nativo de Node, sin dependencias externas).
// Formato: scrypt$N$r$p$salt$hash  (todo en base64url)
const crypto = require('crypto');
const { promisify } = require('util');

const scrypt = promisify(crypto.scrypt);

const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 64 };
const PREFIX = 'scrypt';

const hashPassword = async (password) => {
  const salt = crypto.randomBytes(16);
  const key = await scrypt(String(password), salt, SCRYPT.keylen, {
    N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p,
  });
  return [
    PREFIX, SCRYPT.N, SCRYPT.r, SCRYPT.p,
    salt.toString('base64url'), key.toString('base64url'),
  ].join('$');
};

const verifyPassword = async (password, stored) => {
  if (typeof stored !== 'string') return false;
  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== PREFIX) return false;

  const [, n, r, p, saltB64, keyB64] = parts;
  const expected = Buffer.from(keyB64, 'base64url');
  if (!expected.length) return false;

  let derived;
  try {
    derived = await scrypt(String(password), Buffer.from(saltB64, 'base64url'), expected.length, {
      N: Number(n), r: Number(r), p: Number(p),
    });
  } catch (_error) {
    return false;
  }

  return derived.length === expected.length && crypto.timingSafeEqual(derived, expected);
};

module.exports = { hashPassword, verifyPassword };
