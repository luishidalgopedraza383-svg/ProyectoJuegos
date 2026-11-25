'use strict';

const { Op } = require('sequelize');
const db = require('../models');
const ApiError = require('../utils/ApiError');

const includes = [
  { model: db.Category, as: 'category', attributes: ['id', 'name'] },
  { model: db.Genre, as: 'genre', attributes: ['id', 'name'] },
  { model: db.Platform, as: 'platform', attributes: ['id', 'name'] },
  { model: db.InventoryItem, as: 'inventory', attributes: ['id', 'quantity', 'minQuantity', 'itemType'] },
];

const listGames = async (query = {}) => {
  const where = {};
  if (query.search) where.title = { [Op.iLike]: `%${query.search}%` };
  if (query.genreId) where.genreId = query.genreId;
  if (query.platformId) where.platformId = query.platformId;
  if (query.categoryId) where.categoryId = query.categoryId;
  if (query.onlyActive !== 'false') where.isActive = true;

  const limit = Math.min(Number(query.limit) || 50, 100);
  const offset = Math.max(Number(query.offset) || 0, 0);

  const { rows, count } = await db.VideoGame.findAndCountAll({
    where,
    include: includes,
    order: [['title', 'ASC']],
    limit,
    offset,
  });

  return { items: rows, total: count, limit, offset };
};

const getGame = async (id) => {
  const game = await db.VideoGame.findByPk(id, { include: includes });
  if (!game) throw ApiError.notFound('Videojuego no encontrado');
  return game;
};

const getMeta = async () => {
  const [categories, genres, platforms] = await Promise.all([
    db.Category.findAll({ attributes: ['id', 'name', 'slug'], order: [['name', 'ASC']] }),
    db.Genre.findAll({ attributes: ['id', 'name'], order: [['name', 'ASC']] }),
    db.Platform.findAll({ attributes: ['id', 'name', 'manufacturer'], order: [['name', 'ASC']] }),
  ]);
  return { categories, genres, platforms };
};

// ---- Catálogo público (sin sesión) -------------------------------------
// Solo juegos activos con stock > 0 y campos seguros para un comprador.
const publicIncludes = [
  { model: db.Category, as: 'category', attributes: ['id', 'name'] },
  { model: db.Genre, as: 'genre', attributes: ['id', 'name'] },
  { model: db.Platform, as: 'platform', attributes: ['id', 'name', 'manufacturer'] },
  {
    model: db.InventoryItem,
    as: 'inventory',
    attributes: ['quantity', 'itemType'],
    where: { quantity: { [Op.gt]: 0 } },
    required: true,
  },
];

const toPublicGame = (game) => ({
  id: game.id,
  title: game.title,
  description: game.description,
  sku: game.sku,
  price: game.price,
  currency: game.currency,
  ageRating: game.ageRating,
  imageUrl: game.imageUrl || null,
  isActive: true, // el listado público solo incluye juegos activos
  platform: game.platform ? { id: game.platform.id, name: game.platform.name } : null,
  category: game.category ? { id: game.category.id, name: game.category.name } : null,
  genre: game.genre ? { id: game.genre.id, name: game.genre.name } : null,
  stock: game.inventory?.quantity ?? 0,
  itemType: game.inventory?.itemType ?? null,
  available: (game.inventory?.quantity ?? 0) > 0,
});

const listPublicGames = async (query = {}) => {
  const where = { isActive: true };
  if (query.search) where.title = { [Op.iLike]: `%${query.search}%` };
  if (query.genreId) where.genreId = query.genreId;
  if (query.platformId) where.platformId = query.platformId;
  if (query.categoryId) where.categoryId = query.categoryId;

  const limit = Math.min(Number(query.limit) || 50, 100);
  const offset = Math.max(Number(query.offset) || 0, 0);

  const { rows, count } = await db.VideoGame.findAndCountAll({
    where,
    attributes: ['id', 'title', 'description', 'sku', 'price', 'currency', 'ageRating', 'imageUrl'],
    include: publicIncludes,
    order: [['title', 'ASC']],
    limit,
    offset,
  });

  return { items: rows.map(toPublicGame), total: count, limit, offset };
};

const createGame = async (payload, user) => {
  // La moneda la fija el servidor, nunca el cliente.
  const game = await db.VideoGame.create({ ...payload, currency: 'USD' });
  await db.AuditLog.create({
    userId: user.id,
    action: 'GAME_CREATED',
    entity: 'VideoGame',
    entityId: game.id,
    payload: { title: game.title, sku: game.sku },
  });
  return getGame(game.id);
};

const updateGame = async (id, payload, user) => {
  const game = await db.VideoGame.findByPk(id);
  if (!game) throw ApiError.notFound('Videojuego no encontrado');
  // Se ignora cualquier intento de cambiar la moneda desde fuera.
  const { currency: _currency, ...changes } = payload;
  await game.update({ ...changes, currency: 'USD' });
  await db.AuditLog.create({
    userId: user.id,
    action: 'GAME_UPDATED',
    entity: 'VideoGame',
    entityId: game.id,
    payload,
  });
  return getGame(id);
};

module.exports = { listGames, getGame, getMeta, listPublicGames, createGame, updateGame };
