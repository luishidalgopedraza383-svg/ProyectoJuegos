'use strict';

const { DataTypes } = require('sequelize');

// Perfil de negocio. La contraseña se guarda cifrada con scrypt (password_hash)
// y NUNCA se expone en respuestas API (select: false).
module.exports = (sequelize) =>
  sequelize.define('User', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    authUserId: { type: DataTypes.UUID, allowNull: true, unique: true },
    email: { type: DataTypes.STRING(255), allowNull: false, unique: true, validate: { isEmail: true } },
    displayName: { type: DataTypes.STRING(120), allowNull: false },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'password_hash',
      select: false,
    },
    roleId: { type: DataTypes.UUID, references: { model: 'roles', key: 'id' } },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    lastLoginAt: { type: DataTypes.DATE },
  }, { tableName: 'users' });
