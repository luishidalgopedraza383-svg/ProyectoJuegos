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

const createGame = async (payload, user) => {
  const game = await db.VideoGame.create(payload);
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
  await game.update(payload);
  await db.AuditLog.create({
    userId: user.id,
    action: 'GAME_UPDATED',
    entity: 'VideoGame',
    entityId: game.id,
    payload,
  });
  return getGame(id);
};

module.exports = { listGames, getGame, getMeta, createGame, updateGame };
