'use strict';

const asyncHandler = require('../utils/asyncHandler');
const saleService = require('../services/saleService');

const list = asyncHandler(async (req, res) => {
  res.json(await saleService.listSales(req.validated?.query || {}));
});

const get = asyncHandler(async (req, res) => {
  res.json(await saleService.getSale(req.params.id));
});

const create = asyncHandler(async (req, res) => {
  const sale = await saleService.createSale(req.validated.body, req.user);
  res.status(201).json(sale);
});

const cancel = asyncHandler(async (req, res) => {
  res.json(await saleService.cancelSale(req.validated.params.id, req.validated.body.reason, req.user));
});

const makeReturn = asyncHandler(async (req, res) => {
  res.json(await saleService.registerReturn(req.validated.params.id, req.validated.body, req.user));
});

const myShift = asyncHandler(async (req, res) => {
  const shift = await saleService.getMyShift(req.user);
  res.json({ shift });
});

const openShift = asyncHandler(async (req, res) => {
  const shift = await saleService.openShift(req.user, req.validated.body);
  res.status(201).json(shift);
});

const closeShift = asyncHandler(async (req, res) => {
  res.json(await saleService.closeShift(req.user, req.validated.body));
});

module.exports = { list, get, create, cancel, makeReturn, myShift, openShift, closeShift };
