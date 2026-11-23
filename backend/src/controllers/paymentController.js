'use strict';

const asyncHandler = require('../utils/asyncHandler');
const paymentService = require('../services/paymentService');

const listMethods = asyncHandler(async (_req, res) => {
  res.json({ items: await paymentService.listMethods() });
});

module.exports = { listMethods };
