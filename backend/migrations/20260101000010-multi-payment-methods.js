'use strict';

// La demo vuelve a aceptar tres medios de pago: Tarjeta, Efectivo y
// Transferencia. Las tarjetas siguen en payment_cards; para Transferencia se
// crea una cuenta bancaria ficticia por comprador con saldo propio.

const { DataTypes } = require('sequelize');

const METHODS = [
  { id: '77777777-7777-4777-8777-777777777771', code: 'CASH', name: 'Efectivo' },
  { id: '77777777-7777-4777-8777-777777777772', code: 'CARD', name: 'Tarjeta' },
  { id: '77777777-7777-4777-8777-777777777773', code: 'TRANSFER', name: 'Transferencia' },
];

module.exports = {
  async up(queryInterface) {
    const sequelize = queryInterface.sequelize;
    const query = (sql, replacements) => sequelize.query(sql, { replacements });

    for (const method of METHODS) {
      await query(
        `INSERT INTO payment_methods (id, code, name, is_active, created_at, updated_at)
         VALUES (:id, :code, :name, true, now(), now())
         ON CONFLICT (id) DO UPDATE
           SET name = EXCLUDED.name, is_active = true, updated_at = now()`,
        method,
      );
    }

    // Idempotente: en una BD nueva schema.sql ya creó la tabla.
    const tables = await queryInterface.showAllTables();
    const exists = tables.some((table) => String(table).toLowerCase() === 'bank_accounts');
    if (!exists) {
      await queryInterface.createTable('bank_accounts', {
        id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        user_id: {
          type: DataTypes.UUID,
          allowNull: false,
          unique: true,
          references: { model: 'users', key: 'id' },
        },
        bank: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'BCP' },
        account_number: { type: DataTypes.STRING(20), allowNull: false },
        holder: { type: DataTypes.STRING(80), allowNull: false },
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
    }
  },

  async down(queryInterface) {
    const sequelize = queryInterface.sequelize;
    // No se borran métodos que ya puedan tener pagos históricos: solo se
    // desactivan para que el POS deje de ofrecerlos.
    await sequelize.query(
      `UPDATE payment_methods SET is_active = false, updated_at = now()
       WHERE code IN ('CASH', 'TRANSFER')`,
    );
    const tables = await queryInterface.showAllTables();
    const exists = tables.some((table) => String(table).toLowerCase() === 'bank_accounts');
    if (exists) await queryInterface.dropTable('bank_accounts');
  },
};
