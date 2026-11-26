'use strict';

// Datos iniciales: roles/permisos, 6 cuentas (4 de operación + 2 compradores),
// plataformas Xbox / PC (claves digitales), videojuegos, inventario y una
// tarjeta BCP ficticia por comprador.
// Es idempotente: puede re-ejecutarse y repone los datos de demostración.

const { Op } = require('sequelize');
const { hashPassword } = require('../src/utils/password');

const ROLE_IDS = {
  admin: '11111111-1111-4111-8111-111111111111',
  gerente: '11111111-1111-4111-8111-111111111112',
  cajero: '11111111-1111-4111-8111-111111111113',
  comprador: '11111111-1111-4111-8111-111111111114',
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
  // Sin sales.readAll solo ves tus propias ventas; sin sales.cancel no anulas.
  { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0011', code: 'sales.readAll', description: 'Ver el historial de todas las ventas' },
  { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0012', code: 'sales.cancel', description: 'Anular ventas y registrar devoluciones' },
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
      'sales.read', 'sales.write', 'sales.readAll', 'sales.cancel',
      'customers.read', 'customers.write',
      'reports.read',
    ],
  },
  {
    id: ROLE_IDS.cajero,
    name: 'cajero',
    description: 'Atiende ventas en el punto de venta',
    codes: ['catalog.read', 'inventory.read', 'sales.read', 'sales.write', 'sales.readAll', 'sales.cancel', 'customers.read', 'customers.write'],
  },
  {
    id: ROLE_IDS.comprador,
    name: 'comprador',
    description: 'Solo compra en la tienda: ve el catálogo, paga con su tarjeta y consulta sus compras',
    codes: ['catalog.read', 'sales.read', 'sales.write'],
  },
];

// Cuentas de demostración (cambiar en producción): 4 de operación y
// 2 compradores, que solo pueden comprar.
const users = [
  { id: '22222222-2222-4222-8222-222222222221', authUserId: '33333333-3333-4333-8333-333333333331', email: 'admin@proyectojuegos.local', displayName: 'Administrador General', role: 'admin', password: 'Admin2026!' },
  { id: '22222222-2222-4222-8222-222222222222', authUserId: '33333333-3333-4333-8333-333333333332', email: 'gerente@proyectojuegos.local', displayName: 'Gerente de Tienda', role: 'gerente', password: 'Gerente2026!' },
  { id: '22222222-2222-4222-8222-222222222223', authUserId: '33333333-3333-4333-8333-333333333333', email: 'vendedor@proyectojuegos.local', displayName: 'Vendedor Uno', role: 'cajero', password: 'Vendedor2026!' },
  { id: '22222222-2222-4222-8222-222222222224', authUserId: '33333333-3333-4333-8333-333333333334', email: 'cajero@proyectojuegos.local', displayName: 'Cajero Uno', role: 'cajero', password: 'Cajero2026!' },
  { id: '22222222-2222-4222-8222-222222222225', authUserId: '33333333-3333-4333-8333-333333333335', email: 'comprador1@proyectojuegos.local', displayName: 'Comprador Uno', role: 'comprador', password: 'Comprador2026!' },
  { id: '22222222-2222-4222-8222-222222222226', authUserId: '33333333-3333-4333-8333-333333333336', email: 'comprador2@proyectojuegos.local', displayName: 'Comprador Dos', role: 'comprador', password: 'Comprador2026!' },
];

const categories = [
  { id: '44444444-4444-4444-8444-444444444441', name: 'Acción', slug: 'accion' },
  { id: '44444444-4444-4444-8444-444444444442', name: 'Aventura', slug: 'aventura' },
  { id: '44444444-4444-4444-8444-444444444443', name: 'RPG', slug: 'rpg' },
  { id: '44444444-4444-4444-8444-444444444444', name: 'Deportes', slug: 'deportes' },
  { id: '44444444-4444-4444-8444-444444444445', name: 'Carreras', slug: 'carreras' },
  { id: '44444444-4444-4444-8444-444444444446', name: 'Plataformas', slug: 'plataformas' },
  { id: '44444444-4444-4444-8444-444444444447', name: 'Terror', slug: 'terror' },
  { id: '44444444-4444-4444-8444-444444444448', name: 'Lucha', slug: 'lucha' },
];

