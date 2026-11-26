'use strict';

const { Op } = require('sequelize');
const db = require('../models');
const { toNumber, roundMoney } = require('../utils/money');

const summary = async () => {
  const [completed, revenueRow, games, customers, lowStock] = await Promise.all([
    db.Sale.count({ where: { status: 'completed' } }),
    db.Sale.findOne({
      where: { status: 'completed' },
      attributes: [[db.sequelize.fn('COALESCE', db.sequelize.fn('SUM', db.sequelize.col('total')), 0), 'revenue']],
      raw: true,
    }),
    db.VideoGame.count({ where: { isActive: true } }),
    db.Customer.count({ where: { isActive: true } }),
    db.InventoryItem.count({
      where: {
        quantity: { [Op.lte]: db.sequelize.col('InventoryItem.min_quantity') },
      },
    }),
  ]);

  return {
    completedSales: completed,
    revenue: roundMoney(revenueRow?.revenue || 0),
    activeGames: games,
    activeCustomers: customers,
    lowStockItems: lowStock,
  };
};

const topGames = async () => db.SaleDetail.findAll({
  attributes: [
    'videoGameId',
    [db.sequelize.fn('SUM', db.sequelize.col('quantity')), 'unitsSold'],
    [db.sequelize.fn('SUM', db.sequelize.col('SaleDetail.subtotal')), 'revenue'],
  ],
  include: [
    {
      model: db.Sale,
      as: 'sale',
      attributes: [],
      where: { status: 'completed' },
      required: true,
    },
    { model: db.VideoGame, as: 'game', attributes: ['id', 'title', 'sku'] },
  ],
  // Con `underscored: true` la columna real es video_game_id: usar el nombre
  // del atributo en GROUP BY generaba "videoGameId" y PostgreSQL fallaba.
  group: [db.sequelize.col('SaleDetail.video_game_id'), db.sequelize.col('game.id')],
  order: [[db.sequelize.literal('"unitsSold"'), 'DESC']],
  limit: 10,
});

const salesByDay = async () => db.Sale.findAll({
  where: { status: 'completed' },
  attributes: [
    [db.sequelize.fn('DATE', db.sequelize.col('created_at')), 'day'],
    [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'sales'],
    [db.sequelize.fn('SUM', db.sequelize.col('total')), 'revenue'],
  ],
  group: [db.sequelize.fn('DATE', db.sequelize.col('created_at'))],
  // Se ordena como arreglo para que Sequelize no interprete 'DESC' como columna.
  order: [[db.sequelize.fn('DATE', db.sequelize.col('created_at')), 'DESC']],
  limit: 30,
  raw: true,
});

module.exports = { summary, topGames, salesByDay };
