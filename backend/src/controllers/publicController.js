'use strict';

const asyncHandler = require('../utils/asyncHandler');
const catalogService = require('../services/catalogService');

// Vitrina pública: no requiere token y solo devuelve juegos activos con stock.
const games = asyncHandler(async (req, res) => {
  res.json(await catalogService.listPublicGames(req.validated?.query || {}));
});

const meta = asyncHandler(async (_req, res) => {
  res.json(await catalogService.getMeta());
});

module.exports = { games, meta };
