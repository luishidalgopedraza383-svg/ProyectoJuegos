'use strict';

const { DataTypes } = require('sequelize');

// La identidad y las credenciales viven en Supabase Auth.
// Esta tabla solo guarda el perfil de negocio; nunca passwordHash.
module.exports = (sequelize) =>
  sequelize.define('User', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    authUserId: { type: DataTypes.UUID, allowNull: false, unique: true },
    email: { type: DataTypes.STRING(255), allowNull: false, unique: true, validate: { isEmail: true } },
    displayName: { type: DataTypes.STRING(120), allowNull: false },
    roleId: { type: DataTypes.UUID, references: { model: 'roles', key: 'id' } },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    lastLoginAt: { type: DataTypes.DATE },
  }, { tableName: 'users' });
