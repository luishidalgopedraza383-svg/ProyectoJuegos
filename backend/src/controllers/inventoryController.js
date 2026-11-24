'use strict';

const asyncHandler = require('../utils/asyncHandler');
const inventoryService = require('../services/inventoryService');

const list = asyncHandler(async (_req, res) => {
  res.json({ items: await inventoryService.listItems() });
});

const lowStock = asyncHandler(async (_req, res) => {
  res.json({ items: await inventoryService.listLowStock() });
});

const movements = asyncHandler(async (req, res) => {
  res.json({ items: await inventoryService.listMovements(req.query.itemId) });
});

const registerMovement = asyncHandler(async (req, res) => {
  const result = await inventoryService.registerMovement({
    itemId: req.validated.params.itemId,
    ...req.validated.body,
  }, req.user);
  res.status(201).json(result);
});

const updateItem = asyncHandler(async (req, res) => {
  const item = await inventoryService.updateItem(req.validated.params.itemId, req.validated.body, req.user);
  res.json(item);
});

module.exports = { list, lowStock, movements, registerMovement, updateItem };
