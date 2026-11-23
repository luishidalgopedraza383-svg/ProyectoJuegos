'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define('RolePermission', {
    roleId: { type: DataTypes.UUID, primaryKey: true, references: { model: 'roles', key: 'id' } },
    permissionId: { type: DataTypes.UUID, primaryKey: true, references: { model: 'permissions', key: 'id' } },
  }, { tableName: 'role_permissions', timestamps: false });