const genres = [
  { id: '55555555-5555-4555-8555-555555555551', name: 'Acción' },
  { id: '55555555-5555-4555-8555-555555555552', name: 'Aventura' },
  { id: '55555555-5555-4555-8555-555555555553', name: 'RPG' },
  { id: '55555555-5555-4555-8555-555555555554', name: 'Deportes' },
  { id: '55555555-5555-4555-8555-555555555555', name: 'Carreras' },
  { id: '55555555-5555-4555-8555-555555555556', name: 'Plataformas' },
  { id: '55555555-5555-4555-8555-555555555557', name: 'Terror' },
  { id: '55555555-5555-4555-8555-555555555558', name: 'Lucha' },
  { id: '55555555-5555-4555-8555-555555555559', name: 'Shooter' },
];

// PlayStation y Nintendo dejaron de entregar claves a tiendas virtuales
// externas: solo se comercializan claves de Xbox (clásica y Series X|S) y PC.
const platforms = [
  { id: '66666666-6666-4666-8666-666666666661', name: 'Xbox', manufacturer: 'Microsoft' },
  { id: '66666666-6666-4666-8666-666666666662', name: 'Xbox Series X|S', manufacturer: 'Microsoft' },
  { id: '66666666-6666-4666-8666-666666666664', name: 'PC', manufacturer: 'Multiplataforma' },
];

const byName = (list) => Object.fromEntries(list.map((item) => [item.name, item.id]));
const categoryIds = byName(categories);
const genreIds = byName(genres);
const platformIds = byName(platforms);

// Portadas de ejemplo servidas por Nginx. El administrador puede reemplazarlas
// desde el panel; el seeder nunca sobrescribe una portada ya elegida.
const coverByPlatform = {
  Xbox: '/covers/xbox.svg',
  'Xbox Series X|S': '/covers/xbox.svg',
  PC: '/covers/pc.svg',
};

