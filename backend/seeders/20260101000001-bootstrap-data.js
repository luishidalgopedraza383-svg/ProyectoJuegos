'use strict';

// Datos iniciales: roles/permisos, 4 cuentas (1 admin + 3 usuarios),
// plataformas PlayStation / Xbox / Nintendo / PC, videojuegos e inventario.
// Es idempotente: puede re-ejecutarse y repone los datos de demostración.

const { Op } = require('sequelize');
const { hashPassword } = require('../src/utils/password');

const ROLE_IDS = {
  admin: '11111111-1111-4111-8111-111111111111',
  gerente: '11111111-1111-4111-8111-111111111112',
  cajero: '11111111-1111-4111-8111-111111111113',
};

const permissions = [
  { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0001', code: 'catalog.read', description: 'Ver el catálogo de videojuegos' },
  { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0002', code: 'catalog.write', description: 'Crear y editar videojuegos' },
  { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0003', code: 'inventory.read', description: 'Ver inventario' },
  { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0004', code: 'inventory.write', description: 'Modificar stock' },
  { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0005', code: 'sales.read', description: 'Ver ventas y turnos' },
  { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0006', code: 'sales.write', description: 'Registrar ventas y turnos' },
  { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0007', code: 'customers.read', description: 'Ver clientes' },
  { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0008', code: 'customers.write', description: 'Crear clientes' },
  { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0009', code: 'reports.read', description: 'Ver reportes' },
  { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0010', code: 'users.write', description: 'Administrar cuentas de usuario' },
];

const allCodes = permissions.map((permission) => permission.code);

const roles = [
  { id: ROLE_IDS.admin, name: 'admin', description: 'Acceso total, incluye administración de usuarios', codes: allCodes },
  {
    id: ROLE_IDS.gerente,
    name: 'gerente',
    description: 'Gestiona catálogo, stock, ventas y reportes',
    codes: [
      'catalog.read', 'catalog.write',
      'inventory.read', 'inventory.write',
      'sales.read', 'sales.write',
      'customers.read', 'customers.write',
      'reports.read',
    ],
  },
  {
    id: ROLE_IDS.cajero,
    name: 'cajero',
    description: 'Atiende ventas en el punto de venta',
    codes: ['catalog.read', 'inventory.read', 'sales.read', 'sales.write', 'customers.read', 'customers.write'],
  },
];

// 1 administrador + 3 usuarios. Credenciales de demostración (cambiar en producción).
const users = [
  { id: '22222222-2222-4222-8222-222222222221', authUserId: '33333333-3333-4333-8333-333333333331', email: 'admin@proyectojuegos.local', displayName: 'Administrador General', role: 'admin', password: 'Admin2026!' },
  { id: '22222222-2222-4222-8222-222222222222', authUserId: '33333333-3333-4333-8333-333333333332', email: 'gerente@proyectojuegos.local', displayName: 'Gerente de Tienda', role: 'gerente', password: 'Gerente2026!' },
  { id: '22222222-2222-4222-8222-222222222223', authUserId: '33333333-3333-4333-8333-333333333333', email: 'vendedor@proyectojuegos.local', displayName: 'Vendedor Uno', role: 'cajero', password: 'Vendedor2026!' },
  { id: '22222222-2222-4222-8222-222222222224', authUserId: '33333333-3333-4333-8333-333333333334', email: 'cajero@proyectojuegos.local', displayName: 'Cajero Uno', role: 'cajero', password: 'Cajero2026!' },
];

const categories = [
  { id: '44444444-4444-4444-8444-444444444441', name: 'Acción', slug: 'accion' },
  { id: '44444444-4444-4444-8444-444444444442', name: 'Aventura', slug: 'aventura' },
  { id: '44444444-4444-4444-8444-444444444443', name: 'RPG', slug: 'rpg' },
  { id: '44444444-4444-4444-8444-444444444444', name: 'Deportes', slug: 'deportes' },
  { id: '44444444-4444-4444-8444-444444444445', name: 'Carreras', slug: 'carreras' },
  { id: '44444444-4444-4444-8444-444444444446', name: 'Plataformas', slug: 'plataformas' },
];

const genres = [
  { id: '55555555-5555-4555-8555-555555555551', name: 'Acción' },
  { id: '55555555-5555-4555-8555-555555555552', name: 'Aventura' },
  { id: '55555555-5555-4555-8555-555555555553', name: 'RPG' },
  { id: '55555555-5555-4555-8555-555555555554', name: 'Deportes' },
  { id: '55555555-5555-4555-8555-555555555555', name: 'Carreras' },
  { id: '55555555-5555-4555-8555-555555555556', name: 'Plataformas' },
];

const platforms = [
  { id: '66666666-6666-4666-8666-666666666661', name: 'PlayStation 5', manufacturer: 'Sony' },
  { id: '66666666-6666-4666-8666-666666666662', name: 'Xbox Series X|S', manufacturer: 'Microsoft' },
  { id: '66666666-6666-4666-8666-666666666663', name: 'Nintendo Switch', manufacturer: 'Nintendo' },
  { id: '66666666-6666-4666-8666-666666666664', name: 'PC', manufacturer: 'Multiplataforma' },
];

const byName = (list) => Object.fromEntries(list.map((item) => [item.name, item.id]));
const categoryIds = byName(categories);
const genreIds = byName(genres);
const platformIds = byName(platforms);

const games = [
  { id: '88888888-8888-4888-8888-888888888801', title: 'God of War Ragnarök', sku: 'PS5-GOWR-001', price: 249900, platform: 'PlayStation 5', category: 'Acción', genre: 'Acción', ageRating: 'M', stock: 30, itemType: 'physical_copy', description: 'Kratos y Atreus enfrentan el fin del mundo nórdico.' },
  { id: '88888888-8888-4888-8888-888888888802', title: "Marvel's Spider-Man 2", sku: 'PS5-SM2-002', price: 239900, platform: 'PlayStation 5', category: 'Acción', genre: 'Acción', ageRating: 'T', stock: 25, itemType: 'physical_copy', description: 'Peter Parker y Miles Morales protegen Nueva York.' },
  { id: '88888888-8888-4888-8888-888888888803', title: 'Gran Turismo 7', sku: 'PS5-GT7-003', price: 199900, platform: 'PlayStation 5', category: 'Deportes', genre: 'Carreras', ageRating: 'E', stock: 20, itemType: 'physical_copy', description: 'Simulador de automovilismo con más de 400 vehículos.' },
  { id: '88888888-8888-4888-8888-888888888804', title: 'The Last of Us Part II Remastered', sku: 'PS5-TLOU2-004', price: 219900, platform: 'PlayStation 5', category: 'Acción', genre: 'Aventura', ageRating: 'M', stock: 15, itemType: 'physical_copy', description: 'La supervivencia de Ellie en un mundo hostil.' },
  { id: '88888888-8888-4888-8888-888888888805', title: 'Forza Horizon 5', sku: 'XSS-FH5-005', price: 189900, platform: 'Xbox Series X|S', category: 'Carreras', genre: 'Carreras', ageRating: 'E', stock: 30, itemType: 'digital_key', description: 'Carreras abiertas en México con más de 500 autos.' },
  { id: '88888888-8888-4888-8888-888888888806', title: 'Halo Infinite', sku: 'XSS-HALO-006', price: 179900, platform: 'Xbox Series X|S', category: 'Acción', genre: 'Acción', ageRating: 'T', stock: 25, itemType: 'digital_key', description: 'El Jefe Maestro enfrenta los Banished en Zeta Halo.' },
  { id: '88888888-8888-4888-8888-888888888807', title: 'Starfield', sku: 'XSS-STAR-007', price: 229900, platform: 'Xbox Series X|S', category: 'RPG', genre: 'RPG', ageRating: 'M', stock: 20, itemType: 'digital_key', description: 'RPG espacial de Bethesda con más de 1000 planetas.' },
  { id: '88888888-8888-4888-8888-888888888808', title: 'Gears 5', sku: 'XSS-GEARS-008', price: 149900, platform: 'Xbox Series X|S', category: 'Acción', genre: 'Acción', ageRating: 'M', stock: 18, itemType: 'digital_key', description: 'La campaña de Kait Diaz en la guerra contra los Locust.' },
  { id: '88888888-8888-4888-8888-888888888809', title: 'The Legend of Zelda: Tears of the Kingdom', sku: 'NSW-ZELDA-009', price: 259900, platform: 'Nintendo Switch', category: 'Aventura', genre: 'Aventura', ageRating: 'E10+', stock: 35, itemType: 'physical_copy', description: 'Link explora Hyrule desde las islas flotantes.' },
  { id: '88888888-8888-4888-8888-888888888810', title: 'Super Mario Odyssey', sku: 'NSW-MARIO-010', price: 199900, platform: 'Nintendo Switch', category: 'Plataformas', genre: 'Plataformas', ageRating: 'E', stock: 40, itemType: 'physical_copy', description: 'Mario y Cappy rescatan a la Princesa Peach.' },
  { id: '88888888-8888-4888-8888-888888888811', title: 'Mario Kart 8 Deluxe', sku: 'NSW-MK8-011', price: 179900, platform: 'Nintendo Switch', category: 'Carreras', genre: 'Carreras', ageRating: 'E', stock: 45, itemType: 'physical_copy', description: 'Karts, bicicletas y planeadores en 48 circuitos.' },
  { id: '88888888-8888-4888-8888-888888888812', title: 'Metroid Dread', sku: 'NSW-METROID-012', price: 199900, platform: 'Nintendo Switch', category: 'Acción', genre: 'Acción', ageRating: 'T', stock: 22, itemType: 'physical_copy', description: 'Samus Aran investiga los misterios de Planet ZDR.' },
  { id: '88888888-8888-4888-8888-888888888813', title: 'Elden Ring', sku: 'PC-ELDEN-013', price: 219900, platform: 'PC', category: 'RPG', genre: 'RPG', ageRating: 'M', stock: 28, itemType: 'digital_key', description: 'Action RPG de FromSoftware en las Tierras Intermedias.' },
  { id: '88888888-8888-4888-8888-888888888814', title: 'Cyberpunk 2077', sku: 'PC-CYBER-014', price: 199900, platform: 'PC', category: 'RPG', genre: 'RPG', ageRating: 'M', stock: 24, itemType: 'digital_key', description: 'Night City, mercenarios y megacorporaciones.' },
];

const paymentMethods = [
  { id: '77777777-7777-4777-8777-777777777771', code: 'CASH', name: 'Efectivo' },
  { id: '77777777-7777-4777-8777-777777777772', code: 'CARD', name: 'Tarjeta' },
  { id: '77777777-7777-4777-8777-777777777773', code: 'TRANSFER', name: 'Transferencia' },
];

const seededTableOrder = [
  'audit_logs', 'sale_returns', 'promotion_games', 'promotions',
  'payments', 'sale_details', 'sales', 'cash_shifts',
  'loyalty_movements', 'customers', 'inventory_movements',
  'inventory_items', 'video_games', 'platforms', 'genres', 'categories',
  'role_permissions', 'permissions', 'users', 'roles', 'payment_methods',
];

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    // Si el sistema ya está sembrado, no se toca nada (evita borrar ventas y
    // clientes en cada reinicio del contenedor). Para regenerar la demo:
    //   docker compose down -v && docker compose up -d --build
    const [status] = await queryInterface.sequelize.query(
      'SELECT (SELECT count(*) FROM users) AS users, (SELECT count(*) FROM video_games) AS games',
      { type: 'SELECT' },
    );
    if (Number(status.users) >= users.length && Number(status.games) > 0) {
      return;
    }

    // Limpieza idempotente (permite re-ejecutar el seeder de demostración).
    for (const table of seededTableOrder) {
      await queryInterface.bulkDelete(table, {});
    }

    await queryInterface.bulkInsert('roles', roles.map(({ id, name, description }) => ({
      id, name, description, created_at: now, updated_at: now,
    })));

    await queryInterface.bulkInsert('permissions', permissions.map((permission) => ({
      ...permission, created_at: now, updated_at: now,
    })));

    const rolePermissionRows = [];
    roles.forEach((role) => {
      role.codes.forEach((code) => {
        const permission = permissions.find((item) => item.code === code);
        rolePermissionRows.push({ role_id: role.id, permission_id: permission.id });
      });
    });
    await queryInterface.bulkInsert('role_permissions', rolePermissionRows);

    const hashes = await Promise.all(users.map((user) => hashPassword(user.password)));
    await queryInterface.bulkInsert('users', users.map((user, index) => ({
      id: user.id,
      auth_user_id: user.authUserId,
      email: user.email,
      display_name: user.displayName,
      password_hash: hashes[index],
      role_id: ROLE_IDS[user.role],
      is_active: true,
      created_at: now,
      updated_at: now,
    })));

    await queryInterface.bulkInsert('categories', categories.map((item) => ({
      ...item, created_at: now, updated_at: now,
    })));
    await queryInterface.bulkInsert('genres', genres.map((item) => ({
      ...item, created_at: now, updated_at: now,
    })));
    await queryInterface.bulkInsert('platforms', platforms.map((item) => ({
      ...item, created_at: now, updated_at: now,
    })));

    await queryInterface.bulkInsert('video_games', games.map((game) => ({
      id: game.id,
      title: game.title,
      description: game.description,
      sku: game.sku,
      category_id: categoryIds[game.category],
      genre_id: genreIds[game.genre],
      platform_id: platformIds[game.platform],
      price: game.price,
      currency: 'COP',
      age_rating: game.ageRating,
      is_active: true,
      created_at: now,
      updated_at: now,
    })));

    await queryInterface.bulkInsert('inventory_items', games.map((game, index) => ({
      id: `99999999-9999-4999-8999-9999999999${String(index + 1).padStart(2, '0')}`,
      video_game_id: game.id,
      item_type: game.itemType,
      quantity: game.stock,
      min_quantity: 10,
      created_at: now,
      updated_at: now,
    })));

    await queryInterface.bulkInsert('payment_methods', paymentMethods.map((method) => ({
      ...method, is_active: true, created_at: now, updated_at: now,
    })));
  },

  async down(queryInterface) {
    for (const table of seededTableOrder) {
      await queryInterface.bulkDelete(table, {});
    }
  },
};
