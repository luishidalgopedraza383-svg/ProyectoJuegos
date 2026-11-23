'use strict';

const ROLE_ID = '11111111-1111-4111-8111-111111111111';
const USER_ID = '22222222-2222-4222-8222-222222222222';
const ADMIN_AUTH_ID = '33333333-3333-4333-8333-333333333333';
const CATEGORY_ID = '44444444-4444-4444-8444-444444444444';
const GENRE_ID = '55555555-5555-4555-8555-555555555555';
const PLATFORM_ID = '66666666-6666-4666-8666-666666666666';

const permissionCodes = [
  'catalog.read', 'catalog.write',
  'inventory.read', 'inventory.write',
  'sales.read', 'sales.write',
  'customers.read', 'customers.write',
  'reports.read',
];

const paymentMethods = [
  { id: '77777777-7777-4777-8777-777777777771', code: 'CASH', name: 'Efectivo' },
  { id: '77777777-7777-4777-8777-777777777772', code: 'CARD', name: 'Tarjeta' },
  { id: '77777777-7777-4777-8777-777777777773', code: 'TRANSFER', name: 'Transferencia' },
];

const games = [
  { id: '88888888-8888-4888-8888-888888888881', title: 'Neon Circuit', sku: 'NEON-001', price: 89900 },
  { id: '88888888-8888-4888-8888-888888888882', title: 'Pixel Quest', sku: 'PIXQ-002', price: 54900 },
  { id: '88888888-8888-4888-8888-888888888883', title: 'Deep Space Outpost', sku: 'DSPO-003', price: 119900 },
];

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    await queryInterface.bulkInsert('roles', [{ id: ROLE_ID, name: 'admin', description: 'Acceso total', created_at: now, updated_at: now }]);

    const permissions = permissionCodes.map((code) => ({ code, description: code, created_at: now, updated_at: now }));
    await queryInterface.bulkInsert('permissions', permissions);
    const stored = await queryInterface.sequelize.query('SELECT id, code FROM permissions', { type: 'SELECT' });
    await queryInterface.bulkInsert('role_permissions', stored.map((row) => ({ role_id: ROLE_ID, permission_id: row.id })));

    await queryInterface.bulkInsert('users', [{
      id: USER_ID,
      auth_user_id: ADMIN_AUTH_ID,
      email: 'admin@proyectojuegos.local',
      display_name: 'Administrador Proyecto Juegos',
      role_id: ROLE_ID,
      is_active: true,
      created_at: now,
      updated_at: now,
    }]);

    await queryInterface.bulkInsert('categories', [{ id: CATEGORY_ID, name: 'Acción', slug: 'accion', created_at: now, updated_at: now }]);
    await queryInterface.bulkInsert('genres', [{ id: GENRE_ID, name: 'Aventura', created_at: now, updated_at: now }]);
    await queryInterface.bulkInsert('platforms', [{ id: PLATFORM_ID, name: 'PC', manufacturer: 'Multiplataforma', created_at: now, updated_at: now }]);

    await queryInterface.bulkInsert('video_games', games.map((game) => ({
      ...game,
      category_id: CATEGORY_ID,
      genre_id: GENRE_ID,
      platform_id: PLATFORM_ID,
      currency: 'COP',
      is_active: true,
      created_at: now,
      updated_at: now,
    })));

    await queryInterface.bulkInsert('inventory_items', games.map((game, index) => ({
      id: `99999999-9999-4999-8999-99999999999${index + 1}`,
      video_game_id: game.id,
      item_type: 'digital_key',
      quantity: 25 + index * 10,
      min_quantity: 5,
      created_at: now,
      updated_at: now,
    })));

    await queryInterface.bulkInsert('payment_methods', paymentMethods.map((method) => ({ ...method, is_active: true, created_at: now, updated_at: now })));
  },

  async down(queryInterface) {
    for (const table of ['payment_methods', 'inventory_items', 'video_games', 'platforms', 'genres', 'categories', 'users', 'role_permissions', 'permissions', 'roles']) {
      await queryInterface.bulkDelete(table, {});
    }
  },
};
