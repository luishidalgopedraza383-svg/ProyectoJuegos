'use strict';

const fs = require('fs');
const path = require('path');

module.exports = {
  async up(queryInterface) {
    const sqlPath = path.resolve(__dirname, '../../database/schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    await queryInterface.sequelize.query(sql);
  },

  async down(queryInterface) {
    const tables = [
      'audit_logs', 'sale_returns', 'promotion_games', 'promotions',
      'payments', 'sale_details', 'sales', 'cash_shifts', 'payment_methods',
      'loyalty_movements', 'customers', 'inventory_movements', 'inventory_items',
      'video_games', 'platforms', 'genres', 'categories',
      'users', 'role_permissions', 'permissions', 'roles',
    ];
    for (const table of tables) {
      await queryInterface.dropTable(table);
    }
  },
};
