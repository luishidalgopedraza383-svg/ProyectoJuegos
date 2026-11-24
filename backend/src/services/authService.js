'use strict';

const { Op } = require('sequelize');
const jwt = require('jsonwebtoken');
const db = require('../models');
const ApiError = require('../utils/ApiError');
const { verifyPassword } = require('../utils/password');
const { jwtSecret, jwtExpiresIn } = require('../config/env');

const profileInclude = [
  { model: db.Role, as: 'role', include: [{ model: db.Permission, as: 'permissions' }] },
];

const permissionCodes = (user) => (user?.role?.permissions || []).map((permission) => permission.code);

// El sub del JWT puede ser authUserId (identidad externa) o el id interno del usuario.
const findProfileByAuthId = (authUserId) =>
  db.User.findOne({
    where: { [Op.or]: [{ authUserId }, { id: authUserId }], isActive: true },
    include: profileInclude,
  });

const toPublicProfile = (user) => ({
  id: user.id,
  authUserId: user.authUserId,
  email: user.email,
  displayName: user.displayName,
  role: user.role ? { name: user.role.name, description: user.role.description } : null,
  permissions: permissionCodes(user),
  lastLoginAt: user.lastLoginAt,
});

const login = async ({ email, password }) => {
  const user = await db.User.findOne({
    where: { email: { [Op.iLike]: String(email).trim() } },
    attributes: { include: ['passwordHash'] },
    include: profileInclude,
  });

  // Mensaje identico exista o no el correo: no se revela si la cuenta existe.
  const valid = user && user.passwordHash && await verifyPassword(password, user.passwordHash);
  if (!valid) throw ApiError.unauthorized('Correo o contraseña incorrectos');
  if (!user.isActive) throw ApiError.forbidden('La cuenta está desactivada');

  const token = jwt.sign(
    { sub: user.authUserId || user.id, email: user.email },
    jwtSecret,
    { algorithm: 'HS256', expiresIn: jwtExpiresIn },
  );

  await user.update({ lastLoginAt: new Date() });
  return { token, expiresIn: jwtExpiresIn, user: toPublicProfile(user) };
};

const registerLogin = async (user) => {
  await user.update({ lastLoginAt: new Date() });
};

module.exports = { findProfileByAuthId, registerLogin, login, toPublicProfile };
