'use strict';

const { Op } = require('sequelize');
const jwt = require('jsonwebtoken');
const db = require('../models');
const ApiError = require('../utils/ApiError');
const { hashPassword, verifyPassword } = require('../utils/password');
const walletService = require('./walletService');
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

// Registro público: crea el usuario comprador y su primera billetera ficticia
// en una sola transacción. Devuelve la misma respuesta que /auth/login para
// que el frontend pueda iniciar sesión de inmediato.
const register = async ({ fullName, email, password, bank, initialBalance }) => {
  const cleanEmail = String(email).trim().toLowerCase();
  const existing = await db.User.findOne({ where: { email: { [Op.iLike]: cleanEmail } } });
  if (existing) throw ApiError.conflict('Ya existe una cuenta con ese correo');

  const role = await db.Role.findOne({ where: { name: 'comprador' } });
  if (!role) throw ApiError.conflict('El rol comprador no está configurado');

  const passwordHash = await hashPassword(password);

  return db.sequelize.transaction(async (transaction) => {
    const user = await db.User.create({
      email: cleanEmail,
      displayName: String(fullName).trim(),
      passwordHash,
      roleId: role.id,
      isActive: true,
    }, { transaction });

    const wallet = await walletService.createWallet({
      userId: user.id,
      holder: fullName,
      email: cleanEmail,
      bank,
      initialBalance,
    }, null, { transaction });

    await user.update({ lastLoginAt: new Date() }, { transaction });
    await db.AuditLog.create({
      userId: user.id,
      action: 'USER_REGISTERED',
      entity: 'User',
      entityId: user.id,
      payload: { email: cleanEmail, bank },
    }, { transaction });

    const profile = await db.User.findOne({
      where: { id: user.id },
      include: profileInclude,
      transaction,
    });
    const token = jwt.sign(
      { sub: user.authUserId || user.id, email: user.email },
      jwtSecret,
      { algorithm: 'HS256', expiresIn: jwtExpiresIn },
    );

    return { token, expiresIn: jwtExpiresIn, user: toPublicProfile(profile), wallet };
  });
};

const registerLogin = async (user) => {
  await user.update({ lastLoginAt: new Date() });
};

module.exports = {
  findProfileByAuthId, registerLogin, login, register, toPublicProfile,
};
