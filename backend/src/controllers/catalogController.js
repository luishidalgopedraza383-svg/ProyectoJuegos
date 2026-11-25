'use strict';

const fs = require('fs');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
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

// La portada se sirve desde el mismo origen (/uploads) por la CSP.
const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('Selecciona una imagen');
  const imageUrl = `/uploads/${req.file.filename}`;
  try {
    res.json(await catalogService.updateGame(req.params.id, { imageUrl }, req.user));
  } catch (error) {
    await fs.promises.unlink(req.file.path).catch(() => {});
    throw error;
  }
});

module.exports = { list, get, create, update, uploadImage, meta };
