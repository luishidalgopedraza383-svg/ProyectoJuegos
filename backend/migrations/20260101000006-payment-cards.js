'use strict';

const { DataTypes } = require('sequelize');

// Tabla idempotente: en una BD nueva ya la creó create-schema desde
// schema.sql; aquí se crea solo si falta (BDs creadas antes de este cambio).
module.exports = {
  async up(queryInterface) {
    const tables = await queryInterface.showAllTables();
    const name = tables.find((table) => String(table).toLowerCase() === 'payment_cards');
    if (name) return;

    await queryInterface.createTable('payment_cards', {
      id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
        references: { model: 'users', key: 'id' },
      },
      brand: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'BCP' },
      card_number: { type: DataTypes.STRING(19), allowNull: false },
      holder: { type: DataTypes.STRING(80), allowNull: false },
      expiry: { type: DataTypes.STRING(7), allowNull: false },
      balance: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
        validate: { min: 0 },
      },
      is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    });
  },

  async down(queryInterface) {
    const tables = await queryInterface.showAllTables();
    const name = tables.find((table) => String(table).toLowerCase() === 'payment_cards');
    if (name) await queryInterface.dropTable('payment_cards');
  },
};
