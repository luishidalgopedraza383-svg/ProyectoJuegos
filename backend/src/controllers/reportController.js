'use strict';

const asyncHandler = require('../utils/asyncHandler');
const reportService = require('../services/reportService');

const summary = asyncHandler(async (_req, res) => {
  res.json(await reportService.summary());
});

const topGames = asyncHandler(async (_req, res) => {
  res.json({ items: await reportService.topGames() });
});

const salesByDay = asyncHandler(async (_req, res) => {
  res.json({ items: await reportService.salesByDay() });
});

module.exports = { summary, topGames, salesByDay };