const games = [
  { id: '88888888-8888-4888-8888-888888888805', inventoryId: '99999999-9999-4999-8999-999999999905', title: 'Forza Horizon 5', sku: 'XSS-FH5-005', price: 40, platform: 'Xbox Series X|S', category: 'Carreras', genre: 'Carreras', ageRating: 'E', stock: 30, itemType: 'digital_key', description: 'Carreras abiertas en México con más de 500 autos.' },
  { id: '88888888-8888-4888-8888-888888888806', inventoryId: '99999999-9999-4999-8999-999999999906', title: 'Halo Infinite', sku: 'XSS-HALO-006', price: 35, platform: 'Xbox Series X|S', category: 'Acción', genre: 'Shooter', ageRating: 'T', stock: 25, itemType: 'digital_key', description: 'El Jefe Maestro enfrenta los Banished en Zeta Halo.' },
  { id: '88888888-8888-4888-8888-888888888807', inventoryId: '99999999-9999-4999-8999-999999999907', title: 'Starfield', sku: 'XSS-STAR-007', price: 55, platform: 'Xbox Series X|S', category: 'RPG', genre: 'RPG', ageRating: 'M', stock: 20, itemType: 'digital_key', description: 'RPG espacial de Bethesda con más de 1000 planetas.' },
  { id: '88888888-8888-4888-8888-888888888808', inventoryId: '99999999-9999-4999-8999-999999999908', title: 'Gears 5', sku: 'XSS-GEARS-008', price: 25, platform: 'Xbox Series X|S', category: 'Acción', genre: 'Shooter', ageRating: 'M', stock: 18, itemType: 'digital_key', description: 'La campaña de Kait Diaz en la guerra contra los Locust.' },
  { id: '88888888-8888-4888-8888-888888888813', inventoryId: '99999999-9999-4999-8999-999999999913', title: 'Elden Ring', sku: 'PC-ELDEN-013', price: 50, platform: 'PC', category: 'RPG', genre: 'RPG', ageRating: 'M', stock: 28, itemType: 'digital_key', description: 'Action RPG de FromSoftware en las Tierras Intermedias.' },
  { id: '88888888-8888-4888-8888-888888888814', inventoryId: '99999999-9999-4999-8999-999999999914', title: 'Cyberpunk 2077', sku: 'PC-CYBER-014', price: 45, platform: 'PC', category: 'RPG', genre: 'RPG', ageRating: 'M', stock: 24, itemType: 'digital_key', description: 'Night City, mercenarios y megacorporaciones.' },
  { id: '88888888-8888-4888-8888-888888888815', inventoryId: '99999999-9999-4999-8999-999999999915', title: 'GTA 5', sku: 'PC-GTA5-015', price: 30, platform: 'PC', category: 'Acción', genre: 'Acción', ageRating: 'M', stock: 35, minQuantity: 10, itemType: 'digital_key', description: 'Grand Theft Auto V en PC: historia, mundo abierto y modo online.' },
  { id: '88888888-8888-4888-8888-888888888816', inventoryId: '99999999-9999-4999-8999-999999999916', title: 'Hollow Knight: Silksong', sku: 'PC-SILK-016', price: 12, platform: 'PC', category: 'Plataformas', genre: 'Plataformas', ageRating: 'E', stock: 12, minQuantity: 5, itemType: 'digital_key', description: 'La secuela del aclamado metroidvania de Team Cherry.' },
  { id: '88888888-8888-4888-8888-888888888817', inventoryId: '99999999-9999-4999-8999-999999999917', title: 'Expedition 33', sku: 'PC-EXP33-017', price: 33, platform: 'PC', category: 'RPG', genre: 'RPG', ageRating: 'M', stock: 18, minQuantity: 8, itemType: 'digital_key', description: 'RPG de turnos con combate espectacular en un mundo fantástico.' },
  { id: '88888888-8888-4888-8888-888888888818', inventoryId: '99999999-9999-4999-8999-999999999918', title: 'Minecraft Bedrock', sku: 'PC-MCBE-018', price: 20, platform: 'PC', category: 'Aventura', genre: 'Aventura', ageRating: 'E', stock: 50, minQuantity: 12, itemType: 'digital_key', description: 'Construye, explora y sobrevive en el mundo de bloques.' },
  { id: '88888888-8888-4888-8888-888888888819', inventoryId: '99999999-9999-4999-8999-999999999919', title: 'Halo 1', sku: 'PC-HALO1-019', price: 30, platform: 'PC', category: 'Acción', genre: 'Shooter', ageRating: 'M', stock: 22, minQuantity: 10, itemType: 'digital_key', description: 'El inicio de la leyenda del Jefe Maestro en PC.' },
  { id: '88888888-8888-4888-8888-888888888820', inventoryId: '99999999-9999-4999-8999-999999999920', title: 'Halo 3', sku: 'XB-HALO3-020', price: 30, platform: 'Xbox', category: 'Acción', genre: 'Shooter', ageRating: 'M', stock: 16, minQuantity: 6, itemType: 'digital_key', description: 'La conclusión de la trilogía clásica en Xbox.' },
  { id: '88888888-8888-4888-8888-888888888821', inventoryId: '99999999-9999-4999-8999-999999999921', title: 'Resident Evil: Requiem', sku: 'PC-REQUIEM-021', price: 60, platform: 'PC', category: 'Terror', genre: 'Terror', ageRating: 'M', stock: 8, minQuantity: 5, itemType: 'digital_key', description: 'Nueva entrega de terror y supervivencia de Capcom.' },
  { id: '88888888-8888-4888-8888-888888888822', inventoryId: '99999999-9999-4999-8999-999999999922', title: 'Silent Hill 2', sku: 'PC-SH2-022', price: 20, platform: 'PC', category: 'Terror', genre: 'Terror', ageRating: 'M', stock: 27, minQuantity: 10, itemType: 'digital_key', description: 'El clásico de terror psicológico regresa con un remake.' },
  { id: '88888888-8888-4888-8888-888888888823', inventoryId: '99999999-9999-4999-8999-999999999923', title: 'Tekken 8', sku: 'PC-TEKKEN8-023', price: 50, platform: 'PC', category: 'Lucha', genre: 'Lucha', ageRating: 'T', stock: 14, minQuantity: 8, itemType: 'digital_key', description: 'La saga de artes marciales vuelve con combate de última generación.' },
  { id: '88888888-8888-4888-8888-888888888824', inventoryId: '99999999-9999-4999-8999-999999999924', title: 'Mortal Kombat 1', sku: 'PC-MK1-024', price: 40, platform: 'PC', category: 'Lucha', genre: 'Lucha', ageRating: 'M', stock: 19, minQuantity: 9, itemType: 'digital_key', description: 'El reinicio sangriento de la franquicia de lucha.' },
  { id: '88888888-8888-4888-8888-888888888825', inventoryId: '99999999-9999-4999-8999-999999999925', title: 'Call of Duty: Black Ops 6', sku: 'PC-BO6-025', price: 50, platform: 'PC', category: 'Acción', genre: 'Shooter', ageRating: 'M', stock: 24, minQuantity: 12, itemType: 'digital_key', description: 'Acción, sigilo y multijugador en la nueva entrega de Black Ops.' },
  { id: '88888888-8888-4888-8888-888888888826', inventoryId: '99999999-9999-4999-8999-999999999926', title: 'Battlefield 6', sku: 'PC-BF6-026', price: 60, platform: 'PC', category: 'Acción', genre: 'Shooter', ageRating: 'M', stock: 11, minQuantity: 7, itemType: 'digital_key', description: 'Guerras a gran escala con combate combinado.' },
];

