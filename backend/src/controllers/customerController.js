'use strict';

const asyncHandler = require('../utils/asyncHandler');
const customerService = require('../services/customerService');

const list = asyncHandler(async (req, res) => {
  res.json(await customerService.listCustomers(req.validated?.query || {}));
});

const get = asyncHandler(async (req, res) => {
  res.json(await customerService.getCustomer(req.params.id));
});

const create = asyncHandler(async (req, res) => {
  const customer = await customerService.createCustomer(req.validated.body, req.user);
  res.status(201).json(customer);
});

module.exports = { list, get, create };
