'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define('AuditLog', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    userId: { type: DataTypes.UUID, references: { model: 'users', key: 'id' } },
    action: { type: DataTypes.STRING(80), allowNull: false },
    entity: { type: DataTypes.STRING(60), allowNull: false },
    entityId: { type: DataTypes.UUID },
    payload: { type: DataTypes.JSONB },
    ip: { type: DataTypes.STRING(45) },
    userAgent: { type: DataTypes.STRING(255) },
  }, {
    tableName: 'audit_logs',
    updatedAt: false,
    indexes: [{ fields: ['action'] }, { fields: ['createdAt'] }],
  });