// Medios de pago de la demo: Tarjeta y los seis bancos bolivianos descuentan
// de una cuenta ficticia con saldo. Efectivo y la Transferencia genérica fueron
// retirados por la migración `bolivian-banks` y ya no se insertan.
const paymentMethods = [
  { id: '77777777-7777-4777-8777-777777777772', code: 'CARD', name: 'Tarjeta' },
  { id: '77777777-7777-4777-8777-777777777774', code: 'MERCANTIL', name: 'Mercantil Santa Cruz' },
  { id: '77777777-7777-4777-8777-777777777775', code: 'BNB', name: 'BNB' },
  { id: '77777777-7777-4777-8777-777777777776', code: 'UNION', name: 'Banco Unión' },
  { id: '77777777-7777-4777-8777-777777777777', code: 'BCP', name: 'BCP' },
  { id: '77777777-7777-4777-8777-777777777778', code: 'SOL', name: 'Banco Sol' },
  { id: '77777777-7777-4777-8777-777777777779', code: 'FORTALEZA', name: 'Banco Fortaleza' },
];

// Tarjetas ficticias BCP: solo las cuentas de comprador tienen tarjeta
// (cada comprador conserva la suya y el personal del POS cobra con ella).
// Saldo inicial 500 USD, acorde con el catálogo de 10 a 60 USD: alcanza para
// varias compras. Los números son inventados y cumplen la validación Luhn.
// (Claves en snake_case: bulkInsert escribe nombres de columna crudos.)
const paymentCards = [
  { id: 'dddddddd-dddd-4ddd-8ddd-ddddddddddd5', user_id: '22222222-2222-4222-8222-222222222225', card_number: '4589832944002770', holder: 'Comprador Uno', expiry: '07/29' },
  { id: 'dddddddd-dddd-4ddd-8ddd-ddddddddddd6', user_id: '22222222-2222-4222-8222-222222222226', card_number: '4589492553796178', holder: 'Comprador Dos', expiry: '12/30' },
];
const CARD_BALANCE = 500;

