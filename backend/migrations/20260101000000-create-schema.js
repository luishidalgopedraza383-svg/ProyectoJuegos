'use strict';

const fs = require('fs');
const path = require('path');

// Funciona en el repo (backend/migrations -> ../../database) y dentro del
// contenedor (/app/migrations -> ../database).
const resolveSchema = () => {
  const candidates = [
    path.resolve(__dirname, '../database/schema.sql'),
    path.resolve(__dirname, '../../database/schema.sql'),
  ];
  const found = candidates.find((candidate) => fs.existsSync(candidate));
  if (!found) {
    throw new Error(`No se encontró database/schema.sql. Buscado en: ${candidates.join(', ')}`);
  }
  return found;
};

module.exports = {
  async up(queryInterface) {
    const sql = fs.readFileSync(resolveSchema(), 'utf8');
    await queryInterface.sequelize.query(sql);
  },

  async down(queryInterface) {
    const tables = [
      'audit_logs', 'sale_returns', 'promotion_games', 'promotions',
      'payments', 'sale_details', 'sales', 'cash_shifts', 'payment_methods',
      'loyalty_movements', 'customers', 'inventory_movements', 'inventory_items',
      'video_games', 'platforms', 'genres', 'categories',
      'payment_cards', 'users', 'role_permissions', 'permissions', 'roles',
    ];
    for (const table of tables) {
      await queryInterface.dropTable(table);
    }
  },
};
