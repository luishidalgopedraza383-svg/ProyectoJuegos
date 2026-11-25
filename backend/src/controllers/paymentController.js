'use strict';

const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const paymentService = require('../services/paymentService');

const listMethods = asyncHandler(async (_req, res) => {
  res.json({ items: await paymentService.listMethods() });
});

const myCard = asyncHandler(async (req, res) => {
  res.json({ card: await paymentService.getMyCard(req.user.id) });
});

// Listado de tarjetas de compradores para el personal del POS. Los
// compradores (rol con sales.write pero sin caja) no pueden ver las ajenas.
const buyerCards = asyncHandler(async (req, res) => {
  if (req.user.role?.name === 'comprador') {
    throw ApiError.forbidden('Solo el personal puede ver las tarjetas de los compradores');
  }
  res.json({ items: await paymentService.listBuyerCards() });
});

const myBankAccount = asyncHandler(async (req, res) => {
  res.json({ account: await paymentService.getMyAccount(req.user.id) });
});

// Igual que las tarjetas: solo el personal puede ver cuentas ajenas.
const buyerBankAccounts = asyncHandler(async (req, res) => {
  if (req.user.role?.name === 'comprador') {
    throw ApiError.forbidden('Solo el personal puede ver las cuentas de los compradores');
  }
  res.json({ items: await paymentService.listBuyerAccounts() });
});

module.exports = { listMethods, myCard, buyerCards, myBankAccount, buyerBankAccounts };
