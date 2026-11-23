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
    [db.sequelize.fn('SUM', db.sequelize.col('subtotal')), 'revenue'],
  ],
  include: [{ model: db.VideoGame, as: 'game', attributes: ['id', 'title', 'sku'] }],
  group: ['videoGameId', 'game.id'],
  order: [[db.sequelize.literal('"unitsSold"'), 'DESC']],
  limit: 10,
});

const salesByDay = async () => db.Sale.findAll({
  where: { status: 'completed' },
  attributes: [
    [db.sequelize.fn('DATE', db.sequelize.col('createdAt')), 'day'],
    [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'sales'],
    [db.sequelize.fn('SUM', db.sequelize.col('total')), 'revenue'],
  ],
  group: [db.sequelize.fn('DATE', db.sequelize.col('createdAt'))],
  order: [db.sequelize.fn('DATE', db.sequelize.col('createdAt')), 'ASC'],
  limit: 30,
  raw: true,
});

module.exports = { summary, topGames, salesByDay };
