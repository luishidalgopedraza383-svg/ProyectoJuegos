'use strict';

const asyncHandler = require('../utils/asyncHandler');
const catalogService = require('../services/catalogService');

const list = asyncHandler(async (req, res) => {
  res.json(await catalogService.listGames(req.validated?.query || {}));
});

const get = asyncHandler(async (req, res) => {
  res.json(await catalogService.getGame(req.validated.params.id));
});

const create = asyncHandler(async (req, res) => {
  const game = await catalogService.createGame(req.validated.body, req.user);
  res.status(201).json(game);
});

const meta = asyncHandler(async (_req, res) => {
  res.json(await catalogService.getMeta());
});

const update = asyncHandler(async (req, res) => {
  const game = await catalogService.updateGame(req.validated.params.id, req.validated.body, req.user);
  res.json(game);
});

module.exports = { list, get, create, update, meta };