// Cuentas bancarias ficticias para pagar desde los bancos del POS: una por
// comprador, también con 500 USD iniciales. Los números son inventados (no
// corresponden a una cuenta real) y solo se muestran enmascarados en el POS.
const bankAccounts = [
  { id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee5', user_id: '22222222-2222-4222-8222-222222222225', account_number: '19330001234562770', holder: 'Comprador Uno' },
  { id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee6', user_id: '22222222-2222-4222-8222-222222222226', account_number: '19330001234566178', holder: 'Comprador Dos' },
];
const BANK_BALANCE = 500;

// IDs explícitos: se conservan los de la BD aunque cambie el orden del catálogo.
const inventoryIds = games.map((game) => game.inventoryId);

// Solo se tocan filas con estos IDs. Nunca se borran ventas/clientes reales
// al reiniciar el contenedor ni al deshacer el seeder.
const seededIds = {
  roles: Object.values(ROLE_IDS),
  permissions: permissions.map((item) => item.id),
  users: users.map((item) => item.id),
  categories: categories.map((item) => item.id),
  genres: genres.map((item) => item.id),
  platforms: platforms.map((item) => item.id),
  video_games: games.map((item) => item.id),
  inventory_items: inventoryIds,
  payment_methods: paymentMethods.map((item) => item.id),
  payment_cards: paymentCards.map((item) => item.id),
  bank_accounts: bankAccounts.map((item) => item.id),
};

const insertIfMissing = (queryInterface, table, rows) =>
  queryInterface.bulkInsert(table, rows, { ignoreDuplicates: true });

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    // ON CONFLICT DO NOTHING: en cada arranque se reponen solo las filas que
    // falten. El stock editado, las ventas y los clientes nunca se sobrescriben.
    await insertIfMissing(queryInterface, 'roles', roles.map(({ id, name, description }) => ({
      id, name, description, created_at: now, updated_at: now,
    })));

    await insertIfMissing(queryInterface, 'permissions', permissions.map((permission) => ({
      ...permission, created_at: now, updated_at: now,
    })));

    const rolePermissionRows = [];
    roles.forEach((role) => {
      role.codes.forEach((code) => {
        const permission = permissions.find((item) => item.code === code);
        rolePermissionRows.push({ role_id: role.id, permission_id: permission.id });
      });
    });
    await insertIfMissing(queryInterface, 'role_permissions', rolePermissionRows);

    const hashes = await Promise.all(users.map((user) => hashPassword(user.password)));
    await insertIfMissing(queryInterface, 'users', users.map((user, index) => ({
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

    await insertIfMissing(queryInterface, 'categories', categories.map((item) => ({
      ...item, created_at: now, updated_at: now,
    })));
    await insertIfMissing(queryInterface, 'genres', genres.map((item) => ({
      ...item, created_at: now, updated_at: now,
    })));
    await insertIfMissing(queryInterface, 'platforms', platforms.map((item) => ({
      ...item, created_at: now, updated_at: now,
    })));

    await insertIfMissing(queryInterface, 'video_games', games.map((game) => ({
      id: game.id,
      title: game.title,
      description: game.description,
      sku: game.sku,
      category_id: categoryIds[game.category],
      genre_id: genreIds[game.genre],
      platform_id: platformIds[game.platform],
      price: game.price,
      currency: 'USD',
      age_rating: game.ageRating,
      image_url: coverByPlatform[game.platform] || '/covers/placeholder.svg',
      is_active: true,
      created_at: now,
      updated_at: now,
    })));

    // Si la columna ya existía en una BD creada antes de las portadas, se rellena
    // solo donde no haya imagen (no pisa la portada subida por el usuario).
    for (const game of games) {
      await queryInterface.sequelize.query(
        `UPDATE video_games SET image_url = :imageUrl
         WHERE id = :id AND image_url IS NULL`,
        {
          replacements: {
            id: game.id,
            imageUrl: coverByPlatform[game.platform] || '/covers/placeholder.svg',
          },
        },
      );
    }

    await insertIfMissing(queryInterface, 'inventory_items', games.map((game, index) => ({
      id: inventoryIds[index],
      video_game_id: game.id,
      item_type: game.itemType,
      quantity: game.stock,
      min_quantity: game.minQuantity ?? 10,
      created_at: now,
      updated_at: now,
    })));

    await insertIfMissing(queryInterface, 'payment_methods', paymentMethods.map((method) => ({
      ...method, is_active: true, created_at: now, updated_at: now,
    })));

    // Saldo de demostración: solo se inserta si falta la fila; el saldo
    // descontado por compras reales nunca se repone automáticamente.
    await insertIfMissing(queryInterface, 'payment_cards', paymentCards.map((card) => ({
      ...card,
      brand: 'BCP',
      balance: CARD_BALANCE,
      is_active: true,
      created_at: now,
      updated_at: now,
    })));

    await insertIfMissing(queryInterface, 'bank_accounts', bankAccounts.map((account) => ({
      ...account,
      bank: 'BCP',
      balance: BANK_BALANCE,
      is_active: true,
      created_at: now,
      updated_at: now,
    })));
  },

  async down(queryInterface) {
    // Deshacer solo lo creado por este seeder. Si alguna fila está en uso por
    // una venta real, PostgreSQL rechazará el borrado (y no borrará nada más).
    await queryInterface.bulkDelete('role_permissions', {
      role_id: { [Op.in]: seededIds.roles },
    });
    await queryInterface.bulkDelete('inventory_items', {
      id: { [Op.in]: seededIds.inventory_items },
    });
    await queryInterface.bulkDelete('video_games', {
      id: { [Op.in]: seededIds.video_games },
    });
    await queryInterface.bulkDelete('payment_methods', {
      id: { [Op.in]: seededIds.payment_methods },
    });
    await queryInterface.bulkDelete('payment_cards', {
      id: { [Op.in]: seededIds.payment_cards },
    });
    await queryInterface.bulkDelete('bank_accounts', {
      id: { [Op.in]: seededIds.bank_accounts },
    });
    await queryInterface.bulkDelete('users', {
      id: { [Op.in]: seededIds.users },
    });
    await queryInterface.bulkDelete('permissions', {
      id: { [Op.in]: seededIds.permissions },
    });
    await queryInterface.bulkDelete('roles', {
      id: { [Op.in]: seededIds.roles },
    });
    await queryInterface.bulkDelete('categories', {
      id: { [Op.in]: seededIds.categories },
    });
    await queryInterface.bulkDelete('genres', {
      id: { [Op.in]: seededIds.genres },
    });
    await queryInterface.bulkDelete('platforms', {
      id: { [Op.in]: seededIds.platforms },
    });
  },
};
